import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import {
  ShieldCheck,
  RotateCcw,
  MapPin,
  Phone,
  Mail,
  Clock,
  ArrowUp,
  Zap,
  Flame,
  Headphones,
  AudioLines,
  Store,
  HelpCircle,
  Compass,
  Boxes
} from 'lucide-react';

export default function Footer({ onCategoryClick, onOpenAdmin }) {
  const footerRef = useRef(null);
  const linksGridRef = useRef(null);
  const bottomBarRef = useRef(null);

  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

            if (linksGridRef.current) {
              tl.fromTo(
                linksGridRef.current.children,
                { opacity: 0, y: 16 },
                { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, clearProps: 'transform' }
              );
            }

            if (bottomBarRef.current) {
              tl.fromTo(
                bottomBarRef.current,
                { opacity: 0, y: 12 },
                { opacity: 1, y: 0, duration: 0.45, clearProps: 'transform' },
                '-=0.25'
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

  const scrollToTop = () => {
    if (window.lenis) {
      window.lenis.scrollTo(0, { duration: 1.2 });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleScrollTo = (targetId) => {
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
    <footer
      id="footer"
      ref={footerRef}
      className="w-full relative overflow-hidden bg-[#090b0e] text-white border-t-2 border-[#00FFFF] shadow-[0_-3px_20px_rgba(0,255,255,0.35)] z-10 pt-12 sm:pt-16 pb-8 sm:pb-10 px-6 sm:px-10"
    >
      {/* Subtle Cyan Ambient Glow Aura */}
      <div className="absolute -top-32 left-1/3 w-[500px] h-[300px] bg-gradient-to-b from-[#00FFFF]/10 to-transparent rounded-full blur-[110px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 w-full">

        {/* Main Footer Links & Info Grid */}
        <div
          ref={linksGridRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-10 sm:pb-12 border-b border-white/[0.08]"
        >

          {/* 1. Brand Col (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-4">
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); scrollToTop(); }}
              className="inline-flex items-center gap-3 group cursor-pointer"
              aria-label="CellFocus Home"
            >
              <img
                src="/logo-footer.png"
                alt="CellFocus Crest"
                className="h-11 sm:h-12 w-auto object-contain filter drop-shadow-[0_0_12px_rgba(0,255,255,0.45)] transition-transform duration-200 group-hover:scale-105"
              />
              <img
                src="/wordmark-footer.png"
                alt="CELLFOCUS"
                className="h-4 sm:h-5 w-auto object-contain transition-opacity duration-200 group-hover:opacity-90"
              />
            </a>

            <p className="text-xs sm:text-sm text-[#9ca3af] font-light leading-relaxed max-w-sm">
              Challenging overpriced mobile accessory trends for 15 years. Delivering exceptional, high-grade chargers, premium acoustics, and protective gear at consistently fair prices.
            </p>

            {/* Official Tax & Legal Registration Badge */}
            <div className="pt-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.1] text-[11px] text-[#cbd5e1] shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-[#00FFFF] shrink-0" />
                <span>
                  FBR Registered &bull; NTN:{' '}
                  <strong className="text-white font-mono tracking-wider font-bold">1369148-4</strong>
                </span>
              </div>
            </div>
          </div>

          {/* 2. CATALOG Col (lg:col-span-2) */}
          <div className="lg:col-span-2 space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#00FFFF]">
              CATALOG
            </h4>
            <ul className="space-y-2.5 text-xs text-[#cbd5e1]">
              <li>
                <button
                  onClick={() => {
                    if (onCategoryClick) onCategoryClick('all');
                    handleScrollTo('products');
                  }}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Store className="w-3.5 h-3.5 text-[#00FFFF] shrink-0" />
                  <span>All Products</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    if (onCategoryClick) onCategoryClick('chargers');
                    handleScrollTo('products');
                  }}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Zap className="w-3.5 h-3.5 text-[#00FFFF] shrink-0" />
                  <span>Fast Chargers</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    if (onCategoryClick) onCategoryClick('airpods');
                    handleScrollTo('products');
                  }}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Headphones className="w-3.5 h-3.5 text-[#00FFFF] shrink-0" />
                  <span>AirPods &amp; Wireless</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    if (onCategoryClick) onCategoryClick('handsfree');
                    handleScrollTo('products');
                  }}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-2"
                >
                  <AudioLines className="w-3.5 h-3.5 text-[#00FFFF] shrink-0" />
                  <span>Wired Audio</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleScrollTo('best-sellers')}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Flame className="w-3.5 h-3.5 text-[#00FFFF] shrink-0" />
                  <span>Best Sellers</span>
                </button>
              </li>
            </ul>
          </div>

          {/* 3. SUPPORT & NAVIGATION Col (lg:col-span-3) */}
          <div className="lg:col-span-3 space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#00FFFF]">
              SUPPORT &amp; NAVIGATION
            </h4>
            <ul className="space-y-2.5 text-xs text-[#cbd5e1]">
              <li>
                <button
                  onClick={() => handleScrollTo('returns')}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#00FFFF] shrink-0" />
                  <span>7-Day Return &amp; Exchange</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleScrollTo('faq')}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-2"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-[#00FFFF] shrink-0" />
                  <span>Frequently Asked Questions</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleScrollTo('why-us')}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-2"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#00FFFF] shrink-0" />
                  <span>Why Buy From CellFocus</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleScrollTo('bulk')}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Boxes className="w-3.5 h-3.5 text-[#00FFFF] shrink-0" />
                  <span>Wholesale &amp; Bulk Orders</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleScrollTo('about-us')}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Compass className="w-3.5 h-3.5 text-[#00FFFF] shrink-0" />
                  <span>About Our Mission</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleScrollTo('contact')}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-2"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#00FFFF] shrink-0" />
                  <span>Store Locations &amp; Timings</span>
                </button>
              </li>
            </ul>
          </div>

          {/* 4. PHYSICAL OUTLETS Col (lg:col-span-3) */}
          <div className="lg:col-span-3 space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#00FFFF]">
              PHYSICAL OUTLETS
            </h4>
            <div className="space-y-3 text-xs text-[#9ca3af]">
              <div>
                <p className="font-semibold text-xs text-[#f3f4f6] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#00FFFF] shrink-0" />
                  <span>Store 1: Time Center</span>
                </p>
                <p className="text-[11px] text-[#9ca3af] pl-5 mt-0.5 leading-snug">
                  Shop # C-21, 2nd Floor, Saddar, Peshawar.
                </p>
              </div>

              <div>
                <p className="font-semibold text-xs text-[#f3f4f6] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#00FFFF] shrink-0" />
                  <span>Store 2: City Center Plaza</span>
                </p>
                <p className="text-[11px] text-[#9ca3af] pl-5 mt-0.5 leading-snug">
                  Shop # 19, Basement, Ashraf Road, Peshawar.
                </p>
              </div>

              <div className="pt-1 text-[11px] text-[#9ca3af] space-y-1.5">
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#00FFFF] shrink-0" />
                  <span className="font-mono text-[#d1d5db]">0326 9589597</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#00FFFF] shrink-0" />
                  <span className="text-[#d1d5db]">cellfocusc21@gmail.com</span>
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#00FFFF] shrink-0" />
                  <span className="text-[#d1d5db]">Mon – Sat: 9:00 AM – 7:00 PM</span>
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Utility Bar (Copyright, Admin Portal, Back to Top) */}
        <div
          ref={bottomBarRef}
          className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9ca3af]"
        >
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 font-mono text-[11px]">
            <span className="font-bold text-white tracking-wider">CELLFOCUS</span>
            <span>&bull;</span>
            <span className="text-[#cbd5e1]">
              FBR (NTN): <strong className="text-[#00FFFF] font-mono">1369148-4</strong>
            </span>
            <span>&bull;</span>
            <span>&copy; {new Date().getFullYear()} All Rights Reserved.</span>
          </div>

          <div className="flex items-center gap-5">
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-neutral-100 text-[#090b0e] font-semibold text-xs shadow-md transition-all cursor-pointer active:scale-95"
            >
              <span>Back to Top</span>
              <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}
