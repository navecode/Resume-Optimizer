import os
import logging
import io
from fastapi import FastAPI, UploadFile, File, Form, Body
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from PyPDF2 import PdfReader
import google.generativeai as genai
from reportlab.platypus import SimpleDocTemplate, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import letter
from dotenv import load_dotenv

# Create app first
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change to ["http://localhost:3000"] for stricter rules
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load environment variables
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in .env file")

genai.configure(api_key=GEMINI_API_KEY)

# Logging setup
logging.basicConfig(level=logging.INFO, filename="app_activity.log",
                    format="%(asctime)s - %(levelname)s - %(message)s")

# === Core functions ===
def extract_text_from_pdf(pdf_content: bytes):
    try:
        reader = PdfReader(io.BytesIO(pdf_content))
        text = "".join((page.extract_text() or "") + "\n" for page in reader.pages)
        return text.strip()
    except Exception as e:
        logging.error(f"PDF Extraction Error: {e}")
        raise ValueError(f"Error extracting text from PDF: {e}")

def analyze_resume_gap(resume_text: str, job_description: str):
    model = genai.GenerativeModel("gemini-2.5-pro")
    prompt = f"""You are an expert resume analyst and career coach. Your task is to perform a gap analysis between a user's resume and a job description.

    **Step 1: Identify Missing Keywords**
    Compare the resume against the job description and identify 3-5 of the most critical skills, technologies, or qualifications present in the job description but MISSING from the resume.

    **Step 2: Generate Resume Suggestions**
    For EACH missing keyword you identified, create 2-3 specific, quantifiable, and action-oriented bullet points that the user could add to their resume. Frame these as if the user has the skills.

    **Output Format (Strict):**
    Provide your response using these exact separators.

    ---MISSING_KEYWORDS---
    - [Missing Keyword 1]
    - [Missing Keyword 2]
    - [and so on...]

    ---RESUME_SUGGESTIONS---
    **For [Missing Keyword 1]:**
    - [Action-oriented bullet point 1]
    - [Action-oriented bullet point 2]

    **For [Missing Keyword 2]:**
    - [Action-oriented bullet point 1]
    - [Action-oriented bullet point 2]

    ---END---

    **INPUTS:**

    **Resume Text:**
    {resume_text}

    **Job Description:**
    {job_description}"""
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        logging.error(f"Gemini Analysis Error: {e}")
        raise ValueError(f"Error during resume analysis: {e}")

def generate_cover_letter(resume_text: str, job_description: str, missing_keywords_context: str):
    model = genai.GenerativeModel("gemini-2.5-pro")
    prompt = f"""You are an expert career strategist and professional copywriter. Your task is to write a compelling cover letter.

    **Context:**
    You are given a resume, a job description, and a list of important skills that are in the job description but were missing from the resume.

    **Your Prime Directive:**
    Write a professional and persuasive cover letter assuming the candidate **possesses** the "missing skills". Seamlessly and confidently integrate BOTH the skills demonstrated in the resume AND the provided "missing skills" into the narrative. The goal is to present the candidate as a perfect fit for the role.

    **Formatting and Content Rules:**
    - The letter should be 3-4 paragraphs long.
    - Address it to "Dear Hiring Manager,".
    - The tone must be confident and professional.
    - **Paragraph 1:** State the position and express enthusiasm.
    - **Paragraph 2 (Core):** Weave together achievements from the resume and the assumed "missing skills" to build a strong case. Use metrics and specific examples.
    - **Paragraph 3:** Reiterate your fit and enthusiasm, and include a strong call to action.
    - End with "Sincerely,".
    - DO NOT use placeholders like "[Your Name]".

    **INPUTS:**

    **Resume Text:**
    {resume_text}

    **Job Description:**
    {job_description}

    **Assumed Skills (Missing from Resume but to be included in the letter):**
    {missing_keywords_context}"""
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        logging.error(f"Gemini Cover Letter Error: {e}")
        raise ValueError(f"Error during cover letter generation: {e}")

def create_downloadable_pdf(text_content: str):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    style = styles["BodyText"]
    paragraphs = [Paragraph(line, style) for line in text_content.split('\n')]
    doc.build(paragraphs)
    buffer.seek(0)
    return buffer

# === Routes ===
@app.post("/analyze")
async def analyze_endpoint(resume: UploadFile = File(...), job_description: str = Form(...)):
    resume_content = await resume.read()
    resume_text = extract_text_from_pdf(resume_content)
    analysis_result = analyze_resume_gap(resume_text, job_description)

    if "---MISSING_KEYWORDS---" in analysis_result and "---RESUME_SUGGESTIONS---" in analysis_result:
        try:
            missing_keywords_section = analysis_result.split("---MISSING_KEYWORDS---")[1].split("---RESUME_SUGGESTIONS---")[0].strip()
            resume_suggestions = analysis_result.split("---RESUME_SUGGESTIONS---")[1].split("---END---")[0].strip()
        except IndexError:
            missing_keywords_section = ""
            resume_suggestions = ""
    else:
        logging.warning("AI output did not contain expected separators. Returning raw output.")
        missing_keywords_section = ""
        resume_suggestions = analysis_result

    return {
        "resume_text": resume_text,
        "missing_keywords": missing_keywords_section,
        "suggestions": resume_suggestions
    }


@app.post("/generate_cover_letter")
def generate_cover_letter_endpoint(resume_text: str = Body(...), job_description: str = Body(...), missing_keywords: str = Body(...)):
    cover_letter_text = generate_cover_letter(resume_text, job_description, missing_keywords)
    return {"cover_letter": cover_letter_text}

@app.post("/generate_pdf")
def generate_pdf_endpoint(text: str = Body(...)):
    buffer = create_downloadable_pdf(text)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=AI_Generated_Cover_Letter.pdf"}
    )
