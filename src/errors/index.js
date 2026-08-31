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
 * Base error class for all Zalo Bot SDK errors.
 * Provides consistent metadata across all SDK errors.
 * @class ZaloBotError
 * @extends Error
 */
class ZaloBotError extends Error {
  /**
   * @param {string} message - Error message
   * @param {Object} [options] - Error options
   * @param {string} [options.code] - Zalo error code identifier
   * @param {number} [options.status] - HTTP status code
   * @param {Object} [options.details] - Additional error details
   * @param {Error} [options.cause] - Original error cause (native Error cause)
   */
  constructor(message, options = {}) {
    const { code, status, details, cause } = options;
    super(message, { cause });
    this.name = 'ZaloBotError';
    /** @type {string} Zalo error code identifier */
    this.code = code ?? undefined;
    /** @type {number} HTTP status code */
    this.status = status ?? undefined;
    /** @type {Object} Additional error details */
    this.details = details ?? undefined;
  }
}

/**
 * Error thrown when Zalo Bot API returns an error response.
 * Contains the API error code and any additional response details.
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
   * @param {string|number} code - Zalo Bot API error code
   * @param {number} [status] - HTTP status code
   * @param {Object} [details] - Additional error details from API response
   * @param {Error} [cause] - Original error cause
   */
  constructor(message, code, status, details, cause) {
    super(message, { code, status, details, cause });
    this.name = 'ZaloApiError';
  }
}

/**
 * Error thrown when bot token is invalid, missing, or expired.
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
   * @param {number} [status] - HTTP status code
   * @param {Object} [details] - Additional error details
   * @param {Error} [cause] - Original error cause
   */
  constructor(message = 'Bot token is invalid or expired', status, details, cause) {
    super(message, { status, details, cause });
    this.name = 'ZaloAuthError';
  }
}

/**
 * Error thrown when webhook secret token verification fails.
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
   * @param {number} [status] - HTTP status code
   * @param {Object} [details] - Additional error details
   * @param {Error} [cause] - Original error cause
   */
  constructor(message = 'Invalid webhook secret token', status, details, cause) {
    super(message, { status, details, cause });
    this.name = 'ZaloWebhookError';
  }
}

/**
 * Error thrown when rate limit is exceeded (HTTP 429).
 * The `retryAfter` value is in SECONDS (not the HTTP status code).
 * @class ZaloRateLimitError
 * @extends ZaloBotError
 * @example
 * try {
 *   await bot.message.sendText(chatId, text);
 * } catch (error) {
 *   if (error instanceof ZaloRateLimitError) {
 *     console.log('Rate limited, retry after', error.retryAfter, 'seconds');
 *     await sleep(error.retryAfter * 1000);
 *   }
 * }
 */
class ZaloRateLimitError extends ZaloBotError {
  /**
   * @param {string} message - Error message
   * @param {number} [status] - HTTP status code (429)
   * @param {number} [retryAfter] - Seconds to wait before retrying (NOT HTTP status code)
   * @param {Object} [details] - Additional error details
   * @param {Error} [cause] - Original error cause
   */
  constructor(message = 'Rate limit exceeded. Please try again later.', status, retryAfter, details, cause) {
    super(message, { status, retryAfter, details, cause });
    this.name = 'ZaloRateLimitError';
    /** @type {number|undefined} Seconds to wait before retrying (NOT HTTP status code) */
    this.retryAfter = retryAfter;
  }
}

/**
 * Error thrown when input validation fails.
 * Contains the field name that failed validation.
 * @class ZaloValidationError
 * @extends ZaloBotError
 * @example
 * try {
 *   await bot.message.sendText(chatId, text);
 * } catch (error) {
 *   if (error instanceof ZaloValidationError) {
 *     console.error('Validation failed on field:', error.field);
 *   }
 * }
 */
class ZaloValidationError extends ZaloBotError {
  /**
   * @param {string} message - Error message
   * @param {string} field - Name of the field that failed validation
   * @param {Object} [details] - Additional validation details
   * @param {Error} [cause] - Original error cause
   */
  constructor(message, field, details, cause) {
    super(message, { details, cause });
    this.name = 'ZaloValidationError';
    /** @type {string} Name of the field that failed validation */
    this.field = field;
  }
}

/**
 * Error thrown when a network request fails (DNS, connection refused, etc.).
 * @class ZaloNetworkError
 * @extends ZaloBotError
 * @example
 * try {
 *   await bot.message.sendText(chatId, text);
 * } catch (error) {
 *   if (error instanceof ZaloNetworkError) {
 *     console.error('Network error:', error.message);
 *   }
 * }
 */
class ZaloNetworkError extends ZaloBotError {
  /**
   * @param {string} message - Error message
   * @param {Object} [details] - Additional network error details
   * @param {Error} [cause] - Original error cause
   */
  constructor(message = 'Network error', details, cause) {
    super(message, { details, cause });
    this.name = 'ZaloNetworkError';
  }
}

/**
 * Error thrown when a request times out.
 * @class ZaloTimeoutError
 * @extends ZaloBotError
 * @example
 * try {
 *   await bot.message.sendText(chatId, text);
 * } catch (error) {
 *   if (error instanceof ZaloTimeoutError) {
 *     console.error('Request timed out');
 *   }
 * }
 */
class ZaloTimeoutError extends ZaloBotError {
  /**
   * @param {string} message - Error message
   * @param {Object} [details] - Additional timeout details
   * @param {Error} [cause] - Original error cause
   */
  constructor(message = 'Request timed out', details, cause) {
    super(message, { details, cause });
    this.name = 'ZaloTimeoutError';
  }
}

module.exports = {
  ZaloBotError,
  ZaloApiError,
  ZaloAuthError,
  ZaloWebhookError,
  ZaloRateLimitError,
  ZaloValidationError,
  ZaloNetworkError,
  ZaloTimeoutError,
};