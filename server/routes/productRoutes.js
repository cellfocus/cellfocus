const express = require('express');
const router = express.Router();
const repo = require('../storage');
const { requireAdminAuth } = require('../middleware/security');

// GET all products (Public store catalog)
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const products = await repo.getAllProducts(category);
    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single product (Public)
router.get('/:id', async (req, res) => {
  try {
    const product = await repo.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create product (Admin Protected)
router.post('/', requireAdminAuth, async (req, res) => {
  try {
    const { name, category, price, image, image2, image3, image4, images, details, stock, isBestSeller, isHotDeal, isOnSale, originalPrice, specs, displayOrder, categoryOrder, colors } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Name and price are required' });
    }
    const newProduct = await repo.createProduct({
      name,
      category,
      price,
      image,
      image2,
      image3,
      image4,
      images,
      details,
      stock,
      isOnSale: Boolean(isOnSale),
      originalPrice: Number(originalPrice) || 0,
      specs: specs || '',
      isBestSeller: Boolean(isBestSeller),
      isHotDeal: Boolean(isHotDeal),
      displayOrder: displayOrder !== undefined ? Number(displayOrder) : undefined,
      categoryOrder: categoryOrder !== undefined ? Number(categoryOrder) : undefined,
      colors: Array.isArray(colors) ? colors : [],
    });
    res.status(201).json({ success: true, message: 'Product created successfully', data: newProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH update product ordering numbers (Admin Protected)
router.patch('/:id/order', requireAdminAuth, async (req, res) => {
  try {
    const { displayOrder, categoryOrder } = req.body;
    const patchData = {};
    if (displayOrder !== undefined) patchData.displayOrder = Number(displayOrder);
    if (categoryOrder !== undefined) patchData.categoryOrder = Number(categoryOrder);
    const updated = await repo.updateProduct(req.params.id, patchData);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product ordering updated', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update product (Admin Protected)
router.put('/:id', requireAdminAuth, async (req, res) => {
  try {
    const updated = await repo.updateProduct(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product updated successfully', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH toggle bestseller status (Admin Protected)
router.patch('/:id/bestseller', requireAdminAuth, async (req, res) => {
  try {
    const product = await repo.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const current = Boolean(product.isBestSeller);
    const updated = await repo.updateProduct(req.params.id, { isBestSeller: !current });
    res.json({ success: true, message: `Best Seller ${!current ? 'enabled' : 'disabled'}`, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH toggle hot deal status (Admin Protected)
router.patch('/:id/hotdeal', requireAdminAuth, async (req, res) => {
  try {
    const product = await repo.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const newStatus = !product.isHotDeal;
    const updated = await repo.updateProduct(req.params.id, { isHotDeal: newStatus });
    res.json({
      success: true,
      message: newStatus ? 'Activated as featured Hot Deal of the Week!' : 'Hot Deal deactivated',
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH toggle sale status (Admin Protected)
router.patch('/:id/onsale', requireAdminAuth, async (req, res) => {
  try {
    const product = await repo.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const current = Boolean(product.isOnSale);
    const updated = await repo.updateProduct(req.params.id, { isOnSale: !current });
    res.json({ success: true, message: `Sale status ${!current ? 'enabled' : 'disabled'}`, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE product (Admin Protected)
router.delete('/:id', requireAdminAuth, async (req, res) => {
  try {
    const deleted = await repo.deleteProduct(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted successfully', data: deleted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
