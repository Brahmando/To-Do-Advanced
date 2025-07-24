const {
    recognizeIntent,
    generateClarificationQuestion,
    extractDateRange,
    extractFilters,
    INTENT_TYPES
} = require('./intentRecognitionService');
const {
    getUserTaskSummary,
    getUserGroupActivity,
    getUserNotifications,
    getUserProductivityMetrics,
    getUserContextCache
} = require('./dataAggregationService');
const AiChatSession = require('../models/AiChatSession');
const {
    sanitizeUserInput,
    detectSuspiciousPatterns,
    logSecurityEvent
} = require('../utils/aiChatbotSecurity');

/**
 * AI Chatbot Core Service
 * Main service for processing user queries and generating responses
 */

/**
 * Process user query and generate AI response
 */
async function processUserQuery(userId, message, context = {}) {
    try {
        // Sanitize and validate input
        const sanitizedMessage = sanitizeUserInput(message);

        // Check for suspicious patterns
        if (detectSuspiciousPatterns(sanitizedMessage)) {
            logSecurityEvent('SUSPICIOUS_INPUT', userId, {
                originalMessage: message,
                sanitizedMessage,
                ip: context.ip
            });
            return {
                response: "I detected potentially unsafe content in your message. Please rephrase your question.",
                intent: INTENT_TYPES.UNKNOWN,
                confidence: 0,
                error: "Suspicious input detected"
            };
        }

        // Get or create chat session for context
        let session = await getOrCreateChatSession(userId);

        // Build context from previous messages
        const conversationContext = {
            previousIntent: session.messages.length > 0 ?
                session.messages[session.messages.length - 1].intent : null,
            messageHistory: session.messages.slice(-5) // Last 5 messages for context
        };

        // Recognize intent from sanitized message with context
        const intentResult = recognizeIntent(sanitizedMessage, conversationContext);

        // Extract additional query parameters
        const dateRange = extractDateRange(sanitizedMessage);
        const filters = extractFilters(sanitizedMessage);

        // Handle low confidence responses with clarification
        if (intentResult.confidence < 0.5 && intentResult.intent !== INTENT_TYPES.HELP) {
            const clarification = generateClarificationQuestion(intentResult, sanitizedMessage);
            if (clarification) {
                // Add user message to session
                session.messages.push({
                    role: 'user',
                    content: message,
                    intent: intentResult.intent,
                    timestamp: new Date()
                });

                // Add clarification response
                session.messages.push({
                    role: 'assistant',
                    content: clarification,
                    dataContext: { needsClarification: true, alternatives: intentResult.alternatives },
                    timestamp: new Date()
                });

                await session.save();

                return {
                    response: clarification,
                    intent: INTENT_TYPES.UNKNOWN,
                    confidence: intentResult.confidence,
                    needsClarification: true,
                    alternatives: intentResult.alternatives,
                    sessionId: session._id
                };
            }
        }

        // Handle compound intents (multiple questions in one message)
        if (intentResult.compoundIntents && intentResult.compoundIntents.length > 1) {
            const responses = [];

            for (const compoundIntent of intentResult.compoundIntents) {
                const compoundData = await fetchUserData(userId, compoundIntent.intent, { dateRange, filters });
                const compoundResponse = await generateResponse(compoundData, compoundIntent, context, session);
                responses.push(compoundResponse.content);
            }

            // Add user message to session
            session.messages.push({
                role: 'user',
                content: message,
                intent: 'COMPOUND',
                timestamp: new Date()
            });

            const combinedResponse = responses.join('\n\n---\n\n');

            // Add assistant response to session
            session.messages.push({
                role: 'assistant',
                content: combinedResponse,
                dataContext: { compoundQuery: true, intents: intentResult.compoundIntents },
                timestamp: new Date()
            });

            await session.save();

            return {
                response: combinedResponse,
                intent: 'COMPOUND',
                confidence: intentResult.confidence,
                compoundIntents: intentResult.compoundIntents,
                sessionId: session._id
            };
        }

        // Add user message to session
        session.messages.push({
            role: 'user',
            content: message,
            intent: intentResult.intent,
            timestamp: new Date()
        });

        // Fetch relevant data based on intent with filters and date range
        const userData = await fetchUserData(userId, intentResult.intent, { dateRange, filters });

        // Generate response
        const response = await generateResponse(userData, intentResult, context, session);

        // Add assistant response to session
        session.messages.push({
            role: 'assistant',
            content: response.content,
            dataContext: response.dataContext,
            timestamp: new Date()
        });

        // Save session
        await session.save();

        return {
            response: response.content,
            intent: intentResult.intent,
            confidence: intentResult.confidence,
            dataContext: response.dataContext,
            sessionId: session._id
        };

    } catch (error) {
        console.error('Error processing user query:', error);
        return {
            response: "I'm sorry, I encountered an error while processing your request. Please try again.",
            intent: INTENT_TYPES.UNKNOWN,
            confidence: 0,
            error: error.message
        };
    }
}

/**
 * Fetch relevant user data based on intent with filters and date range support
 */
async function fetchUserData(userId, intent, options = {}) {
    try {
        const { dateRange, filters } = options;

        switch (intent) {
            case INTENT_TYPES.TASK_STATUS:
            case INTENT_TYPES.TASK_DETAILS:
            case INTENT_TYPES.TASK_STATISTICS:
                return await getUserTaskSummary(userId, { dateRange, filters });

            case INTENT_TYPES.OVERDUE_TASKS:
                return await getUserNotifications(userId, { type: 'overdue_task' });

            case INTENT_TYPES.GROUP_INFO:
                return await getUserGroupActivity(userId, { filters });

            case INTENT_TYPES.GROUP_TASKS:
                return await getUserGroupActivity(userId, { filters, groupType: 'personal' });

            case INTENT_TYPES.SHARED_GROUP_TASKS:
                return await getUserGroupActivity(userId, { filters, groupType: 'shared' });

            case INTENT_TYPES.NOTIFICATIONS:
                return await getUserNotifications(userId, {
                    ...filters,
                    dateRange: dateRange
                });

            case INTENT_TYPES.PRODUCTIVITY_INSIGHTS:
                return await getUserProductivityMetrics(userId, { dateRange });

            case INTENT_TYPES.ACCOUNT_OVERVIEW:
                return await getUserContextCache(userId);

            case INTENT_TYPES.GREETING:
            case INTENT_TYPES.DATE_TIME:
            case INTENT_TYPES.MOTIVATION:
            case INTENT_TYPES.SMALL_TALK:
                // These intents don't need user data from database
                return null;

            default:
                return null;
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
    }
}

/**
 * Generate natural language response based on data and intent
 */
async function generateResponse(userData, intentResult, context, session) {
    const { intent, confidence } = intentResult;

    try {
        let content = '';
        let dataContext = {};

        switch (intent) {
            case INTENT_TYPES.TASK_STATUS:
                content = generateTaskStatusResponse(userData);
                dataContext = { taskSummary: userData };
                break;

            case INTENT_TYPES.TASK_DETAILS:
                content = generateTaskDetailsResponse(userData);
                dataContext = { taskDetails: userData };
                break;

            case INTENT_TYPES.TASK_STATISTICS:
                content = generateTaskStatisticsResponse(userData);
                dataContext = { taskStats: userData };
                break;

            case INTENT_TYPES.OVERDUE_TASKS:
                content = generateOverdueTasksResponse(userData);
                dataContext = { overdueTasks: userData };
                break;

            case INTENT_TYPES.GROUP_INFO:
                content = generateGroupInfoResponse(userData);
                dataContext = { groupInfo: userData };
                break;

            case INTENT_TYPES.GROUP_TASKS:
                content = generatePersonalGroupTasksResponse(userData);
                dataContext = { groupTasks: userData };
                break;

            case INTENT_TYPES.SHARED_GROUP_TASKS:
                content = generateSharedGroupTasksResponse(userData);
                dataContext = { sharedGroupTasks: userData };
                break;

            case INTENT_TYPES.NOTIFICATIONS:
                content = generateNotificationsResponse(userData);
                dataContext = { notifications: userData };
                break;

            case INTENT_TYPES.ACCOUNT_OVERVIEW:
                content = generateAccountOverviewResponse(userData);
                dataContext = { accountOverview: userData };
                break;

            case INTENT_TYPES.PRODUCTIVITY_INSIGHTS:
                content = generateProductivityInsightsResponse(userData);
                dataContext = { productivityMetrics: userData };
                break;

            case INTENT_TYPES.GREETING:
                content = generateGreetingResponse();
                dataContext = { greeting: true };
                break;

            case INTENT_TYPES.DATE_TIME:
                content = generateDateTimeResponse();
                dataContext = { dateTime: true };
                break;

            case INTENT_TYPES.MOTIVATION:
                content = generateMotivationResponse();
                dataContext = { motivation: true };
                break;

            case INTENT_TYPES.SMALL_TALK:
                content = generateSmallTalkResponse();
                dataContext = { smallTalk: true };
                break;

            case INTENT_TYPES.HELP:
                content = generateHelpResponse();
                dataContext = { helpInfo: true };
                break;

            default:
                content = generateUnknownResponse(intentResult);
                dataContext = { unknownIntent: true };
        }

        return { content, dataContext };

    } catch (error) {
        console.error('Error generating response:', error);
        return {
            content: "I'm having trouble generating a response right now. Please try rephrasing your question.",
            dataContext: { error: true }
        };
    }
}

/**
 * Response generators for different intents
 */

function generateTaskStatusResponse(taskData) {
    if (!taskData) return "I couldn't retrieve your task information right now.";

    const { activeTasks, completedTasks, overdueTasks, todayTasks } = taskData;

    let response = `Here's your current task status:\n\n`;
    response += `📋 **Active Tasks**: ${activeTasks}\n`;
    response += `✅ **Completed Tasks**: ${completedTasks}\n`;

    if (overdueTasks > 0) {
        response += `⚠️ **Overdue Tasks**: ${overdueTasks}\n`;
    }

    if (todayTasks > 0) {
        response += `📅 **Due Today**: ${todayTasks}\n`;
    }

    if (overdueTasks > 0) {
        response += `\n💡 You have ${overdueTasks} overdue task${overdueTasks > 1 ? 's' : ''}. Consider prioritizing them!`;
        response += `\n\n💬 **Tip**: Ask me "show me overdue tasks" to see detailed breakdown with task types and groups!`;
    } else if (activeTasks === 0) {
        response += `\n🎉 Great job! You have no active tasks right now.`;
    }

    return response;
}

function generateTaskDetailsResponse(taskData) {
    if (!taskData) return "I couldn't retrieve your task details right now.";

    const { upcomingTasks, recentCompletedTasks } = taskData;

    let response = `Here are your task details:\n\n`;

    if (upcomingTasks && upcomingTasks.length > 0) {
        response += `📅 **Upcoming Tasks**:\n`;
        upcomingTasks.forEach((task, index) => {
            const dueDate = new Date(task.date).toLocaleDateString();
            response += `${index + 1}. ${task.text} - Due: ${dueDate}\n`;
        });
    }

    if (recentCompletedTasks && recentCompletedTasks.length > 0) {
        response += `\n✅ **Recently Completed**:\n`;
        recentCompletedTasks.forEach((task, index) => {
            const completedDate = new Date(task.completedAt).toLocaleDateString();
            response += `${index + 1}. ${task.text} - Completed: ${completedDate}\n`;
        });
    }

    if ((!upcomingTasks || upcomingTasks.length === 0) && (!recentCompletedTasks || recentCompletedTasks.length === 0)) {
        response += `No upcoming or recently completed tasks to show.`;
    }

    return response;
}

function generateTaskStatisticsResponse(taskData) {
    if (!taskData) return "I couldn't retrieve your task statistics right now.";

    const { totalTasks, completionRate, thisWeekTasks, overdueTasks } = taskData;

    let response = `📊 **Your Task Statistics**:\n\n`;
    response += `📈 **Total Tasks**: ${totalTasks}\n`;
    response += `🎯 **Completion Rate**: ${completionRate}%\n`;
    response += `📅 **This Week's Tasks**: ${thisWeekTasks}\n`;

    if (overdueTasks > 0) {
        response += `⚠️ **Overdue Tasks**: ${overdueTasks}\n`;
    }

    if (completionRate >= 80) {
        response += `\n🌟 Excellent completion rate! You're doing great!`;
    } else if (completionRate >= 60) {
        response += `\n👍 Good completion rate! Keep up the momentum!`;
    } else if (completionRate > 0) {
        response += `\n💪 There's room for improvement. You can do it!`;
    }

    return response;
}

function generateOverdueTasksResponse(notificationData) {
    if (!notificationData) return "I couldn't retrieve your overdue tasks right now.";

    const { notifications } = notificationData;
    const overdueTasks = notifications ? notifications.filter(n => n.type === 'overdue_task') : [];

    let response = `🚨 **Overdue Tasks Report**\n\n`;

    if (overdueTasks.length === 0) {
        response += `🎉 **Great news!** You have no overdue tasks right now!\n\n`;
        response += `Keep up the excellent work staying on top of your deadlines! 💪`;
        return response;
    }

    response += `⚠️ **Total Overdue**: ${overdueTasks.length} task${overdueTasks.length > 1 ? 's' : ''}\n\n`;

    // Group overdue tasks by type
    const individualTasks = overdueTasks.filter(t => t.taskType === 'individual');
    const groupTasks = overdueTasks.filter(t => t.taskType === 'group');
    const sharedGroupTasks = overdueTasks.filter(t => t.taskType === 'shared_group');

    // Show Individual Tasks
    if (individualTasks.length > 0) {
        response += `📝 **Individual Tasks** (${individualTasks.length}):\n`;
        individualTasks.slice(0, 5).forEach((task, index) => {
            const daysOverdue = Math.floor((new Date() - new Date(task.timestamp)) / (1000 * 60 * 60 * 24));
            response += `${index + 1}. "${task.data.taskText}" - ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue\n`;
        });
        if (individualTasks.length > 5) {
            response += `... and ${individualTasks.length - 5} more individual tasks\n`;
        }
        response += `\n`;
    }

    // Show Group Tasks
    if (groupTasks.length > 0) {
        response += `📁 **Personal Group Tasks** (${groupTasks.length}):\n`;
        groupTasks.slice(0, 5).forEach((task, index) => {
            const daysOverdue = Math.floor((new Date() - new Date(task.timestamp)) / (1000 * 60 * 60 * 24));
            response += `${index + 1}. "${task.data.taskText}" in "${task.data.groupName}" - ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue\n`;
        });
        if (groupTasks.length > 5) {
            response += `... and ${groupTasks.length - 5} more group tasks\n`;
        }
        response += `\n`;
    }

    // Show Shared Group Tasks
    if (sharedGroupTasks.length > 0) {
        response += `🤝 **Shared Group Tasks** (${sharedGroupTasks.length}):\n`;
        sharedGroupTasks.slice(0, 5).forEach((task, index) => {
            const daysOverdue = Math.floor((new Date() - new Date(task.timestamp)) / (1000 * 60 * 60 * 24));
            const roleText = task.data.userRole === 'owner' ? ' (Owner)' : ` (${task.data.userRole})`;
            response += `${index + 1}. "${task.data.taskText}" in "${task.data.groupName}"${roleText} - ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue\n`;
        });
        if (sharedGroupTasks.length > 5) {
            response += `... and ${sharedGroupTasks.length - 5} more shared group tasks\n`;
        }
        response += `\n`;
    }

    // Add helpful tips
    response += `💡 **Tips to tackle overdue tasks:**\n`;
    response += `• Start with the oldest or most important ones\n`;
    response += `• Break large tasks into smaller, manageable steps\n`;
    response += `• Set new realistic deadlines and stick to them\n`;
    response += `• Consider if any tasks can be delegated or removed\n\n`;

    response += `🎯 **You've got this!** Every completed task gets you back on track!`;

    return response;
}

function generateGroupInfoResponse(groupData) {
    if (!groupData) return "I couldn't retrieve your group information right now.";

    const { personalGroups, sharedGroups } = groupData;

    let response = `👥 **Your Groups Overview**:\n\n`;

    response += `📁 **Personal Groups**: ${personalGroups.total}\n`;
    response += `🤝 **Shared Groups**: ${sharedGroups.total}\n`;

    if (sharedGroups.owned > 0) {
        response += `👑 **Groups You Own**: ${sharedGroups.owned}\n`;
    }

    if (sharedGroups.member > 0) {
        response += `👤 **Groups You're Member Of**: ${sharedGroups.member}\n`;
    }

    if (sharedGroups.groups && sharedGroups.groups.length > 0) {
        response += `\n**Your Shared Groups**:\n`;
        sharedGroups.groups.slice(0, 5).forEach((group, index) => {
            response += `${index + 1}. ${group.name} (${group.role}) - ${group.taskCount} tasks\n`;
        });
    }

    return response;
}

function generatePersonalGroupTasksResponse(groupData) {
    if (!groupData) return "I couldn't retrieve your group tasks right now.";

    const { personalGroups } = groupData;

    let response = `📁 **Personal Group Tasks**:\n\n`;

    if (personalGroups && personalGroups.groups && personalGroups.groups.length > 0) {
        personalGroups.groups.forEach((group, index) => {
            response += `**${group.name}**:\n`;
            response += `  📋 Total Tasks: ${group.taskCount}\n`;
            response += `  ✅ Completed: ${group.completed ? 'Yes' : 'No'}\n`;
            response += `  �  Created: ${new Date(group.created).toLocaleDateString()}\n\n`;
        });

        response += `\n💡 These are your personal task groups that help you organize your individual tasks.`;
    } else {
        response += `You don't have any personal group tasks yet.\n\n`;
        response += `💡 **Tip**: You can create group tasks to organize related tasks together!`;
    }

    return response;
}

function generateSharedGroupTasksResponse(groupData) {
    if (!groupData) return "I couldn't retrieve your shared group tasks right now.";

    const { sharedGroups } = groupData;

    let response = `🤝 **Shared Group Tasks**:\n\n`;

    if (sharedGroups && sharedGroups.groups && sharedGroups.groups.length > 0) {
        sharedGroups.groups.forEach((group, index) => {
            response += `**${group.name}**:\n`;
            response += `  📋 Total Tasks: ${group.taskCount}\n`;
            response += `  ✅ Completed: ${group.completedTaskCount}\n`;
            response += `  👤 Your Role: ${group.role}\n`;
            response += `  👥 Members: ${group.memberCount}\n`;
            response += `  🔓 Access: ${group.isPublic ? 'Public' : 'Private'}\n\n`;
        });

        response += `\n💡 These are collaborative groups where you work with other team members.`;
    } else {
        response += `You're not currently part of any shared groups.\n\n`;
        response += `💡 **Tip**: You can join or create shared groups to collaborate with others!`;
    }

    return response;
}

function generateNotificationsResponse(notificationData) {
    if (!notificationData) return "I couldn't retrieve your notifications right now.";

    const { total, unread, notifications } = notificationData;

    let response = `🔔 **Your Notifications**:\n\n`;
    response += `📬 **Total**: ${total}\n`;
    response += `🆕 **Unread**: ${unread}\n\n`;

    if (notifications && notifications.length > 0) {
        response += `**Recent Notifications**:\n`;
        notifications.slice(0, 5).forEach((notification, index) => {
            const icon = notification.priority === 'high' ? '🔴' : notification.priority === 'medium' ? '🟡' : '🟢';
            response += `${icon} ${notification.message}\n`;
        });
    } else {
        response += `No notifications to show.`;
    }

    return response;
}

function generateAccountOverviewResponse(accountData) {
    if (!accountData) return "I couldn't retrieve your account overview right now.";

    const { taskSummary, groupSummary, notificationSummary, productivityMetrics } = accountData;

    let response = `👤 **Account Overview**:\n\n`;

    if (taskSummary) {
        response += `📋 **Tasks**: ${taskSummary.activeTasks} active, ${taskSummary.completedTasks} completed\n`;
    }

    if (groupSummary) {
        response += `👥 **Groups**: ${groupSummary.personalGroups?.total || 0} personal, ${groupSummary.sharedGroups?.total || 0} shared\n`;
    }

    if (notificationSummary) {
        response += `🔔 **Notifications**: ${notificationSummary.unread} unread\n`;
    }

    if (productivityMetrics) {
        response += `📈 **Productivity**: ${productivityMetrics.dailyCompletionAverage} tasks/day average\n`;
    }

    response += `\n💡 Ask me about any specific area for more details!`;

    return response;
}

function generateProductivityInsightsResponse(productivityData) {
    if (!productivityData) return "I couldn't retrieve your productivity insights right now.";

    const { dailyCompletionAverage, weeklyCompletionAverage, mostProductiveDay, streakDays, totalCompletedLast7Days } = productivityData;

    let response = `📈 **Your Productivity Insights**:\n\n`;
    response += `📊 **Daily Average**: ${dailyCompletionAverage} tasks completed\n`;
    response += `📅 **Weekly Average**: ${weeklyCompletionAverage} tasks completed\n`;
    response += `🔥 **Current Streak**: ${streakDays} days\n`;
    response += `📋 **Last 7 Days**: ${totalCompletedLast7Days} tasks completed\n`;

    if (mostProductiveDay) {
        response += `⭐ **Most Productive Day**: ${mostProductiveDay}\n`;
    }

    if (streakDays >= 7) {
        response += `\n🎉 Amazing! You've maintained a ${streakDays}-day streak!`;
    } else if (streakDays >= 3) {
        response += `\n👍 Great job maintaining your ${streakDays}-day streak!`;
    } else if (dailyCompletionAverage > 2) {
        response += `\n💪 You're consistently productive with ${dailyCompletionAverage} tasks per day!`;
    }

    return response;
}

function generateGreetingResponse() {
    const greetings = [
        "Hey there! 👋 Great to see you! How can I help you manage your tasks today?",
        "Hello! 😊 I'm here to help you stay organized and productive. What would you like to know?",
        "Hi! 🌟 Ready to tackle your tasks? I'm here to help you stay on top of everything!",
        "Good to see you! 👋 Whether you need task updates, productivity insights, or just want to chat - I'm here for you!",
        "Hello there! 😄 I'm your Task Buddy AI, ready to help you conquer your to-do list. What's on your mind?"
    ];

    const currentHour = new Date().getHours();
    let timeGreeting = "";

    if (currentHour < 12) {
        timeGreeting = "Good morning! ☀️ ";
    } else if (currentHour < 17) {
        timeGreeting = "Good afternoon! 🌤️ ";
    } else {
        timeGreeting = "Good evening! 🌙 ";
    }

    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    return timeGreeting + randomGreeting;
}

function generateDateTimeResponse() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };

    const dateTimeString = now.toLocaleDateString('en-US', options);
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });

    let response = `📅 **Today is ${dateTimeString}**\n\n`;

    // Add some helpful context for task management
    if (dayOfWeek === 'Monday') {
        response += "🚀 It's Monday - a fresh start to the week! Perfect time to plan your tasks and set your goals.";
    } else if (dayOfWeek === 'Friday') {
        response += "🎉 It's Friday! Time to wrap up the week strong. How are you doing with your tasks?";
    } else if (dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday') {
        response += "😌 It's the weekend! A great time to catch up on personal tasks or just relax.";
    } else {
        response += `💪 It's ${dayOfWeek} - let's make it productive! Need help checking your tasks or planning your day?`;
    }

    return response;
}

function generateMotivationResponse() {
    const motivationalMessages = [
        "🌟 **You've got this!** Every small step counts toward your bigger goals. Keep pushing forward!",
        "💪 **Stay strong!** Remember, progress isn't always about speed - it's about consistency. You're doing great!",
        "🚀 **Believe in yourself!** You've overcome challenges before, and you'll conquer these tasks too!",
        "✨ **You're amazing!** Each completed task is a victory. Celebrate your progress, no matter how small!",
        "🎯 **Focus on one thing at a time.** Break big tasks into smaller ones, and tackle them step by step!",
        "🌈 **Every expert was once a beginner.** You're learning and growing with every task you complete!",
        "⭐ **Your future self will thank you** for the work you're doing today. Keep going!",
        "🔥 **You're building momentum!** Each task completed makes the next one easier. You're on fire!",
        "🌱 **Growth happens outside your comfort zone.** Embrace the challenge and watch yourself flourish!",
        "💎 **You're a diamond in the rough** - pressure creates brilliance. Keep shining!"
    ];

    const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

    let response = randomMessage + "\n\n";
    response += "💡 **Quick tip**: Try breaking your biggest task into 3 smaller steps. You'll be surprised how much easier it becomes!\n\n";
    response += "Need help checking your tasks or setting priorities? Just ask! 😊";

    return response;
}

function generateSmallTalkResponse() {
    const responses = [
        "😊 **You're very welcome!** I'm always happy to help you stay organized and productive!",
        "🎉 **Glad I could help!** That's what I'm here for - making your task management easier and more enjoyable!",
        "😄 **Awesome!** I love helping you stay on top of your tasks. Feel free to ask me anything anytime!",
        "👍 **You're doing great!** Keep up the excellent work with your tasks and productivity!",
        "🌟 **Thank you!** Your success with managing tasks makes me happy too. We make a great team!",
        "😊 **It's my pleasure!** I'm here whenever you need help with tasks, planning, or just want to chat!",
        "🚀 **That's the spirit!** Your positive attitude will take you far. Keep being awesome!",
        "💪 **You've got this!** I believe in your ability to tackle any task that comes your way!",
        "🎯 **Exactly!** With the right mindset and organization, there's nothing you can't accomplish!",
        "✨ **You're amazing!** Thanks for letting me be part of your productivity journey!"
    ];

    const goodbyes = [
        "👋 **See you later!** Don't forget to check off those completed tasks - it feels great!",
        "🌟 **Until next time!** Keep being productive and remember I'm here when you need me!",
        "😊 **Take care!** Hope you have a wonderful and productive day ahead!",
        "🚀 **Catch you later!** Go out there and conquer those tasks like the champion you are!",
        "💪 **Goodbye for now!** Remember, every small step counts toward your bigger goals!"
    ];

    // Simple detection for goodbye vs thank you
    const isGoodbye = Math.random() < 0.3; // 30% chance for goodbye response

    if (isGoodbye) {
        return goodbyes[Math.floor(Math.random() * goodbyes.length)];
    } else {
        return responses[Math.floor(Math.random() * responses.length)];
    }
}

function generateHelpResponse() {
    return `🤖 **Hey! I'm your Task Buddy AI Assistant!**

I'm here to make your life easier and more organized! Here's what I can help you with:

📋 **Tasks & Productivity**: 
- "How many tasks do I have?"
- "Show me my pending tasks"
- "What's my completion rate?"
- "Any overdue tasks?"

👥 **Groups & Collaboration**: 
- "What groups am I in?"
- "Show me my group tasks" (personal groups)
- "Show me shared group tasks" (collaborative groups)
- "Who are my group members?"

🔔 **Notifications & Updates**: 
- "Any unread notifications?"
- "Show me recent alerts"

📈 **Insights & Analytics**: 
- "Show me productivity insights"
- "How's my performance this week?"
- "What's my most productive day?"

👤 **Account & Overview**: 
- "Account overview"
- "My profile summary"

🗓️ **Date & Time**: 
- "What's today's date?"
- "What day is it?"

💪 **Motivation & Support**: 
- "I need motivation"
- "Help me focus"

💬 **Just Chat**: 
- Say hi, thank me, or just have a friendly conversation!

**Pro tip**: Just talk to me naturally! I understand conversational language, so ask me anything in your own words. I'm here to help! 😊`;
}

function generateUnknownResponse(intentResult) {
    let response = `I'm not sure I understand what you're asking about. `;

    if (intentResult.alternatives && intentResult.alternatives.length > 0) {
        response += `Did you mean to ask about:\n`;
        intentResult.alternatives.forEach((alt, index) => {
            response += `${index + 1}. ${getIntentDescription(alt.intent)}\n`;
        });
    } else {
        response += `Try asking about your tasks, groups, notifications, or productivity. Type "help" to see what I can do!`;
    }

    return response;
}

function getIntentDescription(intent) {
    const descriptions = {
        [INTENT_TYPES.TASK_STATUS]: 'Task status and progress',
        [INTENT_TYPES.TASK_DETAILS]: 'Specific task information',
        [INTENT_TYPES.TASK_STATISTICS]: 'Task statistics and analytics',
        [INTENT_TYPES.OVERDUE_TASKS]: 'Overdue and late tasks',
        [INTENT_TYPES.GROUP_INFO]: 'Group information and membership',
        [INTENT_TYPES.GROUP_TASKS]: 'Personal group tasks',
        [INTENT_TYPES.SHARED_GROUP_TASKS]: 'Shared/collaborative group tasks',
        [INTENT_TYPES.NOTIFICATIONS]: 'Notifications and alerts',
        [INTENT_TYPES.ACCOUNT_OVERVIEW]: 'Account overview',
        [INTENT_TYPES.PRODUCTIVITY_INSIGHTS]: 'Productivity insights',
        [INTENT_TYPES.GREETING]: 'Friendly greetings',
        [INTENT_TYPES.DATE_TIME]: 'Date and time queries',
        [INTENT_TYPES.MOTIVATION]: 'Motivational support',
        [INTENT_TYPES.SMALL_TALK]: 'Casual conversation'
    };
    return descriptions[intent] || 'General assistance';
}

/**
 * Get or create chat session for user
 */
async function getOrCreateChatSession(userId) {
    try {
        let session = await AiChatSession.findOne({
            userId,
            isActive: true
        }).sort({ lastActivity: -1 });

        if (!session) {
            session = new AiChatSession({
                userId,
                messages: [],
                isActive: true
            });
        }

        return session;
    } catch (error) {
        console.error('Error getting/creating chat session:', error);
        throw error;
    }
}

/**
 * Get chat history for user
 */
async function getChatHistory(userId, limit = 50) {
    try {
        const session = await AiChatSession.findOne({
            userId,
            isActive: true
        }).sort({ lastActivity: -1 });

        if (!session) {
            return [];
        }

        return session.messages
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
            .slice(-limit);
    } catch (error) {
        console.error('Error getting chat history:', error);
        return [];
    }
}

/**
 * Clear chat history for user
 */
async function clearChatHistory(userId) {
    try {
        await AiChatSession.updateMany(
            { userId },
            { isActive: false }
        );
        return true;
    } catch (error) {
        console.error('Error clearing chat history:', error);
        return false;
    }
}

module.exports = {
    processUserQuery,
    getChatHistory,
    clearChatHistory,
    fetchUserData,
    generateResponse
};