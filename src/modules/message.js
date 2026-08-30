/**
 * Message module - Send and manage Zalo messages
 * Based on Zalo Bot API documentation
 */

class MessageModule {
  /**
   * @param {ZaloClient} client - HTTP client instance
   */
  constructor(client) {
    this.client = client;
  }

  /**
   * Send a text message to a user
   * @param {string} userId - Recipient user ID
   * @param {string} text - Message content (max 1000 characters)
   * @param {Object} [options] - Additional options
   * @param {string} [options.quoteMessageId] - Message ID to reply to
   * @param {boolean} [options.force=true] - Force send even if user hasn't interacted in 24h
   * @returns {Promise<Object>} { message_id, ... }
   * @example
   * await bot.message.sendText('123456789', 'Hello from Zalo Bot!');
   */
  async sendText(userId, text, options = {}) {
    if (!userId || typeof userId !== 'string') {
      throw new Error('userId is required and must be a string');
    }
    if (!text || typeof text !== 'string') {
      throw new Error('text is required and must be a string');
    }
    if (text.length > 1000) {
      throw new Error('Text message exceeds 1000 character limit');
    }

    const payload = {
      recipient: { user_id: userId },
      message: { text },
      ...(options.quoteMessageId && { quote_message_id: options.quoteMessageId }),
      ...(options.force !== undefined && { force: options.force }),
    };

    return this.client.post('/me/messages', payload);
  }

  /**
   * Send an image message
   * @param {string} userId - Recipient user ID
   * @param {string} attachmentId - ID of uploaded image (from media.upload)
   * @param {Object} [options] - Additional options
   * @param {string} [options.quoteMessageId] - Message ID to reply to
   * @param {string} [options.caption] - Optional caption (max 1000 chars)
   * @returns {Promise<Object>}
   */
  async sendImage(userId, attachmentId, options = {}) {
    if (!attachmentId || typeof attachmentId !== 'string') {
      throw new Error('attachmentId is required');
    }

    const payload = {
      recipient: { user_id: userId },
      message: {
        attachment: {
          type: 'image',
          payload: {
            attachment_id: attachmentId,
            ...(options.caption && { caption: options.caption }),
          },
        },
      },
      ...(options.quoteMessageId && { quote_message_id: options.quoteMessageId }),
    };

    return this.client.post('/me/messages', payload);
  }

  /**
   * Send a file message
   * @param {string} userId - Recipient user ID
   * @param {string} attachmentId - ID of uploaded file (from media.upload)
   * @param {Object} [options] - Additional options
   * @param {string} [options.quoteMessageId] - Message ID to reply to
   * @param {string} [options.caption] - Optional caption (max 1000 chars)
   * @returns {Promise<Object>}
   */
  async sendFile(userId, attachmentId, options = {}) {
    if (!attachmentId || typeof attachmentId !== 'string') {
      throw new Error('attachmentId is required');
    }

    const payload = {
      recipient: { user_id: userId },
      message: {
        attachment: {
          type: 'file',
          payload: {
            attachment_id: attachmentId,
            ...(options.caption && { caption: options.caption }),
          },
        },
      },
      ...(options.quoteMessageId && { quote_message_id: options.quoteMessageId }),
    };

    return this.client.post('/me/messages', payload);
  }

  /**
   * Send a sticker message
   * @param {string} userId - Recipient user ID
   * @param {string} stickerId - Sticker ID (from Zalo sticker library)
   * @param {Object} [options] - Additional options
   * @param {string} [options.quoteMessageId] - Message ID to reply to
   * @returns {Promise<Object>}
   */
  async sendSticker(userId, stickerId, options = {}) {
    if (!stickerId || typeof stickerId !== 'string') {
      throw new Error('stickerId is required');
    }

    const payload = {
      recipient: { user_id: userId },
      message: {
        attachment: {
          type: 'sticker',
          payload: { sticker_id: stickerId },
        },
      },
      ...(options.quoteMessageId && { quote_message_id: options.quoteMessageId }),
    };

    return this.client.post('/me/messages', payload);
  }

  /**
   * Send a template message (buttons/quick replies)
   * @param {string} userId - Recipient user ID
   * @param {Object} template - Template payload
   * @param {string} template.type - 'list' or 'button'
   * @param {Array} template.elements - Template elements
   * @param {Object} [options] - Additional options
   * @param {string} [options.quoteMessageId] - Message ID to reply to
   * @returns {Promise<Object>}
   * @example
   * await bot.message.sendTemplate('123456789', {
   *   type: 'button',
   *   elements: [
   *     { title: 'Option 1', payload: 'btn1' },
   *     { title: 'Option 2', payload: 'btn2' },
   *   ]
   * });
   */
  async sendTemplate(userId, template, options = {}) {
    if (!template || typeof template !== 'object') {
      throw new Error('template is required and must be an object');
    }
    if (!template.type || !['list', 'button'].includes(template.type)) {
      throw new Error('template.type must be "list" or "button"');
    }
    if (!Array.isArray(template.elements) || template.elements.length === 0) {
      throw new Error('template.elements must be a non-empty array');
    }

    const payload = {
      recipient: { user_id: userId },
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: template.type,
            elements: template.elements,
          },
        },
      },
      ...(options.quoteMessageId && { quote_message_id: options.quoteMessageId }),
    };

    return this.client.post('/me/messages', payload);
  }

  /**
   * Send a quick reply message
   * @param {string} userId - Recipient user ID
   * @param {string} text - Message text
   * @param {Array} quickReplies - Array of { title, payload } objects
   * @param {Object} [options] - Additional options
   * @param {string} [options.quoteMessageId] - Message ID to reply to
   * @returns {Promise<Object>}
   */
  async sendQuickReply(userId, text, quickReplies, options = {}) {
    if (!Array.isArray(quickReplies) || quickReplies.length === 0) {
      throw new Error('quickReplies must be a non-empty array');
    }
    if (quickReplies.length > 13) {
      throw new Error('Maximum 13 quick replies allowed');
    }

    const payload = {
      recipient: { user_id: userId },
      message: {
        text,
        quick_replies: quickReplies.map(qr => ({
          title: qr.title,
          payload: qr.payload,
          ...(qr.image_url && { image_url: qr.image_url }),
        })),
      },
      ...(options.quoteMessageId && { quote_message_id: options.quoteMessageId }),
    };

    return this.client.post('/me/messages', payload);
  }

  /**
   * Get message details by ID
   * @param {string} messageId - Message ID to retrieve
   * @returns {Promise<Object>} Message details
   */
  async getMessage(messageId) {
    if (!messageId || typeof messageId !== 'string') {
      throw new Error('messageId is required');
    }
    return this.client.get(`/me/messages/${messageId}`);
  }

  /**
   * Get conversation history
   * @param {Object} params - Query parameters
   * @param {string} [params.userId] - Filter by user ID
   * @param {number} [params.limit=50] - Number of messages (max 200)
   * @param {string} [params.cursor] - Pagination cursor
   * @returns {Promise<Object>} { data: [...], paging: {...} }
   */
  async getConversation(params = {}) {
    const query = {
      limit: params.limit || 50,
      ...(params.userId && { user_id: params.userId }),
      ...(params.cursor && { cursor: params.cursor }),
    };
    return this.client.get('/me/messages', query);
  }
}

module.exports = MessageModule;