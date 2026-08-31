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
const {
  ZaloApiError,
  ZaloAuthError,
  ZaloRateLimitError,
  ZaloNetworkError,
  ZaloTimeoutError,
} = require('./errors');

/** Default retry configuration */
const DEFAULT_RETRY = {
  enabled: true,
  maxRetries: 3,
  baseDelay: 1000,    // 1 second
  maxDelay: 30000,    // 30 seconds
  jitter: true,        // random jitter to avoid thundering herd
};


class ZaloClient {
  /**
   * Create a new Zalo Bot API client
   * @param {Object} config - Client configuration
   * @param {string} config.botToken - Zalo Bot Token (e.g. "123456789:abc-xyz")
   * @param {number} [config.timeout=30000] - Request timeout in milliseconds
   * @param {string} [config.baseURL] - Platform host URL (e.g. "https://bot-api.zaloplatforms.com")
   * @param {number} [config.maxRetries=3] - Legacy: max retry attempts (use retry.maxRetries instead)
   * @param {Object} [config.retry] - Retry configuration
   * @param {boolean} [config.retry.enabled=true] - Enable/disable retries
   * @param {number} [config.retry.maxRetries=3] - Maximum retry attempts
   * @param {number} [config.retry.baseDelay=1000] - Base delay in ms for exponential backoff
   * @param {number} [config.retry.maxDelay=30000] - Maximum delay cap in ms
   * @param {boolean} [config.retry.jitter=true] - Add random jitter to backoff delays
   * @example
   * const client = new ZaloClient({
   *   botToken: '123456789:abc-xyz',
   *   retry: { enabled: true, maxRetries: 5, baseDelay: 500 },
   * });
   */
  constructor(config) {
    if (!config || !config.botToken) {
      throw new ZaloAuthError('botToken is required — get it from Zalo Bot Creator after creating a bot');
    }

    this.botToken = config.botToken;
    this.timeout = config.timeout ?? 30000;

    // apiBaseURL = platform host (e.g. "https://bot-api.zaloplatforms.com")
    // requestBaseURL = full URL used for all requests (apiBaseURL + /bot{token})
    this.apiBaseURL = (config.baseURL || 'https://bot-api.zaloplatforms.com').replace(/\/+$/, '');
    this.requestBaseURL = `${this.apiBaseURL}/bot${this.botToken}`;

    // Merge retry config: explicit retry object wins, else derive from legacy maxRetries
    this.retry = {
      ...DEFAULT_RETRY,
      maxRetries: config.maxRetries ?? DEFAULT_RETRY.maxRetries,
      ...(config.retry || {}),
    };

    this._axios = axios.create({
      baseURL: this.requestBaseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // NO response interceptor — 429 bubbles as AxiosError and _request handles retry
  }

  // ─────────────────────────────────────────────
  //  Public API
  // ─────────────────────────────────────────────

  /**
   * Make a GET request to the Zalo Bot API
   * @param {string} method - API method name (e.g. 'getMe')
   * @param {Object} [params] - Query parameters
   * @returns {Promise<Object>} API response data
   */
  async get(method, params = {}) {
    return this._request('GET', method, { params });
  }

  /**
   * Make a POST request to the Zalo Bot API
   * @param {string} method - API method name (e.g. 'sendMessage')
   * @param {Object} [data] - Request body
   * @returns {Promise<Object>} API response data
   */
  async post(method, data = {}) {
    return this._request('POST', method, { data });
  }

  /**
   * Upload a file via multipart/form-data POST
   * @param {string} method - API method/endpoint (e.g. 'me/media/images')
   * @param {Object} form - FormData instance with getHeaders() support
   * @param {Object} [options] - Extra axios request options (headers, etc.)
   * @returns {Promise<Object>} API response data
   * @example
   * const FormData = require('form-data');
   * const form = new FormData();
   * form.append('file', fileStream, { filename: 'photo.jpg' });
   * const result = await client.upload('me/media/images', form);
   */
  async upload(method, form, options = {}) {
    const headers = form.getHeaders ? form.getHeaders() : {};
    return this._request('POST', method, {
      data: form,
      headers,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      ...options,
    });
  }

  /**
   * Download binary content from a URL (streaming)
   * @param {string} url - Full URL or relative path
   * @param {Object} [options] - Extra axios request options
   * @param {Object} [options.headers] - Additional headers
   * @param {number} [options.timeout] - Override timeout for this request
   * @returns {Promise<import('stream').Readable>} Response data stream
   * @example
   * const stream = await client.download('https://example.com/file.bin');
   * const writer = fs.createWriteStream('/local/path');
   * stream.pipe(writer);
   */
  async download(url, options = {}) {
    const response = await this._rawRequest({
      method: 'GET',
      url,
      responseType: 'stream',
      ...options,
    });
    return response.data;
  }

  /**
   * Update bot token at runtime
   * @param {string} newToken - New bot token
   */
  updateBotToken(newToken) {
    if (typeof newToken !== 'string' || newToken.trim() === '') {
      throw new ZaloAuthError('Invalid bot token — must be a non-empty string');
    }
    this.botToken = newToken.trim();
    this.requestBaseURL = `${this.apiBaseURL}/bot${newToken}`;
    this._axios.defaults.baseURL = this.requestBaseURL;
  }

  /**
   * Get current client configuration (safe — excludes secrets)
   * @returns {Object} Configuration snapshot
   */
  getConfig() {
    const maskedToken = this.botToken ? `${this.botToken.substring(0, 6)}...` : null;
    return {
      botToken: maskedToken,
      timeout: this.timeout,
      apiBaseURL: this.apiBaseURL,
      requestBaseURL: maskedToken ? `${this.apiBaseURL}/bot${maskedToken}` : this.apiBaseURL,
      retry: { ...this.retry },
    };
  }

  // ─────────────────────────────────────────────
  //  Core request with retry
  // ─────────────────────────────────────────────

  /**
   * Core request method with exponential backoff + jitter retry.
   * 429 responses are retried; auth (401) and validation (4xx) errors are not.
   *
   * @param {string} method - HTTP method
   * @param {string} methodName - API method/endpoint
   * @param {Object} [options] - Axios request options
   * @returns {Promise<Object>} Parsed API response data
   * @private
   */
  async _request(method, methodName, options = {}) {
    const maxAttempts = this.retry.enabled ? this.retry.maxRetries + 1 : 1;
    let lastError;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await this._rawRequest({
          method,
          url: `/${methodName}`,
          ...options,
        });

        // Check API-level error in response body (200 with ok:false)
        if (response.data && response.data.ok === false) {
          throw this._createApiError(
            response.data.error_code || -1,
            response.data.description || 'Unknown error',
            response.data,
          );
        }

        return response.data;
      } catch (error) {
        lastError = error;

        // Only retry on 429 rate-limit
        if (!this._isRetryable(error)) {
          break;
        }

        // Don't retry if we've exhausted attempts
        if (attempt >= maxAttempts - 1) {
          break;
        }

        const delay = this._calculateRetryDelay(attempt, error);
        await this._delay(delay);
      }
    }

    throw this._classifyError(lastError);
  }

  /**
   * Raw axios request — no retry, no error transformation
   * @param {Object} config - Axios request config
   * @returns {Promise<import('axios').AxiosResponse>}
   * @private
   */
  async _rawRequest(config) {
    return this._axios.request(config);
  }

  // ─────────────────────────────────────────────
  //  Retry helpers
  // ─────────────────────────────────────────────

  /**
   * Determine if an error is eligible for retry.
   * Only 429 rate-limit errors are retried.
   * @param {Error} error
   * @returns {boolean}
   * @private
   */
  _isRetryable(error) {
    if (error instanceof ZaloRateLimitError) {
      return true;
    }
    if (!error.response) return false;
    return error.response.status === 429;
  }

  /**
   * Calculate retry delay with exponential backoff + optional jitter.
   * Respects Retry-After header when present (server instruction takes precedence).
   *
   * @param {number} attempt - Current attempt (0-indexed)
   * @param {Error} error - The error that triggered retry
   * @returns {number} Delay in milliseconds
   * @private
   */
  _calculateRetryDelay(attempt, error) {
    const { baseDelay, maxDelay, jitter } = this.retry;

    // Prefer Retry-After header from the server (takes precedence even over maxDelay)
    let retryAfter = 0;
    if (error.response && error.response.headers) {
      const header = error.response.headers['retry-after'];
      if (header) {
        const parsed = parseInt(header, 10);
        if (Number.isFinite(parsed) && parsed > 0) {
          retryAfter = parsed * 1000; // convert seconds to ms
        }
      }
    }

    // Exponential backoff: baseDelay * 2^attempt
    const backoff = baseDelay * Math.pow(2, attempt);

    // Add jitter: random value between 0 and baseDelay
    const jitterMs = jitter ? Math.floor(Math.random() * baseDelay) : 0;

    // Server Retry-After takes precedence (bypasses maxDelay — server knows best)
    if (retryAfter > 0) {
      return retryAfter;
    }

    // Computed backoff + jitter, capped at maxDelay
    return Math.min(backoff + jitterMs, maxDelay);
  }

  /**
   * Promise-based delay
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise<void>}
   * @private
   */
  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ─────────────────────────────────────────────
  //  Error classification
  // ─────────────────────────────────────────────

  /**
   * Create an appropriate API error from response body data.
   * Error constructors use positional args: (message, code, status, details, cause)
   *
   * @param {number} code - Error code from API
   * @param {string} message - Error message from API
   * @param {*} fullResponse - Full response body
   * @returns {ZaloApiError|ZaloRateLimitError}
   * @private
   */
  _createApiError(code, message, fullResponse) {
    if (code === 429) {
      return new ZaloRateLimitError(message, 429, null, fullResponse);
    }
    return new ZaloApiError(message, code, null, fullResponse);
  }

  /**
   * Classify an axios error into the appropriate Zalo error type.
   * This is the single point of error translation — called after retries are exhausted.
   *
   * Error constructors use positional args:
   *   ZaloApiError(message, code, status, details, cause)
   *   ZaloAuthError(message, status, details, cause)
   *   ZaloRateLimitError(message, status, retryAfter, details, cause)
   *   ZaloNetworkError(message, details, cause)
   *   ZaloTimeoutError(message, details, cause)
   *
   * @param {Error} error - Axios error or Zalo error
   * @returns {import('./errors').ZaloBotError} Classified SDK error
   * @private
   */
  _classifyError(error) {
    // Already a Zalo error from _createApiError — pass through
    if (error instanceof ZaloApiError || error instanceof ZaloRateLimitError) {
      return error;
    }

    // Axios HTTP error (has response)
    if (error.response) {
      const { status, data, headers } = error.response;

      // 401 — auth error, never retry
      if (status === 401) {
        return new ZaloAuthError('Invalid or expired bot token', status, data);
      }

      // 429 — rate limit (retries exhausted)
      if (status === 429) {
        const retryAfter = this._parseRetryAfter(headers);
        return new ZaloRateLimitError('Rate limit exceeded', 429, retryAfter, data);
      }

      // All other HTTP errors — wrap as ZaloApiError
      const description = data && data.description
        ? data.description
        : `Request failed with status ${status}`;
      const errorCode = data && data.error_code ? data.error_code : undefined;
      return new ZaloApiError(description, errorCode, status, data);
    }

    // Timeout
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      return new ZaloTimeoutError(
        `Request timed out after ${this.timeout}ms`,
        { timeout: this.timeout, originalMessage: error.message },
        error,
      );
    }

    // Network error (no response received)
    if (error.request) {
      return new ZaloNetworkError(
        error.message || 'Network request failed',
        { code: error.code, originalMessage: error.message },
        error,
      );
    }

    // Unknown — wrap as generic
    return new ZaloApiError(error.message || 'Unknown error', undefined, undefined, error);
  }

  /**
   * Parse Retry-After header value (seconds)
   * @param {Object} headers - Response headers
   * @returns {number|null} Seconds, or null if not present/invalid
   * @private
   */
  _parseRetryAfter(headers) {
    if (!headers) return null;
    const val = headers['retry-after'];
    if (!val) return null;
    const n = parseInt(val, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
}

module.exports = ZaloClient;
