/**
 * User module - Get user information and follower management
 * Based on Zalo Bot API documentation
 */

class UserModule {
  /**
   * @param {ZaloClient} client - HTTP client instance
   */
  constructor(client) {
    this.client = client;
  }

  /**
   * Get user profile information
   * @param {string} userId - Zalo user ID
   * @param {Object} [options] - Additional options
   * @param {string} [options.fields] - Comma-separated list of fields to return
   * @returns {Promise<Object>} User profile data
   * @example
   * const user = await bot.user.getProfile('123456789');
   * console.log(user.name, user.avatar);
   */
  async getProfile(userId, options = {}) {
    if (!userId || typeof userId !== 'string') {
      throw new Error('userId is required and must be a string');
    }

    const params = {
      ...(options.fields && { fields: options.fields }),
    };

    return this.client.get(`/${userId}`, params);
  }

  /**
   * Get list of followers (users who follow the OA)
   * @param {Object} [params] - Query parameters
   * @param {number} [params.limit=50] - Number of followers (max 200)
   * @param {string} [params.cursor] - Pagination cursor
   * @param {string} [params.fields] - Comma-separated list of fields
   * @returns {Promise<Object>} { data: [...], paging: {...} }
   * @example
   * const followers = await bot.user.getFollowers({ limit: 100 });
   * followers.data.forEach(f => console.log(f.name));
   */
  async getFollowers(params = {}) {
    const query = {
      limit: params.limit || 50,
      ...(params.cursor && { cursor: params.cursor }),
      ...(params.fields && { fields: params.fields }),
    };
    return this.client.get('/me/followers', query);
  }

  /**
   * Check if a user is following the OA
   * @param {string} userId - Zalo user ID
   * @returns {Promise<boolean>} True if user is following
   */
  async isFollowing(userId) {
    if (!userId || typeof userId !== 'string') {
      throw new Error('userId is required and must be a string');
    }

    try {
      await this.getProfile(userId);
      return true;
    } catch (error) {
      if (error.code === 2003) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get user profile with caching (optional)
   * @param {string} userId - Zalo user ID
   * @param {Object} [options] - Additional options
   * @param {boolean} [options.forceRefresh=false] - Bypass cache
   * @returns {Promise<Object>} User profile data
   */
  async getProfileCached(userId, options = {}) {
    // Simple in-memory cache (can be extended with Redis)
    if (!this._cache) {
      this._cache = new Map();
    }

    const cacheKey = `user:${userId}`;
    const cacheTTL = 300000; // 5 minutes

    if (!options.forceRefresh && this._cache.has(cacheKey)) {
      const entry = this._cache.get(cacheKey);
      if (Date.now() - entry.timestamp < cacheTTL) {
        return entry.data;
      }
    }

    const profile = await this.getProfile(userId, options);
    this._cache.set(cacheKey, {
      data: profile,
      timestamp: Date.now(),
    });

    return profile;
  }

  /**
   * Clear user cache
   * @param {string} [userId] - Specific user ID to clear, or omit to clear all
   */
  clearCache(userId) {
    if (!this._cache) {
      this._cache = new Map();
    }
    if (userId) {
      this._cache.delete(`user:${userId}`);
    } else {
      this._cache.clear();
    }
  }
}

module.exports = UserModule;