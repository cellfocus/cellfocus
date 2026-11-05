import React, { useState } from 'react';
import { ShoppingBag, Menu, X, SlidersHorizontal, Flame, Zap, ShieldCheck, HelpCircle, Store, Compass, RotateCcw, Phone, Shield } from 'lucide-react';

export default function Navbar({ cartCount = 0, onCategoryClick, onOpenCart, onOpenAdmin }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        window.lenis.scrollTo(element, { offset: -70, duration: 1.1 });
      } else {
        const navOffset = 76;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - navOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#fbf9f4]/85 backdrop-blur-2xl backdrop-saturate-180 border-b border-[#e5e0d4]/80 shadow-xs shadow-neutral-900/[0.03] transition-all duration-300">
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

        {/* Actions (Admin + Cart) for desktop */}
        <div className="hidden lg:flex items-center space-x-3 border-l border-[#dedad0] pl-5">
          {/* Admin Button */}
          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#dedad0] bg-white/70 hover:bg-white text-xs font-semibold text-[#4a473f] hover:text-[#1c1b18] transition shadow-2xs cursor-pointer"
            title="Open Admin Operations"
          >
            <Shield className="w-3.5 h-3.5 text-[#0d9488]" />
            <span>Admin</span>
          </button>

          {/* Cart Icon */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center justify-center text-[#1c1b18] hover:opacity-75 transition cursor-pointer p-1.5"
            aria-label="Open Shopping Cart"
            title="Cart Drawer"
          >
            <ShoppingBag className="w-5 h-5 stroke-[1.8]" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1.5 text-[10px] font-bold leading-none text-white bg-[#1c1b18] rounded-full px-1.5 py-0.5 min-w-[17px] text-center shadow-xs">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Tablet Navigation fallback (md to lg) */}
        <div className="hidden md:flex lg:hidden items-center space-x-4">
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => handleScrollTo(sec.id)}
              className="text-xs font-medium text-[#4a473f] hover:text-[#1c1b18] transition-colors cursor-pointer"
            >
              {sec.name}
            </button>
          ))}
          <div className="flex items-center space-x-2 pl-2 border-l border-[#dedad0]">
            <button
              onClick={onOpenAdmin}
              className="p-1.5 rounded-lg text-[#1c1b18] border border-[#dedad0] hover:bg-white transition cursor-pointer"
              title="Admin Portal"
            >
              <Shield className="w-4 h-4 text-[#0d9488]" />
            </button>
            <button
              onClick={onOpenCart}
              className="relative p-1.5 text-[#1c1b18]"
              aria-label="Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 text-[9px] font-bold text-white bg-[#1c1b18] rounded-full px-1.5 py-0.2">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile controls (under md) */}
        <div className="flex md:hidden items-center space-x-2.5">
          <button
            onClick={onOpenAdmin}
            className="p-1.5 rounded-lg text-[#1c1b18] border border-[#dedad0] bg-white/70 hover:bg-white transition cursor-pointer"
            title="Admin Portal"
          >
            <Shield className="w-4 h-4 text-[#0d9488]" />
          </button>

          <button
            onClick={onOpenCart}
            className="relative text-[#1c1b18] p-1.5"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5 stroke-[1.8]" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1.5 text-[9px] font-bold leading-none text-white bg-[#1c1b18] rounded-full px-1.5 py-0.5">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-[#1c1b18] p-1.5 rounded-lg border border-[#dedad0] bg-white/70 cursor-pointer"
            aria-label="Toggle section menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer: Clear section navigation list */}
      {mobileMenuOpen && (
        <div className="md:hidden w-full border-t border-white/60 bg-[#f2f2f4]/98 backdrop-blur-2xl px-5 py-4 space-y-1 shadow-lg animate-fadeIn">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#8a867c] px-3 py-1 mb-1">
            Browse Store Sections
          </div>
          {sections.map((sec) => {
            const Icon = sec.icon;
            return (
              <button
                key={sec.id}
                onClick={() => handleScrollTo(sec.id)}
                className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl text-xs font-semibold text-[#1c1b18] hover:bg-white/80 active:bg-white transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-[#78746a]" />
                  <span>{sec.name}</span>
                </div>
                {sec.badge && (
                  <span className="text-[10px] font-bold text-amber-600">
                    {sec.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
