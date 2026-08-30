/**
 * @author  Hoang Khac Phuc
 * @email   hoangkhacphuc.dev@gmail.com
 * @github  https://github.com/hoangkhacphuc
 */

/**
 * Webhook module - Verify and parse Zalo webhook events
 * Based on Zalo Bot API documentation
 */
const crypto = require('crypto');

class WebhookModule {
  constructor(client, config = {}) {
    this.client = client;
    this.secretKey = config.secretKey || client.secretKey || null;
  }

  /**
   * Verify webhook signature from Zalo
   * @param {string} signature - Signature from X-Zalo-Signature header
   * @param {string} rawBody - Raw request body string
   * @param {string} [secretKey] - Optional override secret key
   * @returns {boolean} True if signature is valid
   * @example
   * const isValid = bot.webhook.verifySignature(
   *   req.headers['x-zalo-signature'],
   *   JSON.stringify(req.body)
   * );
   */
  verifySignature(signature, rawBody, secretKey = null) {
    const key = secretKey || this.secretKey;
    if (!key) {
      throw new Error('Secret key is required for signature verification');
    }
    if (!signature || typeof signature !== 'string') {
      return false;
    }
    if (!rawBody || typeof rawBody !== 'string') {
      return false;
    }
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(rawBody);
    const expectedSignature = hmac.digest('hex');
    // If lengths differ, signatures cannot match — fail fast without timing leak
    if (signature.length !== expectedSignature.length) {
      return false;
    }
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Verify signature and throw if invalid
   * @param {string} signature - Signature from X-Zalo-Signature header
   * @param {string} rawBody - Raw request body string
   * @param {string} [secretKey] - Optional override secret key
   * @throws {Error} If signature is invalid
   */
  requireValidSignature(signature, rawBody, secretKey = null) {
    if (!this.verifySignature(signature, rawBody, secretKey)) {
      throw new Error('Invalid webhook signature');
    }
  }

  /**
   * Parse webhook event payload
   * @param {Object} payload - Parsed webhook body
   * @returns {Object} Normalized event object
   * @property {string} event - Event type (user_text, user_quick_reply, user_follow, etc.)
   * @property {string} userId - Sender user ID
   * @property {string} [messageId] - Message ID (if applicable)
   * @property {Object} [message] - Message content (if applicable)
   * @property {Object} raw - Original payload
   * @example
   * const event = bot.webhook.parseEvent(req.body);
   * if (event.event === 'user_text') {
   *   await bot.message.sendText(event.userId, 'You said: ' + event.message.text);
   * }
   */
  parseEvent(payload) {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid payload: must be an object');
    }
    const eventName = payload.event_name || payload.event || null;
    if (!eventName) {
      throw new Error('Missing event_name field in payload');
    }
    const userId = payload.sender?.id || payload.user_id || null;
    if (!userId) {
      throw new Error('Missing sender/user ID in payload');
    }
    const result = {
      event: eventName,
      userId: userId,
      timestamp: payload.timestamp || Date.now(),
      raw: payload,
    };
    if (eventName === 'user_text' || eventName === 'user_quick_reply') {
      result.messageId = payload.message_id || null;
      result.message = {
        text: payload.message?.text || payload.text || null,
        ...(payload.message?.quick_reply && {
          quickReply: payload.message.quick_reply,
        }),
      };
    }
    if (eventName === 'user_follow') {
      result.follow = {
        action: payload.follow?.action || 'follow',
        ...(payload.follow?.source && { source: payload.follow.source }),
      };
    }
    if (eventName === 'user_unfollow') {
      result.unfollow = true;
    }
    if (eventName === 'message_delivered') {
      result.messageId = payload.message_id || null;
    }
    if (eventName === 'message_read') {
      result.messageId = payload.message_id || null;
    }
    return result;
  }

  /**
   * Create Express.js middleware for webhook handling
   * @param {Object} [options] - Middleware options
   * @param {string} [options.secretKey] - Secret key for signature verification
   * @param {boolean} [options.verifySignature=true] - Whether to verify signature
   * @param {Function} [options.onEvent] - Async event handler function
   * @returns {Function} Express middleware
   * @example
   * app.post('/webhook', bot.webhook.middleware({
   *   async onEvent(event) {
   *     console.log('Received:', event.event);
   *   }
   * }));
   */
  middleware(options = {}) {
    const secretKey = options.secretKey || this.secretKey;
    const verifySig = options.verifySignature !== false;
    const onEvent = options.onEvent || null;
    return async (req, res, next) => {
      try {
        const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        if (verifySig && secretKey) {
          const signature = req.headers['x-zalo-signature'] || '';
          if (!this.verifySignature(signature, rawBody, secretKey)) {
            return res.status(401).json({ error: 'Invalid signature' });
          }
        }
        const event = this.parseEvent(req.body);
        if (onEvent && typeof onEvent === 'function') {
          await onEvent(event, req);
        }
        res.status(200).json({ success: true });
        req.zaloEvent = event;
        next();
      } catch (error) {
        console.error('[Zalo Webhook] Error:', error.message);
        res.status(200).json({ success: true, error: error.message });
      }
    };
  }

  /**
   * Quick webhook handler for simple bots
   * @param {Function} handler - Async function(event) => response
   * @param {Object} [options] - Options passed to middleware
   * @returns {Function} Express middleware
   */
  handle(handler, options = {}) {
    const secretKey = options.secretKey || this.secretKey;
    const verifySig = options.verifySignature !== false;
    return async (req, res) => {
      try {
        const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        if (verifySig && secretKey) {
          const signature = req.headers['x-zalo-signature'] || '';
          if (!this.verifySignature(signature, rawBody, secretKey)) {
            return res.status(401).json({ error: 'Invalid signature' });
          }
        }
        const event = this.parseEvent(req.body);
        await handler(event, req);
        res.status(200).json({ success: true });
      } catch (error) {
        console.error('[Zalo Webhook] Error:', error.message);
        res.status(200).json({ success: true, error: error.message });
      }
    };
  }
}

module.exports = WebhookModule;