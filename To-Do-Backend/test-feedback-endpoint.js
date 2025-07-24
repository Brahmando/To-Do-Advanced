// Test the feedback endpoint with real email
require('dotenv').config();
const mongoose = require('mongoose');

async function testFeedbackEndpoint() {
  console.log('🧪 Testing Feedback Endpoint with Real Email...\n');
  
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Import required modules
    const User = require('./models/User');
    const emailService = require('./services/emailService');
    
    // Create a test user if it doesn't exist
    let testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      testUser = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword',
        isVerified: true
      });
      await testUser.save();
      console.log('✅ Created test user');
    } else {
      console.log('✅ Found existing test user');
    }
    
    // Simulate feedback submission
    const feedbackData = {
      userName: testUser.name,
      userEmail: testUser.email,
      rating: 5,
      feedback: 'This is a test feedback submission to verify that emails are being sent to the configured email address. The feedback system is working great!',
      type: 'general',
      timestamp: new Date().toLocaleString('en-US', {
        timeZone: 'UTC',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      userId: testUser._id
    };
    
    console.log('\n📤 Sending feedback email...');
    const result = await emailService.sendFeedbackEmail(feedbackData);
    
    if (result) {
      console.log('✅ Feedback email sent successfully!');
      console.log(`📧 Email sent to: ${process.env.FEEDBACK_EMAIL || process.env.EMAIL_USER}`);
      console.log('\n🎯 Check your inbox for the feedback email!');
    } else {
      console.log('❌ Failed to send feedback email');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

testFeedbackEndpoint();