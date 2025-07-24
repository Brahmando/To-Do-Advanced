# 🔒 Security Configuration Guide

## 🚨 Critical Security Updates Applied

This document outlines the security improvements made to remove hardcoded sensitive values and ensure proper environment variable usage.

## ✅ Security Issues Fixed

### 1. **Removed Hardcoded MongoDB Connection String**
- **Before**: Hardcoded MongoDB URI with credentials in multiple files
- **After**: Uses `MONGODB_URI` environment variable exclusively
- **Files Updated**: 
  - `server.js`
  - `scripts/setupAiChatbotIndexes.js`

### 2. **Removed Hardcoded CORS Origins**
- **Before**: Hardcoded localhost URLs in CORS configuration
- **After**: Uses `CORS_ORIGINS` environment variable
- **Files Updated**:
  - `server.js`
  - `socket.js`

### 3. **Removed Hardcoded URLs in Email Templates**
- **Before**: Hardcoded localhost URLs in email templates
- **After**: Uses `FRONTEND_URL` environment variable
- **Files Updated**:
  - `services/emailService.js`

### 4. **Improved JWT Secret Security**
- **Before**: Weak JWT secret with fallback
- **After**: Requires strong JWT secret from environment
- **Files Updated**:
  - `socket.js` (removed fallback)
  - `.env` (improved secret)

## 🔧 Required Environment Variables

### Backend (.env)
```bash
# Security Configuration - CRITICAL: Change these in production!
JWT_SECRET=generate-a-strong-random-jwt-secret-at-least-32-characters-long
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name

# Server Configuration
PORT=5000
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://yourdomain.com
FRONTEND_URL=http://localhost:3000

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
FEEDBACK_EMAIL=your-email@gmail.com

# OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# OTP Configuration
OTP_EXPIRY_MINUTES=10
```

### Frontend (.env)
```bash
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# API Configuration
VITE_API_URL=http://localhost:5000/api
REACT_APP_BACKEND_URL=http://localhost:5000
```

## 🛡️ Production Security Checklist

### 1. **JWT Secret Generation**
Generate a strong JWT secret (minimum 32 characters):
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

### 2. **MongoDB Security**
- Use MongoDB Atlas with IP whitelisting
- Create dedicated database user with minimal permissions
- Enable MongoDB authentication
- Use connection string with SSL/TLS

### 3. **CORS Configuration**
- Update `CORS_ORIGINS` to include only your production domains
- Remove localhost URLs in production
- Use HTTPS URLs only in production

### 4. **Environment Variables**
- Never commit `.env` files to version control
- Use different `.env` files for different environments
- Validate all required environment variables on startup

### 5. **Email Security**
- Use App Passwords for Gmail (not regular passwords)
- Consider using dedicated email service (SendGrid, AWS SES)
- Validate email addresses and sanitize content

## 🚀 Deployment Security

### 1. **Environment Variable Validation**
The application now validates critical environment variables on startup:
- `MONGODB_URI` - Required for database connection
- `JWT_SECRET` - Required for authentication
- Other variables have sensible defaults for development

### 2. **Error Handling**
- Application exits gracefully if critical environment variables are missing
- Clear error messages for missing configuration
- No sensitive information exposed in error messages

### 3. **Development vs Production**
- Development: Uses fallback values for convenience
- Production: Requires all security-critical variables
- Clear separation of concerns

## 📝 Migration Steps

If you're updating an existing installation:

1. **Update Environment Variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

2. **Generate New JWT Secret**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Update CORS Origins**:
   ```bash
   CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://yourdomain.com
   ```

4. **Set Frontend URL**:
   ```bash
   FRONTEND_URL=https://yourdomain.com
   ```

5. **Restart Application**:
   ```bash
   npm start
   ```

## ⚠️ Security Warnings

1. **Never commit `.env` files** - They contain sensitive credentials
2. **Use strong JWT secrets** - Minimum 32 characters, randomly generated
3. **Validate CORS origins** - Only allow trusted domains
4. **Use HTTPS in production** - Never use HTTP for sensitive data
5. **Regular security updates** - Keep dependencies updated
6. **Monitor access logs** - Watch for suspicious activity

## 🔍 Security Testing

Test your security configuration:

1. **Environment Variable Test**:
   ```bash
   # This should fail if MONGODB_URI is not set
   npm start
   ```

2. **CORS Test**:
   ```bash
   # Test from unauthorized origin - should be blocked
   curl -H "Origin: http://malicious-site.com" http://localhost:5000/api/tasks
   ```

3. **JWT Test**:
   ```bash
   # Test with invalid JWT - should be rejected
   curl -H "Authorization: Bearer invalid-token" http://localhost:5000/api/tasks
   ```

## 📞 Support

If you encounter security-related issues:
1. Check environment variable configuration
2. Verify JWT secret strength
3. Confirm CORS origins are correct
4. Review application logs for errors

Remember: Security is an ongoing process, not a one-time setup!