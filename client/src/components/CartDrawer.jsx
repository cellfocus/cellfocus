import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, CheckCircle2, User, Phone, MapPin, Mail } from 'lucide-react';

const API_ORDERS = 'http://localhost:5000/api/orders';

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  initialStep = 'cart'
}) {
  const [step, setStep] = useState(initialStep); // 'cart' | 'checkout' | 'success'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  // Customer form state
  const [customer, setCustomer] = useState({
    name: 'Sarah Connor',
    email: 'sarah.c@example.com',
    phone: '+1 (555) 019-2834',
    address: '450 North Beverly Drive',
    city: 'Los Angeles, CA'
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

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const shipping = subtotal > 35 || subtotal === 0 ? 0 : 4.99;
  const total = subtotal + shipping;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!customer.name || !customer.phone || !customer.address) {
      alert('Please fill in your name, phone, and delivery address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(API_ORDERS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer,
          items: cartItems,
          subtotal,
          shipping,
          total,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPlacedOrder(data.data);
        setStep('success');
        onClearCart();
      } else {
        alert('Order failed: ' + data.message);
      }
    } catch (err) {
      alert('Could not submit order. Please check backend connection.');
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

                <div className="w-full p-4 rounded-xl bg-white border border-[#e5e2d6] text-left text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between text-[#78746a]">
                    <span>Status:</span>
                    <span className="text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded">{placedOrder.status}</span>
                  </div>
                  <div className="flex justify-between text-[#78746a]">
                    <span>Total Paid:</span>
                    <span className="text-[#1c1b18] font-bold">${placedOrder.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#78746a]">
                    <span>Deliver to:</span>
                    <span className="text-[#1c1b18] truncate max-w-[180px]">{placedOrder.customer.address}</span>
                  </div>
                </div>

                <button
                  onClick={handleClose}
                  className="w-full py-3 rounded-xl bg-[#1c1b18] hover:bg-[#32302b] text-[#f6f5f0] text-xs font-semibold cursor-pointer transition"
                >
                  Return to Store
                </button>
              </div>
            )}

            {/* Checkout Form View */}
            {step === 'checkout' && (
              <form onSubmit={handlePlaceOrder} className="space-y-3.5">
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
                    className="w-full text-xs p-2.5 rounded-xl border border-[#dedad0] bg-white text-[#1c1b18] focus:outline-none focus:border-[#1c1b18]"
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
                    className="w-full text-xs p-2.5 rounded-xl border border-[#dedad0] bg-white text-[#1c1b18] focus:outline-none focus:border-[#1c1b18]"
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
                    className="w-full text-xs p-2.5 rounded-xl border border-[#dedad0] bg-white text-[#1c1b18] focus:outline-none focus:border-[#1c1b18]"
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
                    placeholder="Street, Apartment or Suite"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#dedad0] bg-white text-[#1c1b18] focus:outline-none focus:border-[#1c1b18] mb-2"
                  />
                  <input
                    type="text"
                    required
                    value={customer.city}
                    onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                    placeholder="City, State / Region"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#dedad0] bg-white text-[#1c1b18] focus:outline-none focus:border-[#1c1b18]"
                  />
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
                    {isSubmitting ? 'Placing Order...' : `Confirm & Place Order ($${total.toFixed(2)})`}
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
                cartItems.map((item) => (
                  <div 
                    key={item.id}
                    className="flex gap-4 p-3.5 bg-white rounded-2xl border border-[#e5e2d6] shadow-2xs items-center justify-between"
                  >
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=300&q=80'}
                      alt={item.name}
                      className="w-16 h-16 rounded-xl object-cover bg-[#f4f2ea] shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-[#1c1b18] truncate">{item.name}</h4>
                      <p className="text-xs font-mono text-[#78746a] mt-0.5">${Number(item.price).toFixed(2)}</p>

                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center border border-[#e2dfd5] rounded-lg bg-[#f6f5f0]">
                          <button
                            onClick={() => onUpdateQty(item.id, -1)}
                            className="p-1 hover:bg-[#eeebe2] text-[#4a473f] rounded-l-lg transition cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-mono font-medium text-[#1c1b18]">{item.qty}</span>
                          <button
                            onClick={() => onUpdateQty(item.id, 1)}
                            className="p-1 hover:bg-[#eeebe2] text-[#4a473f] rounded-r-lg transition cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="p-2 text-[#78746a] hover:text-red-600 transition cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4 stroke-[1.6]" />
                    </button>
                  </div>
                ))
              )
            )}

          </div>

          {/* Footer Summary */}
          {step === 'cart' && cartItems.length > 0 && (
            <div className="p-6 border-t border-[#e2dfd5] bg-white/70 space-y-3">
              <div className="space-y-1.5 text-xs text-[#78746a]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono text-[#1c1b18]">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-mono text-[#1c1b18]">
                    {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="border-t border-[#e2dfd5] pt-2 flex justify-between text-sm font-bold text-[#1c1b18]">
                  <span>Total</span>
                  <span className="font-mono">${total.toFixed(2)}</span>
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
