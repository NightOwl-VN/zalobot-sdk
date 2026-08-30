/**
 * Core HTTP client for Zalo Bot API
 * Handles authentication, request retries, and error handling
 */

const axios = require('axios');
const { ZaloApiError, ZaloAuthError, ZaloRateLimitError } = require('./errors');

class ZaloClient {
  /**
   * Create a new Zalo API client
   * @param {Object} config - Client configuration
   * @param {string} config.accessToken - Zalo OA access token
   * @param {string} [config.secretKey] - Secret key for webhook signature verification
   * @param {number} [config.timeout=30000] - Request timeout in milliseconds
   * @param {number} [config.maxRetries=3] - Maximum retry attempts on rate limit
   * @param {string} [config.baseURL='https://graph.zalo.me/v2.0'] - API base URL
   */
  constructor(config) {
    if (!config || !config.accessToken) {
      throw new ZaloAuthError('Access token is required');
    }

    this.accessToken = config.accessToken;
    this.secretKey = config.secretKey || null;
    this.timeout = config.timeout || 30000;
    this.maxRetries = config.maxRetries || 3;
    this.baseURL = config.baseURL || 'https://graph.zalo.me/v2.0';

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'access_token': this.accessToken,
      },
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => this._handleError(error)
    );
  }

  /**
   * Make a GET request to the Zalo API
   * @param {string} endpoint - API endpoint (e.g., '/me')
   * @param {Object} params - Query parameters
   * @param {number} [retryCount=0] - Current retry attempt
   * @returns {Promise<Object>} API response data
   */
  async get(endpoint, params = {}, retryCount = 0) {
    return this._request('GET', endpoint, { params }, retryCount);
  }

  /**
   * Make a POST request to the Zalo API
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @param {number} [retryCount=0] - Current retry attempt
   * @returns {Promise<Object>} API response data
   */
  async post(endpoint, data = {}, retryCount = 0) {
    return this._request('POST', endpoint, { data }, retryCount);
  }

  /**
   * Make a PUT request to the Zalo API
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @param {number} [retryCount=0] - Current retry attempt
   * @returns {Promise<Object>} API response data
   */
  async put(endpoint, data = {}, retryCount = 0) {
    return this._request('PUT', endpoint, { data }, retryCount);
  }

  /**
   * Make a DELETE request to the Zalo API
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @param {number} [retryCount=0] - Current retry attempt
   * @returns {Promise<Object>} API response data
   */
  async delete(endpoint, params = {}, retryCount = 0) {
    return this._request('DELETE', endpoint, { params }, retryCount);
  }

  /**
   * Core request method with retry logic
   * @private
   */
  async _request(method, endpoint, options = {}, retryCount = 0) {
    try {
      const response = await this.client.request({
        method,
        url: endpoint,
        ...options,
      });

      // Check for API error response
      if (response.data && response.data.error) {
        throw this._createApiError(response.data.error, response.data);
      }

      return response.data;
    } catch (error) {
      // Handle rate limiting with retry
      if (error.response && error.response.status === 429 && retryCount < this.maxRetries) {
        const retryAfter = parseInt(error.response.headers['retry-after'] || '60', 10);
        await this._delay(retryAfter * 1000);
        return this._request(method, endpoint, options, retryCount + 1);
      }

      // Handle authentication errors
      if (error.response && error.response.status === 401) {
        throw new ZaloAuthError('Invalid or expired access token');
      }

      // Re-throw with additional context
      if (error.response && error.response.data) {
        const apiError = this._createApiError(error.response.data, error.response.data);
        throw apiError;
      }

      throw error;
    }
  }

  /**
   * Create an appropriate API error from response
   * @private
   */
  _createApiError(data, fullResponse) {
    const errorCode = data.error || data.code || 500;
    const message = data.message || data.error_message || 'Unknown API error';

    if (errorCode === 429) {
      return new ZaloRateLimitError(message, errorCode, fullResponse);
    }

    return new ZaloApiError(message, errorCode, fullResponse);
  }

  /**
   * Handle axios error and convert to appropriate Zalo error
   * @private
   */
  _handleError(error) {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        throw new ZaloAuthError('Invalid or expired access token');
      }

      if (status === 429) {
        const retryAfter = parseInt(error.response.headers['retry-after'] || '60', 10);
        throw new ZaloRateLimitError('Rate limit exceeded', 429, { retryAfter });
      }

      if (data && data.error) {
        throw this._createApiError(data.error, data);
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
   * Update access token at runtime
   * @param {string} newToken - New access token
   */
  updateAccessToken(newToken) {
    this.accessToken = newToken;
    this.client.defaults.headers['access_token'] = newToken;
  }
}

module.exports = ZaloClient;