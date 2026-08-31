/**
 * @author  Hoang Khac Phuc
 * @email   hoangkhacphuc.dev@gmail.com
 * @github  https://github.com/hoangkhacphuc
 */

/** 
 * Message module - Send and manage Zalo Bot messages
 * API Reference: https://bot.zapps.me/docs/apis/sendMessage/
 */

const {
  validateChatId,
  validateMessageText,
  validateUrl,
  validateHttpsUrl,
  validateSecretToken,
  validateRequiredString,
} = require('../utils/validate');

class MessageModule {
  /** 
   * @param {ZaloClient} client - HTTP client instance 
   */
  constructor(client) {
    this.client = client;
  }

  /** 
   * Send a text message to a user or chat
   * @param {string} chatId - Recipient chat ID (user or group)
   * @param {string} text - Message content (1-2000 characters)
   * @param {Object} [options] - Additional options
   * @param {string} [options.caption] - Optional caption for media (1-2000 chars)
   * @returns {Promise<Object>} { ok: true, result: { message_id, date } }
   * @example
   * await bot.message.sendText('abc.xyz', 'Hello from Zalo Bot!');
   */
  async sendText(chatId, text, options = {}) {
    validateChatId(chatId);
    validateMessageText(text);

    const payload = {
      chat_id: chatId,
      text,
      ...(options.caption && { caption: options.caption }),
    };

    return this.client.post('sendMessage', payload);
  }

  /** 
   * Send a photo message
   * @param {string} chatId - Recipient chat ID
   * @param {string} photo - Image URL
   * @param {Object} [options] - Additional options
   * @param {string} [options.caption] - Optional caption (1-2000 chars)
   * @returns {Promise<Object>} { ok: true, result: { message_id, date } }
   */
  async sendPhoto(chatId, photo, options = {}) {
    validateChatId(chatId);
    validateUrl(photo);

    const payload = {
      chat_id: chatId,
      photo,
      ...(options.caption && { caption: options.caption }),
    };

    return this.client.post('sendPhoto', payload);
  }

  /** 
   * Send a sticker message
   * @param {string} chatId - Recipient chat ID
   * @param {string} sticker - Sticker ID from https://stickers.zaloapp.com/
   * @returns {Promise<Object>} { ok: true, result: { message_id, date } }
   */
  async sendSticker(chatId, sticker) {
    validateChatId(chatId);
    validateRequiredString(sticker, 'sticker');

    const payload = {
      chat_id: chatId,
      sticker,
    };

    return this.client.post('sendSticker', payload);
  }

  /** 
   * Send a voice message
   * @param {string} chatId - Recipient chat ID (1-1 only)
   * @param {string} voiceUrl - .aac audio file URL
   * @returns {Promise<Object>} { ok: true, result: { message_id, date } }
   */
  async sendVoice(chatId, voiceUrl) {
    validateChatId(chatId);
    validateUrl(voiceUrl);

    const payload = {
      chat_id: chatId,
      voice_url: voiceUrl,
    };

    return this.client.post('sendVoice', payload);
  }

  /** 
   * Send a chat action (typing indicator)
   * @param {string} chatId - Recipient chat ID
   * @param {string} action - 'typing' or 'upload_photo'
   * @returns {Promise<Object>} { ok: true }
   */
  async sendChatAction(chatId, action) {
    validateChatId(chatId);
    validateRequiredString(action, 'action');

    const payload = {
      chat_id: chatId,
      action,
    };

    return this.client.post('sendChatAction', payload);
  }

  /** 
   * Get bot info
   * @returns {Promise<Object>} { ok: true, result: { id, account_name, account_type } }
   */
  async getMe() {
    return this.client.get('getMe');
  }

  /** 
   * Get updates (long polling) - only works if no webhook configured
   * @param {Object} [options] - Options
   * @param {number} [options.timeout=30] - Timeout in seconds
   * @returns {Promise<Object>} Array of updates
   */
  async getUpdates(options = {}) {
    const timeout = options.timeout || 30;
    // Zalo Bot API getUpdates uses 'timeout' as the query param for long polling
    return this.client.get('getUpdates', { timeout });
  }

  /** 
   * Set webhook URL
   * @param {string} url - HTTPS webhook URL
   * @param {string} secretToken - Secret token for verification (8-256 chars)
   * @returns {Promise<Object>} { ok: true, result: { url, updated_at, verification } }
   */
  async setWebhook(url, secretToken) {
    validateHttpsUrl(url, 'url');
    validateSecretToken(secretToken);

    return this.client.post('setWebhook', { url, secretToken });
  }

  /** 
   * Test webhook URL
   * @returns {Promise<Object>} { ok: true, result: { ok, url, status_code, outcome, latency_ms, hint } }
   */
  async testWebhook() {
    return this.client.post('testWebhook');
  }

  /** 
   * Delete webhook configuration
   * @returns {Promise<Object>} { ok: true, result: { url, updated_at } }
   */
  async deleteWebhook() {
    return this.client.post('deleteWebhook');
  }

  /** 
   * Get current webhook info
   * @returns {Promise<Object>} { ok: true, result: { url, updated_at } }
   */
  async getWebhookInfo() {
    return this.client.get('getWebhookInfo');
  }
}

module.exports = MessageModule;
