// WhatsApp Notification Service for CellFocus
// Normalizes Pakistani phone numbers and formats/dispatches automated messages

const cleanWhatsAppPhone = (raw) => {
  if (!raw) return '';
  let digits = String(raw).replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.substring(2);
  if (digits.startsWith('920') && digits.length >= 13) digits = '92' + digits.substring(3);
  if (digits.startsWith('0') && digits.length >= 10 && digits.length <= 11) digits = '92' + digits.substring(1);
  if (digits.length === 10 && digits.startsWith('3')) digits = '92' + digits;
  return digits;
};

const formatOrderMessage = (order, type = 'Placed') => {
  const customerName = order.customer?.name || 'Customer';
  const customerAddress = order.customer?.address || 'N/A';
  const customerCity = order.customer?.city || '';
  const totalAmount = Number(order.total || 0).toLocaleString();
  const itemsList = (order.items || [])
    .map((it) => {
      const color = it.selectedColor || it.color;
      return `• ${it.name}${color ? ` [Color: ${color}]` : ''} (Qty: ${it.qty}) - Rs. ${(it.price * it.qty).toLocaleString()}`;
    })
    .join('\n');

  if (type === 'Placed') {
    return `Assalam-o-Alaikum *${customerName}*! 📦✨\n\nThank you for shopping at *CellFocus*! Your order has been *PLACED SUCCESSFULLY*! 🎉\n\n*Order ID:* #${order.orderId}\n*Status:* Pending Confirmation\n\n*Items Ordered:*\n${itemsList}\n\n*Total Amount:* Rs. ${totalAmount} PKR\n*Delivery Address:* ${customerAddress}${customerCity ? ', ' + customerCity : ''}\n\nOur team is packing your items for swift dispatch. If you need any assistance, reply to this WhatsApp message or call our official hotline at 0326 9589597.\n\n*CellFocus* — Premium Tech & Fast Chargers`;
  }

  if (type === 'Dispatched' || type === 'Dispached' || type === 'Delivered') {
    return `Assalam-o-Alaikum *${customerName}*! 🚚📦✨\n\nGreat news! Your CellFocus order *#${order.orderId}* has been *DISPATCHED*! 🎉\n\nOur courier rider is on the way with your package.\n\n*Order Summary:*\n${itemsList}\n\n*Total Due (COD):* Rs. ${totalAmount} PKR\n*Delivery Address:* ${customerAddress}${customerCity ? ', ' + customerCity : ''}\n\nOur courier/rider will contact you soon. If you need any assistance, feel free to reply right here on WhatsApp or call our hotline at 0326 9589597.\n\n*CellFocus* — Premium Tech & Fast Chargers`;
  }

  if (type === 'Shipped') {
    return `Assalam-o-Alaikum *${customerName}*! 📦✨\n\nYour CellFocus order *#${order.orderId}* has been *SHIPPED* and processed for delivery!\n\n*Order Summary:*\n${itemsList}\n\n*Total Due:* Rs. ${totalAmount} PKR\n*Delivery Address:* ${customerAddress}${customerCity ? ', ' + customerCity : ''}\n\nWe will notify you as soon as it is out with the rider. CellFocus Hotline: 0326 9589597.`;
  }

  if (type === 'Return') {
    return `Assalam-o-Alaikum *${customerName}*! 📦\n\nYour CellFocus order *#${order.orderId}* status has been updated to *RETURN*.\n\nIf you have any questions or require support, reply to this message or contact 0326 9589597.\n\n*CellFocus* — Premium Tech & Fast Chargers`;
  }

  return `Assalam-o-Alaikum *${customerName}*! Your CellFocus order #${order.orderId} status is now: *${type}*.\nTotal: Rs. ${totalAmount} PKR.`;
};

// Generates direct wa.me URL for browser / admin panel
const getWhatsAppUrl = (order, type = 'Placed') => {
  const phone = cleanWhatsAppPhone(order.customer?.phone);
  if (!phone) return null;
  const message = formatOrderMessage(order, type);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
};

const baileysManager = require('./baileysService');

// Automated backend WhatsApp sender (Baileys Node.js, Meta Cloud API, UltraMsg, or generic gateway)
const sendAutomatedWhatsApp = async (order, type = 'Placed') => {
  const phone = cleanWhatsAppPhone(order.customer?.phone);
  if (!phone) {
    console.warn('[WhatsApp] Skipped: Customer phone missing on order #' + order.orderId);
    return { success: false, reason: 'Phone number missing' };
  }

  const message = formatOrderMessage(order, type);

  // 1. Primary: Baileys Node.js Multi-Device Bot (supports multi-worker IPC + auto-reconnect)
  let baileysFailureReason = null;
  if (baileysManager) {
    const baileysRes = await baileysManager.sendTextMessage(phone, message);
    if (baileysRes?.success) {
      console.log(`[WhatsApp] Sent automatically via Baileys to +${phone} (Order #${order.orderId})`);
      return { success: true, provider: 'baileys', data: baileysRes };
    }
    baileysFailureReason = baileysRes?.reason || baileysRes?.error || null;
    console.warn(`[WhatsApp] Baileys send attempt warning: ${baileysFailureReason || 'unknown error'}`);
  }

  // 1. Meta WhatsApp Cloud API (if configured)
  const metaToken = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (metaToken && metaPhoneId) {
    try {
      const res = await fetch(`https://graph.facebook.com/v18.0/${metaPhoneId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${metaToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: { body: message },
        }),
      });
      const metaData = await res.json();
      console.log(`[WhatsApp] Meta Cloud API sent to ${phone}:`, metaData);
      return { success: true, provider: 'meta', data: metaData };
    } catch (err) {
      console.error('[WhatsApp] Meta Cloud API error:', err.message);
    }
  }

  // 2. Generic Gateway or UltraMsg / Green-API (if configured)
  const gatewayUrl = process.env.WHATSAPP_GATEWAY_URL;
  const gatewayToken = process.env.WHATSAPP_GATEWAY_TOKEN;
  if (gatewayUrl) {
    try {
      const res = await fetch(gatewayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(gatewayToken ? { Authorization: `Bearer ${gatewayToken}` } : {}),
        },
        body: JSON.stringify({
          to: phone,
          phone: phone,
          message: message,
          body: message,
        }),
      });
      const gwData = await res.json();
      console.log(`[WhatsApp] Gateway sent to ${phone}:`, gwData);
      return { success: true, provider: 'gateway', data: gwData };
    } catch (err) {
      console.error('[WhatsApp] Gateway error:', err.message);
    }
  }

  // No active provider sent the message
  const liveState = baileysManager?.getStatus?.() || { status: baileysManager?.status || 'unavailable', lastError: baileysManager?.lastError };
  const botStatus = liveState.status || 'unavailable';
  const lastErr = liveState.lastError ? ` (${liveState.lastError})` : '';
  const finalReason = baileysFailureReason || `WhatsApp bot is ${botStatus}${lastErr}`;
  console.warn(
    `[WhatsApp] Not sent automatically for Order #${order.orderId} (+${phone}) — ${finalReason}`
  );

  return {
    success: false,
    provider: 'none',
    reason: finalReason,
    phone,
    orderId: order.orderId,
    type,
    directUrl: `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
  };
};

module.exports = {
  cleanWhatsAppPhone,
  formatOrderMessage,
  getWhatsAppUrl,
  sendAutomatedWhatsApp,
};

