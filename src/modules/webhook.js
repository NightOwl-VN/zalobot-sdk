/**
 * @author  Hoang Khac Phuc
 * @email   hoangkhacphuc.dev@gmail.com
 * @github  https://github.com/hoangkhacphuc
 */

/**
 * Webhook module - Parse and verify Zalo Bot webhook events
 * Authentication: X-Bot-Api-Secret-Token header (plain comparison, NOT HMAC)
 * Reference: https://bot.zapps.me/docs/webhook/
 */

class WebhookModule {
  /**
   * @param {Object} config - Webhook configuration
   * @param {string} [config.secretKey] - Secret token set via setWebhook
   */
  constructor(config = {}) {
    this.secretKey = config.secretKey || null;
  }

  /**
   * Verify webhook request using X-Bot-Api-Secret-Token header
   * Zalo Bot sends this header with every webhook request — compare it directly
   * against the secret token you configured via setWebhook.
   * @param {Object} req - Express request object (or any object with headers)
   * @returns {boolean} True if token matches
   * @example
   * app.post('/webhook', (req, res) => {
   *   if (!bot.webhook.verify(req)) {
   *     return res.status(403).json({ message: 'Unauthorized' });
   *   }
   *   // process webhook...
   * });
   */
  verify(req) {
    if (!this.secretKey) {
      // No secret configured — skip verification
      return true;
    }
    const token = req.headers && req.headers['x-bot-api-secret-token'];
    if (!token || typeof token !== 'string') {
      return false;
    }
    // Use timing-safe comparison to prevent timing attacks
    if (token.length !== this.secretKey.length) {
      return false;
    }
    const crypto = require('crypto');
    return crypto.timingSafeEqual(
      Buffer.from(token, 'utf8'),
      Buffer.from(this.secretKey, 'utf8')
    );
  }

  /**
   * Verify and throw if invalid
   * @param {Object} req - Express request object
   * @throws {Error} If verification fails
   */
  requireValid(req) {
    if (!this.verify(req)) {
      throw new Error('Invalid webhook secret token');
    }
  }

  /**
   * Parse webhook event payload
   * Zalo Bot webhook sends: { ok: true, result: { event_name, message: { from, chat, text, ... } } }
   * Reference: https://bot.zapps.me/docs/webhook/
   * @param {Object} payload - Parsed webhook body
   * @returns {Object} Normalized event object
   * @property {string} event - Event type (user_text, user_image, user_sticker, user_voice, etc.)
   * @property {string} userId - Sender user ID (message.from.id)
   * @property {string} chatId - Chat ID (message.chat.id)
   * @property {string} [messageId] - Message ID
   * @property {Object} [message] - Message content (text, photo, sticker, voice, etc.)
   * @property {Object} raw - Original payload
   * @example
   * const event = bot.webhook.parseEvent(req.body);
   * if (event.event === 'user_text') {
   *   await bot.message.sendText(event.chatId, `You said: ${event.message.text}`);
   * }
   */
  parseEvent(payload) {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid payload: must be an object');
    }

    const eventName = payload.event_name
      || (payload.result && payload.result.event_name)
      || null;
    if (!eventName) {
      throw new Error('Missing event_name field in payload');
    }

    // Extract message from result wrapper or flat payload
    const result = payload.result || payload;
    const msg = result.message || null;

    // Zalo Bot API: userId from message.from.id, chatId from message.chat.id
    const userId = msg && msg.from ? msg.from.id : null;
    const chatId = msg && msg.chat ? msg.chat.id : userId;
    if (!userId) {
      throw new Error('Missing sender user ID in payload');
    }

    // Normalize event names
    const eventMap = {
      'message.text.received': 'user_text',
      'message.image.received': 'user_image',
      'message.sticker.received': 'user_sticker',
      'message.voice.received': 'user_voice',
      'message.unsupported.received': 'user_unsupported',
      'user.follow': 'user_follow',
      'user.unfollow': 'user_unfollow',
    };
    const normalizedEvent = eventMap[eventName] || eventName;

    const event = {
      event: normalizedEvent,
      userId,
      chatId,
      messageId: msg ? msg.message_id || null : null,
      timestamp: msg ? msg.date || Date.now() : Date.now(),
      raw: payload,
    };

    // Attach message content based on type
    if (msg) {
      switch (normalizedEvent) {
        case 'user_text':
          event.message = { text: msg.text || null };
          break;
        case 'user_image':
          event.message = { photo: msg.photo || null, caption: msg.caption || null };
          break;
        case 'user_sticker':
          event.message = { sticker: msg.sticker || null };
          break;
        case 'user_voice':
          event.message = { voiceUrl: msg.voice_url || null };
          break;
        default:
          event.message = msg;
          break;
      }
    }

    return event;
  }

  /**
   * Create Express.js middleware for webhook handling
   * @param {Object} [options] - Middleware options
   * @param {Function} [options.onEvent] - Async event handler function(event, req)
   * @returns {Function} Express middleware
   * @example
   * app.post('/webhook', bot.webhook.middleware({
   *   async onEvent(event, req) {
   *     if (event.event === 'user_text') {
   *       await bot.message.sendText(event.chatId, 'Hello!');
   *     }
   *   }
   * }));
   */
  middleware(options = {}) {
    const onEvent = options.onEvent || null;
    return async (req, res) => {
      // Verify secret token
      if (!this.verify(req)) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      try {
        const event = this.parseEvent(req.body);

        if (onEvent && typeof onEvent === 'function') {
          await onEvent(event, req);
        }

        res.status(200).json({ message: 'Success' });
      } catch (error) {
        console.error('[Zalo Webhook] Error:', error.message);
        // Always return 200 to Zalo — errors should be logged, not returned
        res.status(200).json({ message: 'Success' });
      }
    };
  }

  /**
   * Quick webhook handler for simple bots
   * @param {Function} handler - Async function(event) => void
   * @returns {Function} Express middleware
   */
  handle(handler) {
    return async (req, res) => {
      if (!this.verify(req)) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      try {
        const event = this.parseEvent(req.body);
        await handler(event);
        res.status(200).json({ message: 'Success' });
      } catch (error) {
        console.error('[Zalo Webhook] Error:', error.message);
        res.status(200).json({ message: 'Success' });
      }
    };
  }
}

module.exports = WebhookModule;
