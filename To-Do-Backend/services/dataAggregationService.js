const User = require('../models/User');
const Task = require('../models/Task');
const Group = require('../models/Group');
const SharedGroup = require('../models/SharedGroup');
const UserContextCache = require('../models/UserContextCache');
const { 
  getCachedUserData, 
  cacheUserData, 
  performanceMonitor 
} = require('./cacheService');

/**
 * Data Aggregation Service
 * Collects and processes user data for AI chatbot responses
 */

/**
 * Get comprehensive task summary for a user with caching
 */
async function getUserTaskSummary(userId, options = {}) {
  const startTime = Date.now();
  
  try {
    // Check cache first
    const cacheKey = `taskSummary:${JSON.stringify(options)}`;
    const cached = getCachedUserData(userId, cacheKey);
    if (cached) {
      performanceMonitor.recordCacheHit();
      performanceMonitor.recordQueryTime(Date.now() - startTime);
      return cached;
    }
    
    performanceMonitor.recordCacheMiss();
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Build query with filters
    let taskQuery = { user: userId };
    if (options.filters?.status === 'completed') {
      taskQuery.completed = true;
      taskQuery.deleted = false;
    } else if (options.filters?.status === 'active') {
      taskQuery.completed = false;
      taskQuery.deleted = false;
    } else if (options.filters?.status === 'overdue') {
      taskQuery.completed = false;
      taskQuery.deleted = false;
      taskQuery.date = { $lt: todayStart };
    }

    // Get all user tasks with optimized query
    const allTasks = await Task.find(taskQuery).lean();
    
    // Calculate task statistics
    const activeTasks = allTasks.filter(task => !task.completed && !task.deleted);
    const completedTasks = allTasks.filter(task => task.completed && !task.deleted);
    const deletedTasks = allTasks.filter(task => task.deleted);
    
    // Overdue tasks (active tasks with date in the past)
    const overdueTasks = activeTasks.filter(task => new Date(task.date) < todayStart);
    
    // Today's tasks
    const todayTasks = activeTasks.filter(task => {
      const taskDate = new Date(task.date);
      return taskDate >= todayStart && taskDate < new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    });
    
    // This week's tasks
    const thisWeekTasks = activeTasks.filter(task => new Date(task.date) >= weekStart);
    
    // Completion rate
    const totalNonDeletedTasks = activeTasks.length + completedTasks.length;
    const completionRate = totalNonDeletedTasks > 0 ? (completedTasks.length / totalNonDeletedTasks) * 100 : 0;
    
    // Recent completed tasks (last 7 days)
    const recentCompletedTasks = completedTasks
      .filter(task => task.completedAt && new Date(task.completedAt) >= weekStart)
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, 5);

    const result = {
      totalTasks: allTasks.length,
      activeTasks: activeTasks.length,
      completedTasks: completedTasks.length,
      deletedTasks: deletedTasks.length,
      overdueTasks: overdueTasks.length,
      todayTasks: todayTasks.length,
      thisWeekTasks: thisWeekTasks.length,
      completionRate: Math.round(completionRate * 100) / 100,
      recentCompletedTasks: recentCompletedTasks.map(task => ({
        id: task._id,
        text: task.text,
        completedAt: task.completedAt,
        date: task.date
      })),
      upcomingTasks: activeTasks
        .filter(task => new Date(task.date) >= todayStart)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5)
        .map(task => ({
          id: task._id,
          text: task.text,
          date: task.date
        }))
    };

    // Cache the result
    cacheUserData(userId, cacheKey, result, 300); // Cache for 5 minutes
    
    performanceMonitor.recordQueryTime(Date.now() - startTime);
    return result;
  } catch (error) {
    performanceMonitor.recordError();
    console.error('Error getting user task summary:', error);
    throw error;
  }
}

/**
 * Get user group activity and information
 */
async function getUserGroupActivity(userId, options = {}) {
  try {
    const { groupType } = options;
    
    // Get personal groups
    const personalGroups = await Group.find({ user: userId, deleted: false }).lean();
    
    // Get shared groups where user is a member
    const sharedGroups = await SharedGroup.find({
      $or: [
        { owner: userId },
        { 'members.user': userId }
      ]
    }).lean();

    // Process shared groups data
    const processedSharedGroups = sharedGroups.map(group => {
      const userMember = group.members.find(member => member.user.toString() === userId.toString());
      const isOwner = group.owner.toString() === userId.toString();
      
      return {
        id: group._id,
        name: group.name,
        description: group.description,
        role: isOwner ? 'owner' : (userMember ? userMember.role : 'unknown'),
        memberCount: group.members.length,
        taskCount: group.tasks.filter(task => !task.deleted).length,
        completedTaskCount: group.tasks.filter(task => task.completed && !task.deleted).length,
        lastActivity: group.lastActivity,
        isPublic: group.isPublic
      };
    });

    // Get recent group activities from change logs
    const recentActivities = [];
    sharedGroups.forEach(group => {
      if (group.changeLog && group.changeLog.length > 0) {
        const recentChanges = group.changeLog
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 3)
          .map(change => ({
            groupId: group._id,
            groupName: group.name,
            userName: change.userName,
            action: change.action,
            message: change.commitMessage,
            timestamp: change.timestamp
          }));
        recentActivities.push(...recentChanges);
      }
    });

    // Sort all activities by timestamp
    recentActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Return data based on groupType filter
    if (groupType === 'personal') {
      return {
        personalGroups: {
          total: personalGroups.length,
          active: personalGroups.filter(group => !group.completed).length,
          completed: personalGroups.filter(group => group.completed).length,
          groups: personalGroups.map(group => ({
            id: group._id,
            name: group.name,
            taskCount: group.tasks.length,
            completed: group.completed,
            created: group.created
          }))
        }
      };
    } else if (groupType === 'shared') {
      return {
        sharedGroups: {
          total: processedSharedGroups.length,
          owned: processedSharedGroups.filter(group => group.role === 'owner').length,
          member: processedSharedGroups.filter(group => group.role !== 'owner').length,
          groups: processedSharedGroups
        },
        recentActivity: recentActivities.slice(0, 10)
      };
    } else {
      // Return both if no specific type requested
      return {
        personalGroups: {
          total: personalGroups.length,
          active: personalGroups.filter(group => !group.completed).length,
          completed: personalGroups.filter(group => group.completed).length,
          groups: personalGroups.map(group => ({
            id: group._id,
            name: group.name,
            taskCount: group.tasks.length,
            completed: group.completed,
            created: group.created
          }))
        },
        sharedGroups: {
          total: processedSharedGroups.length,
          owned: processedSharedGroups.filter(group => group.role === 'owner').length,
          member: processedSharedGroups.filter(group => group.role !== 'owner').length,
          groups: processedSharedGroups
        },
        recentActivity: recentActivities.slice(0, 10)
      };
    }
  } catch (error) {
    console.error('Error getting user group activity:', error);
    throw error;
  }
}

/**
 * Get comprehensive user notifications including all task types
 */
async function getUserNotifications(userId, filters = {}) {
  try {
    const notifications = [];
    const now = new Date();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    // 1. Check for overdue INDIVIDUAL tasks
    const overdueIndividualTasks = await Task.find({
      user: userId,
      completed: false,
      deleted: false,
      date: { $lt: now }
    }).lean();

    overdueIndividualTasks.forEach(task => {
      notifications.push({
        type: 'overdue_task',
        message: `Individual Task "${task.text}" is overdue`,
        timestamp: task.date,
        read: false,
        priority: 'high',
        taskType: 'individual',
        data: { taskId: task._id, taskText: task.text }
      });
    });

    // 2. Check for overdue GROUP tasks (personal groups)
    const personalGroups = await Group.find({ 
      user: userId, 
      deleted: false 
    }).populate('tasks').lean();

    personalGroups.forEach(group => {
      if (group.tasks) {
        group.tasks.forEach(task => {
          if (!task.completed && !task.deleted && new Date(task.date) < now) {
            notifications.push({
              type: 'overdue_task',
              message: `Group Task "${task.text}" in "${group.name}" is overdue`,
              timestamp: task.date,
              read: false,
              priority: 'high',
              taskType: 'group',
              data: { 
                taskId: task._id, 
                taskText: task.text,
                groupId: group._id,
                groupName: group.name 
              }
            });
          }
        });
      }
    });

    // 3. Check for overdue SHARED GROUP tasks
    const sharedGroups = await SharedGroup.find({
      $or: [
        { owner: userId },
        { 'members.user': userId }
      ]
    }).lean();

    sharedGroups.forEach(group => {
      if (group.tasks) {
        group.tasks.forEach(task => {
          if (!task.completed && !task.deleted && new Date(task.date) < now) {
            const userRole = group.owner.toString() === userId.toString() ? 'owner' : 
              group.members.find(m => m.user.toString() === userId.toString())?.role || 'member';
            
            notifications.push({
              type: 'overdue_task',
              message: `Shared Group Task "${task.text}" in "${group.name}" is overdue`,
              timestamp: task.date,
              read: false,
              priority: 'high',
              taskType: 'shared_group',
              data: { 
                taskId: task._id, 
                taskText: task.text,
                groupId: group._id,
                groupName: group.name,
                userRole: userRole
              }
            });
          }
        });
      }
    });

    // 4. Check for upcoming INDIVIDUAL tasks (next 24 hours)
    const upcomingIndividualTasks = await Task.find({
      user: userId,
      completed: false,
      deleted: false,
      date: { $gte: now, $lte: tomorrow }
    }).lean();

    upcomingIndividualTasks.forEach(task => {
      notifications.push({
        type: 'upcoming_task',
        message: `Individual Task "${task.text}" is due soon`,
        timestamp: task.date,
        read: false,
        priority: 'medium',
        taskType: 'individual',
        data: { taskId: task._id, taskText: task.text }
      });
    });

    // 5. Check for upcoming GROUP tasks
    personalGroups.forEach(group => {
      if (group.tasks) {
        group.tasks.forEach(task => {
          if (!task.completed && !task.deleted && 
              new Date(task.date) >= now && new Date(task.date) <= tomorrow) {
            notifications.push({
              type: 'upcoming_task',
              message: `Group Task "${task.text}" in "${group.name}" is due soon`,
              timestamp: task.date,
              read: false,
              priority: 'medium',
              taskType: 'group',
              data: { 
                taskId: task._id, 
                taskText: task.text,
                groupId: group._id,
                groupName: group.name 
              }
            });
          }
        });
      }
    });

    // 6. Check for upcoming SHARED GROUP tasks
    sharedGroups.forEach(group => {
      if (group.tasks) {
        group.tasks.forEach(task => {
          if (!task.completed && !task.deleted && 
              new Date(task.date) >= now && new Date(task.date) <= tomorrow) {
            const userRole = group.owner.toString() === userId.toString() ? 'owner' : 
              group.members.find(m => m.user.toString() === userId.toString())?.role || 'member';
            
            notifications.push({
              type: 'upcoming_task',
              message: `Shared Group Task "${task.text}" in "${group.name}" is due soon`,
              timestamp: task.date,
              read: false,
              priority: 'medium',
              taskType: 'shared_group',
              data: { 
                taskId: task._id, 
                taskText: task.text,
                groupId: group._id,
                groupName: group.name,
                userRole: userRole
              }
            });
          }
        });
      }
    });

    // Check for shared group join requests (if user is owner)
    const ownedGroups = await SharedGroup.find({
      owner: userId,
      'joinRequests.status': 'pending'
    }).lean();

    ownedGroups.forEach(group => {
      const pendingRequests = group.joinRequests.filter(req => req.status === 'pending');
      pendingRequests.forEach(request => {
        notifications.push({
          type: 'join_request',
          message: `${request.userName} wants to join "${group.name}"`,
          timestamp: request.createdAt,
          read: false,
          priority: 'medium',
          data: { groupId: group._id, requestId: request._id }
        });
      });
    });

    // Apply filters
    let filteredNotifications = notifications;
    if (filters.type) {
      filteredNotifications = filteredNotifications.filter(n => n.type === filters.type);
    }
    if (filters.unreadOnly) {
      filteredNotifications = filteredNotifications.filter(n => !n.read);
    }

    // Sort by timestamp (newest first)
    filteredNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      high: notifications.filter(n => n.priority === 'high').length,
      medium: notifications.filter(n => n.priority === 'medium').length,
      low: notifications.filter(n => n.priority === 'low').length,
      notifications: filteredNotifications.slice(0, filters.limit || 20)
    };
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
}

/**
 * Get user productivity metrics and insights
 */
async function getUserProductivityMetrics(userId) {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get completed tasks in the last 30 days
    const recentCompletedTasks = await Task.find({
      user: userId,
      completed: true,
      completedAt: { $gte: thirtyDaysAgo }
    }).lean();

    // Calculate daily completion averages
    const dailyCompletions = {};
    recentCompletedTasks.forEach(task => {
      const day = new Date(task.completedAt).toDateString();
      dailyCompletions[day] = (dailyCompletions[day] || 0) + 1;
    });

    const dailyCompletionValues = Object.values(dailyCompletions);
    const dailyAverage = dailyCompletionValues.length > 0 
      ? dailyCompletionValues.reduce((a, b) => a + b, 0) / dailyCompletionValues.length 
      : 0;

    // Weekly average (last 7 days)
    const weeklyCompletedTasks = recentCompletedTasks.filter(task => 
      new Date(task.completedAt) >= sevenDaysAgo
    );
    const weeklyAverage = weeklyCompletedTasks.length / 7;

    // Find most productive day of the week
    const dayOfWeekCompletions = {};
    recentCompletedTasks.forEach(task => {
      const dayOfWeek = new Date(task.completedAt).toLocaleDateString('en-US', { weekday: 'long' });
      dayOfWeekCompletions[dayOfWeek] = (dayOfWeekCompletions[dayOfWeek] || 0) + 1;
    });

    const mostProductiveDay = Object.entries(dayOfWeekCompletions)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || null;

    // Calculate current streak (consecutive days with completed tasks)
    let streakDays = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dayString = checkDate.toDateString();
      if (dailyCompletions[dayString] > 0) {
        streakDays++;
      } else {
        break;
      }
    }

    // Task completion trends (last 7 days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayString = date.toDateString();
      last7Days.push({
        date: date.toISOString().split('T')[0],
        completed: dailyCompletions[dayString] || 0
      });
    }

    return {
      dailyCompletionAverage: Math.round(dailyAverage * 100) / 100,
      weeklyCompletionAverage: Math.round(weeklyAverage * 100) / 100,
      mostProductiveDay,
      streakDays,
      totalCompletedLast30Days: recentCompletedTasks.length,
      totalCompletedLast7Days: weeklyCompletedTasks.length,
      completionTrend: last7Days,
      dayOfWeekStats: dayOfWeekCompletions
    };
  } catch (error) {
    console.error('Error getting user productivity metrics:', error);
    throw error;
  }
}

/**
 * Get or create user context cache
 */
async function getUserContextCache(userId) {
  try {
    let cache = await UserContextCache.findOne({ userId });
    
    if (!cache || cache.isExpired()) {
      // Create or refresh cache
      const [taskSummary, groupActivity, notifications, productivityMetrics] = await Promise.all([
        getUserTaskSummary(userId),
        getUserGroupActivity(userId),
        getUserNotifications(userId),
        getUserProductivityMetrics(userId)
      ]);

      const cacheData = {
        userId,
        cachedData: {
          taskSummary: { ...taskSummary, lastUpdated: new Date() },
          groupSummary: { ...groupActivity, lastUpdated: new Date() },
          notificationSummary: { ...notifications, lastUpdated: new Date() },
          productivityMetrics: { ...productivityMetrics, lastUpdated: new Date() }
        },
        cacheExpiry: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
      };

      if (cache) {
        cache = await UserContextCache.findOneAndUpdate(
          { userId },
          cacheData,
          { new: true }
        );
      } else {
        cache = await UserContextCache.create(cacheData);
      }
    }

    return cache.cachedData;
  } catch (error) {
    console.error('Error getting user context cache:', error);
    throw error;
  }
}

/**
 * Invalidate user cache (call when user data changes)
 */
async function invalidateUserCache(userId) {
  try {
    await UserContextCache.deleteOne({ userId });
    console.log(`Cache invalidated for user: ${userId}`);
  } catch (error) {
    console.error('Error invalidating user cache:', error);
  }
}

module.exports = {
  getUserTaskSummary,
  getUserGroupActivity,
  getUserNotifications,
  getUserProductivityMetrics,
  getUserContextCache,
  invalidateUserCache
};