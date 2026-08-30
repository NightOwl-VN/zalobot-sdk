/**
 * Media module - Upload and manage media files
 * Based on Zalo Bot API documentation
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

class MediaModule {
  /**
   * @param {ZaloClient} client - HTTP client instance
   */
  constructor(client) {
    this.client = client;
  }

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

  /**
   * Generic upload method
   * @private
   */
  async _upload(file, options = {}) {
    const type = options.type || 'image';
    let fileStream;
    let filename = options.filename || 'file';

    if (typeof file === 'string') {
      // File path
      if (!fs.existsSync(file)) {
        throw new Error(`File not found: ${file}`);
      }
      fileStream = fs.createReadStream(file);
      filename = path.basename(file);
    } else if (Buffer.isBuffer(file)) {
      // Buffer
      fileStream = file;
    } else {
      throw new Error('file must be a file path string or Buffer');
    }

    const form = new FormData();
    form.append('file', fileStream, { filename });

    const headers = {
      ...form.getHeaders(),
    };

    const endpoint = type === 'image' ? '/me/media/images' : '/me/media/files';

    const response = await this.client.client.post(endpoint, form, { headers });
    return response.data;
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
   * Download media file to local path
   * @param {string} attachmentId - Attachment ID from upload response
   * @param {string} savePath - Local path to save the file
   * @returns {Promise<string>} Saved file path
   */
  async downloadMedia(attachmentId, savePath) {
    if (!savePath || typeof savePath !== 'string') {
      throw new Error('savePath is required');
    }

    const url = await this.getMediaUrl(attachmentId, { redirect: true });

    const response = await this.client.client.get(url, {
      responseType: 'stream',
    });

    const writer = fs.createWriteStream(savePath);
    return new Promise((resolve, reject) => {
      response.data.pipe(writer);
      writer.on('finish', () => resolve(savePath));
      writer.on('error', reject);
    });
  }

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