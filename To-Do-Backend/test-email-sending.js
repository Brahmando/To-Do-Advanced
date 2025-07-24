// Test email sending directly
require('dotenv').config();
const emailService = require('./services/emailService');

async function testEmailSending() {
  console.log('🧪 Testing Email Sending...\n');
  
  console.log('Environment Variables:');
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
  console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE);
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set ✅' : 'Not set ❌');
  
  try {
    // Generate test OTP
    const testOTP = emailService.generateOTP();
    console.log('\n📧 Attempting to send test OTP email...');
    
    // Try sending email to the same address
    const result = await emailService.sendOTPEmail(
      process.env.EMAIL_USER, // Send to yourself for testing
      testOTP,
      'Test User'
    );
    
    if (result) {
      console.log('✅ Email sent successfully!');
      console.log('📬 Check your inbox for the OTP email');
    } else {
      console.log('❌ Failed to send email');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔧 Possible solutions:');
      console.log('1. Double-check your Gmail app password');
      console.log('2. Make sure 2-Step Verification is enabled');
      console.log('3. Try generating a new app password');
      console.log('4. Check that EMAIL_FROM matches EMAIL_USER');
    }
  }
}

testEmailSending();
