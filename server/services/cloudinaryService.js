const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'ros12wj5',
  api_key: process.env.CLOUDINARY_API_KEY || '483987842624792',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'kz4wPvcKx57JbKnZQW9xhkXGXjU',
  secure: true,
});

class CloudinaryService {
  constructor() {
    this.cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'ros12wj5';
    this.apiKey = process.env.CLOUDINARY_API_KEY || '483987842624792';
  }

  /**
   * Upload an image (base64 data URI, buffer, or remote URL) to Cloudinary
   * @param {string} fileData - Base64 data URI or remote image URL
   * @param {object} options - Upload options (folder, tags, transformations)
   */
  async uploadImage(fileData, options = {}) {
    try {
      if (!fileData) {
        throw new Error('No image data provided for upload.');
      }

      const defaultOptions = {
        folder: options.folder || 'cellfocus/products',
        resource_type: 'image',
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
      };

      const uploadOptions = { ...defaultOptions, ...options };
      const result = await cloudinary.uploader.upload(fileData, uploadOptions);

      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
      };
    } catch (err) {
      console.error('[Cloudinary] Upload failed:', err.message);
      return {
        success: false,
        error: err.message || 'Cloudinary upload failed.',
      };
    }
  }

  /**
   * Delete an image from Cloudinary by public ID
   * @param {string} publicId
   */
  async deleteImage(publicId) {
    try {
      if (!publicId) return { success: false, error: 'No publicId provided.' };
      const result = await cloudinary.uploader.destroy(publicId);
      return {
        success: result.result === 'ok',
        result,
      };
    } catch (err) {
      console.error('[Cloudinary] Delete failed:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Verify Cloudinary connection
   */
  async testConnection() {
    try {
      const pingResult = await cloudinary.api.ping();
      return {
        success: true,
        status: pingResult.status || 'ok',
        cloudName: this.cloudName,
        apiKey: `${this.apiKey.substring(0, 4)}...${this.apiKey.substring(this.apiKey.length - 3)}`,
      };
    } catch (err) {
      console.error('[Cloudinary] Connection test failed:', err.message);
      return {
        success: false,
        error: err.message,
      };
    }
  }

  /**
   * Get public status metadata
   */
  getStatus() {
    return {
      configured: Boolean(this.cloudName && this.apiKey),
      cloudName: this.cloudName,
      maskedApiKey: this.apiKey ? `${this.apiKey.substring(0, 4)}...${this.apiKey.substring(this.apiKey.length - 3)}` : null,
      folder: 'cellfocus/products',
    };
  }
}

const cloudinaryService = new CloudinaryService();
module.exports = cloudinaryService;

