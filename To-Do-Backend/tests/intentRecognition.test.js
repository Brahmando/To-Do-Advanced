const { recognizeIntent, getIntentTypes, isValidIntent, getIntentDescription, INTENT_TYPES } = require('../services/intentRecognitionService');

/**
 * Unit tests for Intent Recognition Service
 * Run with: node tests/intentRecognition.test.js
 */

// Test cases for different intents
const testCases = [
  // TASK_STATUS tests
  { message: "How many tasks do I have?", expectedIntent: INTENT_TYPES.TASK_STATUS },
  { message: "Show me my pending tasks", expectedIntent: INTENT_TYPES.TASK_STATUS },
  { message: "What's my task status?", expectedIntent: INTENT_TYPES.TASK_STATUS },
  { message: "How many completed tasks?", expectedIntent: INTENT_TYPES.TASK_STATUS },
  
  // TASK_DETAILS tests
  { message: "When is my task due?", expectedIntent: INTENT_TYPES.TASK_DETAILS },
  { message: "Tell me about task details", expectedIntent: INTENT_TYPES.TASK_DETAILS },
  { message: "What's the deadline for my project?", expectedIntent: INTENT_TYPES.TASK_DETAILS },
  
  // TASK_STATISTICS tests
  { message: "Show me task statistics", expectedIntent: INTENT_TYPES.TASK_STATISTICS },
  { message: "What's my completion rate?", expectedIntent: INTENT_TYPES.TASK_STATISTICS },
  { message: "How many total tasks do I have?", expectedIntent: INTENT_TYPES.TASK_STATISTICS },
  
  // GROUP_INFO tests
  { message: "What groups am I in?", expectedIntent: INTENT_TYPES.GROUP_INFO },
  { message: "Show me my groups", expectedIntent: INTENT_TYPES.GROUP_INFO },
  { message: "Who are the members in my group?", expectedIntent: INTENT_TYPES.GROUP_INFO },
  
  // GROUP_TASKS tests
  { message: "Show me group tasks", expectedIntent: INTENT_TYPES.GROUP_TASKS },
  { message: "What are the shared tasks?", expectedIntent: INTENT_TYPES.GROUP_TASKS },
  { message: "Team tasks overview", expectedIntent: INTENT_TYPES.GROUP_TASKS },
  
  // NOTIFICATIONS tests
  { message: "Show me my notifications", expectedIntent: INTENT_TYPES.NOTIFICATIONS },
  { message: "Any unread notifications?", expectedIntent: INTENT_TYPES.NOTIFICATIONS },
  { message: "Recent alerts", expectedIntent: INTENT_TYPES.NOTIFICATIONS },
  
  // ACCOUNT_OVERVIEW tests
  { message: "Account overview", expectedIntent: INTENT_TYPES.ACCOUNT_OVERVIEW },
  { message: "Show me my profile", expectedIntent: INTENT_TYPES.ACCOUNT_OVERVIEW },
  { message: "Account settings", expectedIntent: INTENT_TYPES.ACCOUNT_OVERVIEW },
  
  // PRODUCTIVITY_INSIGHTS tests
  { message: "Show me productivity insights", expectedIntent: INTENT_TYPES.PRODUCTIVITY_INSIGHTS },
  { message: "How's my performance?", expectedIntent: INTENT_TYPES.PRODUCTIVITY_INSIGHTS },
  { message: "Productivity trends", expectedIntent: INTENT_TYPES.PRODUCTIVITY_INSIGHTS },
  
  // HELP tests
  { message: "Help me", expectedIntent: INTENT_TYPES.HELP },
  { message: "What can you do?", expectedIntent: INTENT_TYPES.HELP },
  { message: "How to use this?", expectedIntent: INTENT_TYPES.HELP },
  
  // UNKNOWN tests
  { message: "Random gibberish xyz", expectedIntent: INTENT_TYPES.UNKNOWN },
  { message: "", expectedIntent: INTENT_TYPES.UNKNOWN },
  { message: "123456", expectedIntent: INTENT_TYPES.UNKNOWN }
];

function runTests() {
  console.log('🧪 Running Intent Recognition Tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  testCases.forEach((testCase, index) => {
    const result = recognizeIntent(testCase.message);
    const success = result.intent === testCase.expectedIntent;
    
    if (success) {
      passed++;
      console.log(`✅ Test ${index + 1}: "${testCase.message}" -> ${result.intent} (confidence: ${result.confidence.toFixed(2)})`);
    } else {
      failed++;
      console.log(`❌ Test ${index + 1}: "${testCase.message}"`);
      console.log(`   Expected: ${testCase.expectedIntent}`);
      console.log(`   Got: ${result.intent} (confidence: ${result.confidence.toFixed(2)})`);
      if (result.alternatives.length > 0) {
        console.log(`   Alternatives: ${result.alternatives.map(alt => `${alt.intent}(${alt.confidence.toFixed(2)})`).join(', ')}`);
      }
    }
  });
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  // Test utility functions
  console.log('\n🔧 Testing Utility Functions:');
  console.log(`✅ getIntentTypes(): ${Object.keys(getIntentTypes()).length} intent types`);
  console.log(`✅ isValidIntent('TASK_STATUS'): ${isValidIntent('TASK_STATUS')}`);
  console.log(`✅ isValidIntent('INVALID'): ${isValidIntent('INVALID')}`);
  console.log(`✅ getIntentDescription('HELP'): ${getIntentDescription('HELP')}`);
  
  return { passed, failed };
}

// Run tests if called directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };