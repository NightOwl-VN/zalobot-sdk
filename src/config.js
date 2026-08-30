/**
 * @author  Hoang Khac Phuc
 * @email   hoangkhacphuc.dev@gmail.com
 * @github  https://github.com/hoangkhacphuc
 */

/**
 * Configuration validation and management for Zalo Bot SDK
 */

class ZaloConfig {
  /**
   * @param {Object} options
   * @param {string} options.accessToken - Zalo OA access token (required)
   * @param {string} [options.secretKey] - Secret key for webhook signature verification
   * @param {number} [options.timeout=30000] - Request timeout in ms
   * @param {number} [options.maxRetries=3] - Max retry attempts on rate limit
   * @param {string} [options.baseURL='https://graph.zalo.me/v2.0'] - API base URL
   */
  constructor(options = {}) {
    this._validate(options);

    this.accessToken = options.accessToken;
    this.secretKey = options.secretKey || null;
    this.timeout = options.timeout || 30000;
    this.maxRetries = options.maxRetries || 3;
    this.baseURL = options.baseURL || 'https://graph.zalo.me/v2.0';
  }

  /**
   * Validate configuration options
   * @private
   */
  _validate(options) {
    if (!options || typeof options !== 'object') {
      throw new Error('Configuration must be an object');
    }

    if (!options.accessToken || typeof options.accessToken !== 'string') {
      throw new Error('accessToken is required and must be a string');
    }

    if (options.accessToken.trim().length === 0) {
      throw new Error('accessToken cannot be empty');
    }

    if (options.secretKey && typeof options.secretKey !== 'string') {
      throw new Error('secretKey must be a string');
    }

    if (options.timeout && typeof options.timeout !== 'number') {
      throw new Error('timeout must be a number');
    }

    if (options.maxRetries && typeof options.maxRetries !== 'number') {
      throw new Error('maxRetries must be a number');
    }
  }

  /**
   * Get configuration as plain object
   * @returns {Object}
   */
  toObject() {
    return {
      accessToken: this.accessToken,
      secretKey: this.secretKey,
      timeout: this.timeout,
      maxRetries: this.maxRetries,
      baseURL: this.baseURL,
    };
  }

  /**
   * Create config from environment variables
   * @returns {ZaloConfig}
   */
  static fromEnv() {
    return new ZaloConfig({
      accessToken: process.env.ZALO_ACCESS_TOKEN,
      secretKey: process.env.ZALO_SECRET_KEY,
      timeout: parseInt(process.env.ZALO_TIMEOUT, 10) || 30000,
      maxRetries: parseInt(process.env.ZALO_MAX_RETRIES, 10) || 3,
      baseURL: process.env.ZALO_BASE_URL || 'https://graph.zalo.me/v2.0',
    });
  }
}

module.exports = ZaloConfig;