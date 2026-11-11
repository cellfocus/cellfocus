import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { 
  Boxes, 
  Percent, 
  Truck, 
  ShieldCheck, 
  Building2, 
  MessageCircle, 
  ArrowRight 
} from 'lucide-react';

const BULK_BENEFITS = [
  {
    icon: Percent,
    title: 'Highest Retail Margins',
    desc: 'Direct sourcing ensures healthy profit margins for phone shops and resellers.',
  },
  {
    icon: ShieldCheck,
    title: '100% Tested Stock',
    desc: 'Every charger, cable, and earphone is checked before dispatch.',
  },
  {
    icon: Truck,
    title: 'Nationwide Cargo & COD',
    desc: 'Express cargo via TCS, Leopards, or Daewoo across all cities in Pakistan.',
  },
  {
    icon: Building2,
    title: 'Custom Invoicing & Support',
    desc: 'Direct wholesale account manager for fast refills and instant quotes.',
  },
];

export default function NeedBulkSection() {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const cardsRef = useRef([]);
  const buttonRef = useRef(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

            if (headerRef.current) {
              tl.fromTo(
                headerRef.current.children,
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, clearProps: 'all' }
              );
            }

            if (cardsRef.current.length) {
              tl.fromTo(
                cardsRef.current,
                { opacity: 0, y: 18 },
                { opacity: 1, y: 0, duration: 0.45, stagger: 0.06, clearProps: 'all' },
                '-=0.3'
              );
            }

            if (buttonRef.current) {
              tl.fromTo(
                buttonRef.current,
                { opacity: 0, y: 10 },
                { opacity: 1, y: 0, duration: 0.4, clearProps: 'all' },
                '-=0.2'
              );
            }

            observer.disconnect();
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const whatsappUrl = `https://wa.me/923269589597?text=${encodeURIComponent(
    'Assalam-o-Alaikum CellFocus! 📦✨\n\nI am interested in BULK / WHOLESALE orders for my shop/business. Please share your wholesale price catalog and minimum order quantities. Thank you!'
  )}`;

  return (
    <section
      id="bulk"
      ref={sectionRef}
      className="py-6 sm:py-8 lg:py-10 bg-[#faf8f4] border-t border-[#e8e4d8] relative overflow-hidden"
    >
      {/* Subtle ambient blur aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[240px] bg-teal-500/5 blur-[100px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header - Compact and editorial */}
        <div ref={headerRef} className="text-center max-w-xl mx-auto mb-5 sm:mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-[10px] font-bold uppercase tracking-widest mb-1.5 shadow-2xs">
            <Boxes className="w-3 h-3 text-teal-700" />
            <span>Wholesale &amp; Bulk Supply</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-[#1c1b18] tracking-tight">
            Need <span className="font-serif italic font-normal text-[#0d9488]">Bulk?</span>
          </h2>

          <p className="mt-1 text-xs sm:text-sm text-[#78746a] font-light leading-snug">
            Mobile accessories ki direct wholesale market: Supplying phone shops &amp; resellers across Lahore, Karachi, Islamabad, and nationwide at unbeatably low bulk rates.
          </p>

          <div className="w-10 h-0.5 bg-[#0d9488] mx-auto mt-2.5 rounded-full" />
        </div>

        {/* 4 Feature Value Props - Single screen compact grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
          {BULK_BENEFITS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                ref={(el) => (cardsRef.current[idx] = el)}
                className="p-4 sm:p-4.5 bg-white/95 backdrop-blur-xs rounded-2xl border border-[#e5e1d5] hover:border-[#1c1b18] transition-all duration-300 shadow-2xs hover:shadow-xs group flex flex-col justify-between"
              >
                <div>
                  <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200/60 group-hover:bg-[#1c1b18] group-hover:border-[#1c1b18] text-[#0d9488] group-hover:text-white flex items-center justify-center mb-2.5 transition-colors duration-300">
                    <Icon className="w-4 h-4 stroke-[1.8]" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#1c1b18] mb-1">{item.title}</h3>
                  <p className="text-[11px] sm:text-xs text-[#78746a] leading-relaxed font-light">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sleek Minimal WhatsApp Button - Perfectly matching the website vibe */}
        <div ref={buttonRef} className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-center">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-xs hover:shadow transition-all duration-200 cursor-pointer group hover:-translate-y-0.5"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-white text-emerald-600" />
            <span>Inquire on WhatsApp</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </a>
          <span className="text-[11px] text-[#8c887e] font-mono">
            Direct Wholesale Desk &bull; 0326 9589597
          </span>
        </div>

      </div>
    </section>
  );
}
