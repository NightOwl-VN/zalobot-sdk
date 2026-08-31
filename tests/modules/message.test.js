/**
 * @author  Hoang Khac Phuc
 * @email   hoangkhacphuc.dev@gmail.com
 * @github  https://github.com/hoangkhacphuc
 */

/**
 * Unit tests for MessageModule
 * Tests: sendMessage, sendPhoto, sendSticker, sendVoice, sendChatAction
 * @module tests/modules/message
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const ZaloClient = require('../../src/client');
const MessageModule = require('../../src/modules/message');
const { startMockServer, stopMockServer } = require('../helpers/mock-server');

describe('MessageModule', () => {
  let mockServer;
  let mockBaseUrl;
  let client;
  let messageModule;

  beforeEach(async () => {
    const mock = await startMockServer();
    mockServer = mock.server;
    mockBaseUrl = mock.baseUrl;
    client = new ZaloClient({
      botToken: 'test-token',
      baseURL: mockBaseUrl,
    });
    messageModule = new MessageModule(client);
  });

  afterEach(async () => {
    await stopMockServer(mockServer);
  });

  // ── sendText ──────────────────────────────────────

  describe('sendText()', () => {
    it('should send text message successfully', async () => {
      const result = await messageModule.sendText('user_chat_id', 'Hello!');
      assert.equal(result.ok, true);
      assert.ok(result.result.message_id);
      assert.ok(result.result.date);
    });

    it('should throw when chatId is missing', async () => {
      await assert.rejects(
        () => messageModule.sendText(null, 'Hello'),
        /chatId is required/
      );
    });

    it('should throw when text is missing', async () => {
      await assert.rejects(
        () => messageModule.sendText('user123', null),
        /text is required/
      );
    });

    it('should throw when text is empty', async () => {
      await assert.rejects(
        () => messageModule.sendText('user123', ''),
        /text is required/
      );
    });

    it('should throw when text exceeds 2000 chars', async () => {
      const longText = 'a'.repeat(2001);
      await assert.rejects(
        () => messageModule.sendText('user123', longText),
        /between 1 and 2000/
      );
    });

    it('should send with caption option', async () => {
      const result = await messageModule.sendText('user123', 'Test', { caption: 'Caption text' });
      assert.equal(result.ok, true);
    });
  });

  // ── sendPhoto ─────────────────────────────────────

  describe('sendPhoto()', () => {
    it('should send photo message successfully', async () => {
      const result = await messageModule.sendPhoto('user123', 'https://example.com/photo.jpg');
      assert.equal(result.ok, true);
      assert.ok(result.result.message_id);
    });

    it('should throw when chatId is missing', async () => {
      await assert.rejects(
        () => messageModule.sendPhoto(null, 'https://example.com/photo.jpg'),
        /chatId is required/
      );
    });

    it('should throw when photo URL is missing', async () => {
      await assert.rejects(
        () => messageModule.sendPhoto('user123', null),
        /photo URL is required/
      );
    });

    it('should send with caption option', async () => {
      const result = await messageModule.sendPhoto('user123', 'https://example.com/photo.jpg', {
        caption: 'Beautiful photo!',
      });
      assert.equal(result.ok, true);
    });
  });

  // ── sendSticker ───────────────────────────────────

  describe('sendSticker()', () => {
    it('should send sticker successfully', async () => {
      const result = await messageModule.sendSticker('user123', 'sticker-abc');
      assert.equal(result.ok, true);
      assert.ok(result.result.message_id);
    });

    it('should throw when sticker is missing', async () => {
      await assert.rejects(
        () => messageModule.sendSticker('user123', null),
        /sticker ID is required/
      );
    });
  });

  // ── sendVoice ─────────────────────────────────────

  describe('sendVoice()', () => {
    it('should send voice message successfully', async () => {
      const result = await messageModule.sendVoice('user123', 'https://example.com/voice.aac');
      assert.equal(result.ok, true);
      assert.ok(result.result.message_id);
    });

    it('should throw when voice URL is missing', async () => {
      await assert.rejects(
        () => messageModule.sendVoice('user123', null),
        /voiceUrl is required/
      );
    });
  });

  // ── sendChatAction ────────────────────────────────

  describe('sendChatAction()', () => {
    it('should send chat action successfully', async () => {
      const result = await messageModule.sendChatAction('user123', 'typing');
      assert.equal(result.ok, true);
    });

    it('should throw when action is missing', async () => {
      await assert.rejects(
        () => messageModule.sendChatAction('user123', null),
        /action is required/
      );
    });
  });

  // ── getMe ─────────────────────────────────────────

  describe('getMe()', () => {
    it('should return bot info', async () => {
      const result = await messageModule.getMe();
      assert.equal(result.ok, true);
      assert.ok(result.result.id);
      assert.ok(result.result.account_name);
    });
  });

  // ── getUpdates ────────────────────────────────────

  describe('getUpdates()', () => {
    it('should return empty updates array', async () => {
      const result = await messageModule.getUpdates();
      assert.equal(result.ok, true);
      assert.ok(Array.isArray(result.result));
    });
  });

  // ── setWebhook ────────────────────────────────────

  describe('setWebhook()', () => {
    it('should set webhook successfully', async () => {
      const result = await messageModule.setWebhook('https://example.com/webhook', 'my-secret-123');
      assert.equal(result.ok, true);
      assert.equal(result.result.url, 'https://example.com/webhook');
    });

    it('should throw when URL is missing', async () => {
      await assert.rejects(
        () => messageModule.setWebhook(null, 'secret'),
        /url is required/
      );
    });

    it('should throw when secretToken is too short', async () => {
      await assert.rejects(
        () => messageModule.setWebhook('https://example.com/webhook', 'short'),
        /8-256 characters/
      );
    });
  });

  // ── testWebhook ───────────────────────────────────

  describe('testWebhook()', () => {
    it('should test webhook successfully', async () => {
      const result = await messageModule.testWebhook();
      assert.equal(result.ok, true);
      assert.equal(result.result.ok, true);
    });
  });

  // ── deleteWebhook ─────────────────────────────────

  describe('deleteWebhook()', () => {
    it('should delete webhook successfully', async () => {
      const result = await messageModule.deleteWebhook();
      assert.equal(result.ok, true);
    });
  });

  // ── getWebhookInfo ────────────────────────────────

  describe('getWebhookInfo()', () => {
    it('should get webhook info', async () => {
      const result = await messageModule.getWebhookInfo();
      assert.equal(result.ok, true);
      assert.ok('url' in result.result);
    });
  });
});
