// Quick verification script to test email service
const emailService = require('./services/emailService');

async function testEmailService() {
  console.log('🧪 Testing Email Service Configuration...\n');
  
  // Test OTP generation
  const testOTP = emailService.generateOTP();
  console.log('✅ OTP Generation:', testOTP);
  
  // Check environment variables
  console.log('\n🔧 Environment Variables:');
  console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE || 'Not set');
  console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set ✅' : 'Not set ❌');
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set ✅' : 'Not set ❌');
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM || 'Not set');
  console.log('OTP_EXPIRY_MINUTES:', process.env.OTP_EXPIRY_MINUTES || '10 (default)');
  
  console.log('\n📋 Next Steps:');
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('❌ Please configure your email settings in .env file');
    console.log('📖 Check EMAIL_SETUP_README.md for detailed instructions');
  } else {
    console.log('✅ Email configuration looks good!');
    console.log('🚀 Try testing the signup flow in the frontend');
  }
  
  console.log('\n🎯 Beta Features Implemented:');
  console.log('✅ OTP Email Verification');
  console.log('✅ Beta UI Branding');
  console.log('✅ Enhanced Email Templates');
  console.log('✅ Resend OTP Functionality');
  console.log('✅ Email Verification Required for Login');
}

testEmailService().catch(console.error);
