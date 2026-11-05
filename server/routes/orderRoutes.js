const express = require('express');
const router = express.Router();
const repo = require('../storage');
const { requireAdminAuth } = require('../middleware/security');

// GET all orders (Admin Protected - PII Protection)
router.get('/', requireAdminAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const orders = await repo.getAllOrders(status);
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single order (Admin Protected - PII Protection)
router.get('/:id', requireAdminAuth, async (req, res) => {
  try {
    const order = await repo.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create new order (Public: Customer Checkout)
router.post('/', async (req, res) => {
  try {
    const { customer, items, subtotal, shipping, total } = req.body;
    if (!customer || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Customer details and items are required' });
    }
    const order = await repo.createOrder({
      customer,
      items,
      subtotal,
      shipping: shipping || 0,
      total: total || subtotal,
      status: 'Pending',
    });
    res.status(201).json({ success: true, message: 'Order created successfully', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH / PUT update order status (Admin Protected)
router.patch('/:id/status', requireAdminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }
    const updated = await repo.updateOrderStatus(req.params.id, status);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, message: 'Order status updated', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE order (Admin Protected)
router.delete('/:id', requireAdminAuth, async (req, res) => {
  try {
    const deleted = await repo.deleteOrder(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, message: 'Order removed', data: deleted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

