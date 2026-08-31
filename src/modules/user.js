/**
 * @author  Hoang Khac Phuc
 * @email   hoangkhacphuc.dev@gmail.com
 * @github  https://github.com/hoangkhacphuc
 */

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

    return this.client.get(userId, params);
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
    return this.client.get('me/followers', query);
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
  /**
   * Maximum number of entries the cache will hold before evicting oldest.
   * @private
   */
  static get CACHE_MAX_SIZE() {
    return 1000;
  }

  /**
   * Cache entry TTL in milliseconds (5 minutes).
   * @private
   */
  static get CACHE_TTL() {
    return 300000;
  }

  /**
   * Lazily initialise the bounded cache map and metadata.
   * @private
   */
  _initCache() {
    if (this._cache) return;
    this._cache = new Map();          // key → { data, timestamp }
    this._cacheOrder = [];            // insertion-order keys for eviction
  }

  /**
   * Evict entries whose TTL has expired.  Called on every cache read so stale
   * entries don't accumulate.
   * @private
   */
  _evictExpired() {
    const now = Date.now();
    const ttl = UserModule.CACHE_TTL;
    for (const [key, entry] of this._cache) {
      if (now - entry.timestamp >= ttl) {
        this._cache.delete(key);
        const idx = this._cacheOrder.indexOf(key);
        if (idx !== -1) this._cacheOrder.splice(idx, 1);
      }
    }
  }

  /**
   * Evict the oldest entries when the cache exceeds CACHE_MAX_SIZE.
   * @private
   */
  _evictOldest() {
    while (this._cacheOrder.length > UserModule.CACHE_MAX_SIZE) {
      const oldestKey = this._cacheOrder.shift();
      this._cache.delete(oldestKey);
    }
  }

  /**
   * Get user profile with caching (optional)
   * @param {string} userId - Zalo user ID
   * @param {Object} [options] - Additional options
   * @param {string} [options.fields] - Comma-separated fields (affects cache key)
   * @param {boolean} [options.forceRefresh=false] - Bypass cache
   * @returns {Promise<Object>} User profile data
   */
  async getProfileCached(userId, options = {}) {
    this._initCache();
    this._evictExpired();

    const fields = options.fields || 'default';
    const cacheKey = `user:${userId}:${fields}`;

    if (!options.forceRefresh && this._cache.has(cacheKey)) {
      return this._cache.get(cacheKey).data;
    }

    const profile = await this.getProfile(userId, options);
    this._cache.set(cacheKey, {
      data: profile,
      timestamp: Date.now(),
    });
    this._cacheOrder.push(cacheKey);
    this._evictOldest();

    return profile;
  }

  /**
   * Clear user cache
   * @param {string} [userId] - Specific user ID to clear, or omit to clear all
   */
  clearCache(userId) {
    this._initCache();
    if (userId) {
      // Remove all keys matching this userId (across different field sets)
      const prefix = `user:${userId}:`;
      for (const key of this._cacheOrder) {
        if (key.startsWith(prefix)) {
          this._cache.delete(key);
        }
      }
      this._cacheOrder = this._cacheOrder.filter((k) => this._cache.has(k));
    } else {
      this._cache.clear();
      this._cacheOrder = [];
    }
  }

  /**
   * Return the current number of entries in the cache.
   * Useful for monitoring and debugging cache usage.
   * @returns {number} Number of cached entries
   */
  getCacheSize() {
    this._initCache();
    return this._cache.size;
  }
}

module.exports = UserModule;