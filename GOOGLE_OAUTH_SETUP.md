# Google OAuth Setup Guide

To enable Google Sign-In functionality in your To-Do App, you'll need to configure Google OAuth credentials.

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (legacy) or Google Sign-In API

## Step 2: Create OAuth 2.0 Credentials

1. Navigate to "Credentials" in the Google Cloud Console
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application" as the application type
4. Add your authorized JavaScript origins:
   - For development: `http://localhost:5173` (Vite dev server)
   - For production: Your production domain
5. Add authorized redirect URIs (if needed):
   - For development: `http://localhost:5173`
6. Save and copy your Client ID

## Step 3: Configure Environment Variables

### Backend (.env)
```bash
GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
```

### Frontend (.env)
```bash
VITE_GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
```

## Step 4: Install Dependencies

The required packages are already installed:
- Backend: `google-auth-library`
- Frontend: `@react-oauth/google`

## Step 5: Test the Integration

1. Start your backend server: `npm start` (in To-Do-Backend)
2. Start your frontend: `npm run dev` (in To-Do-Frontend)
3. Try signing up or logging in with Google

## Important Notes

- The same Client ID should be used in both frontend and backend
- Make sure your domain is added to authorized origins
- For production, update the Client ID in both .env files
- Keep your Client ID secure and don't commit it to public repositories

## Troubleshooting

- **"Invalid Client ID"**: Double-check the Client ID in both .env files
- **"Origin not allowed"**: Add your domain to authorized JavaScript origins
- **"Token verification failed"**: Ensure backend and frontend use the same Client ID

## Current State

The Google Sign-In integration is fully implemented:
- ✅ Frontend Google Sign-In button
- ✅ Backend Google token verification
- ✅ User creation/login with Google accounts
- ✅ JWT token generation for authenticated users
- ✅ Environment variable configuration

Just replace the placeholder Client ID with your actual Google OAuth Client ID!
