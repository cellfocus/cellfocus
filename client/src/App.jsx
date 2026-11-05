import React, { useState, useEffect } from 'react';
import Lenis from 'lenis';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import ProductGrid from './components/ProductGrid';
import CartDrawer from './components/CartDrawer';
import AdminPanel from './components/AdminPanel';
import Footer from './components/Footer';
import ThreadsLoader from './components/ThreadsLoader';
import PageSkeleton from './components/PageSkeleton';
import ProductDetailModal from './components/ProductDetailModal';
import WhatsAppButton from './components/WhatsAppButton';

function App() {
  // Staged initial load: 'loader' (3s) -> 'skeleton' (2s) -> 'ready' (full interactive website)
  const [loadingStage, setLoadingStage] = useState('loader');

  useEffect(() => {
    if (loadingStage === 'skeleton') {
      const timer = setTimeout(() => {
        setLoadingStage('ready');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loadingStage]);

  // Global High-Performance Smooth Scroll Engine (Lenis 60/120fps physics)
  useEffect(() => {
    if (loadingStage !== 'ready') return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.4,
      infinite: false,
    });

    window.lenis = lenis;

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Keyboard navigation using Lenis smooth interpolation
    const SECTION_IDS = [
      'products',
      'best-sellers',
      'hot-deal',
      'why-us',
      'faq',
      'about-us',
      'returns',
      'contact',
      'footer',
    ];

    const handleKeyDown = (e) => {
      // Don't intercept when user is typing in form inputs, textareas, or contentEditable elements
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        activeTag === 'select' ||
        (document.activeElement && document.activeElement.isContentEditable)
      ) {
        return;
      }

      const scrollY = window.scrollY || window.pageYOffset;
      const navOffset = 70;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        let targetY = null;
        for (const id of SECTION_IDS) {
          const el = document.getElementById(id);
          if (el) {
            const top = el.getBoundingClientRect().top + scrollY - navOffset;
            if (top > scrollY + 40) {
              targetY = top;
              break;
            }
          }
        }
        if (targetY !== null) {
          lenis.scrollTo(targetY, { duration: 1.1 });
        } else {
          lenis.scrollTo(scrollY + window.innerHeight * 0.85, { duration: 1.1 });
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        let targetY = null;
        for (let i = SECTION_IDS.length - 1; i >= 0; i--) {
          const el = document.getElementById(SECTION_IDS[i]);
          if (el) {
            const top = el.getBoundingClientRect().top + scrollY - navOffset;
            if (top < scrollY - 40) {
              targetY = top;
              break;
            }
          }
        }
        if (targetY !== null) {
          lenis.scrollTo(targetY, { duration: 1.1 });
        } else {
          lenis.scrollTo(0, { duration: 1.1 });
        }
      } else if (e.key === 'PageDown' || (e.code === 'Space' && !e.shiftKey)) {
        e.preventDefault();
        lenis.scrollTo(scrollY + window.innerHeight * 0.88, { duration: 1.1 });
      } else if (e.key === 'PageUp' || (e.code === 'Space' && e.shiftKey)) {
        e.preventDefault();
        lenis.scrollTo(Math.max(0, scrollY - window.innerHeight * 0.88), { duration: 1.1 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(rafId);
      lenis.destroy();
      delete window.lenis;
    };
  }, [loadingStage]);

  // Cart state with localStorage persistence
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('cellfocus_cart');
      return saved ? JSON.parse(saved) : [
        { id: 'ch-101', name: 'GaN 65W Dual Port Charger', price: 24.00, qty: 1, image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=700&q=80' }
      ];
    } catch {
      return [];
    }
  });

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartInitialStep, setCartInitialStep] = useState('cart');
  const [detailProduct, setDetailProduct] = useState(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Support for obfuscated secret URL admin access (e.g., /?portal=manage-cf-9x7q or /?portal=admin)
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const portalToken = searchParams.get('portal');
      if (portalToken === 'admin' || portalToken === 'manage-cf-9x7q') {
        setIsAdminOpen(true);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {}
  }, []);

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cellfocus_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [cartItems]);

  const handleAddToCart = (product, qty = 1) => {
    const pid = product.id || product._id;
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === pid);
      if (existing) {
        return prev.map((item) =>
          item.id === pid ? { ...item, qty: item.qty + qty } : item
        );
      }
      return [
        ...prev,
        {
          id: pid,
          name: product.name,
          price: Number(product.price),
          image: product.image,
          qty: qty
        }
      ];
    });
    setCartInitialStep('cart');
    // Auto open cart drawer on add
    setIsCartOpen(true);
  };

  const handleBuyNow = (product, qty = 1) => {
    const pid = product.id || product._id;
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === pid);
      if (existing) {
        return prev.map((item) =>
          item.id === pid ? { ...item, qty: item.qty + qty } : item
        );
      }
      return [
        ...prev,
        {
          id: pid,
          name: product.name,
          price: Number(product.price),
          image: product.image,
          qty: qty
        }
      ];
    });
    setDetailProduct(null);
    setCartInitialStep('checkout');
    setIsCartOpen(true);
  };

  const handleOpenDetail = (product) => {
    setDetailProduct(product);
  };

  const handleCloseDetail = () => {
    setDetailProduct(null);
  };

  const handleUpdateQty = (id, delta) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const handleRemoveItem = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    const element = document.getElementById('products');
    if (element) {
      if (window.lenis) {
        window.lenis.scrollTo(element, { offset: -70, duration: 1.1 });
      } else {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const totalCartCount = cartItems.reduce((acc, curr) => acc + curr.qty, 0);

  return (
    <div className="min-h-screen bg-[#f7f4ec] text-[#1c1b18] flex flex-col font-sans selection:bg-[#e5e0d4] relative overflow-x-hidden">
      
      {/* Global Seamless Blended Background Aura across entire website */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Top-Right Luminous Cyan #00FFFF Aura */}
        <div className="absolute -top-32 -right-32 w-[720px] h-[720px] bg-gradient-to-bl from-[#00FFFF]/16 via-[#00FFFF]/[0.06] to-transparent rounded-full blur-[130px]" />
        
        {/* Mid-Left Warm Golden Amber/Cream Glow */}
        <div className="absolute top-[28%] -left-40 w-[680px] h-[680px] bg-gradient-to-tr from-amber-200/30 via-[#00FFFF]/[0.05] to-transparent rounded-full blur-[140px]" />
        
        {/* Mid-Right Radiant Cyan Accent */}
        <div className="absolute top-[62%] -right-32 w-[620px] h-[620px] bg-gradient-to-l from-[#00FFFF]/14 to-transparent rounded-full blur-[130px]" />
        
        {/* Bottom Ambient Warm Cream & Cyan Glow */}
        <div className="absolute -bottom-40 left-1/4 w-[720px] h-[720px] bg-gradient-to-t from-amber-100/35 via-[#00FFFF]/[0.05] to-transparent rounded-full blur-[150px]" />
      </div>

      {/* Stage 1: Monotone Animated Loader (3 seconds) */}
      {loadingStage === 'loader' && (
        <ThreadsLoader minDuration={3000} onFinished={() => setLoadingStage('skeleton')} />
      )}

      {/* While in 'loader' or 'skeleton' stage, render ONLY the PageSkeleton so the real web page never flashes early */}
      {loadingStage === 'loader' || loadingStage === 'skeleton' ? (
        <PageSkeleton />
      ) : (
        /* Stage 3: Live Interactive Storefront (revealed only after skeleton finishes) */
        <>
          {/* Hero Zone Container: scoped sticky scroll */}
          <div className="relative w-full">
            <Navbar
              cartCount={totalCartCount}
              onCategoryClick={handleCategorySelect}
              onOpenCart={() => {
                setCartInitialStep('cart');
                setIsCartOpen(true);
              }}
              onOpenAdmin={() => setIsAdminOpen(true)}
            />
            <HeroSection onExploreCategory={handleCategorySelect} />
          </div>

          {/* Main Catalog Section */}
          <main className="flex-1">
            <ProductGrid
              activeCategory={selectedCategory}
              onAddToCart={handleAddToCart}
              onSelectProduct={handleOpenDetail}
              refreshTrigger={refreshTrigger}
            />
          </main>

          {/* Interactive Cart Sidebar Drawer */}
          <CartDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            initialStep={cartInitialStep}
            cartItems={cartItems}
            onUpdateQty={handleUpdateQty}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
          />

          {/* Dedicated Full Product Description / Specs / Policies Modal */}
          <ProductDetailModal
            product={detailProduct}
            isOpen={Boolean(detailProduct)}
            onClose={handleCloseDetail}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
          />

          {/* Full-Stack Admin CRUD Side Panel */}
          <AdminPanel
            isOpen={isAdminOpen}
            onClose={() => setIsAdminOpen(false)}
            onProductsChanged={() => setRefreshTrigger((prev) => prev + 1)}
          />

          {/* Complete E-Commerce Storefront Footer */}
          <Footer
            onCategoryClick={handleCategorySelect}
            onOpenAdmin={() => setIsAdminOpen(true)}
          />

          {/* Floating WhatsApp Quick Action Button */}
          <WhatsAppButton />
        </>
      )}
    </div>
  );
}

export default App;
