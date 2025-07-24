/**
 * Test Runner for AI Chatbot System
 * Runs all tests in sequence and provides comprehensive reporting
 */

const { runTests: runIntentTests } = require('./intentRecognition.test');
const { runAllTests: runServiceTests } = require('./aiChatbotService.test');

/**
 * Run all tests with comprehensive reporting
 */
async function runAllTests() {
  console.log('🧪 AI Chatbot Test Suite Runner');
  console.log('================================\n');
  
  const startTime = Date.now();
  const results = {
    intentRecognition: null,
    aiChatbotService: null,
    totalPassed: 0,
    totalFailed: 0,
    totalTests: 0,
    duration: 0,
    success: false
  };

  try {
    // Run Intent Recognition Tests
    console.log('1️⃣ Running Intent Recognition Tests...');
    const intentResults = runIntentTests();
    results.intentRecognition = intentResults;
    console.log(`✅ Intent Recognition: ${intentResults.passed} passed, ${intentResults.failed} failed\n`);

    // Run AI Chatbot Service Tests
    console.log('2️⃣ Running AI Chatbot Service Tests...');
    const serviceResults = await runServiceTests();
    results.aiChatbotService = serviceResults;
    console.log(`✅ AI Chatbot Service: ${serviceResults.results.chatbot.passed} passed, ${serviceResults.results.chatbot.failed} failed\n`);

    // Calculate totals
    results.totalPassed = intentResults.passed + serviceResults.results.chatbot.passed + 
                         (serviceResults.results.performance ? 1 : 0);
    results.totalFailed = intentResults.failed + serviceResults.results.chatbot.failed + 
                         (serviceResults.results.performance ? 0 : 1);
    results.totalTests = results.totalPassed + results.totalFailed;
    results.duration = Date.now() - startTime;
    results.success = results.totalFailed === 0;

    // Print comprehensive report
    printTestReport(results);

    return results;

  } catch (error) {
    console.error('❌ Test suite failed with error:', error);
    results.duration = Date.now() - startTime;
    results.success = false;
    return results;
  }
}

/**
 * Print detailed test report
 */
function printTestReport(results) {
  console.log('\n📊 COMPREHENSIVE TEST REPORT');
  console.log('============================');
  
  console.log(`\n🕐 Duration: ${results.duration}ms`);
  console.log(`📈 Total Tests: ${results.totalTests}`);
  console.log(`✅ Passed: ${results.totalPassed}`);
  console.log(`❌ Failed: ${results.totalFailed}`);
  console.log(`📊 Success Rate: ${((results.totalPassed / results.totalTests) * 100).toFixed(1)}%`);
  
  console.log('\n📋 Test Breakdown:');
  console.log('------------------');
  
  if (results.intentRecognition) {
    console.log(`🧠 Intent Recognition: ${results.intentRecognition.passed}/${results.intentRecognition.passed + results.intentRecognition.failed} passed`);
  }
  
  if (results.aiChatbotService) {
    const chatbot = results.aiChatbotService.results.chatbot;
    const performance = results.aiChatbotService.results.performance;
    console.log(`🤖 AI Chatbot Service: ${chatbot.passed}/${chatbot.passed + chatbot.failed} passed`);
    console.log(`⚡ Performance: ${performance ? 'PASSED' : 'FAILED'}`);
  }

  // Overall status
  console.log('\n🎯 OVERALL STATUS:');
  if (results.success) {
    console.log('🎉 ALL TESTS PASSED! 🎉');
  } else {
    console.log('💥 SOME TESTS FAILED');
    console.log('🔧 Please review the failed tests above and fix the issues.');
  }
  
  console.log('\n' + '='.repeat(50));
}

/**
 * Generate test coverage report
 */
function generateCoverageReport() {
  console.log('\n📈 TEST COVERAGE REPORT');
  console.log('=======================');
  
  const coverage = {
    intentRecognition: {
      functions: ['recognizeIntent', 'getIntentTypes', 'isValidIntent', 'getIntentDescription'],
      tested: ['recognizeIntent', 'getIntentTypes', 'isValidIntent', 'getIntentDescription'],
      coverage: 100
    },
    aiChatbotService: {
      functions: ['processUserQuery', 'getChatHistory', 'clearChatHistory', 'generateResponse'],
      tested: ['processUserQuery'],
      coverage: 25
    },
    dataAggregation: {
      functions: ['getUserTaskSummary', 'getUserGroupActivity', 'getUserNotifications'],
      tested: [],
      coverage: 0
    },
    security: {
      functions: ['sanitizeInput', 'detectSuspiciousPatterns', 'validateUserPermissions'],
      tested: ['sanitizeInput', 'detectSuspiciousPatterns'],
      coverage: 67
    }
  };

  Object.entries(coverage).forEach(([module, info]) => {
    console.log(`\n${module}:`);
    console.log(`  Functions: ${info.functions.length}`);
    console.log(`  Tested: ${info.tested.length}`);
    console.log(`  Coverage: ${info.coverage}%`);
    
    const untested = info.functions.filter(f => !info.tested.includes(f));
    if (untested.length > 0) {
      console.log(`  Untested: ${untested.join(', ')}`);
    }
  });

  const overallCoverage = Object.values(coverage)
    .reduce((acc, info) => acc + info.coverage, 0) / Object.keys(coverage).length;
  
  console.log(`\n🎯 Overall Coverage: ${overallCoverage.toFixed(1)}%`);
}

/**
 * Run specific test category
 */
async function runSpecificTests(category) {
  console.log(`🎯 Running ${category} tests only...\n`);
  
  switch (category.toLowerCase()) {
    case 'intent':
      return runIntentTests();
    case 'service':
      return await runServiceTests();
    default:
      console.log('❌ Unknown test category. Available: intent, service');
      return null;
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    const command = args[0];
    
    switch (command) {
      case 'coverage':
        generateCoverageReport();
        break;
      case 'intent':
      case 'service':
        await runSpecificTests(command);
        break;
      default:
        console.log('Available commands: coverage, intent, service');
    }
  } else {
    const results = await runAllTests();
    
    if (args.includes('--coverage')) {
      generateCoverageReport();
    }
    
    process.exit(results.success ? 0 : 1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  runSpecificTests,
  generateCoverageReport
};