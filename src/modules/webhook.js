/**
 * @author  Hoang Khac Phuc
 * @email   hoangkhacphuc.dev@gmail.com
 * @github  https://github.com/hoangkhacphuc
 */

/**
 * Webhook module - Parse and verify Zalo Bot webhook events
 * Authentication: X-Bot-Api-Secret-Token header (timing-safe comparison)
 * Reference: https://bot.zapps.me/docs/webhook/
 */

const crypto = require('crypto');
const { ZaloWebhookError } = require('../errors');

/** Event name normalization map: Zalo raw event names → short canonical form */
const EVENT_MAP = Object.freeze({
  'message.text.received': 'user_text',
  'message.image.received': 'user_image',
  'message.sticker.received': 'user_sticker',
  'message.voice.received': 'user_voice',
  'message.unsupported.received': 'user_unsupported',
  'user.follow': 'user_follow',
  'user.unfollow': 'user_unfollow',
});

class WebhookModule {
  /**
   * @param {Object} config - Webhook configuration
   * @param {string} [config.secretKey] - Secret token set via setWebhook
   * @param {boolean} [config.requireSecret=true] - Require secret token verification
   */
  constructor(config = {}) {
    this.secretKey = config.secretKey || null;
    this.requireSecret = config.requireSecret !== false; // default: true
  }

  /**
   * Verify webhook request using X-Bot-Api-Secret-Token header.
   * Uses timing-safe comparison to prevent timing attacks.
   * @param {Object} req - Express request object (or any object with headers)
   * @returns {boolean} True if token matches
   */
  verify(req) {
    if (!this.secretKey) {
      return !this.requireSecret;
    }

    const token = req.headers && req.headers['x-bot-api-secret-token'];
    if (!token || typeof token !== 'string') {
      return !this.requireSecret;
    }

    const a = Buffer.from(token, 'utf8');
    const b = Buffer.from(this.secretKey, 'utf8');
    if (a.length !== b.length) {
      return !this.requireSecret;
    }

    return crypto.timingSafeEqual(a, b);
  }

  /**
   * Verify and throw ZaloWebhookError if invalid
   * @param {Object} req - Express request object
   * @throws {ZaloWebhookError} If verification fails
   */
  requireValid(req) {
    if (!this.verify(req)) {
      throw new ZaloWebhookError('Invalid webhook secret token', 403);
    }
  }

  /**
   * Parse webhook event payload.
   * Supports both wrapped { ok, result: { event_name, message } }
   * and flat payload { event_name, message, ... }.
   * @param {Object} payload - Parsed webhook body
   * @returns {Object} Normalized event: { event, eventName, userId, chatId, messageId, timestamp, message, raw }
   */
  parseEvent(payload) {
    if (!payload || typeof payload !== 'object') {
      throw new ZaloWebhookError('Invalid payload: expected an object', 400);
    }

    const result = payload.result && typeof payload.result === 'object'
      ? payload.result
      : payload;

    const eventName = result.event_name || null;
    if (!eventName) {
      throw new ZaloWebhookError('Missing event_name field in payload', 400);
    }

    const msg = result.message || null;

    // Event parser safety: for events that don't have message.from.id
    // (like user.follow), set userId to null instead of throwing
    let userId = null;
    let chatId = null;
    if (msg && msg.from && msg.from.id !== undefined) {
      userId = msg.from.id;
      chatId = msg.chat ? msg.chat.id : userId;
    } else if (msg && msg.id !== undefined) {
      // Alternative field for events like user.follow
      userId = msg.id;
      chatId = userId;
    }

    const normalizedEvent = EVENT_MAP[eventName] || eventName;

    const event = {
      event: normalizedEvent,
      eventName,
      userId,
      chatId,
      messageId: msg ? (msg.message_id || null) : null,
      timestamp: msg ? (msg.date || Date.now()) : Date.now(),
      raw: payload,
    };

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
   * Create Express.js middleware for webhook handling.
   * @param {Object} [options]
   * @param {Function} [options.onEvent] - Async handler: async (event, req, res) => void
   * @param {Function} [options.onError] - Error handler: async (error, event, req) => void
   * @param {boolean} [options.acknowledgeImmediately=false] - Respond 200 before running handler
   * @returns {Function} Express middleware
   */
  middleware(options = {}) {
    const onEvent = options.onEvent || null;
    const onError = options.onError || null;
    const acknowledgeImmediately = !!options.acknowledgeImmediately;

    return async (req, res) => {
      if (!this.verify(req)) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      let event;
      try {
        event = this.parseEvent(req.body);
      } catch (error) {
        const status = error.status || 500;
        console.error('[Zalo Webhook] Malformed payload:', error.message);
        return res.status(status).json({ message: error.message });
      }

      // Acknowledge behavior:
      // When acknowledgeImmediately=true, send 200 BEFORE running handler
      // When false (default), send 200 AFTER handler completes
      // Always check res.headersSent before sending
      if (acknowledgeImmediately && !res.headersSent) {
        res.status(200).json({ message: 'Success' });
      }

      if (onEvent && typeof onEvent === 'function') {
        try {
          await onEvent(event, req, res);
        } catch (error) {
          // onError callback: when handler throws, call onError if provided,
          // otherwise log to console.error
          if (typeof onError === 'function') {
            try {
              onError(error, event, req);
            } catch (e) {
              console.error('[Zalo Webhook] onError handler failed:', e.message);
            }
          } else {
            console.error('[Zalo Webhook] Handler error:', error.message);
          }

          // Handler failure:
          // If handler throws AND acknowledgeImmediately=true (ACK already sent), don't send another response
          // If acknowledgeImmediately=false, send 500 on handler failure
          if (!acknowledgeImmediately && !res.headersSent) {
            res.status(500).json({ message: 'Internal Server Error' });
          }
        }
      }

      // Send 200 AFTER handler completes (when acknowledgeImmediately=false)
      if (!acknowledgeImmediately && !res.headersSent) {
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
    return this.middleware({ onEvent: handler });
  }
}

module.exports = WebhookModule;
module.exports.EVENT_MAP = EVENT_MAP;