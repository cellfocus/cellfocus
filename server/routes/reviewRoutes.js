const express = require('express');
const router = express.Router();
const repo = require('../storage');
const { requireAdminAuth, generalApiLimiter } = require('../middleware/security');

/**
 * GET /api/reviews
 * Fetch all client reviews (Public)
 */
router.get('/', async (req, res) => {
  try {
    const reviews = await repo.getAllReviews();
    return res.json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (err) {
    console.error('[Review Route] Error fetching reviews:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch reviews.',
    });
  }
});

/**
 * POST /api/reviews
 * Submit a new customer review (Public, Rate Limited)
 */
router.post('/', generalApiLimiter, async (req, res) => {
  try {
    const { name, rating, comment, city, productName } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Review comment/feedback is required.',
      });
    }

    const numRating = Number(rating) || 5;
    if (numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5 stars.',
      });
    }

    const newReview = await repo.createReview({
      name: name && name.trim() ? name.trim() : 'Customer in Pakistan',
      rating: numRating,
      comment: comment.trim(),
      city: city && city.trim() ? city.trim() : 'Pakistan',
      verified: true,
      productName: productName && productName.trim() ? productName.trim() : 'CellFocus Mobile Accessories',
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you for your feedback! Your review has been published.',
      data: newReview,
    });
  } catch (err) {
    console.error('[Review Route] Error creating review:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to submit review.',
    });
  }
});

/**
 * PUT /api/reviews/:id
 * Edit an existing client comment / rating / status (Admin Protected)
 */
router.put('/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, rating, comment, city, verified, productName } = req.body;

    if (comment !== undefined && !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Review comment cannot be empty.',
      });
    }

    const patchData = {};
    if (name !== undefined) patchData.name = name.trim();
    if (rating !== undefined) patchData.rating = Math.min(5, Math.max(1, Number(rating) || 5));
    if (comment !== undefined) patchData.comment = comment.trim();
    if (city !== undefined) patchData.city = city.trim();
    if (verified !== undefined) patchData.verified = Boolean(verified);
    if (productName !== undefined) patchData.productName = productName.trim();

    const updated = await repo.updateReview(id, patchData);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: `Review #${id} not found.`,
      });
    }

    return res.json({
      success: true,
      message: 'Client review updated successfully.',
      data: updated,
    });
  } catch (err) {
    console.error('[Review Route] Error updating review:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to update review.',
    });
  }
});

/**
 * DELETE /api/reviews/:id
 * Delete a client review (Admin Protected)
 */
router.delete('/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await repo.deleteReview(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `Review #${id} not found.`,
      });
    }

    return res.json({
      success: true,
      message: 'Review deleted successfully.',
      data: deleted,
    });
  } catch (err) {
    console.error('[Review Route] Error deleting review:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to delete review.',
    });
  }
});

module.exports = router;

