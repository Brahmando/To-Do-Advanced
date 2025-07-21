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

  async sendFeedbackEmail(feedbackData) {
    const { userName, userEmail, rating, feedback, type, timestamp, userId } = feedbackData;
    
    // Get star rating display
    const starRating = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: process.env.FEEDBACK_EMAIL || process.env.EMAIL_USER, // Send to admin email
      subject: `📝 User Feedback - ${rating}/5 Stars - To-Do App Beta`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">📝 User Feedback</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">To-Do App Beta</p>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <div style="margin-bottom: 25px; padding: 20px; background: white; border-radius: 8px; border-left: 4px solid #667eea;">
              <h3 style="margin: 0 0 15px 0; color: #333;">📊 Feedback Summary</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                  <strong>User:</strong> ${userName}<br>
                  <strong>Email:</strong> ${userEmail}<br>
                  <strong>User ID:</strong> ${userId}
                </div>
                <div>
                  <strong>Rating:</strong> ${starRating} (${rating}/5)<br>
                  <strong>Type:</strong> ${type}<br>
                  <strong>Date:</strong> ${timestamp}
                </div>
              </div>
            </div>
            
            <div style="margin-bottom: 25px; padding: 20px; background: white; border-radius: 8px;">
              <h3 style="margin: 0 0 15px 0; color: #333;">💬 User Feedback</h3>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 3px solid #667eea;">
                <p style="margin: 0; color: #333; line-height: 1.6; white-space: pre-wrap;">${feedback}</p>
              </div>
            </div>
            
            <div style="padding: 15px; background: #e3f2fd; border: 1px solid #bbdefb; border-radius: 5px;">
              <p style="margin: 0; color: #1976d2; font-size: 14px;">
                <strong>🎯 Action Required:</strong> Please review this feedback and consider any necessary improvements or responses.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; background: #f1f1f1; color: #666; font-size: 12px; border-radius: 0 0 10px 10px;">
            <p style="margin: 0;">© 2025 To-Do App (Beta) - Feedback System 📈</p>
          </div>
        </div>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Feedback email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending feedback email:', error);
      return false;
    }
  }

  async sendSurveyEmail(surveyData) {
    const { userName, userEmail, userId, timestamp, responses, statistics } = surveyData;
    
    // Generate response summary
    const responseRows = responses.map(resp => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px; text-align: left; background: #f8f9fa;">${resp.category}</td>
        <td style="padding: 12px; text-align: left;">${resp.question}</td>
        <td style="padding: 12px; text-align: center;">
          <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: bold; color: white; background: ${
            resp.answer === 'yes' ? '#28a745' : 
            resp.answer === 'neutral' ? '#ffc107' : '#dc3545'
          };">
            ${resp.answer === 'yes' ? '✅ Yes' : 
              resp.answer === 'neutral' ? '😐 Neutral' : '❌ No'}
          </span>
        </td>
      </tr>
    `).join('');
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: process.env.FEEDBACK_EMAIL || process.env.EMAIL_USER, // Send to admin email
      subject: `📊 User Survey Results - ${statistics.positivePercentage}% Positive - To-Do App Beta`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">📊 User Survey Results</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">To-Do App Beta</p>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <div style="margin-bottom: 25px; padding: 20px; background: white; border-radius: 8px; border-left: 4px solid #667eea;">
              <h3 style="margin: 0 0 15px 0; color: #333;">👤 User Information</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                  <strong>User:</strong> ${userName}<br>
                  <strong>Email:</strong> ${userEmail}<br>
                  <strong>User ID:</strong> ${userId}
                </div>
                <div>
                  <strong>Completed:</strong> ${timestamp}<br>
                  <strong>Total Questions:</strong> ${statistics.totalQuestions}
                </div>
              </div>
            </div>
            
            <div style="margin-bottom: 25px; padding: 20px; background: white; border-radius: 8px;">
              <h3 style="margin: 0 0 15px 0; color: #333;">📈 Survey Statistics</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; text-align: center;">
                <div style="padding: 15px; background: #d4edda; border-radius: 8px;">
                  <div style="font-size: 24px; font-weight: bold; color: #155724;">${statistics.positivePercentage}%</div>
                  <div style="color: #155724; font-weight: bold;">✅ Positive</div>
                  <div style="color: #666; font-size: 12px;">${statistics.yesAnswers} answers</div>
                </div>
                <div style="padding: 15px; background: #fff3cd; border-radius: 8px;">
                  <div style="font-size: 24px; font-weight: bold; color: #856404;">${statistics.neutralPercentage}%</div>
                  <div style="color: #856404; font-weight: bold;">😐 Neutral</div>
                  <div style="color: #666; font-size: 12px;">${statistics.neutralAnswers} answers</div>
                </div>
                <div style="padding: 15px; background: #f8d7da; border-radius: 8px;">
                  <div style="font-size: 24px; font-weight: bold; color: #721c24;">${statistics.negativePercentage}%</div>
                  <div style="color: #721c24; font-weight: bold;">❌ Negative</div>
                  <div style="color: #666; font-size: 12px;">${statistics.noAnswers} answers</div>
                </div>
              </div>
            </div>
            
            <div style="margin-bottom: 25px; padding: 20px; background: white; border-radius: 8px;">
              <h3 style="margin: 0 0 15px 0; color: #333;">📋 Detailed Responses</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <thead>
                  <tr style="background: #667eea; color: white;">
                    <th style="padding: 12px; text-align: left;">Category</th>
                    <th style="padding: 12px; text-align: left;">Question</th>
                    <th style="padding: 12px; text-align: center;">Response</th>
                  </tr>
                </thead>
                <tbody>
                  ${responseRows}
                </tbody>
              </table>
            </div>
            
            <div style="padding: 15px; background: #e3f2fd; border: 1px solid #bbdefb; border-radius: 5px;">
              <p style="margin: 0; color: #1976d2; font-size: 14px;">
                <strong>🎯 Survey Insights:</strong> Use these results to prioritize feature improvements and address user concerns. 
                ${statistics.positivePercentage >= 70 ? 'Great job! Most users are satisfied.' : 
                  statistics.negativePercentage >= 30 ? 'Attention needed: High negative feedback requires investigation.' :
                  'Mixed feedback: Focus on converting neutral responses to positive.'}
              </p>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; background: #f1f1f1; color: #666; font-size: 12px; border-radius: 0 0 10px 10px;">
            <p style="margin: 0;">© 2025 To-Do App (Beta) - Survey System 📊</p>
          </div>
        </div>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Survey email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending survey email:', error);
      return false;
    }
  }
}

module.exports = new EmailService();
