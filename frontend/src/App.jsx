import React, { useState, useRef } from "react";
import { Upload, FileText, Zap, Download, Eye, RefreshCw, AlertCircle, CheckCircle, Loader, Copy, Check } from "lucide-react";
import './App.css';

/**
 * A helper function to safely escape HTML content for previewing in a new window.
 * This prevents potential XSS issues when rendering user-generated or AI-generated content.
 * @param {string} unsafe - The raw HTML or text string.
 * @returns {string} - The escaped string.
 */
function escapeHtml(unsafe) {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default function App() {
  // --- STATE MANAGEMENT ---
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingState, setLoadingState] = useState(""); // "analyzing", "generating", "pdf"
  const [analysis, setAnalysis] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedKeywords, setCopiedKeywords] = useState(new Set());
  const fileInputRef = useRef(null);

  // --- CONFIGURATION ---
  // Replace with your actual backend API endpoint.
  const apiBase = "http://127.0.0.1:8000";

  // --- UTILITY FUNCTIONS ---

  /**
   * Resets the analysis, cover letter, and any generated PDF URLs.
   * Keeps the uploaded resume and job description intact.
   */
  const resetOutputs = () => {
    setAnalysis(null);
    setCoverLetter("");
    setPdfBlobUrl(null);
    setError(null);
    setSuccess(null);
    setCopiedKeywords(new Set());
  };

  /**
   * Resets the entire application state to its initial values.
   */
  const resetAll = () => {
    setResumeFile(null);
    setJobDescription("");
    resetOutputs();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    showSuccess("All fields have been reset!");
  };

  /**
   * Displays a success message for a short duration.
   * @param {string} message - The success message to display.
   */
  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 5000);
  };

  /**
   * Displays an error message for a longer duration.
   * @param {string} message - The error message to display.
   */
  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(null), 10000);
  };

  /**
   * Copies text to the user's clipboard and provides visual feedback.
   * @param {string} text - The text to copy.
   * @param {number|null} keywordIndex - Optional index for keyword-specific feedback.
   */
  const copyToClipboard = async (text, keywordIndex = null) => {
    if (!text) return;
    try {
      // Using document.execCommand for broader compatibility within iFrames
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);

      if (keywordIndex !== null) {
        setCopiedKeywords(prev => new Set([...prev, keywordIndex]));
        setTimeout(() => {
          setCopiedKeywords(prev => {
            const newSet = new Set(prev);
            newSet.delete(keywordIndex);
            return newSet;
          });
        }, 2000);
      }
      showSuccess("Copied to clipboard!");
    } catch (err) {
      console.error("Clipboard copy failed:", err);
      showError("Failed to copy to clipboard. Please copy manually.");
    }
  };


  // --- FILE HANDLING ---

  /**
   * Validates and sets the selected resume file.
   * @param {File} file - The file selected by the user.
   */
  const handleFile = (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      showError("Please upload a PDF file only.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      showError("File size should be less than 10MB.");
      return;
    }
    resetOutputs();
    setResumeFile(file);
    showSuccess(`Resume "${file.name}" uploaded successfully!`);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragEvents = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
        setIsDragging(true);
    } else if (e.type === "dragleave") {
        setIsDragging(false);
    }
  };


  // --- API CALLS ---

  /**
   * Sends the resume and job description to the backend for analysis.
   */
  const performAnalysis = async () => {
    if (!resumeFile) return showError("Please upload a resume PDF first.");
    if (!jobDescription.trim()) return showError("Please enter the job description.");

    setLoading(true);
    setLoadingState("analyzing");
    setError(null);
    resetOutputs();

    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("job_description", jobDescription.trim());

      const res = await fetch(`${apiBase}/analyze`, { method: "POST", body: formData });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server error: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      if (!data.resume_text) throw new Error("Invalid response from server: Missing resume text.");

      setAnalysis(data);
      showSuccess("Resume analysis completed successfully!");
    } catch (err) {
      console.error("Analysis error:", err);
      showError(`Analysis failed: ${err.message}`);
    } finally {
      setLoading(false);
      setLoadingState("");
    }
  };

  /**
   * Generates a cover letter based on the analysis results.
   */
  const generateCoverLetter = async () => {
    if (!analysis?.resume_text || !jobDescription) {
      return showError("Please run the analysis first.");
    }

    setLoading(true);
    setLoadingState("generating");
    setError(null);

    try {
      const missingKeywordsString = Array.isArray(analysis.missing_keywords) ? analysis.missing_keywords.join(", ") : (analysis.missing_keywords || "");
      const requestBody = {
        resume_text: analysis.resume_text,
        job_description: jobDescription,
        missing_keywords: missingKeywordsString
      };

      const response = await fetch(`${apiBase}/generate_cover_letter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      if (!data.cover_letter) throw new Error("No cover letter was returned from the server.");

      setCoverLetter(data.cover_letter);
      showSuccess("Cover letter generated successfully!");
    } catch (error) {
      console.error("Cover letter generation error:", error);
      showError(`Failed to generate cover letter: ${error.message}`);
    } finally {
      setLoading(false);
      setLoadingState("");
    }
  };

  /**
   * Converts the generated cover letter text to a PDF and initiates download.
   */
  const downloadPdf = async () => {
    if (!coverLetter?.trim()) return showError("No cover letter content to convert to PDF.");

    setLoading(true);
    setLoadingState("pdf");
    setError(null);

    try {
      const res = await fetch(`${apiBase}/generate_pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: coverLetter }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`PDF generation failed (status ${res.status}): ${errorText}`);
      }

      const blob = await res.blob();
      if (blob.size === 0) throw new Error("The server returned an empty file.");

      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'AI_Generated_Cover_Letter.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showSuccess("PDF download started!");
    } catch (err) {
      console.error("Download PDF error:", err);
      showError(`Download Failed: ${err.message}`);
    } finally {
      setLoading(false);
      setLoadingState("");
    }
  };

  /**
   * Opens a new browser window to preview the cover letter.
   */
  const previewCoverLetter = () => {
    if (!coverLetter?.trim()) return showError("Generate a cover letter first to preview it.");

    const previewWindow = window.open("", "coverPreview", "width=800,height=600,scrollbars=yes,resizable=yes");
    if (previewWindow) {
      previewWindow.document.title = "Cover Letter Preview";
      previewWindow.document.head.innerHTML = `<style>body { font-family: 'Times New Roman', Times, serif; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; } pre { white-space: pre-wrap; word-wrap: break-word; font-family: inherit; }</style>`;
      previewWindow.document.body.innerHTML = `<pre>${escapeHtml(coverLetter)}</pre>`;
    } else {
      showError("Popup blocked. Please allow popups for this site to use the preview feature.");
    }
  };


  // --- RENDER FUNCTIONS ---

  /**
   * Renders the list of missing keywords as interactive chips.
   */
  const renderKeywords = () => {
    if (!analysis?.missing_keywords) return null;

    const keywords = Array.isArray(analysis.missing_keywords)
      ? analysis.missing_keywords
      : String(analysis.missing_keywords).split(",").filter(k => k.trim());

    if (keywords.length === 0) {
        return <p className="text-sm text-gray-500">No missing keywords found. Great job!</p>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {keywords.map((keyword, index) => (
          <div key={index} className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 transition-all hover:border-orange-400 hover:bg-orange-50">
            <span>{keyword.trim()}</span>
            <button
              onClick={() => copyToClipboard(keyword.trim(), index)}
              className="bg-transparent border-none cursor-pointer p-0.5 rounded-md transition-colors text-gray-500 hover:bg-gray-200 hover:text-gray-800"
              title="Copy keyword"
            >
              {copiedKeywords.has(index) ? (
                <Check className="w-3 h-3 text-green-600" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
        ))}
      </div>
    );
  };

  // --- MAIN COMPONENT RENDER ---
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
          {/* Header */}
          <header className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6 sm:p-8">
            <div className="flex items-center gap-4 mb-2">
              <FileText className="w-8 h-8 flex-shrink-0" />
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">ATS Resume Analyzer & AI Cover Letter Writer</h1>
            </div>
            <p className="text-gray-300 text-base sm:text-lg">Upload your resume, paste a job description, and let AI optimize your application.</p>
          </header>

          {/* Notifications Area */}
          <div className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-800 animate-pulse">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 text-green-800">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}
          </div>

          {/* Main Content Grid */}
          <main className="grid lg:grid-cols-2 gap-8 p-6">
            {/* Left Panel: Inputs */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6 border">
                <label className="block text-base font-semibold text-gray-700 mb-4">1. Upload Your Resume</label>
                <div
                  onDragEnter={handleDragEvents}
                  onDragLeave={handleDragEvents}
                  onDragOver={handleDragEvents}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${isDragging ? 'border-blue-500 bg-blue-50 scale-105' : 'border-gray-300 hover:border-blue-400 hover:bg-white'}`}
                >
                  <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2 font-medium">Drag & drop PDF here, or click to browse</p>
                  <small className="text-gray-500">Max 10MB. Only PDF supported.</small>
                  {resumeFile && (
                    <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-lg text-left">
                      <p className="text-sm font-semibold text-green-800">Selected: {resumeFile.name}</p>
                      <p className="text-xs text-gray-600">Size: {(resumeFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 border">
                <label className="block text-base font-semibold text-gray-700 mb-4">2. Paste Job Description</label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={12}
                  className="w-full p-4 border border-gray-300 rounded-lg resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Paste the full job description here to find matching keywords..."
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={performAnalysis} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:shadow-none">
                  {loadingState === "analyzing" ? (<><Loader className="w-5 h-5 animate-spin" /> Analyzing...</>) : (<><Zap className="w-5 h-5" /> Analyze</>)}
                </button>
                <button onClick={resetAll} disabled={loading} className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:shadow-none">
                  <RefreshCw className="w-5 h-5" /> Reset All
                </button>
              </div>
            </div>

            {/* Right Panel: Outputs */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 border-b-2 pb-3">3. Review Analysis & Generate</h2>
              {!analysis ? (
                <div className="bg-gray-50 rounded-xl p-12 text-center border">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Your analysis results will appear here.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-orange-800">Missing Keywords</h3>
                      <button onClick={() => copyToClipboard(Array.isArray(analysis.missing_keywords) ? analysis.missing_keywords.join(", ") : analysis.missing_keywords)} className="text-orange-600 hover:text-orange-800 transition-colors" title="Copy all keywords"><Copy className="w-5 h-5" /></button>
                    </div>
                    {renderKeywords()}
                  </div>

                  <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-blue-800">AI Resume Suggestions</h3>
                        <button onClick={() => copyToClipboard(analysis.suggestions)} className="text-blue-600 hover:text-blue-800 transition-colors" title="Copy suggestions"><Copy className="w-5 h-5" /></button>
                    </div>
                    <div className="text-blue-800 whitespace-pre-wrap bg-white p-4 rounded-lg border text-sm">{analysis.suggestions || "No suggestions available."}</div>
                  </div>

                  <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-green-800">Extracted Resume Text</h3>
                        <button onClick={() => copyToClipboard(analysis.resume_text)} className="text-green-600 hover:text-green-800 transition-colors" title="Copy resume text"><Copy className="w-5 h-5" /></button>
                    </div>
                    <div className="bg-white p-4 rounded-lg border max-h-48 overflow-y-auto text-sm text-gray-700">{analysis.resume_text || "Could not extract text from resume."}</div>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-4 pt-4 border-t-2">
                <button onClick={generateCoverLetter} disabled={!analysis || loading} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md disabled:shadow-none">
                  {loadingState === "generating" ? (<><Loader className="w-5 h-5 animate-spin" /> Generating...</>) : "Generate Cover Letter"}
                </button>
                <button onClick={downloadPdf} disabled={!coverLetter || loading} className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md disabled:shadow-none">
                  {loadingState === "pdf" ? <Loader className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />} Download PDF
                </button>
                <button onClick={previewCoverLetter} disabled={!coverLetter || loading} className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md disabled:shadow-none">
                  <Eye className="w-5 h-5" /> Preview
                </button>
              </div>
            </div>
          </main>

          {/* Cover Letter Display */}
          {coverLetter && (
            <section className="p-6">
              <div className="bg-purple-50 rounded-xl p-6 sm:p-8 border border-purple-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                  <h3 className="text-2xl font-bold text-purple-800">Your Generated Cover Letter</h3>
                  <button onClick={() => copyToClipboard(coverLetter)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm hover:shadow-md">
                    <Copy className="w-4 h-4" /> Copy Letter
                  </button>
                </div>
                <div className="bg-white p-6 sm:p-8 rounded-xl border shadow-inner">
                  <div className="prose max-w-none text-gray-800 leading-relaxed whitespace-pre-wrap font-serif">
                    {coverLetter}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* PDF Preview Display */}
          {pdfBlobUrl && (
             <section className="p-6">
               <div className="bg-gray-100 rounded-xl p-6 border">
                 <h3 className="text-xl font-semibold text-gray-800 mb-4">PDF Preview</h3>
                 <iframe src={pdfBlobUrl} title="PDF Preview" className="w-full h-96 rounded-lg border bg-white" />
               </div>
             </section>
          )}

          {/* Footer */}
          <footer className="bg-gray-100 p-4 text-center border-t">
            <small className="text-gray-500">Resume Analyzer & Cover Letter Generator</small>
          </footer>
        </div>
      </div>
    </div>
  );
}
