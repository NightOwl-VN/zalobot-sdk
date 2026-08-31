/**
 * @author  Hoang Khac Phuc
 * @email   hoangkhacphuc.dev@gmail.com
 * @github  https://github.com/hoangkhacphuc
 */

/**
 * Configuration for Zalo Bot SDK.
 * Supports both environment variables and manual configuration.
 * Does NOT auto-load dotenv — the consuming app decides how to load env vars.
 * Reference: https://bot.zapps.me/docs/
 */

/** @type {string} Default API base URL for Zalo Bot Platform */
const DEFAULT_BASE_URL = 'https://bot-api.zaloplatforms.com';

/** @type {number} Default request timeout in milliseconds */
const DEFAULT_TIMEOUT = 30000;

/** @type {number} Default max retry attempts on rate limit */
const DEFAULT_MAX_RETRIES = 3;

class ZaloConfig {
  /**
   * Create a new configuration instance.
   * Options take precedence over environment variables.
   * Uses nullish coalescing (??) so that semantic values like 0 and '' are preserved.
   *
   * @param {Object} [options] - Configuration options (overrides env vars)
   * @param {string} [options.botToken] - Zalo Bot Token (required)
   * @param {string} [options.secretKey] - Secret token for webhook verification
   * @param {number} [options.timeout=30000] - Request timeout in milliseconds (>= 0)
   * @param {number} [options.maxRetries=3] - Max retry attempts on rate limit (>= 0)
   * @param {string} [options.baseURL] - Custom API base URL override
   * @throws {Error} If botToken is missing/invalid or numeric options are out of range
   * @example
   * const config = new ZaloConfig({
   *   botToken: '123456789:abc-xyz',
   *   secretKey: 'my-webhook-secret',
   * });
   */
  constructor(options = {}) {
    /**
     * Zalo Bot Token used for API authentication (embedded in URL path).
     * @type {string|null}
     */
    this.botToken = options.botToken
      ?? process.env.ZALO_BOT_TOKEN
      ?? process.env.BOT_TOKEN
      ?? null;

    /**
     * Secret token used for webhook signature verification.
     * @type {string|null}
     */
    this.secretKey = options.secretKey
      ?? process.env.ZALO_BOT_SECRET
      ?? process.env.BOT_SECRET
      ?? null;

    /**
     * Request timeout in milliseconds.
     * @type {number}
     */
    this.timeout = this._parsePositiveInt(
      options.timeout ?? process.env.ZALO_BOT_TIMEOUT,
      DEFAULT_TIMEOUT,
    );

    /**
     * Maximum number of retry attempts on rate limit errors.
     * @type {number}
     */
    this.maxRetries = this._parsePositiveInt(
      options.maxRetries ?? process.env.ZALO_BOT_MAX_RETRIES,
      DEFAULT_MAX_RETRIES,
    );

    /**
     * API base URL for the Zalo Bot Platform.
     * @type {string}
     */
    this.baseURL = options.baseURL
      ?? process.env.ZALO_BOT_BASE_URL
      ?? DEFAULT_BASE_URL;

    // Validate all configuration values
    this._validate();
  }

  /**
   * Parse a value into a non-negative integer, falling back to a default.
   * Preserves 0 as a valid value (unlike || which treats 0 as falsy).
   *
   * @param {*} value - The value to parse
   * @param {number} defaultValue - Fallback if value is null, undefined, or unparseable
   * @returns {number} The parsed integer or the default
   * @private
   */
  _parsePositiveInt(value, defaultValue) {
    if (value === null || value === undefined) {
      return defaultValue;
    }
    const parsed = parseInt(value, 10);
    return Number.isInteger(parsed) ? parsed : defaultValue;
  }

  /**
   * Validate all configuration values.
   * @throws {Error} If any configuration value is invalid
   * @private
   */
  _validate() {
    if (this.botToken === null || this.botToken === undefined) {
      throw new Error(
        'botToken is required. Create a bot at https://bot.zapps.me/ ' +
        'then set ZALO_BOT_TOKEN environment variable or pass botToken option.',
      );
    }
    if (typeof this.botToken !== 'string' || this.botToken.trim().length === 0) {
      throw new Error('botToken must be a non-empty string');
    }
    if (!Number.isInteger(this.timeout) || this.timeout < 0) {
      throw new Error('timeout must be a non-negative integer');
    }
    if (!Number.isInteger(this.maxRetries) || this.maxRetries < 0) {
      throw new Error('maxRetries must be a non-negative integer');
    }
    if (this.baseURL !== null && this.baseURL !== undefined) {
      try {
        void new URL(this.baseURL);
      } catch {
        throw new Error(`baseURL is not a valid URL: "${this.baseURL}"`);
      }
    }
  }

  /**
   * Get configuration as a plain object.
   * Excludes secretKey by default to prevent accidental secret leakage.
   *
   * @param {Object} [opts] - Options for the output
   * @param {boolean} [opts.includeSecrets=false] - Whether to include secretKey
   * @returns {Object} Plain configuration object with all fields
   * @example
   * // Safe — excludes secretKey
   * const safe = config.toObject();
   *
   * // Includes secretKey (use with caution)
   * const full = config.toObject({ includeSecrets: true });
   */
  toObject({ includeSecrets = false } = {}) {
    const obj = {
      botToken: this.botToken,
      timeout: this.timeout,
      maxRetries: this.maxRetries,
      baseURL: this.baseURL,
    };
    if (includeSecrets) {
      obj.secretKey = this.secretKey;
    }
    return obj;
  }

  /**
   * Get configuration as a safe plain object.
   * Never exposes secretKey unless explicitly requested.
   * This is the recommended method for logging or passing to non-trusted consumers.
   *
   * @param {Object} [opts] - Options for the output
   * @param {boolean} [opts.includeSecrets=false] - Whether to include secretKey (default: false)
   * @returns {Object} Plain configuration object
   * @example
   * // Always safe — secret excluded by default
   * console.log(config.getConfig());
   *
   * // Explicitly include secrets (use with care)
   * console.log(config.getConfig({ includeSecrets: true }));
   */
  getConfig({ includeSecrets = false } = {}) {
    const result = {
      botToken: this.botToken,
      timeout: this.timeout,
      maxRetries: this.maxRetries,
      baseURL: this.baseURL,
    };
    if (includeSecrets) {
      result.secretKey = this.secretKey;
    }
    return result;
  }

  /**
   * Get the actual API base URL for the Zalo Bot Platform.
   * The bot token is NOT leaked in this value — it is returned as a plain base URL.
   *
   * @returns {string} The API base URL (e.g. 'https://bot-api.zaloplatforms.com')
   * @example
   * const url = config.getApiBaseUrl();
   * // 'https://bot-api.zaloplatforms.com'
   */
  getApiBaseUrl() {
    return this.baseURL;
  }

  /**
   * Check if a valid webhook secret key is configured.
   * A secret is considered valid only if it exists and is at least 8 characters.
   *
   * @returns {boolean} True if a valid secret key is configured
   * @example
   * if (config.hasSecretKey()) {
   *   app.use(verifyWebhook(config));
   * }
   */
  hasSecretKey() {
    return typeof this.secretKey === 'string' && this.secretKey.length >= 8;
  }

  /**
   * Create a ZaloConfig instance purely from environment variables.
   * No dotenv loading — process.env must already be populated by the caller.
   *
   * Environment variables checked:
   * - `ZALO_BOT_TOKEN` (fallback: `BOT_TOKEN`)
   * - `ZALO_BOT_SECRET` (fallback: `BOT_SECRET`)
   * - `ZALO_BOT_TIMEOUT`
   * - `ZALO_BOT_MAX_RETRIES`
   * - `ZALO_BOT_BASE_URL`
   *
   * @param {Object} [overrides] - Optional overrides that take precedence over env vars
   * @returns {ZaloConfig} A new configured ZaloConfig instance
   * @throws {Error} If required environment variables are missing or invalid
   * @example
   * // With just env vars (must call dotenv.config() yourself first)
   * const config = ZaloConfig.fromEnv();
   *
   * // With env vars + some overrides
   * const config = ZaloConfig.fromEnv({ timeout: 5000 });
   */
  static fromEnv(overrides = {}) {
    return new ZaloConfig({
      botToken: overrides.botToken
        ?? process.env.ZALO_BOT_TOKEN
        ?? process.env.BOT_TOKEN,
      secretKey: overrides.secretKey
        ?? process.env.ZALO_BOT_SECRET
        ?? process.env.BOT_SECRET,
      timeout: overrides.timeout
        ?? process.env.ZALO_BOT_TIMEOUT,
      maxRetries: overrides.maxRetries
        ?? process.env.ZALO_BOT_MAX_RETRIES,
      baseURL: overrides.baseURL
        ?? process.env.ZALO_BOT_BASE_URL,
    });
  }

  /**
   * Get a string summary of the configuration (without leaking secrets).
   * The bot token is truncated for safety; the secret key is never shown.
   *
   * @returns {string} Human-readable configuration summary
   */
  toString() {
    const tokenPreview = this.botToken
      ? `${this.botToken.substring(0, 6)}...`
      : 'not set';
    return (
      `ZaloConfig(botToken=${tokenPreview}, ` +
      `timeout=${this.timeout}, ` +
      `maxRetries=${this.maxRetries}, ` +
      `baseURL=${this.baseURL})`
    );
  }
}

module.exports = ZaloConfig;
module.exports.DEFAULT_BASE_URL = DEFAULT_BASE_URL;
