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
  ZaloApiError,
  ZaloAuthError,
  ZaloRateLimitError,
} = require('./errors');

/**
 * Main Zalo Bot class
 * @class ZaloBot
 * @example
 * const bot = new ZaloBot({
 *   accessToken: 'your_access_token',
 *   secretKey: 'your_secret_key',
 * });
 * 
 * // Send a message
 * await bot.message.sendText('user_id', 'Hello!');
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
   * @param {Object} config - Configuration options
   * @param {string} config.accessToken - Zalo OA access token (required)
   * @param {string} [config.secretKey] - Secret key for webhook verification
   * @param {number} [config.timeout=30000] - Request timeout in ms
   * @param {number} [config.maxRetries=3] - Max retry attempts on rate limit
   * @param {string} [config.baseURL='https://graph.zalo.me/v2.0'] - API base URL
   */
  constructor(config) {
    const validatedConfig = new ZaloConfig(config);
    this.config = validatedConfig;

    this.client = new ZaloClient(validatedConfig.toObject());

    // Initialize modules
    this.message = new MessageModule(this.client);
    this.user = new UserModule(this.client);
    this.webhook = new WebhookModule(this.client, {
      secretKey: validatedConfig.secretKey,
    });
    this.media = new MediaModule(this.client);

    // Expose errors for convenience
    this.errors = {
      ZaloApiError,
      ZaloAuthError,
      ZaloRateLimitError,
    };
  }

  /**
   * Update access token at runtime
   * @param {string} newToken - New access token
   */
  setAccessToken(newToken) {
    this.config.accessToken = newToken;
    this.client.updateAccessToken(newToken);
  }

  /**
   * Get current configuration
   * @returns {Object} Configuration object
   */
  getConfig() {
    return this.config.toObject();
  }

  /**
   * Create bot from environment variables
   * @returns {ZaloBot}
   */
  static fromEnv() {
    const config = ZaloConfig.fromEnv();
    return new ZaloBot(config.toObject());
  }
}

// Export all components
module.exports = {
  ZaloBot,
  ZaloClient,
  ZaloConfig,
  MessageModule,
  UserModule,
  WebhookModule,
  MediaModule,
  ZaloApiError,
  ZaloAuthError,
  ZaloRateLimitError,
};

// Default export for convenience
module.exports.default = ZaloBot;