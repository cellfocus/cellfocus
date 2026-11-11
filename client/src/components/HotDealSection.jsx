import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Zap, Check, Flame, Clock } from 'lucide-react';
import gsap from 'gsap';
import { useCurrency } from '../context/CurrencyContext';

export default function HotDealSection({ product, onAddToCart, onSelectProduct }) {
  if (!product) return null;

  const { formatPrice } = useCurrency();
  const sectionRef = useRef(null);
  const imgBoxRef = useRef(null);
  const textGroupRef = useRef(null);
  const countdownRef = useRef(null);
  const ctaBtnRef = useRef(null);

  // Real-time ticking countdown timer (target: 6 days, 14 hours ahead, synced)
  const [timeLeft, setTimeLeft] = useState(() => {
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 6, 23, 59, 59);
    const diff = Math.max(0, Math.floor((target - now) / 1000));
    return {
      days: Math.floor(diff / (3600 * 24)),
      hours: Math.floor((diff % (3600 * 24)) / 3600),
      minutes: Math.floor((diff % 3600) / 60),
      seconds: diff % 60,
    };
  });

  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // GSAP scroll trigger for Hot Deal section
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

            // 1. Image card entrance
            if (imgBoxRef.current) {
              tl.fromTo(
                imgBoxRef.current,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.6, clearProps: 'transform' }
              );
            }

            // 2. Text group glide in
            if (textGroupRef.current) {
              tl.fromTo(
                textGroupRef.current.children,
                { opacity: 0, x: 16 },
                { opacity: 1, x: 0, duration: 0.5, stagger: 0.06, clearProps: 'transform' },
                '-=0.35'
              );
            }

            // 3. Countdown timer cards entrance
            if (countdownRef.current) {
              const boxes = countdownRef.current.querySelectorAll('.gsap-timer-box');
              if (boxes.length > 0) {
                tl.fromTo(
                  boxes,
                  { opacity: 0, y: 12 },
                  { opacity: 1, y: 0, duration: 0.45, stagger: 0.05, ease: 'power2.out', clearProps: 'transform' },
                  '-=0.25'
                );
              }
            }

            // 4. CTA button entrance
            if (ctaBtnRef.current) {
              tl.fromTo(
                ctaBtnRef.current,
                { opacity: 0, y: 12 },
                { opacity: 1, y: 0, duration: 0.45, clearProps: 'transform' },
                '-=0.2'
              );
            }

            observer.unobserve(el);
          }
        });
      },
      { rootMargin: '0px 0px -40px 0px', threshold: 0.05 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleAdd = () => {
    setIsAdded(true);
    if (onAddToCart) onAddToCart(product);
    setTimeout(() => setIsAdded(false), 1400);
  };

  const padZero = (n) => String(n).padStart(2, '0');

  const regularPrice = Number(product.price);
  const originalPrice = product.originalPrice && Number(product.originalPrice) > regularPrice
    ? Number(product.originalPrice).toFixed(2)
    : (regularPrice * 1.35).toFixed(2);
  const discountPercent = Math.round(((originalPrice - regularPrice) / originalPrice) * 100);

  // Gather all available distinct photos
  const allImages = React.useMemo(() => {
    const list = [];
    const pushIfValid = (src) => {
      if (src && typeof src === 'string' && src.trim().length > 0 && !list.includes(src.trim())) {
        list.push(src.trim());
      }
    };
    pushIfValid(product.image);
    pushIfValid(product.image2);
    pushIfValid(product.image3);
    pushIfValid(product.image4);
    if (Array.isArray(product.images)) {
      product.images.forEach(pushIfValid);
    }
    if (list.length === 0) {
      list.push('https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80');
    }
    return list;
  }, [product]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isDealHovered, setIsDealHovered] = useState(false);

  useEffect(() => {
    if (!isDealHovered || allImages.length <= 1) {
      setActiveImageIndex(0);
      return;
    }

    const timer = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % allImages.length);
    }, 1400);

    return () => clearInterval(timer);
  }, [isDealHovered, allImages.length]);

  return (
    <section
      id="hot-deal"
      ref={sectionRef}
      className="w-full relative overflow-hidden bg-gradient-to-b from-[#f5f0e4] via-[#f8f4eb] to-[#f5f0e4] border-b border-[#e2dcd0] min-h-[100dvh] lg:h-screen lg:max-h-screen flex items-center justify-center py-6 sm:py-8 lg:py-4 z-10"
    >
      {/* Subtle decorative ambient glow */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-bl from-[#00FFFF]/14 to-transparent rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-amber-200/25 to-transparent rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative w-full my-auto z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          
          {/* Left Column: Product Spotlight Picture & Media Frame */}
          <div className="lg:col-span-5 flex justify-center">
            <div
              ref={imgBoxRef}
              onClick={() => onSelectProduct && onSelectProduct(product)}
              onMouseEnter={() => setIsDealHovered(true)}
              onMouseLeave={() => {
                setIsDealHovered(false);
                setActiveImageIndex(0);
              }}
              className="relative w-full max-w-sm sm:max-w-md h-[240px] sm:h-[290px] lg:h-[320px] xl:h-[350px] rounded-2xl overflow-hidden bg-gradient-to-b from-[#f9fafb] to-[#edf0f5] p-5 lg:p-6 flex items-center justify-center group/deal shadow-sm border border-white cursor-pointer"
            >
              
              {/* Product Photos with animated hover transitions */}
              {allImages.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`${product.name} view ${idx + 1}`}
                  className={`absolute inset-0 m-auto max-h-[85%] max-w-[85%] object-contain transition-all duration-700 ease-out drop-shadow-sm will-change-transform ${
                    idx === activeImageIndex
                      ? 'opacity-100 scale-105 z-10'
                      : 'opacity-0 scale-100 z-0 pointer-events-none'
                  }`}
                />
              ))}

              {/* Floating Colorful Badges */}
              <div className="absolute top-3.5 left-3.5 z-20 flex flex-col gap-1.5">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-600 text-white text-[11px] font-bold uppercase tracking-wider rounded-full shadow-xs">
                  <Flame className="w-3.5 h-3.5 fill-white" />
                  <span>HOT DEAL</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-2xs">
                  {discountPercent}% OFF
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Deal Information, Pricing, Countdown & CTA */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-3.5 sm:space-y-4">
            
            <div ref={textGroupRef} className="space-y-3 sm:space-y-3.5">
              {/* Eyebrow in energetic accent */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-3 py-1 rounded-full">
                  DEAL OF THE WEEK
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-orange-600 font-semibold">
                  <Zap className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                  Limited Stock ({product.stock || 12} left)
                </span>
              </div>

              {/* Title */}
              <h3
                onClick={() => onSelectProduct && onSelectProduct(product)}
                className="text-2xl sm:text-4xl lg:text-5xl font-light text-[#1c1b18] tracking-tight leading-tight line-clamp-1 sm:line-clamp-2 cursor-pointer hover:text-emerald-700 transition-colors"
              >
                {product.name}
              </h3>

              {/* Description */}
              <p className="text-xs sm:text-sm text-[#4a473f] max-w-lg leading-relaxed font-light line-clamp-2">
                {product.details || 'Engineered with high-efficiency rapid components, premium temperature regulation, and durable materials for unmatched daily reliability.'}
              </p>

              {/* Price section with Original Strike-Through */}
              <div className="flex items-baseline gap-3 pt-0.5">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-bold font-mono text-[#1c1b18]">
                  {formatPrice(regularPrice)}
                </span>
                <span className="text-base sm:text-xl font-mono text-[#9ca3af] line-through">
                  {formatPrice(originalPrice)}
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Save {formatPrice(originalPrice - regularPrice)}
                </span>
              </div>
            </div>

            {/* Countdown Timer Boxes (4-box layout) */}
            <div ref={countdownRef} className="pt-1">
              <div className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-600" />
                <span>OFFER ENDS IN:</span>
              </div>
              <div className="grid grid-cols-4 gap-2.5 max-w-[280px] sm:max-w-[320px]">
                
                {/* Days */}
                <div className="gsap-timer-box bg-white rounded-xl border border-[#d1d5db] py-2 px-1 text-center shadow-xs">
                  <span className="block text-xl sm:text-2xl font-light text-[#111827] font-mono leading-none">
                    {padZero(timeLeft.days)}
                  </span>
                  <span className="block text-[9px] text-[#6b7280] font-medium uppercase tracking-wider mt-1">
                    days
                  </span>
                </div>

                {/* Hours */}
                <div className="gsap-timer-box bg-white rounded-xl border border-[#d1d5db] py-2 px-1 text-center shadow-xs">
                  <span className="block text-xl sm:text-2xl font-light text-[#111827] font-mono leading-none">
                    {padZero(timeLeft.hours)}
                  </span>
                  <span className="block text-[9px] text-[#6b7280] font-medium uppercase tracking-wider mt-1">
                    hours
                  </span>
                </div>

                {/* Minutes */}
                <div className="gsap-timer-box bg-white rounded-xl border border-[#d1d5db] py-2 px-1 text-center shadow-xs">
                  <span className="block text-xl sm:text-2xl font-light text-[#111827] font-mono leading-none">
                    {padZero(timeLeft.minutes)}
                  </span>
                  <span className="block text-[9px] text-[#6b7280] font-medium uppercase tracking-wider mt-1">
                    minutes
                  </span>
                </div>

                {/* Seconds */}
                <div className="gsap-timer-box bg-white rounded-xl border border-[#d1d5db] py-2 px-1 text-center shadow-xs">
                  <span className="block text-xl sm:text-2xl font-light text-rose-600 font-mono leading-none">
                    {padZero(timeLeft.seconds)}
                  </span>
                  <span className="block text-[9px] text-[#6b7280] font-medium uppercase tracking-wider mt-1">
                    seconds
                  </span>
                </div>

              </div>
            </div>

            {/* Action CTA Button */}
            <div ref={ctaBtnRef} className="pt-1.5">
              <button
                onClick={handleAdd}
                className={`w-full sm:w-auto px-8 py-3 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg ${
                  isAdded
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                    : 'bg-[#1c1b18] hover:bg-[#2e2d29] text-white hover:scale-[1.01]'
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Added deal to bag!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 text-emerald-400" />
                    <span>Add deal to bag</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
