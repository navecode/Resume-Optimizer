"use client"

import React, { useState, useEffect } from "react"
import LandingPage from './components/LandingPage'
import SignIn from './components/SignIn'
import SignUp from './components/SignUp'
import ResumeOptimizer from './ResumeOptimizer'
import AuthCallback from './components/AuthCallback'
import { LogOut, User } from 'lucide-react'
import { useAuth } from './contexts/AuthContext'
import './App.css'

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing')
  const { user, loading, signOut } = useAuth()

  // Check if we're on an auth callback page
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (window.location.pathname === '/auth/callback' || urlParams.has('access_token')) {
      setCurrentPage('auth-callback');
      return;
    }
  }, []);

  // Redirect to resume optimizer if user is authenticated
  useEffect(() => {
    console.log('App useEffect - user:', user, 'loading:', loading, 'currentPage:', currentPage)
    if (user && !loading && currentPage !== 'auth-callback') {
      console.log('Redirecting to resume-optimizer')
      setCurrentPage('resume-optimizer')
    } else if (!user && !loading && currentPage !== 'auth-callback' && currentPage !== 'signin' && currentPage !== 'signup') {
      console.log('Redirecting to landing')
      setCurrentPage('landing')
    }
  }, [user, loading, currentPage])

  const handleSignIn = () => {
    console.log('Navigating to signin')
    setCurrentPage('signin')
  }

  const handleSignUp = () => {
    console.log('Navigating to signup')
    setCurrentPage('signup')
  }

  const handleBackToLanding = () => {
    console.log('Navigating back to landing')
    setCurrentPage('landing')
  }

  const handleSignInSuccess = () => {
    console.log('Sign in success callback')
    // This will be handled by the auth state change listener
  }

  const handleSignUpSuccess = () => {
    console.log('Sign up success callback')
    // This will be handled by the auth state change listener
  }

  const handleSignOut = async () => {
    await signOut()
    setCurrentPage('landing')
  }

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  const renderPage = () => {
    console.log('Rendering page:', currentPage)
    switch (currentPage) {
      case 'landing':
        return (
          <LandingPage
            onSignIn={handleSignIn}
            onSignUp={handleSignUp}
          />
        )
      case 'signin':
        console.log('Rendering SignIn component')
        return (
          <SignIn
            onSignUp={handleSignUp}
            onBack={handleBackToLanding}
            onSignInSuccess={handleSignInSuccess}
          />
        )
      case 'signup':
        console.log('Rendering SignUp component')
        return (
          <SignUp
            onSignIn={handleSignIn}
            onBack={handleBackToLanding}
            onSignUpSuccess={handleSignUpSuccess}
          />
        )
      case 'auth-callback':
        return <AuthCallback />
      case 'resume-optimizer':
        return (
          <div className="app-container">
            <Header user={user} onSignOut={handleSignOut} />
            <ResumeOptimizer />
          </div>
        )
      default:
        console.log('Rendering default (LandingPage)')
        return (
          <LandingPage
            onSignIn={handleSignIn}
            onSignUp={handleSignUp}
          />
        )
    }
  }

  return (
    <div className="app">
      {renderPage()}
    </div>
  )
}

// Header component for the resume optimizer page
const Header = ({ user, onSignOut }) => {
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-left">
          <h1 className="app-title">ResumeAI</h1>
          <span className="app-subtitle">AI-Powered Resume Optimization</span>
        </div>
        <div className="header-right">
          <div className="user-info">
            <User className="user-icon" />
            <span className="user-name">{user?.name || user?.email}</span>
          </div>
          <button onClick={onSignOut} className="signout-btn">
            <LogOut className="signout-icon" />
            Sign Out
          </button>
        </div>
      </div>
    </header>
  )
}
