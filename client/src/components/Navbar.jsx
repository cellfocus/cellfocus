import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Menu, X, SlidersHorizontal, Flame, Zap, ShieldCheck, 
  HelpCircle, Store, Compass, RotateCcw, Phone, Coins, MessageCircle, ArrowRight, Truck 
} from 'lucide-react';
import CurrencySelector from './CurrencySelector';

export default function Navbar({ cartCount = 0, onCategoryClick, onOpenCart, onOpenAdmin, onOpenTracking }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPastHero, setIsPastHero] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const hero = document.getElementById('hero-section');
      if (hero) {
        const heroBottom = hero.getBoundingClientRect().bottom;
        // When bottom line of hero section is scrolled past, hide the navbar
        const shouldHide = heroBottom <= 40;
        setIsPastHero(shouldHide);
        if (shouldHide) {
          setMobileMenuOpen(false);
        }
      } else {
        setIsPastHero(window.scrollY > (window.innerHeight || 600));
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    let checkInterval = null;
    if (window.lenis) {
      window.lenis.on('scroll', handleScroll);
    } else {
      checkInterval = setInterval(() => {
        if (window.lenis) {
          window.lenis.on('scroll', handleScroll);
          clearInterval(checkInterval);
        }
      }, 400);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (window.lenis) {
        window.lenis.off('scroll', handleScroll);
      }
      if (checkInterval) clearInterval(checkInterval);
    };
  }, []);

  const sections = [
    { name: 'Shop Now', id: 'products', icon: Store },
    { name: 'Best Sellers', id: 'best-sellers', icon: Flame },
    { name: 'Hot Deal', id: 'hot-deal', icon: Zap },
    { name: 'Why Us', id: 'why-us', icon: ShieldCheck },
    { name: 'FAQ', id: 'faq', icon: HelpCircle },
    { name: 'About Us', id: 'about-us', icon: Compass },
    { name: 'Returns', id: 'returns', icon: RotateCcw },
    { name: 'Contact', id: 'contact', icon: Phone },
  ];

  const handleScrollTo = (targetId) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(targetId);
    if (element) {
      if (window.lenis) {
        window.lenis.scrollTo(element, { offset: -20, duration: 1.1 });
      } else {
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - 20;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
    }
  };

  return (
    <header className={`sticky top-0 z-40 w-full bg-[#fbf9f4]/85 backdrop-blur-2xl backdrop-saturate-180 border-b border-[#e5e0d4]/80 shadow-xs shadow-neutral-900/[0.03] transition-all duration-300 ease-out ${
      isPastHero 
        ? '-translate-y-full opacity-0 pointer-events-none' 
        : 'translate-y-0 opacity-100 pointer-events-auto'
    }`}>
      <nav className="w-full max-w-7xl mx-auto px-4 sm:px-8 h-16 sm:h-20 flex items-center justify-between">

        {/* Brand Lockup */}
        <a
          href="#"
          className="flex items-center gap-2.5 sm:gap-3.5 group cursor-pointer py-1 shrink-0"
          aria-label="CellFocus Home"
        >
          <img
            src="/logo-full.png"
            alt="CellFocus Crest"
            className="h-8 sm:h-11 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
          />

          <img
            src="/wordmark.png"
            alt="CELLFOCUS"
            className="h-3 sm:h-4.5 w-auto object-contain transition-opacity duration-200 group-hover:opacity-90"
          />
        </a>

        {/* Desktop Navigation: Direct section links for laptop & desktop */}
        <div className="hidden lg:flex items-center space-x-6 xl:space-x-8">
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => handleScrollTo(sec.id)}
              className="text-xs xl:text-sm font-medium text-[#4a473f] hover:text-[#1c1b18] transition-colors cursor-pointer flex items-center gap-1.5 py-1 select-none"
            >
              <span>{sec.name}</span>
              {sec.badge && (
                <span className="text-[10px] text-amber-600 font-bold leading-none">
                  {sec.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Actions (Currency + Track Order + Cart) for desktop */}
        <div className="hidden lg:flex items-center space-x-3 border-l border-[#dedad0] pl-5">
          {/* Order Tracking Button */}
          <button
            type="button"
            onClick={() => onOpenTracking && onOpenTracking('')}
            className="text-xs font-semibold text-[#1c1b18] hover:text-[#000] bg-white hover:bg-[#f6f4ee] border border-[#dedad0] rounded-full px-3 py-1.5 transition flex items-center gap-1.5 shadow-2xs cursor-pointer select-none"
            title="Track Order Status"
          >
            <Truck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Track Order</span>
          </button>

          {/* Currency Selector */}
          <CurrencySelector />

          {/* Cart Icon */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center justify-center text-[#1c1b18] hover:opacity-75 transition cursor-pointer p-1.5"
            aria-label="Open Shopping Cart"
            title="Cart Drawer"
          >
            <ShoppingBag className="w-5 h-5 stroke-[1.8]" />
            {cartCount > 0 && (
              <span
                key={cartCount}
                className="absolute -top-1 -right-1.5 text-[10px] font-bold leading-none text-white bg-[#1c1b18] rounded-full px-1.5 py-0.5 min-w-[17px] text-center shadow-xs animate-in zoom-in-75 duration-200"
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Mobile & Tablet Controls (under lg): Ultra-clean layout with Track Order + Cart + Hamburger */}
        <div className="flex lg:hidden items-center space-x-1.5">
          {/* Quick Track Order Mobile Icon */}
          <button
            type="button"
            onClick={() => onOpenTracking && onOpenTracking('')}
            className="p-2 rounded-xl text-[#1c1b18] hover:bg-black/5 transition cursor-pointer"
            aria-label="Track Order"
            title="Track Order"
          >
            <Truck className="w-5 h-5 stroke-[1.8] text-[#1c1b18]" />
          </button>

          {/* Cart Icon */}
          <button
            onClick={onOpenCart}
            className="relative p-2 rounded-xl text-[#1c1b18] hover:bg-black/5 transition cursor-pointer"
            aria-label="Shopping Cart"
            title="Open Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5 stroke-[1.8]" />
            {cartCount > 0 && (
              <span
                key={`mob-${cartCount}`}
                className="absolute top-0.5 right-0.5 text-[9px] font-bold leading-none text-white bg-[#1c1b18] rounded-full px-1.5 py-0.5 min-w-[16px] text-center shadow-xs animate-in zoom-in-75 duration-200"
              >
                {cartCount}
              </span>
            )}
          </button>

          {/* Hamburger Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl border border-[#dedad0] bg-white/80 hover:bg-white text-[#1c1b18] transition shadow-2xs cursor-pointer"
            aria-label="Toggle Navigation Menu"
            title="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile & Tablet Navigation Drawer (contains Currency, Cart summary & sections) */}
      {mobileMenuOpen && (
        <div className="lg:hidden w-full border-t border-[#e2dfd5] bg-[#faf8f4]/98 backdrop-blur-2xl px-4 sm:px-8 py-5 space-y-3.5 shadow-2xl animate-in fade-in-50 slide-in-from-top-2 max-h-[85vh] overflow-y-auto overscroll-contain">
          
          {/* Top Row: Currency Switcher inside Hamburger */}
          <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-[#dedad0] shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-[#1c1b18]">Currency &amp; Region</p>
                <p className="text-[10px] text-[#78746a]">Base PKR (Live conversion)</p>
              </div>
            </div>
            <CurrencySelector />
          </div>

          {/* Quick Cart Summary Action */}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenCart();
            }}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#1c1b18] hover:bg-[#32302b] text-[#f6f5f0] text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-4 h-4 text-white" />
              <span>View Shopping Cart</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-mono text-[11px] font-bold">
              {cartCount} {cartCount === 1 ? 'item' : 'items'}
            </span>
          </button>

          {/* Quick Order Tracking Action in Mobile Drawer */}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              if (onOpenTracking) onOpenTracking('');
            }}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-white border border-[#dedad0] text-[#1c1b18] text-xs font-semibold shadow-2xs hover:bg-[#faf8f4] transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                <Truck className="w-3.5 h-3.5" />
              </span>
              <div className="text-left">
                <p className="font-bold leading-tight">Track Your Order</p>
                <p className="text-[10px] text-[#78746a] font-normal">Live courier &amp; parcel tracking</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#78746a]" />
          </button>

          {/* Section Navigation Links */}
          <div className="space-y-1 pt-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#8a867c] px-2 py-1">
              Browse Store Sections
            </div>
            {sections.map((sec) => {
              const Icon = sec.icon;
              return (
                <button
                  key={sec.id}
                  onClick={() => handleScrollTo(sec.id)}
                  className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl text-xs font-semibold text-[#1c1b18] hover:bg-white active:bg-white transition cursor-pointer border border-transparent hover:border-[#eeebe2]"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-[#78746a]" />
                    <span>{sec.name}</span>
                  </div>
                  {sec.badge ? (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                      {sec.badge}
                    </span>
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5 text-[#dedad0]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Direct WhatsApp Support inside Hamburger */}
          <div className="pt-1">
            <a
              href="https://wa.me/923269589597"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs font-semibold transition"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp Support: 0326 9589597</span>
            </a>
          </div>

        </div>
      )}
    </header>
  );
}
