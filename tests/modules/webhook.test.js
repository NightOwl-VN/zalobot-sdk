/**
 * Unit tests for WebhookModule
 * Tests: signature verification, event parsing, middleware
 * @module tests/modules/webhook
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

const WebhookModule = require('../../src/modules/webhook');

/**
 * Helper: Compute HMAC-SHA256 signature for a given body and secret
 * @param {string} body - Raw body string
 * @param {string} secret - Secret key
 * @returns {string} Hex-encoded signature
 */
function computeSignature(body, secret) {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

describe('WebhookModule', () => {
  let webhookModule;
  const SECRET_KEY = 'my-secret-key-for-testing';

  /**
   * Initialize WebhookModule with a mock client and secret key
   */
  beforeEach(() => {
    webhookModule = new WebhookModule(
      { secretKey: SECRET_KEY },
      { secretKey: SECRET_KEY }
    );
  });

  // ── verifySignature ───────────────────────────────

  describe('verifySignature()', () => {
    /**
     * Test: Valid signature returns true
     */
    it('should return true for valid signature', () => {
      const body = '{"event_name":"user_text"}';
      const sig = computeSignature(body, SECRET_KEY);

      const result = webhookModule.verifySignature(sig, body);
      assert.equal(result, true);
    });

    /**
     * Test: Invalid signature returns false
     */
    it('should return false for invalid signature', () => {
      const body = '{"event_name":"user_text"}';
      const result = webhookModule.verifySignature('bad_signature_hex', body);
      assert.equal(result, false);
    });

    /**
     * Test: Throws when no secret key is configured
     */
    it('should throw when secret key is not configured', () => {
      const noKeyModule = new WebhookModule({}, {});
      assert.throws(
        () => noKeyModule.verifySignature('sig', 'body'),
        /Secret key is required/
      );
    });

    /**
     * Test: Returns false when signature is null
     */
    it('should return false when signature is null', () => {
      assert.equal(webhookModule.verifySignature(null, '{}'), false);
    });

    /**
     * Test: Returns false when rawBody is null
     */
    it('should return false when rawBody is null', () => {
      assert.equal(webhookModule.verifySignature('abcdef', null), false);
    });

    /**
     * Test: Uses override secret key when provided
     */
    it('should use override secretKey when provided', () => {
      const overrideSecret = 'override-key';
      const body = '{"data":"test"}';
      const sig = computeSignature(body, overrideSecret);

      const result = webhookModule.verifySignature(sig, body, overrideSecret);
      assert.equal(result, true);
    });
  });

  // ── requireValidSignature ─────────────────────────

  describe('requireValidSignature()', () => {
    /**
     * Test: Does not throw for valid signature
     */
    it('should not throw for valid signature', () => {
      const body = '{"ok":true}';
      const sig = computeSignature(body, SECRET_KEY);
      assert.doesNotThrow(() => webhookModule.requireValidSignature(sig, body));
    });

    /**
     * Test: Throws for invalid signature
     */
    it('should throw for invalid signature', () => {
      assert.throws(
        () => webhookModule.requireValidSignature('wrong', 'body'),
        /Invalid webhook signature/
      );
    });
  });

  // ── parseEvent ────────────────────────────────────

  describe('parseEvent()', () => {
    /**
     * Test: Parse user_text event
     */
    it('should parse user_text event correctly', () => {
      const payload = {
        event_name: 'user_text',
        sender: { id: '12345' },
        message_id: 'msg_001',
        message: { text: 'Hello bot' },
        timestamp: 1700000000,
      };

      const event = webhookModule.parseEvent(payload);
      assert.equal(event.event, 'user_text');
      assert.equal(event.userId, '12345');
      assert.equal(event.messageId, 'msg_001');
      assert.equal(event.message.text, 'Hello bot');
      assert.equal(event.timestamp, 1700000000);
      assert.deepEqual(event.raw, payload);
    });

    /**
     * Test: Parse user_quick_reply event
     */
    it('should parse user_quick_reply event correctly', () => {
      const payload = {
        event_name: 'user_quick_reply',
        sender: { id: '67890' },
        message_id: 'msg_002',
        message: {
          text: 'I choose A',
          quick_reply: { payload: 'option_a' },
        },
      };

      const event = webhookModule.parseEvent(payload);
      assert.equal(event.event, 'user_quick_reply');
      assert.equal(event.userId, '67890');
      assert.equal(event.message.text, 'I choose A');
      assert.equal(event.message.quickReply.payload, 'option_a');
    });

    /**
     * Test: Parse user_follow event
     */
    it('should parse user_follow event correctly', () => {
      const payload = {
        event_name: 'user_follow',
        sender: { id: '11111' },
        follow: { action: 'follow', source: 'qr_code' },
      };

      const event = webhookModule.parseEvent(payload);
      assert.equal(event.event, 'user_follow');
      assert.equal(event.userId, '11111');
      assert.equal(event.follow.action, 'follow');
      assert.equal(event.follow.source, 'qr_code');
    });

    /**
     * Test: Parse user_unfollow event
     */
    it('should parse user_unfollow event correctly', () => {
      const payload = {
        event_name: 'user_unfollow',
        sender: { id: '22222' },
      };

      const event = webhookModule.parseEvent(payload);
      assert.equal(event.event, 'user_unfollow');
      assert.equal(event.unfollow, true);
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
        () => webhookModule.parseEvent({ sender: { id: '1' } }),
        /Missing event_name/
      );
    });

    /**
     * Test: Throws when sender id is missing
     */
    it('should throw when sender id is missing', () => {
      assert.throws(
        () => webhookModule.parseEvent({ event_name: 'user_text' }),
        /Missing sender\/user ID/
      );
    });
  });

  // ── middleware ─────────────────────────────────────

  describe('middleware()', () => {
    /**
     * Test: Middleware returns 200 for valid webhook
     */
    it('should return 200 for valid webhook request', async () => {
      const payload = {
        event_name: 'user_text',
        sender: { id: '12345' },
        message: { text: 'Hi' },
      };
      const rawBody = JSON.stringify(payload);
      const sig = computeSignature(rawBody, SECRET_KEY);

      const middleware = webhookModule.middleware({
        async onEvent(event) {
          // Event handler callback
        },
      });

      // Mock req/res/next
      let statusCode = 0;
      let responseBody = null;
      const req = {
        headers: { 'x-zalo-signature': sig },
        body: payload,
      };
      const res = {
        status(code) { statusCode = code; return this; },
        json(data) { responseBody = data; },
      };
      const next = () => {};

      await middleware(req, res, next);
      assert.equal(statusCode, 200);
      assert.deepEqual(responseBody, { success: true });
    });

    /**
     * Test: Middleware returns 401 for invalid signature
     */
    it('should return 401 for invalid signature', async () => {
      const payload = {
        event_name: 'user_text',
        sender: { id: '12345' },
        message: { text: 'Hi' },
      };

      const middleware = webhookModule.middleware();

      let statusCode = 0;
      const req = {
        headers: { 'x-zalo-signature': 'wrong_signature' },
        body: payload,
      };
      const res = {
        status(code) { statusCode = code; return this; },
        json() {},
      };

      await middleware(req, res, () => {});
      assert.equal(statusCode, 401);
    });
  });
});
