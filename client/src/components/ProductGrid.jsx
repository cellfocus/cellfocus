import React, { useState, useEffect, useRef } from 'react';
import { Plus, Check, Loader2, LayoutGrid, Zap, AudioLines, Headphones, Flame } from 'lucide-react';
import gsap from 'gsap';
import { useCurrency } from '../context/CurrencyContext';
import HotDealSection from './HotDealSection';
import WhyCellFocusSection from './WhyCellFocusSection';
import NeedBulkSection from './NeedBulkSection';
import ClientReviewsSection from './ClientReviewsSection';
import FAQSection from './FAQSection';
import AboutUsSection from './AboutUsSection';
import ReturnPolicySection from './ReturnPolicySection';
import ContactUsSection from './ContactUsSection';
import defaultProducts from '../data/defaultProducts.json';
import { ENDPOINTS } from '../config/api';

const API_BASE = ENDPOINTS.PRODUCTS;

const CATEGORIES = [
  { id: 'all', label: 'All', icon: LayoutGrid },
  { id: 'chargers', label: 'Chargers', icon: Zap },
  { id: 'handsfree', label: 'Handsfree', icon: AudioLines },
  { id: 'airpods', label: 'AirPods', icon: Headphones },
];

function ProductCard({ product, onAdd, isAdded, className = '', onSelectProduct }) {
  const { formatPrice } = useCurrency();
  const pid = product.id || product._id;

  const validColors = React.useMemo(() => {
    return Array.isArray(product.colors)
      ? product.colors.filter((c) => c && typeof c.name === 'string' && c.name.trim().length > 0)
      : [];
  }, [product.colors]);

  const [selectedColor, setSelectedColor] = useState(
    validColors.length > 0 ? validColors[0] : null
  );

  useEffect(() => {
    if (validColors.length > 0) {
      setSelectedColor(validColors[0]);
    } else {
      setSelectedColor(null);
    }
  }, [validColors]);

  // Gather all available distinct photos (prioritizing selected color picture)
  const allImages = React.useMemo(() => {
    const list = [];
    const pushIfValid = (src) => {
      if (src && typeof src === 'string' && src.trim().length > 0 && !list.includes(src.trim())) {
        list.push(src.trim());
      }
    };
    if (selectedColor?.image) {
      pushIfValid(selectedColor.image);
    }
    pushIfValid(product.image);
    pushIfValid(product.image2);
    pushIfValid(product.image3);
    pushIfValid(product.image4);
    if (validColors.length > 0) {
      validColors.forEach((col) => pushIfValid(col.image));
    }
    if (Array.isArray(product.images)) {
      product.images.forEach(pushIfValid);
    }
    if (list.length === 0) {
      list.push('https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=700&q=80');
    }
    return list;
  }, [product, selectedColor]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Smooth animated cycling across all pictures while item is hovered
  useEffect(() => {
    if (!isHovered || allImages.length <= 1) {
      setActiveImageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % allImages.length);
    }, 1300);

    return () => clearInterval(interval);
  }, [isHovered, allImages.length]);

  // Interactive mouse scrubbing across pictures
  const handleMouseMove = (e) => {
    if (allImages.length <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const fraction = Math.max(0, Math.min(0.99, x / rect.width));
    const targetIdx = Math.floor(fraction * allImages.length);
    if (targetIdx !== activeImageIndex) {
      setActiveImageIndex(targetIdx);
    }
  };

  const handleColorClick = (e, color) => {
    e.stopPropagation();
    setSelectedColor(color);
    setActiveImageIndex(0);
  };

  const hasSale = Boolean(product.isOnSale && product.originalPrice && Number(product.originalPrice) > Number(product.price));
  const discountPercent = hasSale ? Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100) : 0;

  return (
    <div
      onClick={() =>
        onSelectProduct &&
        onSelectProduct({
          ...product,
          selectedColor: selectedColor?.name || (product.colors?.[0]?.name) || null,
          image: selectedColor?.image || product.image,
        })
      }
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setActiveImageIndex(0);
      }}
      className={`group bg-[#ffffff] p-2.5 sm:p-3.5 rounded-none border border-[#e6e4dc] hover:border-[#1c1b18] transition-all shadow-2xs flex flex-col justify-between cursor-pointer ${className}`}
    >
      {/* Product Image: Clean square box with smooth animated picture transitions */}
      <div 
        className="relative aspect-square rounded-none overflow-hidden bg-[#f4f2ea] mb-2.5 group/media"
        onMouseMove={handleMouseMove}
      >
        {allImages.map((src, idx) => (
          <img
            key={idx}
            src={src}
            alt={`${product.name} - CellFocus Original Mobile Accessories Pakistan, Wholesale & Retail (${product.category || 'Accessories'})`}
            loading="lazy"
            decoding="async"
            className={`absolute inset-0 w-full h-full object-contain p-2 sm:p-2.5 transition-all duration-700 ease-out will-change-transform ${
              idx === activeImageIndex
                ? 'opacity-100 scale-[1.03] z-10'
                : 'opacity-0 scale-100 z-0 pointer-events-none'
            }`}
          />
        ))}

        {/* Minimal clean progress indicator when hovered on multi-picture items */}
        {allImages.length > 1 && isHovered && (
          <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1 z-20 pointer-events-none transition-opacity duration-300">
            {allImages.map((_, i) => (
              <span
                key={i}
                className={`h-0.5 rounded-full transition-all duration-300 ${
                  i === activeImageIndex
                    ? 'w-4 bg-white shadow-xs'
                    : 'w-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        )}

        <span className="absolute top-1.5 left-1.5 z-20 px-1.5 py-0.5 rounded-none bg-white/95 text-[9px] font-semibold text-[#1c1b18] uppercase tracking-wider border border-[#e5e2d6]">
          {product.category}
        </span>
        {hasSale ? (
          <span className="absolute top-1.5 right-1.5 z-20 px-2 py-0.5 rounded-none bg-rose-600 text-[9px] font-bold text-white uppercase tracking-wider border border-rose-700 shadow-xs">
            -{discountPercent}%
          </span>
        ) : product.isHotDeal ? (
          <span className="absolute top-1.5 right-1.5 z-20 px-2 py-0.5 rounded-none bg-rose-600 text-[9px] font-bold text-white uppercase tracking-wider border border-rose-700 flex items-center gap-1 shadow-xs">
            <Zap className="w-2.5 h-2.5 fill-white text-white" />
            <span>Hot Deal</span>
          </span>
        ) : product.isBestSeller ? (
          <span className="absolute top-1.5 right-1.5 z-20 px-2 py-0.5 rounded-none bg-[#1c1b18] text-[9px] font-bold text-amber-300 uppercase tracking-wider border border-[#1c1b18] flex items-center gap-1 shadow-xs">
            <Flame className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
            <span>Best Seller</span>
          </span>
        ) : null}
      </div>

      {/* Product Info */}
      <div className="flex flex-col flex-1 justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-0.5 sm:gap-2 mb-1">
            <h3 className="text-xs sm:text-sm font-medium text-[#1c1b18] group-hover:text-[#0d9488] transition-colors line-clamp-1" title={product.name}>
              {product.name}
            </h3>
            <div className="flex items-baseline gap-1.5 shrink-0">
              <span className="text-xs sm:text-sm font-semibold text-[#1c1b18] font-mono">
                {formatPrice(product.price)}
              </span>
              {hasSale && (
                <span className="text-[10px] text-[#9ca3af] line-through font-mono">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
          </div>

          <p className="text-[11px] sm:text-xs text-[#78746a] mb-2 line-clamp-1 sm:line-clamp-2">
            {product.details}
          </p>

          {/* Color Variants Swatches - click immediately shifts picture to that color */}
          {validColors.length > 0 && (
            <div className="flex items-center gap-2 mb-2.5 pt-0.5 flex-wrap">
              <span className="text-[10px] text-[#78746a] font-medium">Color:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {validColors.map((c, i) => {
                  const isSelected = selectedColor?.name === c.name || (!selectedColor && i === 0);
                  const isLight = (() => {
                    const hex = (c.hex || '#000000').replace('#', '');
                    const r = parseInt(hex.substring(0, 2), 16) || 0;
                    const g = parseInt(hex.substring(2, 4), 16) || 0;
                    const b = parseInt(hex.substring(4, 6), 16) || 0;
                    return (r * 299 + g * 587 + b * 114) / 1000 > 170;
                  })();
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={(e) => handleColorClick(e, c)}
                      className={`w-5 h-5 rounded-full transition-all cursor-pointer relative flex items-center justify-center ${
                        isSelected
                          ? 'ring-2 ring-[#1c1b18] ring-offset-2 scale-110 shadow-xs'
                          : 'opacity-80 hover:opacity-100 hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex || '#000000' }}
                      title={`${c.name || 'Color'} (Click to view)`}
                    >
                      <span className="absolute inset-0 rounded-full border border-black/15 pointer-events-none" />
                      {isSelected && (
                        <Check
                          className={`w-2.5 h-2.5 relative z-10 ${
                            isLight ? 'text-black' : 'text-white'
                          }`}
                          strokeWidth={3}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
              <span className="text-[10px] text-[#1c1b18] font-bold truncate">
                {selectedColor?.name || validColors[0]?.name}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdd({
              ...product,
              selectedColor: selectedColor?.name || (validColors[0]?.name) || null,
              image: selectedColor?.image || product.image,
            });
          }}
          className={`w-full py-2 rounded-none text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer ${isAdded
            ? 'bg-[#1c1b18] text-[#f6f5f0]'
            : 'bg-[#f4f2eb] hover:bg-[#eae6dc] text-[#1c1b18]'
            }`}
        >
          {isAdded ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span className="text-[11px] sm:text-xs">Added</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span className="text-[11px] sm:text-xs">Buy Now</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function ProductGrid({ activeCategory, onAddToCart, refreshTrigger, onSelectProduct }) {
  const [products, setProducts] = useState(defaultProducts || []);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(activeCategory || 'all');
  const [addedId, setAddedId] = useState(null);

  const shopSectionRef = useRef(null);
  const shopHeaderRef = useRef(null);
  const shopGridRef = useRef(null);

  const bestSectionRef = useRef(null);
  const bestHeaderRef = useRef(null);
  const bestGridRef = useRef(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_BASE);
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        setProducts(json.data);
      }
    } catch (err) {
      console.warn('API fetch error, keeping current catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [refreshTrigger]);

  useEffect(() => {
    if (activeCategory) {
      setFilter(activeCategory);
    }
  }, [activeCategory]);

  const displayedProducts = React.useMemo(() => {
    if (filter === 'all') {
      return [...products].sort((a, b) => {
        const ordA = a.displayOrder !== undefined ? Number(a.displayOrder) : 999;
        const ordB = b.displayOrder !== undefined ? Number(b.displayOrder) : 999;
        if (ordA !== ordB) return ordA - ordB;
        return (Number(a.categoryOrder) || 999) - (Number(b.categoryOrder) || 999);
      });
    }
    return products
      .filter((p) => (p.category || '').toLowerCase() === filter.toLowerCase())
      .sort((a, b) => {
        const ordA = a.categoryOrder !== undefined ? Number(a.categoryOrder) : (a.displayOrder !== undefined ? Number(a.displayOrder) : 999);
        const ordB = b.categoryOrder !== undefined ? Number(b.categoryOrder) : (b.displayOrder !== undefined ? Number(b.displayOrder) : 999);
        if (ordA !== ordB) return ordA - ordB;
        return (Number(a.displayOrder) || 999) - (Number(b.displayOrder) || 999);
      });
  }, [products, filter]);

  const bestSellers = products.filter((p) => Boolean(p.isBestSeller));
  const hotDealProduct = products.find((p) => Boolean(p.isHotDeal));
  const currentMonthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // GSAP scroll entrance animation for Shop Now section
  useEffect(() => {
    const el = shopSectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

            if (shopHeaderRef.current) {
              tl.fromTo(
                shopHeaderRef.current.children,
                { opacity: 0, y: 18 },
                { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, clearProps: 'transform' }
              );
            }

            if (shopGridRef.current) {
              const cards = shopGridRef.current.querySelectorAll('.gsap-shop-card');
              if (cards.length > 0) {
                tl.fromTo(
                  cards,
                  { opacity: 0, y: 22 },
                  { opacity: 1, y: 0, duration: 0.45, stagger: 0.04, clearProps: 'transform' },
                  '-=0.3'
                );
              }
            }

            observer.unobserve(el);
          }
        });
      },
      { rootMargin: '0px 0px -40px 0px', threshold: 0.05 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loading]);

  // GSAP animation when category tab changes
  useEffect(() => {
    if (!shopGridRef.current || loading) return;
    const cards = shopGridRef.current.querySelectorAll('.gsap-shop-card');
    if (cards.length > 0) {
      gsap.fromTo(
        cards,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.03, ease: 'power2.out', clearProps: 'transform' }
      );
    }
  }, [filter]);

  // GSAP scroll entrance animation for Best Sellers section
  useEffect(() => {
    const el = bestSectionRef.current;
    if (!el || bestSellers.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

            if (bestHeaderRef.current) {
              tl.fromTo(
                bestHeaderRef.current.children,
                { opacity: 0, y: 18 },
                { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, clearProps: 'transform' }
              );
            }

            if (bestGridRef.current) {
              const cards = bestGridRef.current.querySelectorAll('.gsap-bestseller-card');
              if (cards.length > 0) {
                tl.fromTo(
                  cards,
                  { opacity: 0, y: 22 },
                  { opacity: 1, y: 0, duration: 0.45, stagger: 0.04, clearProps: 'transform' },
                  '-=0.3'
                );
              }
            }

            observer.unobserve(el);
          }
        });
      },
      { rootMargin: '0px 0px -40px 0px', threshold: 0.05 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [bestSellers.length]);

  const handleAdd = (product) => {
    const pid = product.id || product._id;
    setAddedId(pid);
    if (onAddToCart) onAddToCart(product);
    setTimeout(() => setAddedId(null), 1200);
  };

  return (
    <div className="w-full relative z-10">
      {/* 1 & 2. Catalog & Best Sellers: Surface 1 (Pure White) - Natural Flowing Display as Before */}
      <section
        id="products"
        ref={shopSectionRef}
        className="w-full bg-white border-b border-[#e6e2d8] py-14 sm:py-20"
      >
        <div className="max-w-6xl mx-auto px-6">
          {/* ALL PRODUCTS / SHOP NOW CATEGORY BROWSER */}
          <div
            ref={shopHeaderRef}
            className="pb-8 pt-2 border-b border-[#e5e0d4]/80 flex flex-col items-center text-center"
          >
            {/* Section Title: Shop Now */}
            <h2 className="text-2xl sm:text-4xl font-light text-[#1c1b18] tracking-tight">
              Shop Now
            </h2>
            <p className="text-xs sm:text-sm text-[#78746a] mt-1.5 font-light max-w-lg">
              Original Mobile Accessories in Pakistan &bull; Wholesale &amp; Retail Sasta Charger, Earpods &amp; Handsfree Price
            </p>

            {/* Categories with Icons Centered Below */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mt-5">
              {CATEGORIES.map((tab) => {
                const Icon = tab.icon;
                const active = filter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-none text-xs font-medium tracking-wide transition-all cursor-pointer border ${active
                      ? 'bg-[#1c1b18] text-[#f6f5f0] border-[#1c1b18] shadow-xs'
                      : 'bg-white text-[#4a473f] border-[#dedad0] hover:border-[#1c1b18] hover:text-[#1c1b18]'
                      }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#2e8b57]' : 'text-[#78746a]'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loading state */}
          {loading && products.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-[#78746a] space-y-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs">Connecting to CellFocus API...</span>
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="py-20 text-center text-[#78746a] text-xs">
              No accessories found in this category. Use the Admin panel to add items.
            </div>
          ) : (
            /* Grid: 2 cards per row on mobile, 3 on tablet, 4 on desktop with crisp square/box corners */
            <div
              ref={shopGridRef}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 pt-6"
            >
              {displayedProducts.map((product) => {
                const pid = product.id || product._id;
                return (
                  <ProductCard
                    key={pid}
                    product={product}
                    onAdd={handleAdd}
                    isAdded={addedId === pid}
                    onSelectProduct={onSelectProduct}
                    className="gsap-shop-card"
                  />
                );
              })}
            </div>
          )}

          {/* 2. BEST SELLERS OF THE MONTH SECTION (Positioned right after Shop Now with no trailing gap) */}
          {bestSellers.length > 0 && (
            <div
              id="best-sellers"
              ref={bestSectionRef}
              className="mt-14 pt-10 border-t border-[#e6e4dc]"
            >
              <div
                ref={bestHeaderRef}
                className="flex flex-col items-center text-center mb-6"
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50/90 border border-amber-200 text-amber-900 text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest rounded-none mb-2.5">
                  <Flame className="w-3 h-3 text-amber-600 fill-amber-600" />
                  <span>Trending &bull; {currentMonthYear}</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-light text-[#1c1b18] tracking-tight">
                  Best Sellers of the Month
                </h2>
                <p className="text-xs sm:text-sm text-[#78746a] max-w-md mt-1.5 font-light">
                  Top customer favorites engineered for exceptional performance, speed, and acoustic fidelity.
                </p>
              </div>

              <div
                ref={bestGridRef}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6"
              >
                {bestSellers.map((product) => {
                  const pid = product.id || product._id;
                  return (
                    <ProductCard
                      key={`best-${pid}`}
                      product={product}
                      onAdd={handleAdd}
                      isAdded={addedId === pid}
                      onSelectProduct={onSelectProduct}
                      className="gsap-bestseller-card"
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. EXCLUSIVE SPOTLIGHT HOT DEAL */}
      {hotDealProduct && (
        <HotDealSection
          product={hotDealProduct}
          onAddToCart={onAddToCart}
          onSelectProduct={onSelectProduct}
        />
      )}

      {/* 4. WHY PEOPLE BUY FROM CELLFOCUS (Animated via GSAP, right after Deal of the Week) */}
      <WhyCellFocusSection />

      {/* 5. NEED BULK? (Wholesale & B2B Inventory Supply) */}
      <NeedBulkSection />

      {/* 5b. CLIENT REVIEWS & TESTIMONIALS */}
      <ClientReviewsSection />

      {/* 6. QUESTIONS, ANSWERED (Interactive FAQ with colorful accents) */}
      <FAQSection />

      {/* 6. ABOUT US (Minimal editorial with animated typography) */}
      <AboutUsSection />

      {/* 7. 7-DAY RETURN & EXCHANGE POLICY */}
      <ReturnPolicySection />

      {/* 8. CONTACT US (Shop Address, Timings, About Dev) */}
      <ContactUsSection />
    </div>
  );
}
