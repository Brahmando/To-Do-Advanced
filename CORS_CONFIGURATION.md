# CORS Configuration for Railway Backend

To fix the CORS issues with Google Sign-In, you need to update the environment variables on your Railway backend deployment.

## Steps to Update CORS Configuration

1. Login to the [Railway Dashboard](https://railway.app/dashboard)

2. Go to your "To-Do-Advanced-Production" project

3. Click on the "Variables" tab

4. Look for an environment variable named `CORS_ORIGINS` 

5. Edit the variable and make sure it includes all of these domains (comma-separated):
   ```
   http://localhost:3000,http://localhost:5173,https://to-do-advanced-rose.vercel.app
   ```

6. If the `CORS_ORIGINS` variable doesn't exist, add it with the values above

7. Save the changes and wait for your backend to redeploy

## Additional Railway Server Configuration

You may also need to add a specific header to your Railway backend:

1. In the Railway dashboard, go to "Settings"
2. Look for any HTTP headers configuration
3. Add the following header:
   ```
   Access-Control-Allow-Origin: https://to-do-advanced-rose.vercel.app
   ```

## Testing the Fix

After making these changes, try the Google Sign-In again. The CORS error should be resolved.

If you continue to have issues, consider one of these options:

1. Implement a CORS proxy solution
2. Use the same domain for both frontend and backend
3. Contact Railway support for additional help with CORS configuration
