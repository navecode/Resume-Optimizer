import streamlit as st
from PyPDF2 import PdfReader
import google.generativeai as genai
from reportlab.platypus import SimpleDocTemplate, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import letter
import io
import logging
import os
from dotenv import load_dotenv

# ──────────────────────────────
# 🔧 Load environment variables & Configure API
# ──────────────────────────────
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    st.error("🚨 Gemini API key not found! Please add your GEMINI_API_KEY to a `.env` file.")
    st.stop()

genai.configure(api_key=GEMINI_API_KEY)

# ──────────────────────────────
# 🔧 App Setup & Configuration
# ──────────────────────────────
st.set_page_config(page_title="🚀 Resume & Cover Letter Co-Pilot", layout="wide")
st.title("🚀 AI Resume & Cover Letter Co-Pilot")
st.markdown("Get a targeted **cover letter** and actionable **resume suggestions** to bridge the gap between your resume and your dream job.")

# Configure logging
logging.basicConfig(level=logging.INFO, filename="app_activity.log", format="%(asctime)s - %(levelname)s - %(message)s")

# ──────────────────────────────
# 📄 Core Functions
# ──────────────────────────────
def extract_text_from_pdf(pdf_file):
    """Extracts text from an uploaded PDF file."""
    try:
        reader = PdfReader(pdf_file)
        text = "".join(page.extract_text() + "\n" for page in reader.pages)
        return text.strip()
    except Exception as e:
        st.error(f"❌ Error extracting text from PDF: {e}")
        logging.error(f"PDF Extraction Error: {e}")
        return None

# ENHANCEMENT: Step 1 of the new workflow -> Analysis
def analyze_resume_gap(resume_text, job_description):
    """
    Identifies missing keywords from the resume compared to the job description
    and generates actionable resume bullet points for those keywords.
    """
    model = genai.GenerativeModel("gemini-2.5-pro")
    prompt = f"""
    You are an expert resume analyst and career coach. Your task is to perform a gap analysis between a user's resume and a job description.

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
    {job_description}
    """
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        st.error(f"🚨 Error during resume analysis: {e}")
        logging.error(f"Gemini Analysis Error: {e}")
        return None


# ENHANCEMENT: Step 2 of the new workflow -> Cover Letter Generation
def generate_cover_letter(resume_text, job_description, missing_keywords_context):
    """
    Generates a cover letter, assuming the user possesses the missing skills.
    """
    model = genai.GenerativeModel("gemini-2.5-pro")
    prompt = f"""
    You are an expert career strategist and professional copywriter. Your task is to write a compelling cover letter.

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
    {missing_keywords_context}
    """
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        st.error(f"🚨 Error during cover letter generation: {e}")
        logging.error(f"Gemini Cover Letter Error: {e}")
        return None

def create_downloadable_pdf(text_content):
    """Creates a downloadable PDF from text content, with proper line wrapping."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, leftMargin=72, rightMargin=72, topMargin=72, bottomMargin=72)
    styles = getSampleStyleSheet()
    style = styles["BodyText"]
    paragraphs = [Paragraph(line, style) for line in text_content.split('\n')]
    doc.build(paragraphs)
    buffer.seek(0)
    return buffer

# ──────────────────────────────
# 🎨 Streamlit UI
# ──────────────────────────────
col1, col2 = st.columns(2)

with col1:
    resume_file = st.file_uploader("📄 **Step 1:** Upload Your Resume (PDF)", type=["pdf"])

with col2:
    job_description = st.text_area("📋 **Step 2:** Paste Job Description", height=275)

if st.button("✨ Generate Cover Letter & Resume Tips", type="primary", use_container_width=True):
    if not resume_file:
        st.error("⚠️ Please upload your resume.")
    elif not job_description.strip():
        st.error("⚠️ Please paste the job description.")
    else:
        with st.spinner("Step 1/2: Analyzing resume and job description for skill gaps..."):
            resume_text = extract_text_from_pdf(resume_file)
            if resume_text:
                analysis_result = analyze_resume_gap(resume_text, job_description)

        if analysis_result:
            try:
                # Parse the analysis result
                missing_keywords_section = analysis_result.split("---MISSING_KEYWORDS---")[1].split("---RESUME_SUGGESTIONS---")[0].strip()
                resume_suggestions = analysis_result.split("---RESUME_SUGGESTIONS---")[1].split("---END---")[0].strip()
            except IndexError:
                st.error("🚨 Could not parse the analysis from the AI. Please try again.")
                st.stop()

            with st.spinner("Step 2/2: Crafting your cover letter with all skills included..."):
                cover_letter_text = generate_cover_letter(resume_text, job_description, missing_keywords_section)

            if cover_letter_text:
                st.success("✅ Success! Your personalized career package is ready.", icon="🎉")
                logging.info("Successfully generated content for user.")

                # ENHANCEMENT: Display the resume suggestions prominently
                st.subheader("🚀 Upgrade Your Resume!")
                st.info("AI analysis found these key skills from the job description are missing from your resume. Add these points to get past automated screening.", icon="💡")
                st.markdown(resume_suggestions)

                st.subheader("✍️ Your Generated Cover Letter (Editable)")
                st.markdown("This letter is written *as if* your resume already includes the skills above.")
                edited_letter = st.text_area(label="Edit your letter before downloading:", value=cover_letter_text, height=400, label_visibility="collapsed")

                pdf_buffer = create_downloadable_pdf(edited_letter)
                st.download_button(
                    label="📥 Download Cover Letter as PDF",
                    data=pdf_buffer,
                    file_name="AI_Generated_Cover_Letter.pdf",
                    mime="application/pdf",
                    use_container_width=True
                )