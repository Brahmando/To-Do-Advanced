/**
 * AI Chatbot Helper Functions
 * Utility functions for enhanced chatbot functionality
 */

/**
 * Generate example queries based on user's current data
 */
function generatePersonalizedExamples(userData) {
  const examples = [];
  
  if (userData.taskSummary) {
    const { activeTasks, completedTasks, overdueTasks } = userData.taskSummary;
    
    if (activeTasks > 0) {
      examples.push("How many active tasks do I have?");
      examples.push("Show me my pending tasks");
    }
    
    if (completedTasks > 0) {
      examples.push("What's my completion rate?");
      examples.push("Show me recently completed tasks");
    }
    
    if (overdueTasks > 0) {
      examples.push("Do I have any overdue tasks?");
      examples.push("Show me overdue tasks");
    }
  }
  
  if (userData.groupSummary) {
    const { personalGroups, sharedGroups } = userData.groupSummary;
    
    if (personalGroups?.total > 0) {
      examples.push("What groups do I have?");
      examples.push("Show me my group tasks");
    }
    
    if (sharedGroups?.total > 0) {
      examples.push("What shared groups am I in?");
      examples.push("Show me shared group activities");
    }
  }
  
  if (userData.productivityMetrics) {
    examples.push("How's my productivity this week?");
    examples.push("What's my most productive day?");
    examples.push("Show me productivity trends");
  }
  
  // Add some general examples if no specific data
  if (examples.length === 0) {
    examples.push(
      "How many tasks do I have?",
      "What groups am I in?",
      "Show me my notifications",
      "Account overview"
    );
  }
  
  return examples.slice(0, 6); // Return max 6 examples
}

/**
 * Generate contextual suggestions based on conversation
 */
function generateContextualSuggestions(lastIntent, userData) {
  const suggestions = [];
  
  switch (lastIntent) {
    case 'TASK_STATUS':
      suggestions.push(
        "Tell me more about overdue tasks",
        "Show me task details",
        "What's my completion rate?"
      );
      break;
      
    case 'TASK_STATISTICS':
      suggestions.push(
        "Show me productivity insights",
        "What's my most productive day?",
        "How am I doing this week?"
      );
      break;
      
    case 'GROUP_INFO':
      suggestions.push(
        "Show me group tasks",
        "What's the recent group activity?",
        "Who are the most active members?"
      );
      break;
      
    case 'PRODUCTIVITY_INSIGHTS':
      suggestions.push(
        "Show me task statistics",
        "How can I improve my productivity?",
        "What are my productivity trends?"
      );
      break;
      
    default:
      suggestions.push(
        "Show me my tasks",
        "What groups am I in?",
        "Any notifications?",
        "Account overview"
      );
  }
  
  return suggestions.slice(0, 4);
}

/**
 * Format response with better structure and emojis
 */
function enhanceResponseFormatting(response, intent, userData) {
  let enhancedResponse = response;
  
  // Add contextual emojis and formatting
  switch (intent) {
    case 'TASK_STATUS':
      enhancedResponse = `📋 **Task Status Update**\n\n${response}`;
      break;
      
    case 'TASK_STATISTICS':
      enhancedResponse = `📊 **Task Analytics**\n\n${response}`;
      break;
      
    case 'GROUP_INFO':
      enhancedResponse = `👥 **Group Overview**\n\n${response}`;
      break;
      
    case 'PRODUCTIVITY_INSIGHTS':
      enhancedResponse = `📈 **Productivity Report**\n\n${response}`;
      break;
      
    case 'NOTIFICATIONS':
      enhancedResponse = `🔔 **Notification Center**\n\n${response}`;
      break;
      
    case 'ACCOUNT_OVERVIEW':
      enhancedResponse = `👤 **Account Dashboard**\n\n${response}`;
      break;
  }
  
  // Add helpful tips based on data
  if (userData) {
    const tips = generateHelpfulTips(intent, userData);
    if (tips.length > 0) {
      enhancedResponse += `\n\n💡 **Quick Tips:**\n${tips.join('\n')}`;
    }
  }
  
  return enhancedResponse;
}

/**
 * Generate helpful tips based on user data
 */
function generateHelpfulTips(intent, userData) {
  const tips = [];
  
  if (intent === 'TASK_STATUS' && userData.taskSummary) {
    const { overdueTasks, todayTasks, completionRate } = userData.taskSummary;
    
    if (overdueTasks > 0) {
      tips.push("• Consider prioritizing your overdue tasks first");
    }
    
    if (todayTasks > 5) {
      tips.push("• You have many tasks due today - try breaking them into smaller chunks");
    }
    
    if (completionRate < 50) {
      tips.push("• Try setting smaller, more achievable daily goals");
    }
  }
  
  if (intent === 'PRODUCTIVITY_INSIGHTS' && userData.productivityMetrics) {
    const { streakDays, mostProductiveDay } = userData.productivityMetrics;
    
    if (streakDays === 0) {
      tips.push("• Start a new productivity streak by completing at least one task today");
    }
    
    if (mostProductiveDay) {
      tips.push(`• Your most productive day is ${mostProductiveDay} - try scheduling important tasks then`);
    }
  }
  
  return tips;
}

/**
 * Generate quick action suggestions
 */
function generateQuickActions(userData) {
  const actions = [];
  
  if (userData.taskSummary) {
    const { overdueTasks, todayTasks } = userData.taskSummary;
    
    if (overdueTasks > 0) {
      actions.push({
        text: "Show overdue tasks",
        query: "Show me my overdue tasks",
        priority: "high"
      });
    }
    
    if (todayTasks > 0) {
      actions.push({
        text: "Today's tasks",
        query: "What tasks are due today?",
        priority: "medium"
      });
    }
  }
  
  if (userData.notificationSummary?.unread > 0) {
    actions.push({
      text: "Check notifications",
      query: "Show me unread notifications",
      priority: "medium"
    });
  }
  
  actions.push({
    text: "Productivity summary",
    query: "How's my productivity this week?",
    priority: "low"
  });
  
  return actions.slice(0, 3);
}

/**
 * Create conversation export data
 */
function exportConversation(messages, userId) {
  const exportData = {
    userId,
    exportDate: new Date().toISOString(),
    messageCount: messages.length,
    conversation: messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      intent: msg.intent || null
    }))
  };
  
  return {
    filename: `task-buddy-chat-${new Date().toISOString().split('T')[0]}.json`,
    data: JSON.stringify(exportData, null, 2),
    mimeType: 'application/json'
  };
}

/**
 * Analyze conversation patterns
 */
function analyzeConversationPatterns(messages) {
  const analysis = {
    totalMessages: messages.length,
    userMessages: messages.filter(m => m.role === 'user').length,
    assistantMessages: messages.filter(m => m.role === 'assistant').length,
    mostCommonIntents: {},
    conversationDuration: null,
    averageResponseTime: null
  };
  
  // Count intents
  messages.forEach(msg => {
    if (msg.intent) {
      analysis.mostCommonIntents[msg.intent] = (analysis.mostCommonIntents[msg.intent] || 0) + 1;
    }
  });
  
  // Calculate duration
  if (messages.length > 1) {
    const firstMessage = new Date(messages[0].timestamp);
    const lastMessage = new Date(messages[messages.length - 1].timestamp);
    analysis.conversationDuration = lastMessage - firstMessage;
  }
  
  return analysis;
}

/**
 * Generate smart follow-up questions
 */
function generateFollowUpQuestions(intent, userData) {
  const questions = [];
  
  switch (intent) {
    case 'TASK_STATUS':
      questions.push(
        "Would you like to see task details?",
        "Want to know about overdue tasks?",
        "Interested in completion statistics?"
      );
      break;
      
    case 'GROUP_INFO':
      questions.push(
        "Want to see group activities?",
        "Interested in member contributions?",
        "Need help with group management?"
      );
      break;
      
    case 'PRODUCTIVITY_INSIGHTS':
      questions.push(
        "Want tips to improve productivity?",
        "Interested in weekly trends?",
        "Need help setting goals?"
      );
      break;
  }
  
  return questions.slice(0, 2);
}

module.exports = {
  generatePersonalizedExamples,
  generateContextualSuggestions,
  enhanceResponseFormatting,
  generateHelpfulTips,
  generateQuickActions,
  exportConversation,
  analyzeConversationPatterns,
  generateFollowUpQuestions
};