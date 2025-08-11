# ATS Resume Analyzer & AI Cover Letter Writer

An intelligent web application designed to help job seekers optimize their resumes and automatically generate tailored cover letters. This tool analyzes a user's resume against a specific job description, identifies missing keywords, provides actionable suggestions for improvement, and uses AI to write a compelling cover letter.

![Screenshot of the ATS Resume Analyzer application in use.](https://i.imgur.com/your-screenshot-url.png)
*(Replace the URL above with a screenshot of your running application)*

---

## ✨ Features

-   **📄 PDF Resume Upload**: Securely upload your resume in PDF format.
-   **📝 Job Description Analysis**: Paste any job description to serve as the benchmark for analysis.
-   **🔑 Keyword Matching**: Identifies critical keywords from the job description that are missing from your resume.
-   **💡 AI-Powered Suggestions**: Provides concrete, actionable advice on how to improve your resume's content and structure.
-   **✍️ Automatic Cover Letter Generation**: Uses the analysis to generate a unique, professional cover letter tailored to the job.
-   **📋 Interactive UI**: Easily copy missing keywords, suggestions, or the full cover letter text to your clipboard.
-   **🚀 PDF Download & Preview**: Download the generated cover letter as a PDF or preview it directly in the browser.
-   **💅 Modern & Responsive Design**: A clean, intuitive, and mobile-friendly user interface.

---

## 🛠️ Tech Stack

This project is a full-stack application composed of a React frontend and a Python backend.

| Area      | Technology                                    |
| :-------- | :-------------------------------------------- |
| **Frontend** | React.js, `lucide-react` (icons), CSS3        |
| **Backend** | Python 3, FastAPI                             |
| **AI / ML** | Google Gemini 2.5 Pro                         |
| **PDF Tools** | `PyMuPDF` (for text extraction), `FPDF2` (for PDF generation) |

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

-   Node.js and npm (or yarn) installed for the frontend.
-   Python 3.8+ and `pip` installed for the backend.
-   An API key for the language model you are using (e.g., Google AI Studio), which should be stored in an environment variable.

### 1. Backend Setup

First, set up and run the Python/FastAPI server.

```bash
# 1. Clone the repository
git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)

# 2. Navigate to the backend directory
cd your-repo-name/backend/

# 3. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows, use `venv\Scripts\activate`

# 4. Install the required Python packages
pip install -r requirements.txt

# 5. Create a .env file and add your API key
# Example .env file:
# GEMINI_API_KEY="your_secret_api_key_here"

# 6. Run the FastAPI server
uvicorn main:app --reload
```

The backend server will now be running, typically at `http://127.0.0.1:8000`.

### 2. Frontend Setup

Next, set up and run the React client in a separate terminal.

```bash
# 1. Navigate to the frontend directory from the root folder
cd ../frontend/

# 2. Install the required npm packages
npm install

# 3. Start the React development server
npm start
```

The React application should now be running and will open automatically in your browser, typically at `http://localhost:3000`. The app is configured to send API requests to your local backend server.

---

## ⚙️ API Endpoints

The backend exposes the following RESTful API endpoints:

| Method | Endpoint                  | Description                                                              |
| :----- | :------------------------ | :----------------------------------------------------------------------- |
| `POST` | `/analyze`                | Accepts a resume and job description; returns analysis and suggestions.  |
| `POST` | `/generate_cover_letter`  | Accepts resume text and job data; returns an AI-generated cover letter.  |
| `POST` | `/generate_pdf`           | Accepts text content; returns a downloadable PDF file.                   |

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
