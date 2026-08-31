/**
 * @author  Hoang Khac Phuc
 * @email   hoangkhacphuc.dev@gmail.com
 * @github  https://github.com/hoangkhacphuc
 */

/**
 * Configuration for Zalo Bot SDK
 * Supports both environment variables and manual configuration
 * Reference: https://bot.zapps.me/docs/
 */

const path = require('path');

// Auto-load .env if dotenv is available and .env file exists
try {
  require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
} catch (_e) {
  // dotenv not available — proceed without auto-loading
}

class ZaloConfig {
  /**
   * Create a new configuration instance
   * @param {Object} [options] - Configuration options (overrides env vars)
   * @param {string} [options.botToken] - Zalo Bot Token (required)
   * @param {string} [options.secretKey] - Secret token for webhook verification
   * @param {number} [options.timeout=30000] - Request timeout in milliseconds
   * @param {number} [options.maxRetries=3] - Max retry attempts on rate limit
   * @example
   * const config = new ZaloConfig({
   *   botToken: process.env.ZALO_BOT_TOKEN,
   *   secretKey: process.env.ZALO_BOT_SECRET,
   * });
   */
  constructor(options = {}) {
    // Merge options with environment variables (options take precedence)
    this.botToken = options.botToken
      || process.env.ZALO_BOT_TOKEN
      || process.env.BOT_TOKEN
      || null;

    this.secretKey = options.secretKey
      || process.env.ZALO_BOT_SECRET
      || process.env.BOT_SECRET
      || null;

    this.timeout = parseInt(options.timeout || process.env.ZALO_BOT_TIMEOUT, 10) || 30000;
    this.maxRetries = parseInt(options.maxRetries || process.env.ZALO_BOT_MAX_RETRIES, 10) || 3;

    // Validate required fields
    this._validate();
  }

  /**
   * Validate configuration values
   * @throws {Error} If required configuration is missing or invalid
   * @private
   */
  _validate() {
    if (!this.botToken) {
      throw new Error(
        'botToken is required. Create a bot at https://bot.zapps.me/ ' +
        'then set ZALO_BOT_TOKEN environment variable or pass botToken option.'
      );
    }
    if (typeof this.botToken !== 'string') {
      throw new Error('botToken must be a string');
    }
    if (this.botToken.length === 0) {
      throw new Error('botToken cannot be empty');
    }
    if (this.timeout < 0) {
      throw new Error('timeout must be non-negative');
    }
    if (this.maxRetries < 0) {
      throw new Error('maxRetries must be non-negative');
    }
  }

  /**
   * Get configuration as plain object
   * @returns {Object} Configuration object
   */
  toObject() {
    return {
      botToken: this.botToken,
      secretKey: this.secretKey,
      timeout: this.timeout,
      maxRetries: this.maxRetries,
    };
  }

  /**
   * Get the API base URL for the configured bot
   * @returns {string} API base URL
   */
  getApiBaseUrl() {
    return `https://bot-api.zaloplatforms.com/bot${this.botToken}`;
  }

  /**
   * Check if webhook secret is configured
   * @returns {boolean} True if secret key is set
   */
  hasSecretKey() {
    return this.secretKey && this.secretKey.length >= 8;
  }
}

module.exports = ZaloConfig;
