import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const AuthCallback = () => {
  const [message, setMessage] = useState('Processing...');
  const { user } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setMessage('Authentication error. Please try again.');
        } else if (data.session) {
          setMessage('Authentication successful! Redirecting...');
          // The AuthContext will handle the redirect automatically
        } else {
          setMessage('No session found. Please sign in again.');
        }
      } catch (error) {
        setMessage('An error occurred. Please try again.');
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Authentication</h1>
          <p>{message}</p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
