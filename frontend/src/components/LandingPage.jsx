import React from 'react';
import { ArrowRight, CheckCircle, Star, Users, Zap, Shield } from 'lucide-react';
import './LandingPage.css';

const LandingPage = ({ onSignIn, onSignUp }) => {
  const handleSignInClick = () => {
    console.log('LandingPage: Sign In button clicked')
    onSignIn()
  }

  const handleSignUpClick = () => {
    console.log('LandingPage: Sign Up button clicked')
    onSignUp()
  }

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <h2>ResumeAI</h2>
          </div>
          <div className="nav-links">
            <button onClick={handleSignInClick} className="nav-btn signin-btn">Sign In</button>
            <button onClick={handleSignUpClick} className="nav-btn signup-btn">Sign Up</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Optimize Your Resume with
              <span className="gradient-text"> AI-Powered Insights</span>
            </h1>
            <p className="hero-subtitle">
              Upload your resume and job description to get personalized suggestions, 
              missing keywords, and AI-generated cover letters that help you stand out.
            </p>
            <div className="hero-buttons">
              <button onClick={handleSignUpClick} className="btn-primary">
                Get Started Free
                <ArrowRight className="btn-icon" />
              </button>
              <button onClick={handleSignInClick} className="btn-secondary">
                Sign In
              </button>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <Users className="stat-icon" />
                <span>10,000+ Users</span>
              </div>
              <div className="stat">
                <Star className="stat-icon" />
                <span>4.9/5 Rating</span>
              </div>
              <div className="stat">
                <Zap className="stat-icon" />
                <span>95% Success Rate</span>
              </div>
            </div>
          </div>
          <div className="hero-image">
            <div className="mockup-card">
              <div className="mockup-header">
                <div className="mockup-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
              <div className="mockup-content">
                <div className="mockup-line"></div>
                <div className="mockup-line short"></div>
                <div className="mockup-line"></div>
                <div className="mockup-line short"></div>
                <div className="mockup-highlight">
                  <CheckCircle className="highlight-icon" />
                  <span>AI-optimized suggestions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Why Choose ResumeAI?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <Zap />
              </div>
              <h3>AI-Powered Analysis</h3>
              <p>Advanced algorithms analyze your resume against job descriptions to identify gaps and opportunities.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <CheckCircle />
              </div>
              <h3>Keyword Optimization</h3>
              <p>Discover missing keywords and get suggestions to improve your resume's ATS compatibility.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Shield />
              </div>
              <h3>Privacy First</h3>
              <p>Your data is encrypted and secure. We never store or share your personal information.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Star />
              </div>
              <h3>Cover Letter Generator</h3>
              <p>Generate professional cover letters tailored to specific job descriptions in seconds.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <h2>Ready to Transform Your Career?</h2>
          <p>Join thousands of professionals who have optimized their resumes with AI</p>
          <button onClick={onSignUp} className="btn-primary large">
            Start Your Free Analysis
            <ArrowRight className="btn-icon" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>ResumeAI</h3>
              <p>AI-powered resume optimization for modern job seekers.</p>
            </div>
            <div className="footer-section">
              <h4>Product</h4>
              <ul>
                <li>Resume Analysis</li>
                <li>Cover Letters</li>
                <li>Keyword Optimization</li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Company</h4>
              <ul>
                <li>About</li>
                <li>Privacy</li>
                <li>Terms</li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Support</h4>
              <ul>
                <li>Help Center</li>
                <li>Contact</li>
                <li>FAQ</li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 ResumeAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
