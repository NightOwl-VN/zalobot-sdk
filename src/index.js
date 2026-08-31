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
  ZaloApiError,
  ZaloAuthError,
  ZaloRateLimitError,
} = require('./errors');

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
   * @param {Object} config - Configuration options
   * @param {string} config.botToken - Zalo Bot Token (required, e.g. "123456789:abc-xyz")
   * @param {string} [config.secretKey] - Secret key for webhook verification (8-256 chars)
   * @param {number} [config.timeout=30000] - Request timeout in ms
   * @param {number} [config.maxRetries=3] - Max retry attempts on rate limit
   * @param {string} [config.baseURL] - Custom base URL (optional)
   */
  constructor(config) {
    const validatedConfig = new ZaloConfig(config);
    this.config = validatedConfig;

    this.client = new ZaloClient(validatedConfig.toObject());

    // Initialize modules
    this.message = new MessageModule(this.client);
    this.user = new UserModule(this.client);
    this.webhook = new WebhookModule({
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
   * Update bot token at runtime
   * @param {string} newToken - New bot token
   */
  setBotToken(newToken) {
    this.config.botToken = newToken;
    this.client.updateBotToken(newToken);
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

