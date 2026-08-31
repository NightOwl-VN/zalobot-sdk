/**
 * @author  Hoang Khac Phuc
 * @email   hoangkhacphuc.dev@gmail.com
 * @github  https://github.com/hoangkhacphuc
 */

/**
 * Unit tests for WebhookModule
 * Tests: token verification, event parsing, middleware
 * @module tests/modules/webhook
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const WebhookModule = require('../../src/modules/webhook');

describe('WebhookModule', () => {
  let webhookModule;
  const SECRET_KEY = 'my-secret-key-for-testing';

  /**
   * Initialize WebhookModule with a secret key
   */
  beforeEach(() => {
    webhookModule = new WebhookModule({ secretKey: SECRET_KEY });
  });

  // ── verify ────────────────────────────────────────

  describe('verify()', () => {
    /**
     * Test: Valid token returns true
     */
    it('should return true for valid token', () => {
      const req = {
        headers: { 'x-bot-api-secret-token': SECRET_KEY },
      };
      const result = webhookModule.verify(req);
      assert.equal(result, true);
    });

    /**
     * Test: Invalid token returns false
     */
    it('should return false for invalid token', () => {
      const req = {
        headers: { 'x-bot-api-secret-token': 'wrong_token' },
      };
      const result = webhookModule.verify(req);
      assert.equal(result, false);
    });

    /**
     * Test: Returns true when no secret key is configured
     */
    it('should return true when no secret key is configured', () => {
      const noKeyModule = new WebhookModule({});
      const req = { headers: {} };
      assert.equal(noKeyModule.verify(req), true);
    });

    /**
     * Test: Returns false when token header is missing
     */
    it('should return false when token header is missing', () => {
      const req = { headers: {} };
      const result = webhookModule.verify(req);
      assert.equal(result, false);
    });

    /**
     * Test: Returns false when token is empty string
     */
    it('should return false when token is empty string', () => {
      const req = { headers: { 'x-bot-api-secret-token': '' } };
      const result = webhookModule.verify(req);
      assert.equal(result, false);
    });
  });

  // ── requireValid ──────────────────────────────────

  describe('requireValid()', () => {
    /**
     * Test: Does not throw for valid token
     */
    it('should not throw for valid token', () => {
      const req = { headers: { 'x-bot-api-secret-token': SECRET_KEY } };
      assert.doesNotThrow(() => webhookModule.requireValid(req));
    });

    /**
     * Test: Throws for invalid token
     */
    it('should throw for invalid token', () => {
      const req = { headers: { 'x-bot-api-secret-token': 'wrong' } };
      assert.throws(
        () => webhookModule.requireValid(req),
        /Invalid webhook secret token/
      );
    });
  });

  // ── parseEvent ────────────────────────────────────

  describe('parseEvent()', () => {
    /**
     * Test: Parse Zalo Bot message.text.received event
     */
    it('should parse message.text.received event correctly', () => {
      const payload = {
        ok: true,
        result: {
          event_name: 'message.text.received',
          message: {
            from: { id: '0e7279ebd6a13fff66b0', display_name: 'John', is_bot: false },
            chat: { id: '0e7279ebd6a13fff66b0', chat_type: 'PRIVATE' },
            text: 'Hello bot',
            message_id: '6003008fbd02235b7a14',
            date: 1788139617411,
          },
        },
      };

      const event = webhookModule.parseEvent(payload);
      assert.equal(event.event, 'user_text');
      assert.equal(event.userId, '0e7279ebd6a13fff66b0');
      assert.equal(event.chatId, '0e7279ebd6a13fff66b0');
      assert.equal(event.messageId, '6003008fbd02235b7a14');
      assert.equal(event.message.text, 'Hello bot');
      assert.deepEqual(event.raw, payload);
    });

    /**
     * Test: Parse flat payload (no result wrapper)
     */
    it('should parse flat payload (no result wrapper)', () => {
      const payload = {
        event_name: 'message.text.received',
        message: {
          from: { id: 'user123' },
          chat: { id: 'user123', chat_type: 'PRIVATE' },
          text: 'Hi there',
          message_id: 'msg_001',
          date: 1700000000,
        },
      };

      const event = webhookModule.parseEvent(payload);
      assert.equal(event.event, 'user_text');
      assert.equal(event.userId, 'user123');
      assert.equal(event.chatId, 'user123');
      assert.equal(event.messageId, 'msg_001');
      assert.equal(event.message.text, 'Hi there');
    });

    /**
     * Test: Parse image event
     */
    it('should parse message.image.received event correctly', () => {
      const payload = {
        ok: true,
        result: {
          event_name: 'message.image.received',
          message: {
            from: { id: 'user456' },
            chat: { id: 'user456' },
            photo: 'https://example.com/photo.jpg',
            caption: 'Nice photo',
            message_id: 'img_001',
            date: 1700000000,
          },
        },
      };

      const event = webhookModule.parseEvent(payload);
      assert.equal(event.event, 'user_image');
      assert.equal(event.userId, 'user456');
      assert.equal(event.message.photo, 'https://example.com/photo.jpg');
      assert.equal(event.message.caption, 'Nice photo');
    });

    /**
     * Test: Parse sticker event
     */
    it('should parse message.sticker.received event correctly', () => {
      const payload = {
        ok: true,
        result: {
          event_name: 'message.sticker.received',
          message: {
            from: { id: 'user789' },
            chat: { id: 'user789' },
            sticker: 'sticker-id-abc',
            message_id: 'stk_001',
            date: 1700000000,
          },
        },
      };

      const event = webhookModule.parseEvent(payload);
      assert.equal(event.event, 'user_sticker');
      assert.equal(event.message.sticker, 'sticker-id-abc');
    });

    /**
     * Test: Throws on null payload
     */
    it('should throw when payload is null', () => {
      assert.throws(
        () => webhookModule.parseEvent(null),
        /Invalid payload/
      );
    });

    /**
     * Test: Throws when event_name is missing
     */
    it('should throw when event_name is missing', () => {
      assert.throws(
        () => webhookModule.parseEvent({ message: { from: { id: '1' } } }),
        /Missing event_name/
      );
    });

    /**
     * Test: Throws when from.id is missing
     */
    it('should throw when from.id is missing', () => {
      assert.throws(
        () => webhookModule.parseEvent({ event_name: 'message.text.received' }),
        /Missing sender user ID/
      );
    });
  });

  // ── middleware ─────────────────────────────────────

  describe('middleware()', () => {
    /**
     * Test: Middleware returns 200 for valid webhook request
     */
    it('should return 200 for valid webhook request', async () => {
      const payload = {
        ok: true,
        result: {
          event_name: 'message.text.received',
          message: {
            from: { id: 'user123' },
            chat: { id: 'user123' },
            text: 'Hi',
            message_id: 'msg_001',
            date: 1700000000,
          },
        },
      };

      const middleware = webhookModule.middleware({
        async onEvent() {},
      });

      let statusCode = 0;
      let responseBody = null;
      const req = {
        headers: { 'x-bot-api-secret-token': SECRET_KEY },
        body: payload,
      };
      const res = {
        status(code) { statusCode = code; return this; },
        json(data) { responseBody = data; },
      };

      await middleware(req, res, () => {});
      assert.equal(statusCode, 200);
      assert.deepEqual(responseBody, { message: 'Success' });
    });

    /**
     * Test: Middleware returns 403 for invalid secret token
     */
    it('should return 403 for invalid secret token', async () => {
      const payload = {
        ok: true,
        result: {
          event_name: 'message.text.received',
          message: {
            from: { id: 'user123' },
            chat: { id: 'user123' },
            text: 'Hi',
          },
        },
      };

      const middleware = webhookModule.middleware();

      let statusCode = 0;
      const req = {
        headers: { 'x-bot-api-secret-token': 'wrong_token' },
        body: payload,
      };
      const res = {
        status(code) { statusCode = code; return this; },
        json() {},
      };

      await middleware(req, res, () => {});
      assert.equal(statusCode, 403);
    });
  });
});
