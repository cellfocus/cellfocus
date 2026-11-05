import React, { useState, useEffect, useRef } from 'react';
import { Plus, Check, Loader2, LayoutGrid, Zap, AudioLines, Headphones, Flame } from 'lucide-react';
import gsap from 'gsap';
import HotDealSection from './HotDealSection';
import WhyCellFocusSection from './WhyCellFocusSection';
import FAQSection from './FAQSection';
import AboutUsSection from './AboutUsSection';
import ReturnPolicySection from './ReturnPolicySection';
import ContactUsSection from './ContactUsSection';
import defaultProducts from '../data/defaultProducts.json';

const API_BASE = 'http://localhost:5000/api/products';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: LayoutGrid },
  { id: 'chargers', label: 'Chargers', icon: Zap },
  { id: 'handsfree', label: 'Handsfree', icon: AudioLines },
  { id: 'airpods', label: 'AirPods', icon: Headphones },
];

function ProductCard({ product, onAdd, isAdded, className = '', onSelectProduct }) {
  const pid = product.id || product._id;
  const img1 = product.image || (product.images && product.images[0]) || 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=700&q=80';
  const img2 = product.image2 || (product.images && product.images[1]);
  const hasSale = Boolean(product.isOnSale && product.originalPrice && Number(product.originalPrice) > Number(product.price));
  const discountPercent = hasSale ? Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100) : 0;

  return (
    <div
      onClick={() => onSelectProduct && onSelectProduct(product)}
      className={`group bg-[#ffffff] p-2.5 sm:p-3.5 rounded-none border border-[#e6e4dc] hover:border-[#1c1b18] transition-all shadow-2xs flex flex-col justify-between cursor-pointer ${className}`}
    >
      {/* Product Image: Clean square box without rounded corners */}
      <div className="relative aspect-square rounded-none overflow-hidden bg-[#f4f2ea] mb-2.5 group/media">
        <img
          src={img1}
          alt={product.name}
          className={`w-full h-full object-cover object-center transition-all duration-500 ${img2 ? 'group-hover/media:opacity-0' : 'group-hover/media:scale-[1.02]'}`}
        />
        {img2 && (
          <img
            src={img2}
            alt={`${product.name} angle`}
            className="absolute inset-0 w-full h-full object-cover object-center opacity-0 group-hover/media:opacity-100 group-hover/media:scale-[1.02] transition-all duration-500"
          />
        )}
        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-none bg-white/95 text-[9px] font-semibold text-[#1c1b18] uppercase tracking-wider border border-[#e5e2d6]">
          {product.category}
        </span>
        {hasSale ? (
          <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-none bg-rose-600 text-[9px] font-bold text-white uppercase tracking-wider border border-rose-700 shadow-xs">
            -{discountPercent}%
          </span>
        ) : product.isHotDeal ? (
          <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-none bg-rose-600 text-[9px] font-bold text-white uppercase tracking-wider border border-rose-700 flex items-center gap-1 shadow-xs">
            <Zap className="w-2.5 h-2.5 fill-white text-white" />
            <span>Hot Deal</span>
          </span>
        ) : product.isBestSeller ? (
          <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-none bg-[#1c1b18] text-[9px] font-bold text-amber-300 uppercase tracking-wider border border-[#1c1b18] flex items-center gap-1 shadow-xs">
            <Flame className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
            <span>Best Seller</span>
          </span>
        ) : null}
        {img2 && !product.isBestSeller && !product.isHotDeal && !hasSale && (
          <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-none bg-black/70 text-[8px] font-medium text-white tracking-wider opacity-0 group-hover/media:opacity-100 transition-opacity">
            2 Photos
          </span>
        )}

        {/* Hover Hint to View Full Specs & Photos */}
        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none p-3">
          <span className="px-3 py-1 bg-white/95 text-[#1c1b18] text-[10px] font-bold uppercase tracking-wider shadow-md backdrop-blur-xs flex items-center gap-1">
            <span>View Specs &amp; Photos</span>
          </span>
        </div>
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
                ${Number(product.price).toFixed(2)}
              </span>
              {hasSale && (
                <span className="text-[10px] text-[#9ca3af] line-through font-mono">
                  ${Number(product.originalPrice).toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <p className="text-[11px] sm:text-xs text-[#78746a] mb-3 line-clamp-1 sm:line-clamp-2">
            {product.details}
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdd(product);
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
              <span className="text-[11px] sm:text-xs">Add to cart</span>
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

  const displayedProducts = filter === 'all'
    ? products
    : products.filter((p) => p.category.toLowerCase() === filter.toLowerCase());

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

      {/* 5. QUESTIONS, ANSWERED (Interactive FAQ with colorful accents) */}
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
