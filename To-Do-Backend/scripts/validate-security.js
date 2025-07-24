#!/usr/bin/env node

/**
 * Security Configuration Validator
 * Validates that all security-critical environment variables are properly configured
 */

require('dotenv').config();
const crypto = require('crypto');

console.log('🔒 Security Configuration Validator\n');

let hasErrors = false;
const warnings = [];
const errors = [];

// Required environment variables
const requiredVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'EMAIL_USER',
  'EMAIL_PASS',
  'GOOGLE_CLIENT_ID'
];

// Check required variables
console.log('📋 Checking Required Environment Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    errors.push(`❌ ${varName} is missing`);
    hasErrors = true;
  } else {
    console.log(`✅ ${varName} is set`);
  }
});

// Validate JWT Secret strength
console.log('\n🔑 Validating JWT Secret:');
const jwtSecret = process.env.JWT_SECRET;
if (jwtSecret) {
  if (jwtSecret.length < 32) {
    errors.push('❌ JWT_SECRET is too short (minimum 32 characters)');
    hasErrors = true;
  } else if (jwtSecret === 'your-jwt-secret-key' || jwtSecret === 'your-super-secure-jwt-secret-key-change-this-in-production-min-32-chars') {
    errors.push('❌ JWT_SECRET is using default value - change it!');
    hasErrors = true;
  } else {
    console.log('✅ JWT_SECRET length is adequate');
    
    // Check entropy (basic check)
    const uniqueChars = new Set(jwtSecret).size;
    if (uniqueChars < 10) {
      warnings.push('⚠️  JWT_SECRET has low character diversity');
    } else {
      console.log('✅ JWT_SECRET has good character diversity');
    }
  }
}

// Validate MongoDB URI
console.log('\n🗄️  Validating MongoDB Configuration:');
const mongoUri = process.env.MONGODB_URI;
if (mongoUri) {
  if (mongoUri.includes('powerangerinfinite123') || mongoUri.includes('n2n1RXzFsHFfzmNJ')) {
    warnings.push('⚠️  MongoDB URI contains example credentials - consider changing');
  }
  
  if (!mongoUri.includes('retryWrites=true')) {
    warnings.push('⚠️  MongoDB URI should include retryWrites=true for reliability');
  }
  
  if (mongoUri.startsWith('mongodb+srv://')) {
    console.log('✅ Using MongoDB Atlas (recommended)');
  } else {
    warnings.push('⚠️  Consider using MongoDB Atlas for better security');
  }
}

// Validate CORS Origins
console.log('\n🌐 Validating CORS Configuration:');
const corsOrigins = process.env.CORS_ORIGINS;
if (corsOrigins) {
  const origins = corsOrigins.split(',').map(o => o.trim());
  console.log(`✅ CORS_ORIGINS configured with ${origins.length} origins`);
  
  const hasHttps = origins.some(origin => origin.startsWith('https://'));
  const hasLocalhost = origins.some(origin => origin.includes('localhost'));
  
  if (!hasHttps && process.env.NODE_ENV === 'production') {
    warnings.push('⚠️  No HTTPS origins found - ensure production uses HTTPS');
  }
  
  if (hasLocalhost && process.env.NODE_ENV === 'production') {
    warnings.push('⚠️  Localhost origins found in production environment');
  }
} else {
  warnings.push('⚠️  CORS_ORIGINS not set - using default development origins');
}

// Validate Email Configuration
console.log('\n📧 Validating Email Configuration:');
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

if (emailUser && emailPass) {
  if (emailUser.includes('@gmail.com') && emailPass.length < 16) {
    warnings.push('⚠️  Gmail App Password should be 16 characters long');
  }
  
  if (emailUser === process.env.FEEDBACK_EMAIL) {
    console.log('✅ Using same email for sending and receiving feedback');
  } else {
    console.log('✅ Separate feedback email configured');
  }
}

// Validate Google OAuth
console.log('\n🔐 Validating Google OAuth:');
const googleClientId = process.env.GOOGLE_CLIENT_ID;
if (googleClientId) {
  if (googleClientId.includes('858827027826')) {
    warnings.push('⚠️  Google Client ID appears to be example/development ID');
  }
  
  if (googleClientId.endsWith('.apps.googleusercontent.com')) {
    console.log('✅ Google Client ID format is correct');
  } else {
    errors.push('❌ Google Client ID format is invalid');
    hasErrors = true;
  }
}

// Environment-specific checks
console.log('\n🌍 Environment-Specific Checks:');
const nodeEnv = process.env.NODE_ENV || 'development';
console.log(`Current environment: ${nodeEnv}`);

if (nodeEnv === 'production') {
  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl || !frontendUrl.startsWith('https://')) {
    errors.push('❌ FRONTEND_URL must use HTTPS in production');
    hasErrors = true;
  }
  
  if (corsOrigins && corsOrigins.includes('localhost')) {
    errors.push('❌ CORS_ORIGINS should not include localhost in production');
    hasErrors = true;
  }
}

// Generate security recommendations
console.log('\n💡 Security Recommendations:');
console.log('1. Use strong, unique passwords for all services');
console.log('2. Enable 2FA on all accounts (MongoDB, Google, Email)');
console.log('3. Regularly rotate JWT secrets and API keys');
console.log('4. Monitor application logs for suspicious activity');
console.log('5. Keep dependencies updated with security patches');
console.log('6. Use HTTPS in production environments');
console.log('7. Implement rate limiting for API endpoints');
console.log('8. Regular security audits and penetration testing');

// Generate new JWT secret suggestion
console.log('\n🔑 Generate New JWT Secret:');
const newJwtSecret = crypto.randomBytes(32).toString('hex');
console.log(`Suggested JWT_SECRET: ${newJwtSecret}`);

// Summary
console.log('\n📊 Security Validation Summary:');
console.log(`✅ Checks passed: ${requiredVars.length - errors.length}/${requiredVars.length}`);
console.log(`⚠️  Warnings: ${warnings.length}`);
console.log(`❌ Errors: ${errors.length}`);

if (warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  warnings.forEach(warning => console.log(`  ${warning}`));
}

if (errors.length > 0) {
  console.log('\n❌ Errors:');
  errors.forEach(error => console.log(`  ${error}`));
}

if (hasErrors) {
  console.log('\n🚨 Security validation failed! Please fix the errors above.');
  process.exit(1);
} else if (warnings.length > 0) {
  console.log('\n⚠️  Security validation passed with warnings. Consider addressing them.');
  process.exit(0);
} else {
  console.log('\n🎉 Security validation passed! Your configuration looks good.');
  process.exit(0);
}