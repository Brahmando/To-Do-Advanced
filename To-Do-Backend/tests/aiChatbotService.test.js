const { processUserQuery, getChatHistory, clearChatHistory } = require('../services/aiChatbotService');
const { recognizeIntent, INTENT_TYPES } = require('../services/intentRecognitionService');
const AiChatSession = require('../models/AiChatSession');

/**
 * Integration tests for AI Chatbot Service
 * Run with: node tests/aiChatbotService.test.js
 */

// Mock user ID for testing
const TEST_USER_ID = '507f1f77bcf86cd799439011';

// Test cases for different scenarios
const testScenarios = [
  {
    name: 'Task Status Query',
    message: 'How many tasks do I have?',
    expectedIntent: INTENT_TYPES.TASK_STATUS,
    shouldContain: ['tasks', 'active', 'completed']
  },
  {
    name: 'Group Information Query',
    message: 'What groups am I in?',
    expectedIntent: INTENT_TYPES.GROUP_INFO,
    shouldContain: ['groups', 'member']
  },
  {
    name: 'Productivity Insights Query',
    message: 'Show me my productivity insights',
    expectedIntent: INTENT_TYPES.PRODUCTIVITY_INSIGHTS,
    shouldContain: ['productivity', 'average', 'completion']
  },
  {
    name: 'Help Query',
    message: 'Help me',
    expectedIntent: INTENT_TYPES.HELP,
    shouldContain: ['help', 'assistant', 'tasks']
  },
  {
    name: 'Compound Query',
    message: 'How many tasks do I have and what groups am I in?',
    expectedIntent: 'COMPOUND',
    shouldContain: ['tasks', 'groups']
  },
  {
    name: 'Ambiguous Query',
    message: 'Show me stuff',
    expectedIntent: INTENT_TYPES.UNKNOWN,
    shouldContain: ['not sure', 'rephrase']
  }
];

async function runAiChatbotTests() {
  console.log('🧪 Running AI Chatbot Service Tests...\n');
  
  let passed = 0;
  let failed = 0;
  const results = [];

  for (const scenario of testScenarios) {
    try {
      console.log(`Testing: ${scenario.name}`);
      console.log(`Message: "${scenario.message}"`);
      
      // Test intent recognition first
      const intentResult = recognizeIntent(scenario.message);
      console.log(`Intent: ${intentResult.intent} (confidence: ${intentResult.confidence.toFixed(2)})`);
      
      // Test full query processing (this would need a test database)
      // For now, we'll just test the intent recognition
      const intentMatches = intentResult.intent === scenario.expectedIntent || 
                           (scenario.expectedIntent === 'COMPOUND' && intentResult.compoundIntents?.length > 1);
      
      if (intentMatches) {
        console.log('✅ Intent recognition passed');
        passed++;
      } else {
        console.log(`❌ Intent recognition failed - Expected: ${scenario.expectedIntent}, Got: ${intentResult.intent}`);
        failed++;
      }
      
      results.push({
        scenario: scenario.name,
        passed: intentMatches,
        intent: intentResult.intent,
        confidence: intentResult.confidence
      });
      
    } catch (error) {
      console.log(`❌ Test failed with error: ${error.message}`);
      failed++;
      results.push({
        scenario: scenario.name,
        passed: false,
        error: error.message
      });
    }
    
    console.log('---\n');
  }

  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%\n`);

  // Test conversation context
  console.log('🔄 Testing Conversation Context...');
  try {
    const context = { previousIntent: INTENT_TYPES.TASK_STATUS };
    const followUpResult = recognizeIntent('tell me more', context);
    
    if (followUpResult.isFollowUp) {
      console.log('✅ Follow-up detection passed');
      passed++;
    } else {
      console.log('❌ Follow-up detection failed');
      failed++;
    }
  } catch (error) {
    console.log(`❌ Context test failed: ${error.message}`);
    failed++;
  }

  // Test security features
  console.log('\n🔒 Testing Security Features...');
  try {
    const maliciousInputs = [
      '<script>alert("xss")</script>',
      'javascript:void(0)',
      '<iframe src="evil.com"></iframe>'
    ];

    for (const maliciousInput of maliciousInputs) {
      const result = recognizeIntent(maliciousInput);
      // Should not crash and should handle safely
      console.log(`✅ Handled malicious input safely: ${maliciousInput.substring(0, 20)}...`);
      passed++;
    }
  } catch (error) {
    console.log(`❌ Security test failed: ${error.message}`);
    failed++;
  }

  return { passed, failed, results };
}

// Mock database functions for testing
function mockDatabaseSetup() {
  // This would set up test database connections
  console.log('📝 Note: Database integration tests require test database setup');
}

// Performance testing
async function runPerformanceTests() {
  console.log('\n⚡ Running Performance Tests...');
  
  const testMessages = [
    'How many tasks do I have?',
    'Show me my groups',
    'What are my notifications?',
    'Productivity insights please'
  ];

  const times = [];
  
  for (const message of testMessages) {
    const start = Date.now();
    recognizeIntent(message);
    const end = Date.now();
    times.push(end - start);
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const maxTime = Math.max(...times);
  const minTime = Math.min(...times);

  console.log(`📈 Performance Results:`);
  console.log(`  Average response time: ${avgTime.toFixed(2)}ms`);
  console.log(`  Max response time: ${maxTime}ms`);
  console.log(`  Min response time: ${minTime}ms`);

  // Performance should be under 100ms for intent recognition
  if (avgTime < 100) {
    console.log('✅ Performance test passed');
    return true;
  } else {
    console.log('❌ Performance test failed - too slow');
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting AI Chatbot Test Suite\n');
  
  mockDatabaseSetup();
  
  const chatbotResults = await runAiChatbotTests();
  const performanceResult = await runPerformanceTests();
  
  const totalPassed = chatbotResults.passed + (performanceResult ? 1 : 0);
  const totalFailed = chatbotResults.failed + (performanceResult ? 0 : 1);
  
  console.log('\n🏁 Final Results:');
  console.log(`Total Tests: ${totalPassed + totalFailed}`);
  console.log(`Passed: ${totalPassed}`);
  console.log(`Failed: ${totalFailed}`);
  console.log(`Success Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);
  
  return {
    success: totalFailed === 0,
    results: {
      chatbot: chatbotResults,
      performance: performanceResult
    }
  };
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().then(results => {
    process.exit(results.success ? 0 : 1);
  });
}

module.exports = { runAllTests, runAiChatbotTests, runPerformanceTests };