/**
 * @author  Hoang Khac Phuc
 * @email   hoangkhacphuc.dev@gmail.com
 * @github  https://github.com/hoangkhacphuc
 */

/**
 * Core HTTP client for Zalo Bot API
 * Handles authentication, request retries, and error handling
 * API Base URL: https://bot-api.zaloplatforms.com/bot{BOT_TOKEN}/{method}
 * Authentication: Bot Token embedded in URL path (NOT in headers)
 * Reference: https://bot.zapps.me/docs/
 */

const axios = require('axios');
const { ZaloApiError, ZaloAuthError, ZaloRateLimitError } = require('./errors');

class ZaloClient {
  /**
   * Create a new Zalo Bot API client
   * @param {Object} config - Client configuration
   * @param {string} config.botToken - Zalo Bot Token (e.g. "123456789:abc-xyz")
   * @param {string} [config.secretKey] - Secret token for webhook verification
   * @param {number} [config.timeout=30000] - Request timeout in milliseconds
   * @param {number} [config.maxRetries=3] - Maximum retry attempts on rate limit
   * @example
   * const client = new ZaloClient({
   *   botToken: '123456789:abc-xyz',
   *   secretKey: 'my-secret-token',
   * });
   */
  constructor(config) {
    if (!config || !config.botToken) {
      throw new ZaloAuthError('botToken is required — get it from Zalo Bot Creator after creating a bot');
    }

    this.botToken = config.botToken;
    this.secretKey = config.secretKey || null;
    this.timeout = config.timeout || 30000;
    this.maxRetries = config.maxRetries || 3;
    this.baseURL = config.baseURL || `https://bot-api.zaloplatforms.com/bot${this.botToken}`;

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => this._handleError(error)
    );
  }

  /**
   * Make a GET request to the Zalo Bot API
   * @param {string} method - API method name (e.g. 'getMe')
   * @param {Object} [params] - Query parameters
   * @param {number} [retryCount=0] - Current retry attempt
   * @returns {Promise<Object>} API response data
   */
  async get(method, params = {}, retryCount = 0) {
    return this._request('GET', method, { params }, retryCount);
  }

  /**
   * Make a POST request to the Zalo Bot API
   * @param {string} method - API method name (e.g. 'sendMessage')
   * @param {Object} [data] - Request body
   * @param {number} [retryCount=0] - Current retry attempt
   * @returns {Promise<Object>} API response data
   */
  async post(method, data = {}, retryCount = 0) {
    return this._request('POST', method, { data }, retryCount);
  }

  /**
   * Core request method with retry logic
   * @private
   */
  async _request(method, methodName, options = {}, retryCount = 0) {
    try {
      const response = await this.client.request({
        method,
        url: `/${methodName}`,
        ...options,
      });

      // Check API error response
      if (response.data && response.data.ok === false) {
        throw this._createApiError(
          response.data.error_code || -1,
          response.data.description || 'Unknown error',
          response.data
        );
      }

      return response.data;
    } catch (error) {
      // Handle rate limiting with retry
      if (error.response && error.response.status === 429 && retryCount < this.maxRetries) {
        const retryAfter = parseInt(error.response.headers['retry-after'] || '60', 10);
        await this._delay(retryAfter * 1000);
        return this._request(method, methodName, options, retryCount + 1);
      }

      // Handle authentication errors
      if (error.response && error.response.status === 401) {
        throw new ZaloAuthError('Invalid or expired bot token');
      }

      // Re-throw with additional context
      if (error.response && error.response.data) {
        const data = error.response.data;
        if (data.ok === false) {
          throw this._createApiError(
            data.error_code || -1,
            data.description || 'Unknown error',
            data
          );
        }
      }

      throw error;
    }
  }

  /**
   * Create an appropriate API error from response
   * @private
   */
  _createApiError(code, message, fullResponse) {
    if (code === 429) {
      return new ZaloRateLimitError(message, code, fullResponse);
    }
    return new ZaloApiError(message, code, fullResponse);
  }

  /**
   * Handle axios error and convert to appropriate Zalo error
   * @private
   */
  _handleError(error) {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        throw new ZaloAuthError('Invalid or expired bot token');
      }

      if (status === 429) {
        const retryAfter = parseInt(error.response.headers['retry-after'] || '60', 10);
        throw new ZaloRateLimitError('Rate limit exceeded', 429, { retryAfter });
      }

      if (data && data.ok === false) {
        throw this._createApiError(
          data.error_code || -1,
          data.description || 'Unknown error',
          data
        );
      }
    }

    throw error;
  }

  /**
   * Utility delay for retry backoff
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update bot token at runtime
   * @param {string} newToken - New bot token
   */
  updateBotToken(newToken) {
    this.botToken = newToken;
    this.baseURL = `https://bot-api.zaloplatforms.com/bot${newToken}`;
    this.client.defaults.baseURL = this.baseURL;
  }
}

module.exports = ZaloClient;
