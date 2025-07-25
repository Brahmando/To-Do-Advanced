/**
 * Caching Service for AI Chatbot
 * Provides in-memory caching with TTL support
 */

class CacheService {
  constructor() {
    this.cache = new Map();
    this.ttlMap = new Map();
    
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Set cache entry with TTL (time to live)
   */
  set(key, value, ttlSeconds = 900) { // Default 15 minutes
    const expiryTime = Date.now() + (ttlSeconds * 1000);
    
    this.cache.set(key, value);
    this.ttlMap.set(key, expiryTime);
    
    return true;
  }

  /**
   * Get cache entry
   */
  get(key) {
    const expiryTime = this.ttlMap.get(key);
    
    if (!expiryTime || Date.now() > expiryTime) {
      // Entry expired or doesn't exist
      this.delete(key);
      return null;
    }
    
    return this.cache.get(key);
  }

  /**
   * Check if key exists and is not expired
   */
  has(key) {
    const expiryTime = this.ttlMap.get(key);
    
    if (!expiryTime || Date.now() > expiryTime) {
      this.delete(key);
      return false;
    }
    
    return this.cache.has(key);
  }

  /**
   * Delete cache entry
   */
  delete(key) {
    this.cache.delete(key);
    this.ttlMap.delete(key);
    return true;
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
    this.ttlMap.clear();
    return true;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Estimate memory usage (rough calculation)
   */
  estimateMemoryUsage() {
    let totalSize = 0;
    
    for (const [key, value] of this.cache.entries()) {
      totalSize += JSON.stringify(key).length;
      totalSize += JSON.stringify(value).length;
    }
    
    return {
      bytes: totalSize,
      kb: Math.round(totalSize / 1024),
      mb: Math.round(totalSize / (1024 * 1024))
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, expiryTime] of this.ttlMap.entries()) {
      if (now > expiryTime) {
        this.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cache cleanup: removed ${cleanedCount} expired entries`);
    }
    
    return cleanedCount;
  }

  /**
   * Get or set with callback (cache-aside pattern)
   */
  async getOrSet(key, callback, ttlSeconds = 900) {
    // Try to get from cache first
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }
    
    // Not in cache, execute callback to get data
    try {
      const result = await callback();
      this.set(key, result, ttlSeconds);
      return result;
    } catch (error) {
      console.error('Cache callback error:', error);
      throw error;
    }
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidatePattern(pattern) {
    const regex = new RegExp(pattern);
    let invalidatedCount = 0;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.delete(key);
        invalidatedCount++;
      }
    }
    
    return invalidatedCount;
  }
}

// Create singleton instance
const cacheService = new CacheService();

/**
 * Generate cache key for user data
 */
function generateUserCacheKey(userId, dataType, options = {}) {
  const optionsStr = Object.keys(options).length > 0 ? 
    JSON.stringify(options) : '';
  return `user:${userId}:${dataType}:${optionsStr}`;
}

/**
 * Generate cache key for chat sessions
 */
function generateSessionCacheKey(userId, sessionId) {
  return `session:${userId}:${sessionId}`;
}

/**
 * Cache user data with automatic invalidation
 */
async function cacheUserData(userId, dataType, data, ttlSeconds = 900) {
  const key = generateUserCacheKey(userId, dataType);
  return cacheService.set(key, data, ttlSeconds);
}

/**
 * Get cached user data
 */
function getCachedUserData(userId, dataType, options = {}) {
  const key = generateUserCacheKey(userId, dataType, options);
  return cacheService.get(key);
}

/**
 * Invalidate all cache entries for a user
 */
function invalidateUserCache(userId) {
  return cacheService.invalidatePattern(`^user:${userId}:`);
}

/**
 * Clear all cache entries for a specific user
 */
function clearUserCache(userId) {
  return cacheService.invalidatePattern(`^user:${userId}:`);
}

/**
 * Invalidate specific data type cache for user
 */
function invalidateUserDataCache(userId, dataType) {
  return cacheService.invalidatePattern(`^user:${userId}:${dataType}:`);
}

/**
 * Cache middleware for Express routes
 */
function cacheMiddleware(ttlSeconds = 300) {
  return (req, res, next) => {
    const userId = req.user?.id;
    if (!userId) {
      return next();
    }

    const cacheKey = `route:${req.originalUrl}:${userId}`;
    const cached = cacheService.get(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(data) {
      if (res.statusCode === 200) {
        cacheService.set(cacheKey, data, ttlSeconds);
      }
      return originalJson.call(this, data);
    };

    next();
  };
}

/**
 * Performance monitoring
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      queryTimes: [],
      errorCount: 0
    };
  }

  recordCacheHit() {
    this.metrics.cacheHits++;
  }

  recordCacheMiss() {
    this.metrics.cacheMisses++;
  }

  recordQueryTime(timeMs) {
    this.metrics.queryTimes.push(timeMs);
    // Keep only last 100 query times
    if (this.metrics.queryTimes.length > 100) {
      this.metrics.queryTimes.shift();
    }
  }

  recordError() {
    this.metrics.errorCount++;
  }

  getStats() {
    const queryTimes = this.metrics.queryTimes;
    const avgQueryTime = queryTimes.length > 0 ? 
      queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length : 0;
    
    const cacheHitRate = this.metrics.cacheHits + this.metrics.cacheMisses > 0 ?
      (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100 : 0;

    return {
      cacheHits: this.metrics.cacheHits,
      cacheMisses: this.metrics.cacheMisses,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      averageQueryTime: Math.round(avgQueryTime * 100) / 100,
      errorCount: this.metrics.errorCount,
      cacheStats: cacheService.getStats()
    };
  }

  reset() {
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      queryTimes: [],
      errorCount: 0
    };
  }
}

const performanceMonitor = new PerformanceMonitor();

module.exports = {
  cacheService,
  generateUserCacheKey,
  generateSessionCacheKey,
  cacheUserData,
  getCachedUserData,
  clearUserCache,
  invalidateUserCache,
  invalidateUserDataCache,
  cacheMiddleware,
  performanceMonitor
};