/**
 * @author  Hoang Khac Phuc
 * @email   hoangkhacphuc.dev@gmail.com
 * @github  https://github.com/hoangkhacphuc
 */

/**
 * Base error class for Zalo Bot SDK
 */
class ZaloBotError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Zalo API Error mapped directly from Zalo Bot error responses
 */
class ZaloApiError extends ZaloBotError {
  constructor(errorData) {
    const errorCode = errorData?.error || errorData?.error_code || -1;
    const rawMessage = errorData?.message || 'Unknown Zalo API error';
    const englishMessage = ZaloApiError.getErrorMessage(errorCode) || rawMessage;

    super(`[Zalo API Error ${errorCode}]: ${englishMessage}`, {
      code: errorCode,
      rawMessage,
      ...errorData
    });
    this.code = errorCode;
    this.rawMessage = rawMessage;
  }

  static getErrorMessage(code) {
    const errorMap = {
      0: 'Success',
      "-1": 'Unknown error from Zalo Bot service',
      "-2": 'Invalid request parameters',
      "-3": 'Access token is invalid or expired',
      "-4": 'Application does not have permission for this feature',
      "-5": 'Invalid secret key or webhook signature',
      "-6": 'Zalo Bot account is locked or disabled',
      "-7": 'User blocked the bot or has not interacted yet',
      "-8": 'File or media payload exceeds maximum allowed size',
      "-9": 'Rate limit exceeded, please slow down requests',
      "-10": 'Unsupported request or endpoint not found',
      "-11": 'Target user not found',
      "-12": 'Request timed out waiting for upstream server',
      "-13": 'Failed to parse payload content structure'
    };
    return errorMap[String(code)] || null;
  }
}

/**
 * Zalo Auth Error (Missing / Invalid Token or Signature)
 */
class ZaloAuthError extends ZaloBotError {
  constructor(message = 'Access token is missing or expired', details = {}) {
    super(message, details);
  }
}

/**
 * Zalo Validation Error (Payload validation fails before request)
 */
class ZaloValidationError extends ZaloBotError {
  constructor(message = 'Invalid request payload or missing required fields', details = {}) {
    super(message, details);
  }
}

module.exports = {
  ZaloBotError,
  ZaloApiError,
  ZaloAuthError,
  ZaloValidationError
};
