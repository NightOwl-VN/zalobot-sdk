/**
 * @author  Hoang Khac Phuc
 * @email   hoangkhacphuc.dev@gmail.com
 * @github  https://github.com/hoangkhacphuc
 */

/**
 * Unit tests for MessageModule
 * Tests: sendText, sendImage, sendFile, sendSticker, sendTemplate, sendQuickReply
 * Uses mock server to simulate Zalo API responses
 * @module tests/modules/message.test
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const ZaloClient = require('../../src/client');
const MessageModule = require('../../src/modules/message');
const { startMockServer, stopMockServer } = require('../helpers/mock-server');

describe('MessageModule', () => {
  let messageModule;
  let mockServer;

  /**
   * Set up mock server and MessageModule before each test
   */
  beforeEach(async () => {
    const mock = await startMockServer({ accessToken: 'test-token' });
    mockServer = mock.server;

    const client = new ZaloClient({
      accessToken: 'test-token',
      baseURL: mock.baseUrl,
    });
    messageModule = new MessageModule(client);
  });

  /**
   * Tear down mock server after each test
   */
  afterEach(async () => {
    await stopMockServer(mockServer);
  });

  // ── sendText ──────────────────────────────────────

  describe('sendText()', () => {
    /**
     * Test: sendText returns message_id on success
     */
    it('should send text message and return message_id', async () => {
      const result = await messageModule.sendText('user_123', 'Hello World');
      assert.ok(result.message_id);
      assert.ok(result.message_id.startsWith('msg_mock_'));
    });

    /**
     * Test: sendText throws when userId is missing
     */
    it('should throw when userId is missing', async () => {
      await assert.rejects(
        () => messageModule.sendText(null, 'Hello'),
        /userId is required/
      );
    });

    /**
     * Test: sendText throws when text is empty
     */
    it('should throw when text is empty', async () => {
      await assert.rejects(
        () => messageModule.sendText('user_123', ''),
        /text is required/
      );
    });

    /**
     * Test: sendText throws when text exceeds 1000 characters
     */
    it('should throw when text exceeds 1000 characters', async () => {
      const longText = 'a'.repeat(1001);
      await assert.rejects(
        () => messageModule.sendText('user_123', longText),
        /exceeds 1000 character limit/
      );
    });

    /**
     * Test: sendText accepts text exactly 1000 characters
     */
    it('should accept text of exactly 1000 characters', async () => {
      const exactText = 'a'.repeat(1000);
      const result = await messageModule.sendText('user_123', exactText);
      assert.ok(result.message_id);
    });
  });

  // ── sendImage ─────────────────────────────────────

  describe('sendImage()', () => {
    /**
     * Test: sendImage sends with valid attachmentId
     */
    it('should send image with valid attachmentId', async () => {
      const result = await messageModule.sendImage('user_123', 'img_abc123');
      assert.ok(result.message_id);
    });

    /**
     * Test: sendImage throws when attachmentId is missing
     */
    it('should throw when attachmentId is missing', async () => {
      await assert.rejects(
        () => messageModule.sendImage('user_123', null),
        /attachmentId is required/
      );
    });
  });

  // ── sendFile ──────────────────────────────────────

  describe('sendFile()', () => {
    /**
     * Test: sendFile sends with valid attachmentId
     */
    it('should send file with valid attachmentId', async () => {
      const result = await messageModule.sendFile('user_123', 'file_abc123');
      assert.ok(result.message_id);
    });

    /**
     * Test: sendFile throws when attachmentId is missing
     */
    it('should throw when attachmentId is missing', async () => {
      await assert.rejects(
        () => messageModule.sendFile('user_123', undefined),
        /attachmentId is required/
      );
    });
  });

  // ── sendSticker ───────────────────────────────────

  describe('sendSticker()', () => {
    /**
     * Test: sendSticker sends with valid stickerId
     */
    it('should send sticker with valid stickerId', async () => {
      const result = await messageModule.sendSticker('user_123', 'sticker_001');
      assert.ok(result.message_id);
    });

    /**
     * Test: sendSticker throws when stickerId is missing
     */
    it('should throw when stickerId is missing', async () => {
      await assert.rejects(
        () => messageModule.sendSticker('user_123', ''),
        /stickerId is required/
      );
    });
  });

  // ── sendTemplate ──────────────────────────────────

  describe('sendTemplate()', () => {
    /**
     * Test: sendTemplate sends button template
     */
    it('should send button template', async () => {
      const result = await messageModule.sendTemplate('user_123', {
        type: 'button',
        elements: [
          { title: 'Yes', payload: 'yes' },
          { title: 'No', payload: 'no' },
        ],
      });
      assert.ok(result.message_id);
    });

    /**
     * Test: sendTemplate throws with invalid type
     */
    it('should throw when template.type is invalid', async () => {
      await assert.rejects(
        () => messageModule.sendTemplate('user_123', {
          type: 'invalid',
          elements: [{ title: 'A' }],
        }),
        /template.type must be/
      );
    });

    /**
     * Test: sendTemplate throws when elements is empty
     */
    it('should throw when template.elements is empty', async () => {
      await assert.rejects(
        () => messageModule.sendTemplate('user_123', {
          type: 'button',
          elements: [],
        }),
        /non-empty array/
      );
    });
  });

  // ── sendQuickReply ────────────────────────────────

  describe('sendQuickReply()', () => {
    /**
     * Test: sendQuickReply sends with valid replies
     */
    it('should send quick reply with valid options', async () => {
      const result = await messageModule.sendQuickReply(
        'user_123',
        'Pick an option:',
        [
          { title: 'A', payload: 'a' },
          { title: 'B', payload: 'b' },
        ]
      );
      assert.ok(result.message_id);
    });

    /**
     * Test: sendQuickReply throws with empty array
     */
    it('should throw when quickReplies is empty', async () => {
      await assert.rejects(
        () => messageModule.sendQuickReply('user_123', 'Choose:', []),
        /non-empty array/
      );
    });

    /**
     * Test: sendQuickReply throws when exceeding 13 replies
     */
    it('should throw when quickReplies exceeds 13 items', async () => {
      const tooMany = Array.from({ length: 14 }, (_, i) => ({
        title: `Opt ${i}`,
        payload: `opt${i}`,
      }));
      await assert.rejects(
        () => messageModule.sendQuickReply('user_123', 'Choose:', tooMany),
        /Maximum 13 quick replies/
      );
    });
  });

  // ── getMessage ────────────────────────────────────

  describe('getMessage()', () => {
    /**
     * Test: getMessage retrieves message details
     */
    it('should retrieve message by ID', async () => {
      const result = await messageModule.getMessage('msg_abc');
      assert.equal(result.message_id, 'msg_abc');
      assert.equal(result.status, 'delivered');
    });

    /**
     * Test: getMessage throws when messageId is missing
     */
    it('should throw when messageId is missing', async () => {
      await assert.rejects(
        () => messageModule.getMessage(null),
        /messageId is required/
      );
    });
  });
});
