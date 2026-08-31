/**
 * @author  Hoang Khac Phuc
 * @email   hoangkhacphuc.dev@gmail.com
 * @github  https://github.com/hoangkhacphuc
 */

/**
 * Unit tests for WebhookModule
 * Tests: token verification, event parsing, middleware, security defaults
 * @module tests/modules/webhook
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const WebhookModule = require('../../src/modules/webhook');
const { EVENT_MAP } = require('../../src/modules/webhook');

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
     * Test: Returns false when no secret key is configured (requireSecret=true default)
     */
    it('should return false when no secret key is configured (secure default)', () => {
      const noKeyModule = new WebhookModule({});
      const req = { headers: {} };
      assert.equal(noKeyModule.verify(req), false);
    });

    /**
     * Test: Returns true when no secret key and requireSecret=false (dev mode)
     */
    it('should return true when requireSecret=false and no secret key (dev mode)', () => {
      const devModule = new WebhookModule({ requireSecret: false });
      const req = { headers: {} };
      assert.equal(devModule.verify(req), true);
    });

    /**
     * Test: Returns false when token header is missing (with secret configured)
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

  // ── EVENT_MAP ─────────────────────────────────────

  describe('EVENT_MAP', () => {
    /**
     * Test: EVENT_MAP is frozen (immutable)
     */
    it('should be frozen (immutable)', () => {
      assert.equal(Object.isFrozen(EVENT_MAP), true);
    });

    /**
     * Test: Cannot add properties to EVENT_MAP
     */
    it('should not allow modification', () => {
      const original = Object.keys(EVENT_MAP).length;
      try {
        EVENT_MAP['new.event'] = 'new_event'; // eslint-disable-line no-unused-vars
      } catch (e) {
        // In strict mode this would throw
      }
      assert.equal(Object.keys(EVENT_MAP).length, original);
    });

    /**
     * Test: All expected mappings exist
     */
    it('should contain all expected event mappings', () => {
      assert.equal(EVENT_MAP['message.text.received'], 'user_text');
      assert.equal(EVENT_MAP['message.image.received'], 'user_image');
      assert.equal(EVENT_MAP['message.sticker.received'], 'user_sticker');
      assert.equal(EVENT_MAP['message.voice.received'], 'user_voice');
      assert.equal(EVENT_MAP['message.unsupported.received'], 'user_unsupported');
      assert.equal(EVENT_MAP['user.follow'], 'user_follow');
      assert.equal(EVENT_MAP['user.unfollow'], 'user_unfollow');
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
     * Test: Does NOT throw when from.id is missing — sets userId to null (safety)
     */
    it('should set userId to null when from.id is missing (event safety)', () => {
      const payload = {
        event_name: 'message.text.received',
        message: { text: 'Hello' },
      };

      const event = webhookModule.parseEvent(payload);
      assert.equal(event.userId, null);
      assert.equal(event.chatId, null);
      assert.equal(event.event, 'user_text');
    });

    /**
     * Test: user.follow event parsed safely without from.id
     */
    it('should handle user.follow event without message.from.id', () => {
      const payload = {
        ok: true,
        result: {
          event_name: 'user.follow',
          message: {
            id: 'follow_user_123',
            date: 1700000000,
          },
        },
      };

      const event = webhookModule.parseEvent(payload);
      assert.equal(event.event, 'user_follow');
      assert.equal(event.userId, 'follow_user_123');
      assert.equal(event.chatId, 'follow_user_123');
    });

    /**
     * Test: Unknown event name is preserved (not silently converted)
     */
    it('should preserve unknown event names safely', () => {
      const payload = {
        event_name: 'some.unknown.event',
        message: {
          from: { id: 'user_unknown' },
          chat: { id: 'user_unknown' },
        },
      };

      const event = webhookModule.parseEvent(payload);
      assert.equal(event.event, 'some.unknown.event');
      assert.equal(event.userId, 'user_unknown');
      // Falls through to default case in switch
      assert.ok(event.message);
    });
  });

  // ── middleware ─────────────────────────────────────

  describe('middleware()', () => {
    /**
     * Helper: create mock req/res objects
     */
    function mockReqRes(secret, payload) {
      const req = {
        headers: secret ? { 'x-bot-api-secret-token': secret } : {},
        body: payload || {
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
        },
      };

      let statusCode = 200;
      let responseBody = null;
      let headersSent = false;
      const res = {
        get headersSent() { return headersSent; },
        status(code) { statusCode = code; return this; },
        json(data) {
          responseBody = data;
          headersSent = true;
        },
      };

      return { req, res, get: () => ({ statusCode, responseBody }) };
    }

    /**
     * Test: Middleware returns 200 for valid webhook request
     */
    it('should return 200 for valid webhook request', async () => {
      const { req, res, get } = mockReqRes(SECRET_KEY);
      const middleware = webhookModule.middleware({
        async onEvent() {},
      });

      await middleware(req, res, () => {});
      const state = get();
      assert.equal(state.statusCode, 200);
      assert.deepEqual(state.responseBody, { message: 'Success' });
    });

    /**
     * Test: Middleware returns 403 for invalid secret token
     */
    it('should return 403 for invalid secret token', async () => {
      const { req, res, get } = mockReqRes('wrong_token');
      const middleware = webhookModule.middleware();

      await middleware(req, res, () => {});
      const state = get();
      assert.equal(state.statusCode, 403);
    });

    /**
     * Test: acknowledgeImmediately=true sends 200 BEFORE handler runs
     */
    it('should send 200 before handler when acknowledgeImmediately=true', async () => {
      const { req, res, get } = mockReqRes(SECRET_KEY);
      let handlerRan = false;

      const middleware = webhookModule.middleware({
        acknowledgeImmediately: true,
        async onEvent(event) {
          // At this point, 200 should already be sent
          assert.equal(res.headersSent, true);
          handlerRan = true;
        },
      });

      await middleware(req, res, () => {});
      assert.equal(handlerRan, true);
    });

    /**
     * Test: acknowledgeImmediately=false sends 200 AFTER handler completes
     */
    it('should send 200 after handler when acknowledgeImmediately=false', async () => {
      const { req, res, get } = mockReqRes(SECRET_KEY);
      let handlerRan = false;

      const middleware = webhookModule.middleware({
        acknowledgeImmediately: false,
        async onEvent(event) {
          assert.equal(res.headersSent, false);
          handlerRan = true;
        },
      });

      await middleware(req, res, () => {});
      const state = get();
      assert.equal(handlerRan, true);
      assert.equal(state.statusCode, 200);
    });

    /**
     * Test: onError callback is called when handler throws
     */
    it('should call onError when handler throws', async () => {
      const { req, res, get } = mockReqRes(SECRET_KEY);
      let caughtError = null;
      let caughtEvent = null;

      const middleware = webhookModule.middleware({
        async onEvent() {
          throw new Error('handler exploded');
        },
        onError(error, event, request) {
          caughtError = error;
          caughtEvent = event;
        },
      });

      await middleware(req, res, () => {});
      assert.equal(caughtError.message, 'handler exploded');
      assert.equal(caughtEvent.userId, 'user123');
    });

    /**
     * Test: Handler failure sends 500 when acknowledgeImmediately=false
     */
    it('should send 500 on handler failure when acknowledgeImmediately=false', async () => {
      const { req, res, get } = mockReqRes(SECRET_KEY);

      const middleware = webhookModule.middleware({
        acknowledgeImmediately: false,
        async onEvent() {
          throw new Error('handler failed');
        },
      });

      await middleware(req, res, () => {});
      const state = get();
      assert.equal(state.statusCode, 500);
    });

    /**
     * Test: Handler failure does NOT send another response when acknowledgeImmediately=true
     */
    it('should not send response when handler fails after ack sent', async () => {
      const { req, res, get } = mockReqRes(SECRET_KEY);
      let sendCount = 0;
      let headersSent = false;

      const specialRes = {
        get headersSent() { return headersSent; },
        status(code) { return this; },
        json(data) {
          sendCount++;
          headersSent = true;
        },
      };

      const middleware = webhookModule.middleware({
        acknowledgeImmediately: true,
        async onEvent() {
          throw new Error('handler failed after ack');
        },
      });

      await middleware(req, specialRes, () => {});
      // Only the initial 200 ack, no second response
      assert.equal(sendCount, 1);
    });
  });
});
