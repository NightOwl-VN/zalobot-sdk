/**
 * @author  Hoang Khac Phuc
 * @email   hoangkhacphuc.dev@gmail.com
 * @github  https://github.com/hoangkhacphuc
 */

/**
 * Custom error classes for Zalo Bot SDK
 * Reference: https://bot.zapps.me/docs/error-code/
 * @module errors
 */

/**
 * Base error class for all Zalo Bot SDK errors
 * @class ZaloBotError
 * @extends Error
 */
class ZaloBotError extends Error {
  /**
   * @param {string} message - Error message
   */
  constructor(message) {
    super(message);
    this.name = 'ZaloBotError';
  }
}

/**
 * Error thrown when Zalo Bot API returns an error response
 * @class ZaloApiError
 * @extends ZaloBotError
 * @example
 * try {
 *   await bot.message.sendText(chatId, text);
 * } catch (error) {
 *   if (error instanceof ZaloApiError) {
 *     console.error('API Error:', error.code, error.message);
 *   }
 * }
 */
class ZaloApiError extends ZaloBotError {
  /**
   * @param {string} message - Error message
   * @param {number} code - Zalo Bot API error code
   * @param {Object} [details] - Additional error details from API response
   */
  constructor(message, code, details = {}) {
    super(`[Zalo API Error ${code}]: ${message}`);
    this.name = 'ZaloApiError';
    /** @type {number} Zalo error code */
    this.code = code;
    /** @type {Object} Additional details from API response */
    this.details = details;
  }
}

/**
 * Error thrown when bot token is invalid, missing, or expired
 * @class ZaloAuthError
 * @extends ZaloBotError
 * @example
 * try {
 *   await bot.message.getMe();
 * } catch (error) {
 *   if (error instanceof ZaloAuthError) {
 *     console.error('Auth failed - check your Bot Token');
 *   }
 * }
 */
class ZaloAuthError extends ZaloBotError {
  /**
   * @param {string} message - Error message
   * @param {Object} [details] - Additional details
   */
  constructor(message = 'Bot token is invalid or expired', details = {}) {
    super(message);
    this.name = 'ZaloAuthError';
    /** @type {Object} Additional details */
    this.details = details;
  }
}

/**
 * Error thrown when webhook secret token verification fails
 * @class ZaloWebhookError
 * @extends ZaloBotError
 * @example
 * // In middleware
 * if (req.headers['x-bot-api-secret-token'] !== secretKey) {
 *   throw new ZaloWebhookError('Invalid secret token');
 * }
 */
class ZaloWebhookError extends ZaloBotError {
  /**
   * @param {string} message - Error message
   */
  constructor(message = 'Invalid webhook secret token') {
    super(message);
    this.name = 'ZaloWebhookError';
  }
}

/**
 * Error thrown when rate limit is exceeded (HTTP 429)
 * @class ZaloRateLimitError
 * @extends ZaloBotError
 * @example
 * try {
 *   await bot.message.sendText(chatId, text);
 * } catch (error) {
 *   if (error instanceof ZaloRateLimitError) {
 *     console.log('Rate limited, retry after', error.retryAfter);
 *   }
 * }
 */
class ZaloRateLimitError extends ZaloBotError {
  /**
   * @param {string} message - Error message
   * @param {number} [retryAfter] - Seconds to wait before retrying
   */
  constructor(message = 'Rate limit exceeded. Please try again later.', retryAfter = null) {
    super(message);
    this.name = 'ZaloRateLimitError';
    /** @type {number|null} Seconds to wait before retrying */
    this.retryAfter = retryAfter;
  }
}

module.exports = {
  ZaloBotError,
  ZaloApiError,
  ZaloAuthError,
  ZaloWebhookError,
  ZaloRateLimitError,
};
