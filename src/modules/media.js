/**
 * @author  Hoang Khac Phuc
 * @email   hoangkhacphuc.dev@gmail.com
 * @github  https://github.com/hoangkhacphuc
 */

/**
 * Media module - Upload and manage media files
 * Based on Zalo Bot API documentation
 *
 * All HTTP calls go through client.upload() / client.download() which
 * route through the client's error-handling and retry interceptors.
 * Never access the raw axios instance directly.
 */

const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { pipeline } = require('stream');
const { promisify } = require('util');
const FormData = require('form-data');

const pipelineAsync = promisify(pipeline);

/**
 * Private IP ranges used for SSRF protection on download URLs.
 * @private
 */
const PRIVATE_IP_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\./,
  /^localhost$/i,
  /^\[::1\]$/,
  /^\[::ffff:127\./i,
  /^\[::ffff:(10|172\.(1[6-9]|2\d|3[01])|192\.168)\./i,
];

class MediaModule {
  /**
   * @param {ZaloClient} client - HTTP client instance
   */
  constructor(client) {
    this.client = client;
  }

  // ──────────────────────────────────────────────
  //  Public upload helpers
  // ──────────────────────────────────────────────

  /**
   * Upload an image file to Zalo
   * @param {string|Buffer} file - File path or Buffer containing image data
   * @param {Object} [options] - Upload options
   * @param {string} [options.filename] - Custom filename (for Buffer upload)
   * @param {string} [options.type='image'] - Media type: 'image', 'file'
   * @returns {Promise<Object>} { attachment_id, ... }
   * @example
   * const result = await bot.media.uploadImage('/path/to/photo.jpg');
   * await bot.message.sendImage('123456789', result.attachment_id);
   */
  async uploadImage(file, options = {}) {
    return this._upload(file, { ...options, type: 'image' });
  }

  /**
   * Upload a file to Zalo
   * @param {string|Buffer} file - File path or Buffer containing file data
   * @param {Object} [options] - Upload options
   * @param {string} [options.filename] - Custom filename (for Buffer upload)
   * @param {string} [options.type='file'] - Media type: 'image', 'file'
   * @returns {Promise<Object>} { attachment_id, ... }
   * @example
   * const result = await bot.media.uploadFile('/path/to/document.pdf');
   */
  async uploadFile(file, options = {}) {
    return this._upload(file, { ...options, type: 'file' });
  }

  // ──────────────────────────────────────────────
  //  Private implementation
  // ──────────────────────────────────────────────

  /**
   * Generic upload — delegates to client.upload() for the actual HTTP call.
   * @private
   * @param {string|Buffer} file - File path or Buffer
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} API response data
   */
  async _upload(file, options = {}) {
    const type = options.type || 'image';
    let fileStream;
    let filename = options.filename || 'file';

    if (typeof file === 'string') {
      // --- File path: validate existence before attempting upload ---
      if (!fs.existsSync(file)) {
        throw new Error(`File not found: ${file}`);
      }

      const stats = fs.statSync(file);
      if (stats.size === 0) {
        throw new Error(`File is empty: ${file}`);
      }

      fileStream = fs.createReadStream(file);
      filename = path.basename(file);
    } else if (Buffer.isBuffer(file)) {
      if (file.length === 0) {
        throw new Error('Buffer is empty — nothing to upload');
      }
      fileStream = file;
    } else {
      throw new Error('file must be a file path string or Buffer');
    }

    const form = new FormData();
    form.append('file', fileStream, { filename });

    const endpoint = type === 'image' ? 'me/media/images' : 'me/media/files';
    return this.client.upload(endpoint, form);
  }

  /**
   * Get media URL by attachment ID
   * @param {string} attachmentId - Attachment ID from upload response
   * @param {Object} [options] - Options
   * @param {boolean} [options.redirect=false] - Return redirect URL instead of fetching
   * @returns {Promise<string>} Media URL
   */
  async getMediaUrl(attachmentId, options = {}) {
    if (!attachmentId || typeof attachmentId !== 'string') {
      throw new Error('attachmentId is required');
    }

    const result = await this.client.get(`/me/media/${attachmentId}`, {
      ...(options.redirect && { redirect: 'true' }),
    });

    return result.url || result.data?.url || null;
  }

  /**
   * Download media file to local path.
   * Uses client.download() for the HTTP stream, then pipes to disk with
   * full error handling and automatic cleanup of partial files on failure.
   *
   * @param {string} attachmentId - Attachment ID from upload response
   * @param {string} savePath - Local path to save the file
   * @returns {Promise<string>} Saved file path
   */
  async downloadMedia(attachmentId, savePath) {
    if (!attachmentId || typeof attachmentId !== 'string') {
      throw new Error('attachmentId is required');
    }
    if (!savePath || typeof savePath !== 'string') {
      throw new Error('savePath is required');
    }

    // Resolve the remote URL via the Zalo API
    const url = await this.getMediaUrl(attachmentId, { redirect: true });

    if (!url) {
      throw new Error(`No download URL returned for attachment ${attachmentId}`);
    }

    // SSRF protection: ensure the URL points to an external host
    this._validateDownloadUrl(url);

    // Obtain a readable stream from the client (errors surface as rejects)
    const stream = await this.client.download(url);

    try {
      await pipelineAsync(stream, fs.createWriteStream(savePath));
      return savePath;
    } catch (err) {
      // Best-effort cleanup of partial / corrupt file
      try {
        fs.unlinkSync(savePath);
      } catch {
        // File may not have been created yet — ignore
      }
      throw err;
    }
  }

  // ──────────────────────────────────────────────
  //  URL / SSRF validation
  // ──────────────────────────────────────────────

  /**
   * Validate that a download URL is safe to fetch.
   * Blocks private/internal hosts to prevent SSRF attacks.
   * @private
   * @param {string} urlString - Absolute URL to validate
   * @throws {Error} If the URL targets a private/internal host
   */
  _validateDownloadUrl(urlString) {
    let parsed;
    try {
      parsed = new URL(urlString);
    } catch {
      throw new Error(`Invalid download URL: ${urlString}`);
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error(`Download URL must use http or https protocol, got: ${parsed.protocol}`);
    }

    const hostname = parsed.hostname.toLowerCase();

    for (const pattern of PRIVATE_IP_RANGES) {
      if (pattern.test(hostname)) {
        throw new Error(`Download URL must not target a private/internal host: ${hostname}`);
      }
    }
  }

  // ──────────────────────────────────────────────
  //  Static helpers
  // ──────────────────────────────────────────────

  /**
   * Check if a file is a valid image format
   * @param {string} filePath - File path to check
   * @returns {boolean} True if valid image
   */
  static isValidImage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(ext);
  }

  /**
   * Check file size (in bytes)
   * @param {string} filePath - File path
   * @returns {number} File size in bytes
   */
  static getFileSize(filePath) {
    const stats = fs.statSync(filePath);
    return stats.size;
  }

  /**
   * Validate image file (size and format)
   * @param {string} filePath - File path
   * @param {Object} [limits] - Validation limits
   * @param {number} [limits.maxSize=10 * 1024 * 1024] - Max file size (default 10MB)
   * @returns {Object} { valid: boolean, error?: string }
   */
  static validateImage(filePath, limits = {}) {
    const maxSize = limits.maxSize || 10 * 1024 * 1024; // 10MB

    if (!fs.existsSync(filePath)) {
      return { valid: false, error: 'File not found' };
    }

    if (!this.isValidImage(filePath)) {
      return { valid: false, error: 'Invalid image format. Supported: jpg, jpeg, png, gif, bmp, webp' };
    }

    const size = this.getFileSize(filePath);
    if (size > maxSize) {
      return { valid: false, error: `File exceeds maximum size of ${maxSize / (1024 * 1024)}MB` };
    }

    return { valid: true };
  }
}

module.exports = MediaModule;
