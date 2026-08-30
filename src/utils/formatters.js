/**
 * @author  Hoang Khac Phuc
 * @email   hoangkhacphuc.dev@gmail.com
 * @github  https://github.com/hoangkhacphuc
 */

/**
 * Utility functions for formatting payloads and responses
 */

/**
 * Format a user ID string (ensure it's a string)
 * @param {string|number} userId - User ID
 * @returns {string} Normalized user ID
 */
function normalizeUserId(userId) {
  if (userId === null || userId === undefined) {
    throw new Error('userId is required');
  }
  return String(userId);
}

/**
 * Build a recipient object for API calls
 * @param {string} userId - Recipient user ID
 * @returns {Object} { recipient: { user_id: ... } }
 */
function buildRecipient(userId) {
  return { recipient: { user_id: normalizeUserId(userId) } };
}

/**
 * Validate text message length
 * @param {string} text - Message text
 * @param {number} [maxLength=1000] - Maximum allowed length
 * @returns {boolean} True if valid
 * @throws {Error} If text exceeds max length
 */
function validateTextLength(text, maxLength = 1000) {
  if (text && text.length > maxLength) {
    throw new Error(`Text exceeds maximum length of ${maxLength} characters`);
  }
  return true;
}

/**
 * Build a message attachment payload
 * @param {string} type - Attachment type ('image', 'file', 'sticker', 'template')
 * @param {Object} payload - Attachment payload
 * @returns {Object} { attachment: { type, payload } }
 */
function buildAttachment(type, payload) {
  return {
    attachment: {
      type,
      payload,
    },
  };
}

/**
 * Build quick replies array
 * @param {Array} replies - Array of { title, payload, image_url? } objects
 * @returns {Array} Formatted quick replies
 */
function buildQuickReplies(replies) {
  if (!Array.isArray(replies) || replies.length === 0) {
    return [];
  }
  if (replies.length > 13) {
    throw new Error('Maximum 13 quick replies allowed');
  }
  return replies.map(qr => ({
    title: String(qr.title).substring(0, 20),
    payload: String(qr.payload).substring(0, 1000),
    ...(qr.image_url && { image_url: qr.image_url }),
  }));
}

/**
 * Pagination helper for API responses
 * @param {Object} response - API response with paging
 * @param {Function} fetchFn - Function to fetch next page
 * @returns {Object} Pagination helpers
 */
function paginate(response, fetchFn) {
  const data = response.data || [];
  const paging = response.paging || {};

  return {
    data,
    paging,
    hasNext: !!paging.next,
    next: async () => {
      if (!paging.next) return null;
      return fetchFn({ cursor: paging.cursor });
    },
    get all() {
      return data;
    },
  };
}

/**
 * Safe JSON parse with fallback
 * @param {string} str - JSON string
 * @param {*} fallback - Fallback value on error
 * @returns {*} Parsed object or fallback
 */
function safeParseJSON(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

/**
 * Truncate string to max length with ellipsis
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} [suffix='...'] - Suffix to append
 * @returns {string} Truncated string
 */
function truncate(str, maxLength, suffix = '...') {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Build a template payload for buttons
 * @param {Array} buttons - Array of button objects
 * @param {string} [text] - Optional text to display above buttons
 * @returns {Object} Template payload
 */
function buildButtonTemplate(buttons, text = null) {
  return {
    type: 'button',
    elements: buttons.map((btn, index) => ({
      title: btn.title || `Option ${index + 1}`,
      payload: btn.payload || `btn_${index + 1}`,
      ...(btn.url && { url: btn.url }),
    })),
    ...(text && { text }),
  };
}

module.exports = {
  normalizeUserId,
  buildRecipient,
  validateTextLength,
  buildAttachment,
  buildQuickReplies,
  paginate,
  safeParseJSON,
  truncate,
  buildButtonTemplate,
};