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
    const vietnameseMessage = ZaloApiError.getErrorMessage(errorCode) || rawMessage;

    super(`[Zalo API Error ${errorCode}]: ${vietnameseMessage}`, {
      code: errorCode,
      rawMessage,
      ...errorData
    });
    this.code = errorCode;
    this.rawMessage = rawMessage;
  }

  static getErrorMessage(code) {
    const errorMap = {
      0: 'Thành công (Success)',
      "-1": 'Lỗi không xác định từ hệ thống Zalo',
      "-2": 'Dữ liệu truyền vào không hợp lệ (Invalid parameters)',
      "-3": 'Access Token không hợp lệ hoặc đã hết hạn',
      "-4": 'Ứng dụng không có quyền truy cập tính năng này',
      "-5": 'Secret Key hoặc chữ ký xác thực không hợp lệ',
      "-6": 'Tài khoản Zalo Bot bị khóa hoặc vô hiệu hóa',
      "-7": 'Người dùng đã chặn bot hoặc chưa tương tác với bot',
      "-8": 'File hoặc media upload vượt quá kích thước cho phép',
      "-9": 'Đã vượt quá giới hạn tần suất gửi tin (Rate Limit Exceeded)',
      "-10": 'Yêu cầu không được hỗ trợ hoặc endpoint không tồn tại',
      "-11": 'Người dùng không tồn tại (User not found)',
      "-12": 'Hết hạn thời gian phản hồi (Request Timeout)',
      "-13": 'Lỗi phân giải định dạng nội dung gửi đi'
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
