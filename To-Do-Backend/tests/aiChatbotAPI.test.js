/**
 * API Endpoint Tests for AI Chatbot
 * Tests the REST API endpoints for authentication, responses, and error handling
 * 
 * Note: These tests require a running server and valid authentication
 * Run with: node tests/aiChatbotAPI.test.js
 */

const BASE_URL = 'http://localhost:5000';

// Mock authentication token (replace with actual token for testing)
const AUTH_TOKEN = 'your-test-token-here';

// Test cases for API endpoints
const apiTestCases = [
  {
    name: 'Chat Endpoint - Valid Message',
    endpoint: '/api/ai-chatbot/chat',
    method: 'POST',
    body: { message: 'How many tasks do I have?' },
    expectedStatus: 200,
    expectedFields: ['success', 'data.response', 'data.intent', 'data.confidence']
  },
  {
    name: 'Chat Endpoint - Empty Message',
    endpoint: '/api/ai-chatbot/chat',
    method: 'POST',
    body: { message: '' },
    expectedStatus: 400,
    expectedFields: ['success', 'error']
  },
  {
    name: 'Chat Endpoint - Long Message',
    endpoint: '/api/ai-chatbot/chat',
    method: 'POST',
    body: { message: 'a'.repeat(1001) }, // Exceeds 1000 char limit
    expectedStatus: 400,
    expectedFields: ['success', 'error']
  },
  {
    name: 'Chat History Endpoint',
    endpoint: '/api/ai-chatbot/history',
    method: 'GET',
    expectedStatus: 200,
    expectedFields: ['success', 'data.messages', 'data.count']
  },
  {
    name: 'Status Endpoint',
    endpoint: '/api/ai-chatbot/status',
    method: 'GET',
    expectedStatus: 200,
    expectedFields: ['success', 'data.status', 'data.capabilities']
  },
  {
    name: 'Help Endpoint',
    endpoint: '/api/ai-chatbot/help',
    method: 'GET',
    expectedStatus: 200,
    expectedFields: ['success', 'data.title', 'data.examples']
  }
];

// Authentication test cases
const authTestCases = [
  {
    name: 'No Token',
    token: null,
    expectedStatus: 401,
    expectedError: 'NO_TOKEN'
  },
  {
    name: 'Invalid Token',
    token: 'invalid-token',
    expectedStatus: 401,
    expectedError: 'INVALID_TOKEN'
  },
  {
    name: 'Malformed Token',
    token: 'Bearer malformed',
    expectedStatus: 401,
    expectedError: 'INVALID_TOKEN'
  }
];

// Rate limiting test
const rateLimitTest = {
  name: 'Rate Limiting',
  endpoint: '/api/ai-chatbot/chat',
  method: 'POST',
  body: { message: 'test' },
  requestCount: 35, // Exceeds 30 requests per minute limit
  expectedStatus: 429
};

/**
 * Make HTTP request
 */
async function makeRequest(endpoint, method = 'GET', body = null, token = AUTH_TOKEN) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    return {
      status: response.status,
      data,
      headers: response.headers
    };
  } catch (error) {
    return {
      status: 0,
      error: error.message
    };
  }
}

/**
 * Check if object has nested property
 */
function hasNestedProperty(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined;
  }, obj);
}

/**
 * Run API endpoint tests
 */
async function runAPITests() {
  console.log('🌐 Running API Endpoint Tests...\n');
  
  let passed = 0;
  let failed = 0;
  const results = [];

  for (const testCase of apiTestCases) {
    try {
      console.log(`Testing: ${testCase.name}`);
      
      const response = await makeRequest(
        testCase.endpoint,
        testCase.method,
        testCase.body
      );

      // Check status code
      const statusMatch = response.status === testCase.expectedStatus;
      
      // Check expected fields
      let fieldsMatch = true;
      const missingFields = [];
      
      if (testCase.expectedFields) {
        for (const field of testCase.expectedFields) {
          if (!hasNestedProperty(response.data, field)) {
            fieldsMatch = false;
            missingFields.push(field);
          }
        }
      }

      const testPassed = statusMatch && fieldsMatch;
      
      if (testPassed) {
        console.log('✅ Test passed');
        passed++;
      } else {
        console.log('❌ Test failed');
        if (!statusMatch) {
          console.log(`  Expected status: ${testCase.expectedStatus}, Got: ${response.status}`);
        }
        if (!fieldsMatch) {
          console.log(`  Missing fields: ${missingFields.join(', ')}`);
        }
        failed++;
      }

      results.push({
        test: testCase.name,
        passed: testPassed,
        status: response.status,
        expectedStatus: testCase.expectedStatus,
        missingFields
      });

    } catch (error) {
      console.log(`❌ Test failed with error: ${error.message}`);
      failed++;
      results.push({
        test: testCase.name,
        passed: false,
        error: error.message
      });
    }
    
    console.log('---\n');
  }

  return { passed, failed, results };
}

/**
 * Run authentication tests
 */
async function runAuthTests() {
  console.log('🔐 Running Authentication Tests...\n');
  
  let passed = 0;
  let failed = 0;
  const results = [];

  for (const testCase of authTestCases) {
    try {
      console.log(`Testing: ${testCase.name}`);
      
      const response = await makeRequest(
        '/api/ai-chatbot/status',
        'GET',
        null,
        testCase.token
      );

      const statusMatch = response.status === testCase.expectedStatus;
      const errorMatch = !testCase.expectedError || 
                        response.data?.code === testCase.expectedError;

      const testPassed = statusMatch && errorMatch;
      
      if (testPassed) {
        console.log('✅ Authentication test passed');
        passed++;
      } else {
        console.log('❌ Authentication test failed');
        console.log(`  Expected status: ${testCase.expectedStatus}, Got: ${response.status}`);
        if (testCase.expectedError) {
          console.log(`  Expected error: ${testCase.expectedError}, Got: ${response.data?.code}`);
        }
        failed++;
      }

      results.push({
        test: testCase.name,
        passed: testPassed,
        status: response.status,
        expectedStatus: testCase.expectedStatus
      });

    } catch (error) {
      console.log(`❌ Auth test failed with error: ${error.message}`);
      failed++;
    }
    
    console.log('---\n');
  }

  return { passed, failed, results };
}

/**
 * Run rate limiting test
 */
async function runRateLimitTest() {
  console.log('⏱️ Running Rate Limiting Test...\n');
  
  console.log(`Making ${rateLimitTest.requestCount} requests rapidly...`);
  
  const promises = [];
  for (let i = 0; i < rateLimitTest.requestCount; i++) {
    promises.push(makeRequest(
      rateLimitTest.endpoint,
      rateLimitTest.method,
      rateLimitTest.body
    ));
  }

  try {
    const responses = await Promise.all(promises);
    
    // Check if any requests were rate limited
    const rateLimitedResponses = responses.filter(r => r.status === 429);
    
    if (rateLimitedResponses.length > 0) {
      console.log(`✅ Rate limiting working - ${rateLimitedResponses.length} requests blocked`);
      return true;
    } else {
      console.log('❌ Rate limiting not working - all requests succeeded');
      return false;
    }
  } catch (error) {
    console.log(`❌ Rate limit test failed: ${error.message}`);
    return false;
  }
}

/**
 * Run security tests
 */
async function runSecurityTests() {
  console.log('🔒 Running Security Tests...\n');
  
  const securityTestCases = [
    {
      name: 'XSS Prevention',
      message: '<script>alert("xss")</script>How many tasks?',
      shouldNotContain: ['<script>', 'alert']
    },
    {
      name: 'SQL Injection Prevention',
      message: "'; DROP TABLE users; --",
      shouldNotCrash: true
    },
    {
      name: 'HTML Injection Prevention',
      message: '<img src="x" onerror="alert(1)">',
      shouldNotContain: ['<img', 'onerror']
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of securityTestCases) {
    try {
      console.log(`Testing: ${testCase.name}`);
      
      const response = await makeRequest(
        '/api/ai-chatbot/chat',
        'POST',
        { message: testCase.message }
      );

      let testPassed = true;
      
      // Check if response doesn't contain dangerous content
      if (testCase.shouldNotContain) {
        const responseText = JSON.stringify(response.data);
        for (const dangerousContent of testCase.shouldNotContain) {
          if (responseText.includes(dangerousContent)) {
            testPassed = false;
            console.log(`❌ Response contains dangerous content: ${dangerousContent}`);
          }
        }
      }

      // Check if request didn't crash the server
      if (testCase.shouldNotCrash && response.status === 0) {
        testPassed = false;
        console.log('❌ Request crashed the server');
      }

      if (testPassed) {
        console.log('✅ Security test passed');
        passed++;
      } else {
        failed++;
      }

    } catch (error) {
      console.log(`❌ Security test failed: ${error.message}`);
      failed++;
    }
    
    console.log('---\n');
  }

  return { passed, failed };
}

/**
 * Run all API tests
 */
async function runAllAPITests() {
  console.log('🚀 Starting AI Chatbot API Test Suite\n');
  
  // Check if server is running
  try {
    const healthCheck = await makeRequest('/');
    if (healthCheck.status === 0) {
      console.log('❌ Server is not running. Please start the server first.');
      return { success: false, error: 'Server not running' };
    }
  } catch (error) {
    console.log('❌ Cannot connect to server. Please ensure server is running.');
    return { success: false, error: 'Cannot connect to server' };
  }

  const apiResults = await runAPITests();
  const authResults = await runAuthTests();
  const rateLimitResult = await runRateLimitTest();
  const securityResults = await runSecurityTests();
  
  const totalPassed = apiResults.passed + authResults.passed + 
                     (rateLimitResult ? 1 : 0) + securityResults.passed;
  const totalFailed = apiResults.failed + authResults.failed + 
                     (rateLimitResult ? 0 : 1) + securityResults.failed;
  
  console.log('\n🏁 Final API Test Results:');
  console.log(`Total Tests: ${totalPassed + totalFailed}`);
  console.log(`Passed: ${totalPassed}`);
  console.log(`Failed: ${totalFailed}`);
  console.log(`Success Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);
  
  return {
    success: totalFailed === 0,
    results: {
      api: apiResults,
      auth: authResults,
      rateLimit: rateLimitResult,
      security: securityResults
    }
  };
}

// Run tests if called directly
if (require.main === module) {
  // Check if fetch is available (Node.js 18+)
  if (typeof fetch === 'undefined') {
    console.log('❌ This test requires Node.js 18+ or a fetch polyfill');
    console.log('💡 Install node-fetch: npm install node-fetch');
    process.exit(1);
  }

  runAllAPITests().then(results => {
    process.exit(results.success ? 0 : 1);
  });
}

module.exports = { runAllAPITests, runAPITests, runAuthTests, runSecurityTests };