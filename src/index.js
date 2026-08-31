/**
 * @author  Hoang Khac Phuc
 * @email   hoangkhacphuc.dev@gmail.com
 * @github  https://github.com/hoangkhacphuc
 */

/**
 * Zalo Bot API SDK - Node.js library for Zalo Bot Platform
 * @module zalo-bot-sdk
 */

const ZaloClient = require('./client');
const ZaloConfig = require('./config');
const MessageModule = require('./modules/message');
const UserModule = require('./modules/user');
const WebhookModule = require('./modules/webhook');
const MediaModule = require('./modules/media');
const {
  ZaloBotError,
  ZaloApiError,
  ZaloAuthError,
  ZaloWebhookError,
  ZaloRateLimitError,
  ZaloValidationError,
  ZaloNetworkError,
  ZaloTimeoutError,
} = require('./errors');

/**
 * All SDK error classes for convenient access.
 * @type {Object}
 */
const Errors = {
  ZaloBotError,
  ZaloApiError,
  ZaloAuthError,
  ZaloWebhookError,
  ZaloRateLimitError,
  ZaloValidationError,
  ZaloNetworkError,
  ZaloTimeoutError,
};

/**
 * Main Zalo Bot class
 * @class ZaloBot
 * @example
 * const bot = new ZaloBot({
 *   botToken: '123456789:abc-xyz',
 *   secretKey: 'your-secret-token',
 * });
 *
 * // Send a message
 * await bot.message.sendText('chat_id', 'Hello!');
 *
 * // Handle webhook
 * app.post('/webhook', bot.webhook.middleware({
 *   async onEvent(event) {
 *     console.log('Received:', event);
 *   }
 * }));
 */
class ZaloBot {
  /**
   * @param {Object|ZaloConfig} config - Configuration options or a ZaloConfig instance
   * @param {string} config.botToken - Zalo Bot Token (required, e.g. "123456789:abc-xyz")
   * @param {string} [config.secretKey] - Secret key for webhook verification (8-256 chars)
   * @param {number} [config.timeout=30000] - Request timeout in ms
   * @param {number} [config.maxRetries=3] - Max retry attempts on rate limit
   * @param {string} [config.baseURL] - Custom base URL (optional)
   */
  constructor(config) {
    // Accept a ZaloConfig instance directly, or build one from a plain object
    if (config instanceof ZaloConfig) {
      this.config = config;
    } else {
      this.config = new ZaloConfig(config);
    }

    // ZaloClient needs the full config including secretKey for webhook support
    this.client = new ZaloClient(this.config.toObject({ includeSecrets: true }));

    // Initialize modules — each receives the shared client
    this.message = new MessageModule(this.client);
    this.user = new UserModule(this.client);
    this.webhook = new WebhookModule({
      secretKey: this.config.secretKey,
    });
    this.media = new MediaModule(this.client);
  }

  /**
   * Update bot token at runtime
   * @param {string} newToken - New bot token
   */
  setBotToken(newToken) {
    this.config.botToken = newToken;
    this.client.updateBotToken(newToken);
  }

  /**
   * Get current configuration as a plain object.
   * By default, sensitive fields (secretKey) are excluded to prevent accidental leakage.
   *
   * @param {Object} [opts] - Options for the output
   * @param {boolean} [opts.includeSecrets=false] - Whether to include secretKey
   * @returns {Object} Plain configuration object
   * @example
   * // Safe — excludes secretKey
   * console.log(bot.getConfig());
   *
   * // Include secrets when needed
   * const full = bot.getConfig({ includeSecrets: true });
   */
  getConfig({ includeSecrets = false } = {}) {
    return this.config.getConfig({ includeSecrets });
  }

  /**
   * Create bot from environment variables.
   * The consuming app is responsible for loading .env before calling this method
   * (e.g. via `require('dotenv').config()` at the entry point).
   *
   * Environment variables used:
   * - `ZALO_BOT_TOKEN` (fallback: `BOT_TOKEN`)
   * - `ZALO_BOT_SECRET` (fallback: `BOT_SECRET`)
   * - `ZALO_BOT_TIMEOUT`
   * - `ZALO_BOT_MAX_RETRIES`
   * - `ZALO_BOT_BASE_URL`
   *
   * @param {Object} [overrides] - Optional overrides that take precedence over env vars
   * @returns {ZaloBot}
   * @throws {Error} If required environment variables are missing or invalid
   * @example
   * // .env: ZALO_BOT_TOKEN=123456789:abc  ZALO_BOT_SECRET=my-secret
   * require('dotenv').config();
   * const bot = ZaloBot.fromEnv();
   */
  static fromEnv(overrides = {}) {
    const config = ZaloConfig.fromEnv(overrides);
    // Pass the ZaloConfig instance directly so secretKey is preserved
    return new ZaloBot(config);
  }
}

// Named exports — all components and error classes
module.exports = {
  // Main class
  ZaloBot,

  // Core modules
  ZaloClient,
  ZaloConfig,
  MessageModule,
  UserModule,
  WebhookModule,
  MediaModule,

  // Error classes (all 8)
  ZaloBotError,
  ZaloApiError,
  ZaloAuthError,
  ZaloWebhookError,
  ZaloRateLimitError,
  ZaloValidationError,
  ZaloNetworkError,
  ZaloTimeoutError,

  // Convenience object grouping all error classes
  Errors,
};

// Default export for convenience (`import ZaloBot from 'zalo-bot-sdk'`)
module.exports.default = ZaloBot;
