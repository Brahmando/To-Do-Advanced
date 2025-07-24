import React from 'react';
import { GoogleLogin } from '@react-oauth/google';

const GoogleSignInButton = ({ onSuccess, onError, text = "Sign in with Google" }) => {
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      // Send the Google token to your backend for verification
      const response = await fetch('https://to-do-advanced-production.up.railway.app/api/auth/google-signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      onError('Network error during Google sign-in');
    }
  };

  const handleGoogleError = () => {
    console.error('Google sign-in failed');
    onError('Google sign-in was cancelled or failed');
  };

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          size="large"
          width="100%"
          text={text}
          shape="rectangular"
          logo_alignment="left"
          theme="outline"
        />
      </div>
    </div>
  );
};

export default GoogleSignInButton;
