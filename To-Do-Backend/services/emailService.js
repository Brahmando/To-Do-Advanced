const nodemailer = require('nodemailer');
const crypto = require('crypto');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
  }

  async sendOTPEmail(email, otp, name) {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: '🔐 To-Do App (Beta) - Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🚀 To-Do App (Beta)</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Email Verification</p>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Hello ${name}! 👋</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Welcome to our To-Do App Beta! We're excited to have you test our application. 
              To complete your account setup, please verify your email address using the code below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; background: #667eea; color: white; padding: 15px 30px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 3px;">
                ${otp}
              </div>
            </div>
            
            <p style="color: #888; font-size: 14px; text-align: center; margin-top: 25px;">
              This code will expire in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.
            </p>
            
            <div style="margin-top: 30px; padding: 15px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>Beta Notice:</strong> This application is currently in beta testing. 
                You may encounter bugs or unexpected behavior. Please report any issues you find!
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              If you didn't create an account with us, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; background: #f1f1f1; color: #666; font-size: 12px; border-radius: 0 0 10px 10px;">
            <p style="margin: 0;">© 2025 To-Do App (Beta) - Making productivity fun! 🎯</p>
          </div>
        </div>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('OTP email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending OTP email:', error);
      return false;
    }
  }

  async sendWelcomeEmail(email, name) {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: '🎉 Welcome to To-Do App (Beta)!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🎉 Welcome to To-Do App (Beta)</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Your account is now verified!</p>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Congratulations ${name}! 🚀</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Your email has been successfully verified and your account is now active! 
              You can now enjoy all the features of our To-Do App Beta.
            </p>
            
            <div style="margin: 25px 0; padding: 20px; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px;">
              <h3 style="margin: 0 0 10px 0; color: #155724;">🌟 What you can do now:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #155724;">
                <li>Create and manage personal tasks</li>
                <li>Create group tasks and collaborate</li>
                <li>Join shared groups with friends</li>
                <li>Get notifications for group activities</li>
              </ul>
            </div>
            
            <div style="margin-top: 30px; padding: 15px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>Beta Tester:</strong> As a beta tester, your feedback is invaluable! 
                Help us improve by reporting any bugs or suggesting new features.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="http://localhost:3000" style="display: inline-block; background: #667eea; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Start Using To-Do App 🚀
              </a>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; background: #f1f1f1; color: #666; font-size: 12px; border-radius: 0 0 10px 10px;">
            <p style="margin: 0;">© 2025 To-Do App (Beta) - Making productivity fun! 🎯</p>
          </div>
        </div>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Welcome email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  }
}

module.exports = new EmailService();
