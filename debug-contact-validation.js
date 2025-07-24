// Debug script to test contact form validation

const testData = {
  name: 'Test User',
  email: 'test@example.com',
  subject: 'Test Subject',
  message: 'This is a test message that should be long enough to pass validation.',
  category: 'general'
};

console.log('🧪 Testing Contact Form Data:');
console.log(JSON.stringify(testData, null, 2));

console.log('\n📋 Validation Checks:');
console.log('Name length:', testData.name.length, '(should be 2-100)');
console.log('Email format:', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testData.email));
console.log('Subject length:', testData.subject.length, '(should be 5-200)');
console.log('Message length:', testData.message.length, '(should be 10-1000)');
console.log('Category valid:', ['general', 'support', 'feature', 'bug', 'business', 'feedback'].includes(testData.category));

// Test the actual API call
async function testContactAPI() {
  try {
    console.log('\n🚀 Testing API Call...');
    
    const response = await fetch('http://localhost:5000/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log('📊 Response Status:', response.status);
    
    if (response.ok) {
      console.log('✅ Contact API Test Successful!');
      console.log('📧 Response:', result);
    } else {
      console.log('❌ Contact API Test Failed!');
      console.log('🚨 Error Response:', result);
    }
  } catch (error) {
    console.log('❌ Network Error:', error.message);
  }
}

// Run the test
testContactAPI();