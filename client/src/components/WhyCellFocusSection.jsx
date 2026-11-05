import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ShieldCheck, Truck, Banknote, Award } from 'lucide-react';

const FEATURES = [
  {
    id: 'genuine',
    icon: ShieldCheck,
    title: 'Genuine products',
    description: 'Every item is sourced from trusted suppliers and checked before it is listed.',
  },
  {
    id: 'delivery',
    icon: Truck,
    title: 'Fast delivery',
    description: 'Orders leave the shop the same day and reach you across Pakistan.',
  },
  {
    id: 'cod',
    icon: Banknote,
    title: 'Cash on delivery',
    description: 'Open the parcel, check the product, then pay the rider.',
  },
  {
    id: 'warranty',
    icon: Award,
    badgeText: '7',
    title: '7 days warranty',
    description: 'Feel free to contact within 7 days to replace or return',
  },
];

const BRANDS = [
  { name: 'iPhone', isApple: true },
  { name: 'SAMSUNG', font: 'font-sans tracking-wide font-black' },
  { name: 'xiaomi', font: 'font-sans font-bold tracking-tight lowercase' },
  { name: 'oppo', font: 'font-sans font-bold tracking-wider lowercase' },
  { name: 'vivo', font: 'font-sans font-extrabold lowercase' },
  { name: 'Infinix', font: 'font-sans font-bold' },
  { name: 'TECNO', font: 'font-mono font-bold tracking-widest' },
];

export default function WhyCellFocusSection() {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const wLetterRef = useRef(null);
  const restTitleRef = useRef(null);
  const subHeaderRef = useRef(null);
  const accentBarRef = useRef(null);
  const cardsRef = useRef([]);
  const brandBarRef = useRef(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    // Trigger GSAP entrance animation when the section scrolls into view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

            // 1. Oversized "W" springs into view smoothly
            if (wLetterRef.current) {
              tl.fromTo(
                wLetterRef.current,
                { opacity: 0, y: 20, scale: 0.8 },
                { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.2)', clearProps: 'transform' }
              );
            }

            // 2. The rest of the title "hy CellFocus?" fades and glides into place
            if (restTitleRef.current) {
              tl.fromTo(
                restTitleRef.current,
                { opacity: 0, x: -15 },
                { opacity: 1, x: 0, duration: 0.55, ease: 'power2.out', clearProps: 'transform' },
                '-=0.45'
              );
            }

            // 3. Subtitle & cyan accent underline
            if (subHeaderRef.current) {
              tl.fromTo(
                subHeaderRef.current,
                { opacity: 0, y: 12 },
                { opacity: 1, y: 0, duration: 0.45, clearProps: 'transform' },
                '-=0.35'
              );
            }
            if (accentBarRef.current) {
              tl.fromTo(
                accentBarRef.current,
                { scaleX: 0, opacity: 0 },
                { scaleX: 1, opacity: 1, duration: 0.45, ease: 'power2.out', clearProps: 'transform' },
                '-=0.3'
              );
            }

            // 4. Staggered feature cards entrance
            if (cardsRef.current.length > 0) {
              tl.fromTo(
                cardsRef.current,
                { opacity: 0, y: 24 },
                { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out', clearProps: 'transform' },
                '-=0.25'
              );
            }

            // 5. Brand compatibility bar reveal
            if (brandBarRef.current) {
              tl.fromTo(
                brandBarRef.current,
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', clearProps: 'transform' },
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

  return (
    <section
      id="why-us"
      ref={sectionRef}
      className="w-full relative overflow-hidden bg-gradient-to-b from-[#ffffff] via-[#f8fdfc] to-[#ffffff] border-b border-[#e5e0d4] min-h-[100dvh] lg:h-screen lg:max-h-screen flex flex-col justify-center py-6 sm:py-8 lg:py-4 z-10"
    >
      {/* Soft ambient corner aura */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-bl from-[#00FFFF]/14 to-transparent rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-teal-100/30 to-transparent rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-6 relative z-10 w-full my-auto">

        {/* Section Header: Centered & Clean with oversized animated 'W' */}
        <div ref={headerRef} className="flex flex-col items-center text-center mb-4 sm:mb-5 lg:mb-4">
          <h2 className="flex items-baseline justify-center tracking-tight flex-wrap select-none">
            <span
              ref={wLetterRef}
              className="inline-block text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1c1b18] leading-none mr-0.5 origin-bottom"
            >
              W
            </span>
            <span
              ref={restTitleRef}
              className="text-xl sm:text-2xl lg:text-3xl font-light text-[#1c1b18] flex items-baseline gap-2"
            >
              <span>hy</span>
              <span className="font-medium text-[#1c1b18]">
                Cell<span className="text-[#0d9488]">Focus</span>
              </span>
              <span className="text-[#0d9488] font-semibold">?</span>
            </span>
          </h2>

          <p ref={subHeaderRef} className="text-xs sm:text-sm text-[#78746a] mt-1 font-light max-w-lg">
            Trusted quality. Smart features. Better experience.
          </p>

          {/* Cyan / Teal Accent Underline Bar */}
          <div
            ref={accentBarRef}
            className="w-12 h-0.5 bg-gradient-to-r from-[#0d9488] via-[#00FFFF] to-[#0d9488] rounded-full mt-2 shadow-[0_0_10px_rgba(0,255,255,0.4)] origin-center"
          />
        </div>

        {/* Middle: 4 Feature Benefit Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-4 mb-4 sm:mb-5 lg:mb-4">
          {FEATURES.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                ref={(el) => (cardsRef.current[idx] = el)}
                className="bg-white/95 backdrop-blur-xs rounded-2xl p-4 sm:p-5 lg:p-4 border border-[#e5e1d5] shadow-xs hover:shadow-md hover:border-[#00FFFF]/50 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Circular #00FFFF Cyan Icon Badge */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white to-[#e6ffff] border border-[#00FFFF]/40 flex items-center justify-center text-[#009999] mb-3 group-hover:scale-105 group-hover:bg-[#009999] group-hover:text-white transition-all duration-300 shadow-2xs">
                    {item.badgeText ? (
                      <div className="relative flex items-center justify-center">
                        <Icon className="w-6 h-6" />
                        <span className="absolute text-[9px] font-black leading-none text-[#009999] group-hover:text-white">
                          {item.badgeText}
                        </span>
                      </div>
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>

                  {/* Feature Title */}
                  <h4 className="text-sm font-bold text-[#1c1b18] mb-1">
                    {item.title}
                  </h4>

                  {/* Feature Subtext */}
                  <p className="text-xs text-[#666258] leading-relaxed font-light line-clamp-2 sm:line-clamp-3">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom: Works With Every Major Phone Brand Banner */}
        <div
          ref={brandBarRef}
          className="w-full bg-white/90 backdrop-blur-xs rounded-2xl border border-[#e4dfd2] py-2.5 px-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-[#334155]"
        >
          {/* Label */}
          <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-[#0f172a] shrink-0">
            <span>Works with every major phone brand</span>
            <span className="hidden sm:inline text-[#cbd5e1]">|</span>
          </div>

          {/* Brand Badges / Logos */}
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 sm:gap-6 text-xs sm:text-sm text-[#475569]">
            {BRANDS.map((brand) => (
              <span
                key={brand.name}
                className={`transition-colors hover:text-[#0d9488] cursor-default flex items-center gap-1 ${brand.font || 'font-semibold'}`}
              >
                {brand.isApple && (
                  <svg className="w-3.5 h-3.5 fill-current inline-block -mt-0.5" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.71-7.91-12.04-14.49-6.3-9.52-11.37-20.44-15.2-32.76-3.84-12.32-5.75-23.77-5.75-34.34 0-14.86 3.82-27.23 11.45-37.13 7.64-9.9 17.06-14.99 28.27-15.27 4.58 0 9.84 1.25 15.78 3.75 5.94 2.5 9.77 3.81 11.5 3.93 1.48-.12 5.51-1.54 12.09-4.26 6.58-2.73 12.18-3.99 16.79-3.79 12.69.65 22.84 5.34 30.46 14.07-11.05 6.72-16.48 15.93-16.29 27.63.19 9.38 3.79 17.38 10.8 24.02 7.01 6.64 15.42 10.42 25.23 11.34-2.22 6.67-4.99 13.57-8.32 20.7zM119.22 31.84c0-7.39 2.67-14.41 8.01-21.06 5.34-6.65 11.96-10.78 19.86-12.39.22 1.08.33 2.05.33 2.92 0 7.39-2.8 14.53-8.4 21.43-5.61 6.9-12.4 11.08-20.37 12.55-.23-1.08-.34-2.23-.34-3.45z" />
                  </svg>
                )}
                <span>{brand.name}</span>
              </span>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

