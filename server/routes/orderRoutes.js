const express = require('express');
const router = express.Router();
const repo = require('../storage');
const { requireAdminAuth, orderCheckoutLimiter, trackingLimiter } = require('../middleware/security');
const whatsappService = require('../services/whatsappService');
const brevoEmailService = require('../services/brevoEmailService');

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

// GET track order by Order ID (Public Customer Tracking - Rate Limited against enumeration)
router.get('/track/:id', trackingLimiter, async (req, res) => {
  try {
    let queryId = String(req.params.id || '').trim();
    if (!queryId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    // Normalize input (supports "4975", "#CF-4975", "cf-4975", "CF-4975")
    let normalized = queryId.replace(/^#/, '').toUpperCase();
    if (!normalized.startsWith('CF-') && /^\d{4}$/.test(normalized)) {
      normalized = 'CF-' + normalized;
    }

    let order = await repo.getOrderById(normalized);
    if (!order && normalized !== queryId) {
      order = await repo.getOrderById(queryId);
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order #${queryId} could not be found. Please double-check your Order ID.`,
      });
    }

    res.json({
      success: true,
      data: {
        orderId: order.orderId,
        status: order.status || 'Pending',
        createdAt: order.createdAt,
        customer: {
          name: order.customer?.name || 'Customer',
          city: order.customer?.city || '',
          address: order.customer?.address || '',
          phone: order.customer?.phone ? order.customer.phone.replace(/(\d{3})\d+(\d{3})/, '$1****$2') : '',
        },
        items: (order.items || []).map((it) => ({
          name: it.name,
          qty: it.qty,
          price: it.price,
          image: it.image,
          selectedColor: it.selectedColor || it.color || null,
        })),
        subtotal: order.subtotal,
        shipping: order.shipping,
        total: order.total,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create new order (Public: Customer Checkout - Rate Limited against bot spam)
router.post('/', orderCheckoutLimiter, async (req, res) => {
  try {
    const { customer, items, subtotal, shipping, total } = req.body;
    if (!customer || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Customer details and items are required' });
    }
    const normalizedItems = items.map((it) => ({
      ...it,
      selectedColor: it.selectedColor || it.color || null,
    }));
    const order = await repo.createOrder({
      customer,
      items: normalizedItems,
      subtotal,
      shipping: shipping || 0,
      total: total || subtotal,
      status: 'Pending',
    });

    // Auto-dispatch WhatsApp confirmation message from CellFocus to customer
    let waResult = { success: false, reason: 'Not attempted' };
    try {
      waResult = await whatsappService.sendAutomatedWhatsApp(order, 'Placed');
    } catch (waErr) {
      waResult = { success: false, reason: waErr.message };
      console.warn('[WhatsApp] Auto-dispatch failed:', waErr.message);
    }

    // Auto-dispatch Brevo email alerts to Store Admin & Customer
    try {
      brevoEmailService.sendNewOrderAlert(order).catch((emailErr) => {
        console.warn('[Brevo Email] Admin alert failed:', emailErr.message);
      });
      brevoEmailService.sendOrderConfirmationToCustomer(order).catch((emailErr) => {
        console.warn('[Brevo Email] Customer confirmation failed:', emailErr.message);
      });
    } catch (emailErr) {
      console.warn('[Brevo Email] Alert dispatch error:', emailErr.message);
    }

    const whatsappNoticeUrl = whatsappService.getWhatsAppUrl(order, 'Placed');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order,
      whatsappAutoSent: Boolean(waResult?.success),
      whatsappReason: waResult?.reason || null,
      whatsappNoticeUrl,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH / PUT update order status (Admin Protected)
router.patch('/:id/status', requireAdminAuth, async (req, res) => {
  try {
    const rawStatus = String(req.body.status || '').trim();
    const status = rawStatus === 'Dispached' ? 'Dispatched' : rawStatus;
    const validStatuses = ['Pending', 'Dispatched', 'Return'];
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

    // Auto-dispatch WhatsApp & Email notice when marked as Dispatched or Return
    let waResult = { success: false, reason: 'No message required for Pending' };
    if (status === 'Dispatched' || status === 'Return') {
      try {
        waResult = await whatsappService.sendAutomatedWhatsApp(updated, status);
      } catch (waErr) {
        waResult = { success: false, reason: waErr.message };
        console.warn(`[WhatsApp] ${status} auto-dispatch failed:`, waErr.message);
      }

      try {
        brevoEmailService.sendOrderStatusEmail(updated, status).catch((emailErr) => {
          console.warn(`[Brevo Email] ${status} email failed:`, emailErr.message);
        });
      } catch (emailErr) {
        console.warn(`[Brevo Email] ${status} dispatch error:`, emailErr.message);
      }
    }

    const whatsappNoticeUrl = whatsappService.getWhatsAppUrl(updated, status);

    res.json({
      success: true,
      message: 'Order status updated',
      data: updated,
      whatsappAutoSent: Boolean(waResult?.success),
      whatsappReason: waResult?.reason || null,
      whatsappNoticeUrl,
    });
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

