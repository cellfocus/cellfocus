import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Minus,
  ShoppingBag,
  RotateCcw,
  MessageCircle,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import gsap from 'gsap';

// Helper to provide only the exact pictures belonging to the clicked product
const getProductGallery = (product) => {
  if (!product) return [];

  const images = [];

  // Primary image
  const img1 = product.image || (product.images && product.images[0]);
  if (img1 && typeof img1 === 'string' && img1.trim()) {
    images.push(img1.trim());
  }

  // Secondary angle
  const img2 = product.image2 || (product.images && product.images[1]);
  if (img2 && typeof img2 === 'string' && img2.trim() && !images.includes(img2.trim())) {
    images.push(img2.trim());
  }

  // 3rd angle
  const img3 = product.image3 || (product.images && product.images[2]);
  if (img3 && typeof img3 === 'string' && img3.trim() && !images.includes(img3.trim())) {
    images.push(img3.trim());
  }

  // 4th angle / packaging
  const img4 = product.image4 || (product.images && product.images[3]);
  if (img4 && typeof img4 === 'string' && img4.trim() && !images.includes(img4.trim())) {
    images.push(img4.trim());
  }

  // Additional images if product has a larger array of its own photos
  if (Array.isArray(product.images)) {
    product.images.forEach((img) => {
      if (img && typeof img === 'string' && img.trim() && !images.includes(img.trim())) {
        images.push(img.trim());
      }
    });
  }

  // Fallback only if product has no picture at all
  if (images.length === 0) {
    images.push('https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1000&q=80');
  }

  return images;
};

// Parse user-entered technical specifications (format: Name: Value or individual lines)
const parseSpecs = (specsStr) => {
  if (!specsStr || typeof specsStr !== 'string') return [];
  return specsStr
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const colonIdx = line.indexOf(':');
      if (colonIdx > -1) {
        return {
          label: line.slice(0, colonIdx).trim(),
          value: line.slice(colonIdx + 1).trim()
        };
      }
      return { label: '', value: line };
    });
};

export default function ProductDetailModal({ product, isOpen, onClose, onAddToCart, onBuyNow }) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  const modalRef = useRef(null);
  const contentRef = useRef(null);
  const [touchStartX, setTouchStartX] = useState(null);

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e, galleryLength) => {
    if (touchStartX === null || galleryLength <= 1) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0 && activeImageIndex < galleryLength - 1) {
        setActiveImageIndex((prev) => prev + 1);
      } else if (diff < 0 && activeImageIndex > 0) {
        setActiveImageIndex((prev) => prev - 1);
      }
    }
    setTouchStartX(null);
  };

  // Reset selected image and quantity whenever the product changes or opens
  useEffect(() => {
    if (product) {
      setActiveImageIndex(0);
      setQty(1);
      setAddedNotice(false);
    }
  }, [product]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';

      // Entrance animation
      if (contentRef.current) {
        gsap.fromTo(
          contentRef.current,
          { opacity: 0, scale: 0.96, y: 16 },
          { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: 'power2.out' }
        );
      }
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const gallery = getProductGallery(product);
  const userSpecs = parseSpecs(product.specs);

  const currentPrice = Number(product.price) || 0;
  const isOnSale = Boolean(
    product.isOnSale &&
    product.originalPrice &&
    Number(product.originalPrice) > currentPrice
  );
  const originalPrice = isOnSale ? Number(product.originalPrice) : null;
  const discountPercent = isOnSale
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;

  const handleIncrement = () => setQty((prev) => Math.min(prev + 1, product.stock || 20));
  const handleDecrement = () => setQty((prev) => Math.max(prev - 1, 1));

  const handleAddToCartClick = () => {
    if (onAddToCart) {
      for (let i = 0; i < qty; i++) {
        onAddToCart(product);
      }
    }
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
  };

  const handleBuyNowClick = () => {
    if (onBuyNow) {
      onBuyNow(product, qty);
    } else if (onAddToCart) {
      for (let i = 0; i < qty; i++) {
        onAddToCart(product);
      }
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hi CellFocus! I would like to order:\n\n*${product.name}*\nPrice: $${currentPrice.toFixed(2)}${isOnSale ? ` (Sale -${discountPercent}% OFF)` : ''}\nQuantity: ${qty}\n\nPlease confirm availability and dispatch.`
  );

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
    >
      {/* Background click handler */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Main Modal Card */}
      <div
        ref={contentRef}
        className="relative z-10 w-full max-w-4xl bg-[#ffffff] rounded-none sm:rounded-2xl border border-[#ded8cb] shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
      >
        {/* Top Bar: Clean Breadcrumb & Close */}
        <div className="flex items-center justify-between px-5 sm:px-8 py-3.5 border-b border-[#e8e4d8] bg-[#fbf9f4]/95 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs text-[#78746a]">
            <button
              onClick={onClose}
              className="hover:text-[#1c1b18] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Store</span>
            </button>
            <span className="text-[#cbd5e1]">&bull;</span>
            <span className="uppercase text-[10px] font-semibold tracking-wider text-[#0d9488]">
              {product.category}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#f4f2ea] hover:bg-[#1c1b18] text-[#1c1b18] hover:text-white flex items-center justify-center transition-all cursor-pointer"
            aria-label="Close product view"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-5 sm:p-8 space-y-6">
          
          {/* Top Section: Pictures Gallery + Ordering Details */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            
            {/* Left Column: Image Gallery (lg:col-span-5) */}
            <div className="lg:col-span-5 space-y-3">
              
              {/* Main Active Picture Frame with Animated Slide Track */}
              <div
                onTouchStart={handleTouchStart}
                onTouchEnd={(e) => handleTouchEnd(e, gallery.length)}
                className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#faf8f4] border border-[#e5e1d5] group shadow-2xs"
              >
                {/* Smooth Animated Horizontal Sliding Strip */}
                <div
                  className="flex h-full w-full transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
                  style={{ transform: `translateX(-${activeImageIndex * 100}%)` }}
                >
                  {gallery.map((img, idx) => (
                    <div
                      key={idx}
                      className="min-w-full w-full h-full shrink-0 flex items-center justify-center p-1 sm:p-2 select-none"
                    >
                      <img
                        src={img}
                        alt={`${product.name} view ${idx + 1}`}
                        className="max-h-full max-w-full w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                        draggable={false}
                      />
                    </div>
                  ))}
                </div>

                {/* Subtle, Clean Sale Badge */}
                {isOnSale && (
                  <span className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-xs rounded-none">
                    -{discountPercent}% OFF
                  </span>
                )}

                {/* Navigation Chevrons (Only if multiple pictures exist) */}
                {gallery.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : gallery.length - 1));
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#1c1b18] shadow-md border border-[#e5e1d5] flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer active:scale-95"
                      aria-label="Previous photo"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIndex((prev) => (prev < gallery.length - 1 ? prev + 1 : 0));
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#1c1b18] shadow-md border border-[#e5e1d5] flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer active:scale-95"
                      aria-label="Next photo"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    {/* Counter Indicator Badge */}
                    <div className="absolute bottom-2.5 right-2.5 z-10 text-[10px] font-mono bg-black/65 text-white px-2 py-0.5 rounded-full backdrop-blur-xs shadow-xs">
                      {activeImageIndex + 1} / {gallery.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails Row: with active highlight indicator */}
              {gallery.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {gallery.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-lg overflow-hidden bg-[#faf8f4] border transition-all cursor-pointer p-0.5 flex items-center justify-center ${
                        activeImageIndex === idx
                          ? 'border-[#1c1b18] ring-2 ring-[#1c1b18] scale-[1.03]'
                          : 'border-[#e4dfd2] hover:border-[#1c1b18]/50 opacity-60 hover:opacity-100'
                      }`}
                      aria-label={`View angle ${idx + 1}`}
                    >
                      <img
                        src={img}
                        alt={`${product.name} angle ${idx + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}

            </div>

            {/* Right Column: Title, Price, Quantity & Ordering Actions (lg:col-span-7) */}
            <div className="lg:col-span-7 space-y-4">
              
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#78746a] block mb-1">
                  {product.category}
                </span>

                <h1 className="text-xl sm:text-2xl lg:text-3xl font-light text-[#1c1b18] tracking-tight">
                  {product.name}
                </h1>

                {product.details && (
                  <p className="text-xs sm:text-sm text-[#57534e] mt-2 font-light leading-relaxed">
                    {product.details}
                  </p>
                )}
              </div>

              {/* Clean Pricing Area */}
              <div className="p-3.5 bg-[#faf8f4] border border-[#e6e2d8]">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-[#1c1b18]">
                    ${currentPrice.toFixed(2)}
                  </span>
                  {isOnSale && (
                    <>
                      <span className="text-base font-mono text-[#9ca3af] line-through">
                        ${originalPrice.toFixed(2)}
                      </span>
                      <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-none uppercase">
                        Save ${(originalPrice - currentPrice).toFixed(2)} ({discountPercent}% OFF)
                      </span>
                    </>
                  )}
                </div>
                <span className="text-[10px] text-[#78746a] font-mono mt-1 block">
                  Available in stock ({product.stock || 20} units) &bull; Doorstep Delivery
                </span>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center gap-3 pt-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#1c1b18] w-16">
                  Qty:
                </span>
                <div className="inline-flex items-center border border-[#d6d2c4] rounded-none bg-white">
                  <button
                    type="button"
                    onClick={handleDecrement}
                    className="w-8 h-8 flex items-center justify-center text-[#1c1b18] hover:bg-[#f4f2ea] transition-colors cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center font-mono font-bold text-xs text-[#1c1b18]">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={handleIncrement}
                    className="w-8 h-8 flex items-center justify-center text-[#1c1b18] hover:bg-[#f4f2ea] transition-colors cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-xs text-[#78746a]">
                  Total: <strong className="text-[#1c1b18] font-mono">${(currentPrice * qty).toFixed(2)}</strong>
                </span>
              </div>

              {/* Purchase Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleAddToCartClick}
                  className="py-3 px-4 rounded-none text-xs font-semibold tracking-wide transition-all duration-200 flex items-center justify-center gap-2 border border-[#1c1b18] text-[#1c1b18] hover:bg-[#1c1b18] hover:text-white cursor-pointer"
                >
                  {addedNotice ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Added to Cart</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBuyNowClick}
                  className="py-3 px-4 rounded-none text-xs font-semibold tracking-wide transition-all duration-200 flex items-center justify-center gap-2 bg-[#1c1b18] hover:bg-[#33312b] text-white cursor-pointer shadow-xs"
                >
                  <span>Buy It Now</span>
                </button>
              </div>

              {/* Direct WhatsApp Quick Order */}
              <div className="pt-1">
                <a
                  href={`https://wa.me/923269589597?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-none text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Order via WhatsApp (0326 9589597)</span>
                </a>
              </div>

            </div>

          </div>

          {/* Section 2: Technical Specifications Sheet (ONLY displayed if specs were entered) */}
          {userSpecs.length > 0 && (
            <div className="border-t border-[#e8e4d8] pt-6 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1c1b18]">
                Technical Specifications
              </h3>

              <div className="divide-y divide-[#eeebe2] border border-[#eeebe2] bg-[#fbf9f5] rounded-xl overflow-hidden shadow-2xs">
                {userSpecs.map((spec, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[110px_1fr] sm:grid-cols-[170px_1fr] gap-3 sm:gap-6 items-start py-2.5 px-3.5 text-xs transition-colors hover:bg-[#f5f2e8]/60"
                  >
                    {spec.label ? (
                      <>
                        <span className="font-medium text-[#78746a] text-left leading-snug pt-0.5 select-none break-words">
                          {spec.label}
                        </span>
                        <span className="text-[#1c1b18] text-left font-medium leading-relaxed break-words min-w-0">
                          {spec.value}
                        </span>
                      </>
                    ) : (
                      <span className="col-span-2 text-[#1c1b18] font-medium leading-relaxed text-left">
                        {spec.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Return & Replace Policy Guarantee Note */}
          <div className="border-t border-[#e8e4d8] pt-6">
            <div className="p-4 bg-[#fbf9f5] border border-[#e8e4d8] text-xs text-[#555248] space-y-1">
              <div className="flex items-center gap-2 text-[#1c1b18] font-semibold">
                <RotateCcw className="w-3.5 h-3.5 text-[#0d9488]" />
                <span>7-Day Return &amp; Replacement Policy</span>
              </div>
              <p className="text-[11px] text-[#78746a] leading-relaxed">
                Hassle-free doorstep exchange or replacement within 7 days of delivery. Product must be in original condition with packaging and included accessories.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}