// Development Email Service (Console Output)
// Use this for testing without actual email setup

const crypto = require('crypto');

class DevEmailService {
  constructor() {
    console.log('📧 Development Email Service Initialized (Console Output Mode)');
  }

  generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
  }

  async sendOTPEmail(email, otp, name) {
    console.log('\n' + '='.repeat(60));
    console.log('📧 EMAIL SENT (Development Mode)');
    console.log('='.repeat(60));
    console.log(`To: ${email}`);
    console.log(`Subject: 🔐 To-Do App (Beta) - Email Verification Code`);
    console.log('\n📝 Email Content:');
    console.log(`Hello ${name}!`);
    console.log(`Your verification code is: ${otp}`);
    console.log(`This code expires in 10 minutes.`);
    console.log('='.repeat(60) + '\n');
    
    return true; // Simulate successful email sending
  }

  async sendWelcomeEmail(email, name) {
    console.log('\n' + '='.repeat(60));
    console.log('🎉 WELCOME EMAIL SENT (Development Mode)');
    console.log('='.repeat(60));
    console.log(`To: ${email}`);
    console.log(`Subject: 🎉 Welcome to To-Do App (Beta)!`);
    console.log('\n📝 Email Content:');
    console.log(`Congratulations ${name}!`);
    console.log(`Your email has been successfully verified!`);
    console.log(`Welcome to To-Do App Beta!`);
    console.log('='.repeat(60) + '\n');
    
    return true; // Simulate successful email sending
  }
}

module.exports = new DevEmailService();
