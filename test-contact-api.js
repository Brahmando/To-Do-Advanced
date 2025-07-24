// Test script to verify contact API functionality
const fetch = require('node-fetch');

async function testContactAPI() {
  const testData = {
    name: 'Test User',
    email: 'test@example.com',
    subject: 'Test Contact Form',
    message: 'This is a test message to verify the contact form functionality.',
    category: 'general'
  };

  try {
    console.log('🧪 Testing Contact API...');
    console.log('📤 Sending test contact form data...');
    
    const response = await fetch('http://localhost:5000/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Contact API Test Successful!');
      console.log('📧 Response:', result);
    } else {
      console.log('❌ Contact API Test Failed!');
      console.log('🚨 Error:', result);
    }
  } catch (error) {
    console.log('❌ Network Error:', error.message);
    console.log('💡 Make sure the backend server is running on port 5000');
  }
}

// Run the test
testData();

async function testData() {
  await testContactAPI();
}