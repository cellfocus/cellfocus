const express = require('express');
const router = express.Router();
const cloudinaryService = require('../services/cloudinaryService');
const { requireAdminAuth, uploadLimiter } = require('../middleware/security');

// Dedicated scoped body parser for image upload payloads (up to 15mb)
router.use(express.json({ limit: '15mb' }));
router.use(express.urlencoded({ limit: '15mb', extended: true }));

/**
 * POST /api/upload/image
 * Uploads an image (base64 or remote URL) directly to Cloudinary
 * Protected: Admin session / passcode required + Rate limited
 */
router.post('/image', requireAdminAuth, uploadLimiter, async (req, res) => {
  try {
    const { image, folder, public_id } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'No image data provided. Please provide a base64 data URI or image URL.',
      });
    }

    const uploadOptions = {
      folder: folder || 'cellfocus/products',
    };
    if (public_id) {
      uploadOptions.public_id = public_id;
    }

    const result = await cloudinaryService.uploadImage(image, uploadOptions);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || 'Failed to upload image to Cloudinary.',
      });
    }

    return res.json({
      success: true,
      message: 'Image uploaded to Cloudinary successfully!',
      url: result.url,
      publicId: result.publicId,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    });
  } catch (err) {
    console.error('[Upload Route] Error uploading image:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error during image upload.',
    });
  }
});

/**
 * POST /api/upload/delete
 * Deletes an image from Cloudinary by its public_id
 * Protected: Admin session / passcode required + Rate limited
 */
router.post('/delete', requireAdminAuth, uploadLimiter, async (req, res) => {
  try {
    const { publicId } = req.body;
    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'publicId is required.',
      });
    }

    const result = await cloudinaryService.deleteImage(publicId);
    return res.json(result);
  } catch (err) {
    console.error('[Upload Route] Error deleting image:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error during image deletion.',
    });
  }
});

module.exports = router;
