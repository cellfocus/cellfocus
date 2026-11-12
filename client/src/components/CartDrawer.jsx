import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, CheckCircle2, User, Phone, MapPin, Mail, Truck } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { ENDPOINTS } from '../config/api';

const API_ORDERS = ENDPOINTS.ORDERS;

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  initialStep = 'cart',
  onOpenTracking
}) {
  const { formatPrice } = useCurrency();
  const [step, setStep] = useState(initialStep); // 'cart' | 'checkout' | 'success'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  // Customer form state
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: ''
  });

  // Lock body scroll when cart is open & sync step
  useEffect(() => {
    if (isOpen) {
      setStep(initialStep || 'cart');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialStep]);

  // Construct instant WhatsApp message for customer order
  const getWhatsAppOrderUrl = (order) => {
    if (!order) return '';
    const itemsText = (order.items || [])
      .map((it) => `• ${it.name}${it.selectedColor ? ` [Color: ${it.selectedColor}]` : ''} (Qty: ${it.qty}) - Rs. ${(it.price * it.qty).toLocaleString()}`)
      .join('\n');
    const msg = `Assalam-o-Alaikum CellFocus! 📦✨\n\nI just placed an order on your website:\n\n*Order ID:* #${order.orderId}\n*Customer:* ${order.customer?.name || customer.name}\n*Phone:* ${order.customer?.phone || customer.phone}\n*Address:* ${order.customer?.address || customer.address}, ${order.customer?.city || customer.city}\n\n*Items Ordered:*\n${itemsText}\n\n*Total Amount:* Rs. ${Number(order.total).toLocaleString()} PKR\n\nPlease confirm my order and share delivery updates. Thank you!`;
    return `https://wa.me/923269589597?text=${encodeURIComponent(msg)}`;
  };

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const shipping = subtotal > 2000 || subtotal === 0 ? 0 : 250;
  const total = subtotal + shipping;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!customer.name || !customer.phone || !customer.address) {
      alert('Please fill in your name, phone, and delivery address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const normalizedItems = cartItems.map((item) => ({
        ...item,
        selectedColor: item.selectedColor || item.color || null,
      }));
      const res = await fetch(API_ORDERS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer,
          items: normalizedItems,
          subtotal,
          shipping,
          total,
        }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(`Order API unreachable (HTTP ${res.status})`);
      }
      const data = await res.json();
      if (res.ok && data.success) {
        setPlacedOrder({
          ...data.data,
          whatsappNoticeUrl: data.whatsappNoticeUrl || null,
          whatsappAutoSent: Boolean(data.whatsappAutoSent),
        });
        setStep('success');
        onClearCart();
      } else {
        alert('Order failed: ' + (data.message || `HTTP ${res.status}`));
      }
    } catch (err) {
      alert(err?.message || 'Could not submit order. Please check backend connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep('cart');
    setPlacedOrder(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={handleClose}
        className="absolute inset-0 bg-neutral-900/40 backdrop-blur-xs transition-opacity duration-300"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#f6f5f0] border-l border-[#e2dfd5] shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="p-6 border-b border-[#e2dfd5] flex items-center justify-between bg-white/60">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#1c1b18]" />
              <h2 className="text-base font-semibold text-[#1c1b18] tracking-tight">
                {step === 'checkout' ? 'Delivery Details' : step === 'success' ? 'Order Confirmed' : 'Your Cart'}
              </h2>
              {step === 'cart' && (
                <span className="text-xs text-[#78746a] font-mono">({cartItems.reduce((a, b) => a + b.qty, 0)})</span>
              )}
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-full text-[#78746a] hover:text-[#1c1b18] hover:bg-[#eeebe2] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            
            {/* Success View */}
            {step === 'success' && placedOrder && (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-4">
                <CheckCircle2 className="w-14 h-14 text-teal-600 animate-bounce" />
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-[#78746a]">
                    Tracking ID: {placedOrder.orderId}
                  </span>
                  <h3 className="text-lg font-bold text-[#1c1b18] mt-1">Thank You, {placedOrder.customer.name}!</h3>
                  <p className="text-xs text-[#78746a] max-w-xs mt-2">
                    Your order has been registered in our tracking database. You can monitor its status in the Admin Tracking Portal.
                  </p>
                </div>

                <div className="w-full p-4 rounded-xl bg-white border border-[#e5e2d6] text-left text-xs space-y-2 font-mono">
                  <div className="flex justify-between text-[#78746a]">
                    <span>Status:</span>
                    <span className="text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded">{placedOrder.status}</span>
                  </div>
                  <div className="flex justify-between text-[#78746a]">
                    <span>Total Paid:</span>
                    <span className="text-[#1c1b18] font-bold">{formatPrice(placedOrder.total)}</span>
                  </div>
                  <div className="flex justify-between text-[#78746a]">
                    <span>Deliver to:</span>
                    <span className="text-[#1c1b18] truncate max-w-[180px]">{placedOrder.customer.address}</span>
                  </div>
                  {Array.isArray(placedOrder.items) && placedOrder.items.length > 0 && (
                    <div className="border-t border-[#f0eee6] pt-2 space-y-1 font-sans">
                      {placedOrder.items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2 text-[11px] text-[#4a473f]">
                          <span className="truncate">
                            {it.name}
                            {it.selectedColor ? ` (${it.selectedColor})` : ''} ×{it.qty}
                          </span>
                          <span className="font-mono shrink-0">{formatPrice(it.price * it.qty)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {placedOrder.whatsappAutoSent && (
                  <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 w-full">
                    WhatsApp confirmation sent from CellFocus to <strong>{placedOrder.customer.phone}</strong>.
                  </p>
                )}

                <div className="w-full space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleClose();
                      if (onOpenTracking) onOpenTracking(placedOrder.orderId);
                    }}
                    className="w-full py-2.5 rounded-xl border border-[#dedad0] bg-white hover:bg-[#faf8f4] text-[#1c1b18] text-xs font-semibold cursor-pointer transition flex items-center justify-center gap-1.5"
                  >
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <span>Track Order Live</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-full py-3 rounded-xl bg-[#1c1b18] hover:bg-[#32302b] text-[#f6f5f0] text-xs font-semibold cursor-pointer transition"
                  >
                    Return to Store
                  </button>
                </div>
              </div>
            )}

            {/* Checkout Form View */}
            {step === 'checkout' && (
              <form onSubmit={handlePlaceOrder} className="space-y-3.5" autoComplete="off">
                {/* Dummy inputs to absorb browser autofill heuristics */}
                <input type="text" name="prevent_autofill" style={{ display: 'none' }} tabIndex="-1" />
                <input type="password" name="prevent_autofill_pwd" style={{ display: 'none' }} tabIndex="-1" />
                <p className="text-xs text-[#78746a]">
                  Enter your shipping details for rapid 24h dispatch:
                </p>

                <div>
                  <label className="block text-[11px] font-semibold text-[#1c1b18] mb-1 flex items-center gap-1">
                    <User className="w-3 h-3 text-[#78746a]" /> Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    name="cf_receiver_name"
                    id="cf_receiver_name"
                    placeholder="Enter your full name"
                    autoComplete="new-password"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#dedad0] bg-white text-[#1c1b18] placeholder:text-[#a09c91] focus:outline-none focus:border-[#1c1b18]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#1c1b18] mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-[#78746a]" /> Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    name="cf_receiver_email"
                    id="cf_receiver_email"
                    placeholder="name@example.com"
                    autoComplete="new-password"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#dedad0] bg-white text-[#1c1b18] placeholder:text-[#a09c91] focus:outline-none focus:border-[#1c1b18]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#1c1b18] mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-[#78746a]" /> Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    name="cf_receiver_phone"
                    id="cf_receiver_phone"
                    placeholder="03XX XXXXXXX"
                    autoComplete="new-password"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#dedad0] bg-white text-[#1c1b18] placeholder:text-[#a09c91] focus:outline-none focus:border-[#1c1b18]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#1c1b18] mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#78746a]" /> Shipping Address & City
                  </label>
                  <input
                    type="text"
                    required
                    value={customer.address}
                    onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                    name="cf_receiver_address"
                    id="cf_receiver_address"
                    placeholder="House / Street / Apartment details"
                    autoComplete="new-password"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#dedad0] bg-white text-[#1c1b18] placeholder:text-[#a09c91] focus:outline-none focus:border-[#1c1b18] mb-2"
                  />
                  <input
                    type="text"
                    required
                    value={customer.city}
                    onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                    name="cf_receiver_city"
                    id="cf_receiver_city"
                    placeholder="City (e.g. Lahore, Karachi, Peshawar)"
                    autoComplete="new-password"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#dedad0] bg-white text-[#1c1b18] placeholder:text-[#a09c91] focus:outline-none focus:border-[#1c1b18]"
                  />
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#e5e2d6] space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#78746a]">
                    Order Summary ({cartItems.reduce((a, b) => a + b.qty, 0)} items)
                  </p>
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {cartItems.map((it) => (
                      <div key={it.cartKey || it.id} className="flex items-center justify-between gap-2 text-[11px] text-[#1c1b18]">
                        <span className="truncate">
                          {it.name}
                          {it.selectedColor && (
                            <span className="ml-1 inline-block px-1.5 py-0.2 rounded bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-semibold">
                              {it.selectedColor}
                            </span>
                          )}
                          <span className="text-[#78746a] ml-1 font-mono">x{it.qty}</span>
                        </span>
                        <span className="font-mono shrink-0">{formatPrice(it.price * it.qty)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('cart')}
                    className="px-4 py-3 rounded-xl border border-[#dedad0] bg-white text-[#4a473f] text-xs font-medium hover:bg-[#eeebe2] transition cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 rounded-xl bg-[#1c1b18] hover:bg-[#32302b] text-[#f6f5f0] text-xs font-semibold tracking-wide flex items-center justify-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Placing Order...' : `Confirm & Place Order (${formatPrice(total)})`}
                  </button>
                </div>
              </form>
            )}

            {/* Cart Items View */}
            {step === 'cart' && (
              cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-[#eeebe2] flex items-center justify-center text-[#78746a]">
                    <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#1c1b18]">Your cart is empty</h3>
                  <p className="text-xs text-[#78746a] max-w-xs">
                    Browse our chargers, handsfree, and AirPods collections to add items.
                  </p>
                  <button
                    onClick={handleClose}
                    className="mt-2 px-4 py-2 rounded-full bg-[#1c1b18] text-[#f6f5f0] text-xs font-medium hover:bg-[#32302b] transition cursor-pointer"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                cartItems.map((item) => {
                  const itemKey = item.cartKey || item.id;
                  return (
                    <div 
                      key={itemKey}
                      className="flex gap-4 p-3.5 bg-white rounded-2xl border border-[#e5e2d6] shadow-2xs items-center justify-between"
                    >
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=300&q=80'}
                        alt={item.name}
                        className="w-16 h-16 rounded-xl object-contain bg-[#f4f2ea] shrink-0 p-1"
                      />

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-[#1c1b18] truncate">{item.name}</h4>
                        {item.selectedColor && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded font-medium mt-0.5">
                            <span>Color:</span>
                            <strong>{item.selectedColor}</strong>
                          </span>
                        )}
                        <p className="text-xs font-mono text-[#78746a] mt-0.5">{formatPrice(item.price)}</p>

                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center border border-[#e2dfd5] rounded-lg bg-[#f6f5f0]">
                            <button
                              onClick={() => onUpdateQty(itemKey, -1)}
                              className="p-1 hover:bg-[#eeebe2] text-[#4a473f] rounded-l-lg transition cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 text-xs font-mono font-medium text-[#1c1b18]">{item.qty}</span>
                            <button
                              onClick={() => onUpdateQty(itemKey, 1)}
                              className="p-1 hover:bg-[#eeebe2] text-[#4a473f] rounded-r-lg transition cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => onRemoveItem(itemKey)}
                        className="p-2 text-[#78746a] hover:text-red-600 transition cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4 stroke-[1.6]" />
                      </button>
                    </div>
                  );
                })
              )
            )}

          </div>

          {/* Footer Summary */}
          {step === 'cart' && cartItems.length > 0 && (
            <div className="p-6 border-t border-[#e2dfd5] bg-white/70 space-y-3">
              <div className="space-y-1.5 text-xs text-[#78746a]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono text-[#1c1b18]">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-mono text-[#1c1b18]">
                    {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                  </span>
                </div>
                <div className="border-t border-[#e2dfd5] pt-2 flex justify-between text-sm font-bold text-[#1c1b18]">
                  <span>Total</span>
                  <span className="font-mono">{formatPrice(total)}</span>
                </div>
              </div>

              <button
                onClick={() => setStep('checkout')}
                className="w-full py-3 rounded-xl bg-[#1c1b18] hover:bg-[#32302b] text-[#f6f5f0] text-xs font-semibold tracking-wide flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
