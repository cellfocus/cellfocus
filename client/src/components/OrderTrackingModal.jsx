import React, { useState, useEffect } from 'react';
import { 
  X, Search, Truck, Package, Clock, CheckCircle, XCircle, AlertCircle, 
  MapPin, User, ChevronRight, MessageCircle, RefreshCw, ArrowRight
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { ENDPOINTS } from '../config/api';

const STATUS_STEPS = [
  { key: 'Pending', label: 'Order Placed', desc: 'Received & Queued', icon: Clock },
  { key: 'Shipped', label: 'Shipped', desc: 'Packed & In Transit', icon: Package },
  { key: 'Dispatched', label: 'Dispatched', desc: 'With Courier Rider', icon: Truck },
];

const STATUS_THEME = {
  Pending: {
    badge: 'bg-amber-50 text-amber-900 border-amber-300',
    title: 'Order Placed & Confirmed',
    message: 'Your order has been registered in our system and is queued for processing.',
    stepIndex: 0,
  },
  Shipped: {
    badge: 'bg-indigo-50 text-indigo-900 border-indigo-300',
    title: 'Shipped from Warehouse',
    message: 'Your parcel has been packed and handed over to courier dispatch.',
    stepIndex: 1,
  },
  Dispatched: {
    badge: 'bg-emerald-50 text-emerald-900 border-emerald-300',
    title: 'Dispatched & On the Way',
    message: 'Your parcel has been dispatched with our delivery rider and is out for delivery!',
    stepIndex: 2,
  },
  Dispached: {
    badge: 'bg-emerald-50 text-emerald-900 border-emerald-300',
    title: 'Dispatched & On the Way',
    message: 'Your parcel has been dispatched with our delivery rider and is out for delivery!',
    stepIndex: 2,
  },
  Delivered: {
    badge: 'bg-emerald-50 text-emerald-900 border-emerald-300',
    title: 'Dispatched & On the Way',
    message: 'Your parcel has been dispatched. Thank you for shopping with CellFocus!',
    stepIndex: 2,
  },
  Return: {
    badge: 'bg-rose-50 text-rose-900 border-rose-300',
    title: 'Order Return',
    message: 'This order is marked as Return. Our support team is handling the return process.',
    stepIndex: -1,
  },
  Processing: {
    badge: 'bg-blue-50 text-blue-900 border-blue-300',
    title: 'Order In Process',
    message: 'Our warehouse team is boxing your items securely for dispatch.',
    stepIndex: 0,
  },
  Cancelled: {
    badge: 'bg-rose-50 text-rose-900 border-rose-300',
    title: 'Order Cancelled',
    message: 'This order was cancelled. If you have questions, please reach out to CellFocus support.',
    stepIndex: -1,
  },
};

const sanitizeTrackingId = (id) => {
  if (!id) return '';
  if (typeof id === 'string') return id.trim();
  if (typeof id === 'number') return String(id);
  if (typeof id === 'object') {
    if (typeof id.orderId === 'string' || typeof id.orderId === 'number') return String(id.orderId).trim();
    return '';
  }
  return '';
};

export default function OrderTrackingModal({ isOpen, onClose, initialOrderId = '' }) {
  const [orderIdInput, setOrderIdInput] = useState(() => sanitizeTrackingId(initialOrderId));
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState(null);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const clean = sanitizeTrackingId(initialOrderId);
    if (clean) {
      setOrderIdInput(clean);
      handleTrack(clean);
    } else {
      setOrderIdInput('');
      setOrderData(null);
      setError(null);
    }
  }, [initialOrderId, isOpen]);

  if (!isOpen) return null;

  const handleTrack = async (searchId) => {
    const query = String(searchId !== undefined ? searchId : orderIdInput || '').trim();
    if (!query) {
      setError('Please enter your order number.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(ENDPOINTS.ORDER_TRACK(query));
      const json = await res.json();

      if (json.success && json.data) {
        setOrderData(json.data);
      } else {
        setOrderData(null);
        setError(json.message || `No order found matching "${query}". Please verify your Order ID.`);
      }
    } catch (err) {
      setOrderData(null);
      setError('Unable to reach tracking server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentTheme = orderData?.status ? STATUS_THEME[orderData.status] || STATUS_THEME.Pending : STATUS_THEME.Pending;
  const isCancelled = orderData?.status === 'Cancelled' || orderData?.status === 'Return';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-[#fbf9f4] border border-[#e5e0d4] rounded-3xl shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-white border-b border-[#e5e0d4] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              <Truck className="w-5 h-5 stroke-[1.8]" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#1c1b18] tracking-tight">
                Track Your Order
              </h3>
              <p className="text-xs text-[#78746a] mt-0.5">
                Check real-time delivery progress &amp; order status
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#78746a] hover:text-[#1c1b18] hover:bg-[#faf8f4] transition cursor-pointer"
            aria-label="Close tracking"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-5 sm:p-6 space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTrack();
            }}
            className="space-y-2"
          >
            <label className="block text-xs font-bold text-[#1c1b18]">
              Enter your order number
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#78746a]" />
                <input
                  type="text"
                  value={orderIdInput}
                  onChange={(e) => setOrderIdInput(e.target.value)}
                  placeholder="Enter your order number"
                  autoFocus
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#dedad0] bg-white text-xs sm:text-sm font-mono text-[#1c1b18] placeholder:text-[#a8a29e] focus:outline-none focus:border-[#1c1b18] focus:ring-1 focus:ring-[#1c1b18]"
                />
                {orderIdInput && (
                  <button
                    type="button"
                    onClick={() => { setOrderIdInput(''); setOrderData(null); setError(null); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#78746a] hover:text-[#1c1b18]"
                  >
                    Clear
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-4 sm:px-5 py-2.5 rounded-xl bg-[#1c1b18] hover:bg-[#32302b] text-white text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer shrink-0 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Track</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-[#78746a]">
              Tip: Your 4-digit Order ID was displayed on checkout and sent to your WhatsApp.
            </p>
          </form>

          {/* Error Notice */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Order Not Found</p>
                <p className="text-[11px] text-rose-800 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Tracking Result View */}
          {orderData && (
            <div className="space-y-4 pt-2 border-t border-[#dedad0] animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* Order Status Hero Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#dedad0] shadow-xs space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f0eee6] pb-3">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-mono text-[#78746a] block">
                      Order Reference
                    </span>
                    <h4 className="text-base sm:text-lg font-mono font-extrabold text-[#1c1b18]">
                      #{orderData.orderId}
                    </h4>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${currentTheme.badge}`}>
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                    <span>{orderData.status}</span>
                  </span>
                </div>

                <div className="text-xs">
                  <p className="font-bold text-[#1c1b18]">{currentTheme.title}</p>
                  <p className="text-[#78746a] text-[11px] mt-0.5">{currentTheme.message}</p>
                </div>

                {/* 3-Stage Stepper Bar */}
                {!isCancelled && (
                  <div className="pt-2">
                    <div className="grid grid-cols-3 gap-2 relative">
                      {STATUS_STEPS.map((step, idx) => {
                        const IconComponent = step.icon;
                        const isCompleted = idx <= currentTheme.stepIndex;
                        const isCurrent = idx === currentTheme.stepIndex;

                        return (
                          <div key={step.key} className="flex flex-col items-center text-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                              isCompleted 
                                ? 'bg-emerald-600 text-white shadow-xs' 
                                : 'bg-[#eeebe2] text-[#a8a29e]'
                            } ${isCurrent ? 'ring-2 ring-emerald-500/30 ring-offset-2' : ''}`}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <span className={`text-[10px] sm:text-[11px] font-bold mt-1.5 leading-tight ${
                              isCompleted ? 'text-[#1c1b18]' : 'text-[#a8a29e]'
                            }`}>
                              {step.label}
                            </span>
                            <span className="hidden sm:block text-[9px] text-[#78746a] mt-0.5">
                              {step.desc}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery & Customer Info */}
              <div className="p-4 rounded-xl bg-white border border-[#dedad0] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#78746a] tracking-wider block">
                    Recipient
                  </span>
                  <p className="font-bold text-[#1c1b18] flex items-center gap-1.5 mt-0.5">
                    <User className="w-3.5 h-3.5 text-[#78746a]" />
                    <span>{orderData.customer?.name}</span>
                  </p>
                  {orderData.customer?.phone && (
                    <p className="text-[11px] font-mono text-[#78746a] mt-0.5">
                      {orderData.customer.phone}
                    </p>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-[#78746a] tracking-wider block">
                    Destination
                  </span>
                  <p className="text-[11px] text-[#4a473f] flex items-start gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#78746a] shrink-0 mt-0.5" />
                    <span>
                      {orderData.customer?.address}
                      {orderData.customer?.city ? `, ${orderData.customer.city}` : ''}
                    </span>
                  </p>
                </div>
              </div>

              {/* Ordered Items Preview */}
              <div className="p-4 rounded-xl bg-white border border-[#dedad0] space-y-2 text-xs">
                <span className="text-[10px] font-bold uppercase text-[#78746a] tracking-wider block">
                  Items in Parcel ({orderData.items?.length || 0})
                </span>

                <div className="divide-y divide-[#f0eee6]">
                  {(orderData.items || []).map((it, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 truncate">
                        {it.image && (
                          <img
                            src={it.image}
                            alt={it.name}
                            className="w-9 h-9 rounded-lg object-cover bg-[#faf8f4] border border-[#eeebe2] shrink-0"
                          />
                        )}
                        <div className="truncate">
                          <p className="font-medium text-[#1c1b18] truncate">{it.name}</p>
                          <p className="text-[11px] text-[#78746a]">Qty: {it.qty}</p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-[#1c1b18] shrink-0">
                        {formatPrice(it.price * it.qty)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#f0eee6] pt-2 flex justify-between items-center text-xs font-bold text-[#1c1b18]">
                  <span className="text-[#78746a]">Total (COD):</span>
                  <span className="font-mono text-sm text-emerald-800">
                    {formatPrice(orderData.total)}
                  </span>
                </div>
              </div>

              {/* WhatsApp Support Callout */}
              <a
                href={`https://wa.me/923269589597?text=${encodeURIComponent(`Assalam-o-Alaikum CellFocus! I am inquiring about the delivery status of my order #${orderData.orderId}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl border border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-900 text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Need delivery help? Chat with CellFocus Support</span>
              </a>

            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-[#e5e0d4] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#1c1b18] hover:bg-[#32302b] text-white text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

