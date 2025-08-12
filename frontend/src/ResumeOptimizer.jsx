"use client"

import React, { useState, useRef, useEffect } from "react"
import { Copy, Upload, FileText, Sparkles, Check, Download, Eye } from "lucide-react"

// Mock components to simulate Shadcn UI
const Button = ({ children, onClick, disabled, size, className, variant, ...props }) => (
  <button 
    onClick={onClick} 
    disabled={disabled} 
    className={`button ${size || ''} ${variant || ''} ${className || ''}`}
    {...props}
  >
    {children}
  </button>
)

const Card = ({ children, className, ...props }) => (
  <div className={`card ${className || ''}`} {...props}>
    {children}
  </div>
)

const CardContent = ({ children, className, ...props }) => (
  <div className={`card-content ${className || ''}`} {...props}>
    {children}
  </div>
)

const Textarea = ({ placeholder, value, onChange, className, ...props }) => (
  <textarea
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={`textarea ${className || ''}`}
    {...props}
  />
)

const Badge = ({ children, variant, className, ...props }) => (
  <span className={`badge ${variant || ''} ${className || ''}`} {...props}>
    {children}
  </span>
)

// Mock toast hook
const useToast = () => ({
  toast: ({ title, description, variant }) => {
    console.log(`Toast: ${title} - ${description} (${variant})`)
    // You can implement a real toast system here
  }
})

export default function ResumeOptimizer() {
  const [resumeFile, setResumeFile] = useState(null)
  const [jobDescription, setJobDescription] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [coverLetter, setCoverLetter] = useState("")
  const [analysis, setAnalysis] = useState(null)
  const [copiedItems, setCopiedItems] = useState(new Set())
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const { toast } = useToast()
  const resultsRef = useRef(null)
  const fileInputRef = useRef(null)

  // Backend API configuration
  const API_BASE_URL = "http://127.0.0.1:8000"

  const missingKeywords = [
    "Apache Flink",
    "Storm",
    "AWS Data Lake",
    "PostgreSQL",
    "DynamoDB",
    "MongoDB",
    "AWS Step Functions",
    "Kafka",
    "Spark",
    "Elasticsearch",
  ]

  const suggestions = [
    {
      keyword: "Apache Flink",
      suggestion:
        "Utilized Apache Flink to develop high-performance streaming applications for real-time data processing, achieving 99.9% uptime and processing over 1M events per second.",
    },
    {
      keyword: "AWS Data Lake",
      suggestion:
        "Architected and implemented AWS Data Lake solutions using S3, Glue, and Athena to centralize petabyte-scale data storage and enable advanced analytics across multiple business units.",
    },
    {
      keyword: "PostgreSQL",
      suggestion:
        "Optimized PostgreSQL database performance through advanced indexing strategies and query optimization, reducing average response time by 60% for critical business operations.",
    },
  ]

  // Utility functions
  const showSuccess = (message) => {
    setSuccess(message)
    setTimeout(() => setSuccess(null), 5000)
  }

  const showError = (message) => {
    setError(message)
    setTimeout(() => setError(null), 10000)
  }

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (file.type !== "application/pdf") {
        showError("Please upload a PDF file only.")
        return
      }
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        showError("File size should be less than 10MB.")
        return
      }
      setResumeFile(file)
      showSuccess(`Resume "${file.name}" uploaded successfully!`)
      setError(null)
    }
  }

  const handleAnalyze = async () => {
    if (!resumeFile) {
      showError("Please upload a resume PDF first.")
      return
    }
    if (!jobDescription.trim()) {
      showError("Please enter the job description.")
      return
    }

    setIsAnalyzing(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append("resume", resumeFile)
      formData.append("job_description", jobDescription.trim())

      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Server error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      
      if (!data.resume_text) {
        throw new Error("Invalid response from server: Missing resume text.")
      }

      setAnalysis(data)
      setShowResults(true)
      showSuccess("Resume analysis completed successfully!")

    } catch (error) {
      console.error("Analysis error:", error)
      showError(`Analysis failed: ${error.message}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Smoothly scroll to results after they render
  useEffect(() => {
    if (showResults && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [showResults])

  const handleGenerateCoverLetter = async () => {
    if (!analysis?.resume_text || !jobDescription) {
      showError("Please run the analysis first.")
      return
    }

    setIsGeneratingCoverLetter(true)
    setError(null)

    try {
      const missingKeywordsString = Array.isArray(analysis.missing_keywords) 
        ? analysis.missing_keywords.join(", ") 
        : (analysis.missing_keywords || "")

      const requestBody = {
        resume_text: analysis.resume_text,
        job_description: jobDescription,
        missing_keywords: missingKeywordsString
      }

      const response = await fetch(`${API_BASE_URL}/generate_cover_letter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Server error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      
      if (!data.cover_letter) {
        throw new Error("No cover letter was returned from the server.")
      }

      setCoverLetter(data.cover_letter)
      showSuccess("Cover letter generated successfully!")

    } catch (error) {
      console.error("Cover letter generation error:", error)
      showError(`Failed to generate cover letter: ${error.message}`)
    } finally {
      setIsGeneratingCoverLetter(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!coverLetter?.trim()) {
      showError("No cover letter content to convert to PDF.")
      return
    }

    setIsDownloadingPdf(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/generate_pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: coverLetter }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`PDF generation failed (status ${response.status}): ${errorText}`)
      }

      const blob = await response.blob()
      if (blob.size === 0) {
        throw new Error("The server returned an empty file.")
      }

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'AI_Generated_Cover_Letter.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      showSuccess("PDF download started!")

    } catch (error) {
      console.error("Download PDF error:", error)
      showError(`Download Failed: ${error.message}`)
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  const previewCoverLetter = () => {
    if (!coverLetter?.trim()) {
      showError("Generate a cover letter first to preview it.")
      return
    }

    const previewWindow = window.open("", "coverPreview", "width=800,height=600,scrollbars=yes,resizable=yes")
    if (previewWindow) {
      previewWindow.document.title = "Cover Letter Preview"
      previewWindow.document.head.innerHTML = `
        <style>
          body { 
            font-family: 'Times New Roman', Times, serif; 
            line-height: 1.6; 
            padding: 40px; 
            max-width: 800px; 
            margin: 0 auto; 
          } 
          pre { 
            white-space: pre-wrap; 
            word-wrap: break-word; 
            font-family: inherit; 
          }
        </style>
      `
      previewWindow.document.body.innerHTML = `<pre>${escapeHtml(coverLetter)}</pre>`
    } else {
      showError("Popup blocked. Please allow popups for this site to use the preview feature.")
    }
  }

  const escapeHtml = (unsafe) => {
    if (!unsafe) return ""
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
  }

  const copyToClipboard = async (text, itemId) => {
    try {
      await navigator.clipboard.writeText(text)
      
      // Add to copied items for visual feedback
      setCopiedItems(prev => new Set([...prev, itemId]))
      
      // Remove from copied items after 2 seconds
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev)
          newSet.delete(itemId)
          return newSet
        })
      }, 2000)
      
      showSuccess("Copied to clipboard!")
    } catch (err) {
      console.error('Failed to copy:', err)
      showError("Failed to copy to clipboard. Please copy manually.")
    }
  }

  return (
    <div className="resume-optimizer">
      <div className="max-w-6xl mx-auto px-4 py-8 md-py-12 w-full">
        {/* Header */}
        <div className="text-center mb-8 md-mb-12">
          <h1 className="text-3xl md-text-4xl font-bold text-gray-900 mb-3">Resume Optimizer</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your resume and job description to get tailored suggestions
          </p>
        </div>

        {/* Notifications */}
        {error && (
          <div className="notification error mb-6">
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="notification success mb-6">
            <span>{success}</span>
          </div>
        )}

        {/* Upload Section */}
        <div className="grid md-grid-cols-2 gap-6 mb-8">
          {/* Resume Upload */}
          <Card className="border-2 border-dashed border-gray-300 hover-border-blue-400 transition-colors">
            <CardContent className="p-6">
              <div className="text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="resume-upload"
                  className="hidden"
                  accept=".pdf"
                  onChange={handleFileUpload}
                />
                <label htmlFor="resume-upload" className="cursor-pointer flex flex-col items-center space-y-3">
                  {resumeFile ? (
                    <>
                      <FileText className="h-12 w-12 text-blue-500" />
                      <div>
                        <p className="font-medium text-gray-900">{resumeFile.name}</p>
                        <p className="text-sm text-gray-500">Click to change file</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">Upload Resume</p>
                        <p className="text-sm text-gray-500">PDF files only, max 10MB</p>
                      </div>
                    </>
                  )}
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Job Description */}
          <Card>
            <CardContent className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Job Description</label>
              <Textarea
                placeholder="Paste the job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-200px resize-none"
              />
            </CardContent>
          </Card>
        </div>

        {/* Analyze Button */}
        <div className="text-center mb-12">
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-medium"
          >
            {isAnalyzing ? (
              <>
                <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                Analyzing Documents...
              </>
            ) : (
              "Analyze Documents"
            )}
          </Button>
        </div>

        {/* Results Section */}
        {showResults && (
          <div ref={resultsRef} className="space-y-12">
            {/* Missing Keywords */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Keywords Missing From Your Resume</h2>
              <div className="flex flex-wrap gap-3">
                {missingKeywords.map((keyword, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="px-4 py-2 text-sm bg-blue-50 text-blue-700 hover-bg-blue-100 border border-blue-200"
                  >
                    {keyword}
                  </Badge>
                ))}
              </div>
            </section>

            {/* Suggested Bullet Points */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Suggested Bullet Points</h2>
              <div className="space-y-6">
                {suggestions.map((item, index) => {
                  const itemId = `suggestion-${index}`
                  const isCopied = copiedItems.has(itemId)
                  
                  return (
                    <Card key={index} className="border border-gray-200">
                      <CardContent className="p-6">
                        <h3 className="font-semibold text-gray-900 mb-3">For "{item.keyword}":</h3>
                        <div className="relative">
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 pr-20">
                            <p className="text-gray-700 leading-relaxed">{item.suggestion}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`absolute top-3 right-3 h-12 w-12 p-0 copy-button ${isCopied ? 'copied' : ''}`}
                            onClick={() => copyToClipboard(item.suggestion, itemId)}
                            title="Copy bullet point"
                          >
                            {isCopied ? (
                              <Check className="h-6 w-6 text-green-600" />
                            ) : (
                              <Copy className="h-6 w-6 text-gray-500" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </section>

            {/* Cover Letter Section */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Generate Cover Letter</h2>
              <div className="text-center mb-6">
                <Button
                  onClick={handleGenerateCoverLetter}
                  disabled={isGeneratingCoverLetter}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                >
                  {isGeneratingCoverLetter ? (
                    <>
                      <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                      Generating Cover Letter...
                    </>
                  ) : (
                    "Generate 100-word Cover Letter"
                  )}
                </Button>
              </div>

              {coverLetter && (
                <Card className="border border-gray-200">
                  <CardContent className="p-6">
                    <div className="relative">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 pr-20">
                        <pre className="whitespace-pre-wrap text-gray-700 font-sans leading-relaxed">{coverLetter}</pre>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`absolute top-3 right-3 h-12 w-12 p-0 copy-button ${copiedItems.has('cover-letter') ? 'copied' : ''}`}
                        onClick={() => copyToClipboard(coverLetter, 'cover-letter')}
                        title="Copy cover letter"
                      >
                        {copiedItems.has('cover-letter') ? (
                          <Check className="h-6 w-6 text-green-600" />
                        ) : (
                          <Copy className="h-6 w-6 text-gray-500" />
                        )}
                      </Button>
                    </div>
                    
                    {/* Cover Letter Actions */}
                    <div className="flex gap-3 mt-4">
                      <Button
                        onClick={handleDownloadPdf}
                        disabled={isDownloadingPdf}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                      >
                        {isDownloadingPdf ? (
                          <Sparkles className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        {isDownloadingPdf ? "Generating PDF..." : "Download PDF"}
                      </Button>
                      
                      <Button
                        onClick={previewCoverLetter}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                      >
                        <Eye className="h-4 w-4" />
                        Preview
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
