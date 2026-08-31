/**
 * @author  Hoang Khac Phuc
 * @email   hoangkhacphuc.dev@gmail.com
 * @github  https://github.com/hoangkhacphuc
 */

/**
 * Reusable validation utilities for Zalo Bot SDK
 * @module utils/validate
 */

const { ZaloValidationError } = require('../errors');

/**
 * Validate that a value is a required string with optional length constraints
 * @param {*} value - Value to validate
 * @param {string} fieldName - Name of the field (used in error messages)
 * @param {Object} [options] - Validation options
 * @param {number} [options.minLength] - Minimum string length
 * @param {number} [options.maxLength] - Maximum string length
 * @param {boolean} [options.trim] - If true, reject whitespace-only strings
 * @returns {string} The validated string value
 * @throws {ZaloValidationError} If validation fails
 */
function validateRequiredString(value, fieldName, options = {}) {
  if (!value || typeof value !== 'string') {
    throw new ZaloValidationError(`${fieldName} is required and must be a string`, fieldName);
  }
  if (options.minLength && value.length < options.minLength) {
    throw new ZaloValidationError(`${fieldName} must be at least ${options.minLength} characters`, fieldName);
  }
  if (options.maxLength && value.length > options.maxLength) {
    throw new ZaloValidationError(`${fieldName} must be at most ${options.maxLength} characters`, fieldName);
  }
  if (options.trim && value.trim().length === 0) {
    throw new ZaloValidationError(`${fieldName} cannot be empty/whitespace`, fieldName);
  }
  return value;
}

/**
 * Validate that a value is a valid URL with optional protocol restrictions
 * @param {*} value - Value to validate
 * @param {string} fieldName - Name of the field (used in error messages)
 * @param {Object} [options] - Validation options
 * @param {string[]} [options.protocols] - Allowed protocols (e.g. ['https:'])
 * @returns {string} The validated URL string
 * @throws {ZaloValidationError} If validation fails
 */
function validateUrl(value, fieldName, options = {}) {
  validateRequiredString(value, fieldName);
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new ZaloValidationError(`Invalid URL format for ${fieldName}`, fieldName);
  }
  if (options.protocols && !options.protocols.includes(parsed.protocol)) {
    throw new ZaloValidationError(`${fieldName} must use protocol: ${options.protocols.join(', ')}`, fieldName);
  }
  return value;
}

/**
 * Validate that a value is a valid HTTPS URL
 * @param {*} value - Value to validate
 * @param {string} fieldName - Name of the field (used in error messages)
 * @returns {string} The validated HTTPS URL string
 * @throws {ZaloValidationError} If validation fails
 */
function validateHttpsUrl(value, fieldName) {
  return validateUrl(value, fieldName, { protocols: ['https:'] });
}

/**
 * Validate a chat ID
 * @param {string} chatId - Chat ID to validate
 * @returns {string} The validated chat ID
 * @throws {ZaloValidationError} If chat ID is missing or not a string
 */
function validateChatId(chatId) {
  return validateRequiredString(chatId, 'chat_id');
}

/**
 * Validate message text (1-2000 characters)
 * @param {string} text - Message text to validate
 * @returns {string} The validated message text
 * @throws {ZaloValidationError} If text is invalid or out of length bounds
 */
function validateMessageText(text) {
  validateRequiredString(text, 'text', { maxLength: 2000 });
  return text;
}

/**
 * Validate a webhook secret token (8-256 characters)
 * @param {string} secret - Secret token to validate
 * @returns {string} The validated secret token
 * @throws {ZaloValidationError} If token is missing or outside length bounds
 */
function validateSecretToken(secret) {
  validateRequiredString(secret, 'secretToken', { minLength: 8, maxLength: 256 });
  return secret;
}

/**
 * Validate a chat action against allowed values
 * @param {string} action - Action to validate
 * @returns {string} The validated action
 * @throws {ZaloValidationError} If action is invalid
 */
function validateAction(action) {
  const VALID_ACTIONS = ['typing', 'upload_photo'];
  validateRequiredString(action, 'action');
  if (!VALID_ACTIONS.includes(action)) {
    throw new ZaloValidationError(`Invalid action: '${action}'. Must be one of: ${VALID_ACTIONS.join(', ')}`, 'action');
  }
  return action;
}

module.exports = {
  validateRequiredString,
  validateUrl,
  validateHttpsUrl,
  validateChatId,
  validateMessageText,
  validateSecretToken,
  validateAction,
};
