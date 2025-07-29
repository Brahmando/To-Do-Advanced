import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';

const GoogleSignInButton = ({ onSuccess, onError, text = "Sign in with Google" }) => {
  const [hasError, setHasError] = useState(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      // Send the Google token to your backend for verification
      const response = await fetch('https://to-do-advanced-production.up.railway.app/api/auth/google-signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin,
        },
        credentials: 'include', // Send cookies with the request
        mode: 'cors', // Explicitly state that this is a CORS request
        body: JSON.stringify({
          credential: credentialResponse.credential
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onSuccess(data.user);
      } else {
        onError(data.error || 'Google sign-in failed');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      
      // Specific error handling for CORS issues
      if (error.message && error.message.includes('NetworkError')) {
        onError('CORS error: Unable to connect to authentication server. Please contact support.');
        console.error('CORS Error Details:', { 
          origin: window.location.origin,
          target: 'https://to-do-advanced-production.up.railway.app/api/auth/google-signin'
        });
      } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        onError('Network error: Server may be down or CORS issue. Please try again later.');
      } else {
        onError('Network error during Google sign-in');
      }
      
      setHasError(true);
    }
  };

  const handleGoogleError = (error) => {
    console.error('Google sign-in failed:', error);
    setHasError(true);
    
    // Check for common error patterns
    if (error && error.toString().includes('ERR_BLOCKED_BY_CLIENT') || 
        error && error.toString().includes('net::ERR_BLOCKED_BY_CLIENT')) {
      onError('Google sign-in was blocked by your browser. Please disable ad blockers or privacy extensions for this site.');
    } else if (error && error.toString().includes('popup')) {
      onError('Google sign-in popup was blocked. Please allow popups for this site.');
    } else {
      onError('Google sign-in was cancelled or failed. Please try again.');
    }
  };

  return (
    <div className="w-full flex flex-col justify-center">
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          size="large"
          width="100%"
          text={text}
          useOneTap={false} // Disable OneTap to avoid additional issues
          shape="rectangular"
          logo_alignment="left"
          theme="outline"
        />
        
        {hasError && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
            <p className="font-medium">⚠️ Google Sign-In Issue Detected</p>
            <p className="mt-1">Possible causes:</p>
            <ul className="list-disc ml-4 mt-1">
              <li>Ad blocker or privacy extension is active</li>
              <li>Third-party cookies are blocked</li>
              <li>Pop-ups are blocked for this site</li>
            </ul>
            <p className="mt-2">Please try regular email login instead or adjust your browser settings.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleSignInButton;
