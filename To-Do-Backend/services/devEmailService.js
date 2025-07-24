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

  async sendFeedbackEmail(feedbackData) {
    const { userName, userEmail, rating, feedback, type, timestamp, userId } = feedbackData;
    
    console.log('\n' + '='.repeat(60));
    console.log('📝 FEEDBACK EMAIL SENT (Development Mode)');
    console.log('='.repeat(60));
    console.log(`To: Admin/Developer Email`);
    console.log(`Subject: 📝 User Feedback - ${rating}/5 Stars - To-Do App Beta`);
    console.log('\n📊 Feedback Details:');
    console.log(`User: ${userName} (${userEmail})`);
    console.log(`User ID: ${userId}`);
    console.log(`Rating: ${'⭐'.repeat(rating)}${'☆'.repeat(5 - rating)} (${rating}/5)`);
    console.log(`Type: ${type}`);
    console.log(`Timestamp: ${timestamp}`);
    console.log('\n💬 User Feedback:');
    console.log(`"${feedback}"`);
    console.log('='.repeat(60) + '\n');
    
    return true; // Simulate successful email sending
  }

  async sendSurveyEmail(surveyData) {
    const { userName, userEmail, userId, timestamp, responses, statistics } = surveyData;
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 SURVEY RESULTS EMAIL SENT (Development Mode)');
    console.log('='.repeat(80));
    console.log(`To: Admin/Developer Email`);
    console.log(`Subject: 📊 User Survey Results - ${statistics.positivePercentage}% Positive - To-Do App Beta`);
    console.log('\n👤 User Information:');
    console.log(`Name: ${userName}`);
    console.log(`Email: ${userEmail}`);
    console.log(`User ID: ${userId}`);
    console.log(`Completed: ${timestamp}`);
    
    console.log('\n📈 Survey Statistics:');
    console.log(`Total Questions: ${statistics.totalQuestions}`);
    console.log(`✅ Positive (Yes): ${statistics.yesAnswers} (${statistics.positivePercentage}%)`);
    console.log(`😐 Neutral: ${statistics.neutralAnswers} (${statistics.neutralPercentage}%)`);
    console.log(`❌ Negative (No): ${statistics.noAnswers} (${statistics.negativePercentage}%)`);
    
    console.log('\n📋 Detailed Responses:');
    responses.forEach((resp, index) => {
      const answerEmoji = resp.answer === 'yes' ? '✅' : resp.answer === 'neutral' ? '😐' : '❌';
      console.log(`${index + 1}. [${resp.category}] ${resp.question}`);
      console.log(`   Answer: ${answerEmoji} ${resp.answer.toUpperCase()}\n`);
    });
    
    console.log('='.repeat(80) + '\n');
    
    return true; // Simulate successful email sending
  }

  async sendContactEmail(contactData) {
    const { name, email, subject, message, category, timestamp, contactId } = contactData;
    
    // Get category info
    const categoryInfo = {
      general: { icon: '💬', label: 'General Inquiry' },
      support: { icon: '🔧', label: 'Technical Support' },
      feature: { icon: '💡', label: 'Feature Request' },
      bug: { icon: '🐛', label: 'Bug Report' },
      business: { icon: '💼', label: 'Business Inquiry' },
      feedback: { icon: '📝', label: 'Feedback' }
    };
    
    const catInfo = categoryInfo[category] || categoryInfo.general;
    
    console.log('\n' + '='.repeat(70));
    console.log('📞 CONTACT FORM EMAIL SENT (Development Mode)');
    console.log('='.repeat(70));
    console.log(`To: Admin/Developer Email`);
    console.log(`Subject: ${catInfo.icon} Contact Form: ${subject} - To-Do App`);
    console.log('\n📋 Contact Information:');
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Category: ${catInfo.icon} ${catInfo.label}`);
    console.log(`Contact ID: ${contactId}`);
    console.log(`Timestamp: ${timestamp}`);
    console.log(`Priority: ${category === 'support' || category === 'bug' ? 'HIGH' : 'NORMAL'}`);
    
    console.log('\n📝 Subject:');
    console.log(`"${subject}"`);
    
    console.log('\n💬 Message:');
    console.log(`"${message}"`);
    
    console.log('\n🎯 Action Required:');
    if (category === 'support') {
      console.log('Technical support needed - Please respond within 24 hours.');
    } else if (category === 'bug') {
      console.log('Bug report - Please investigate and prioritize fix.');
    } else if (category === 'feature') {
      console.log('Feature request - Consider for product roadmap.');
    } else if (category === 'business') {
      console.log('Business inquiry - Forward to appropriate team.');
    } else {
      console.log('Please review and respond to this contact form submission.');
    }
    
    console.log('='.repeat(70) + '\n');
    
    return true; // Simulate successful email sending
  }

  async sendContactConfirmationEmail(contactData) {
    const { name, email, subject, category, timestamp } = contactData;
    
    // Get category info
    const categoryInfo = {
      general: { icon: '💬', label: 'General Inquiry' },
      support: { icon: '🔧', label: 'Technical Support' },
      feature: { icon: '💡', label: 'Feature Request' },
      bug: { icon: '🐛', label: 'Bug Report' },
      business: { icon: '💼', label: 'Business Inquiry' },
      feedback: { icon: '📝', label: 'Feedback' }
    };
    
    const catInfo = categoryInfo[category] || categoryInfo.general;
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ CONTACT CONFIRMATION EMAIL SENT (Development Mode)');
    console.log('='.repeat(60));
    console.log(`To: ${email}`);
    console.log(`Subject: ✅ We received your message - To-Do App Support`);
    console.log('\n📝 Email Content:');
    console.log(`Hello ${name}!`);
    console.log(`Thank you for contacting us! We've received your message.`);
    console.log('\n📋 Your Submission:');
    console.log(`Category: ${catInfo.icon} ${catInfo.label}`);
    console.log(`Subject: ${subject}`);
    console.log(`Submitted: ${timestamp}`);
    console.log(`Status: ✅ Received`);
    console.log('\n⏰ Response Time: 24-48 hours');
    console.log('='.repeat(60) + '\n');
    
    return true; // Simulate successful email sending
  }
}

module.exports = new DevEmailService();
