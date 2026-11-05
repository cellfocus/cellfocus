import React, { useEffect, useRef } from 'react';
import { MapPin, Clock, Phone, Mail, MessageCircle, ExternalLink, Navigation, Code2 } from 'lucide-react';
import gsap from 'gsap';

export default function ContactUsSection() {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const cardsGridRef = useRef(null);
  const devStripRef = useRef(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

            // 1. Header fade & slide up
            if (headerRef.current) {
              tl.fromTo(
                headerRef.current.children,
                { opacity: 0, y: 16 },
                { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, clearProps: 'transform' }
              );
            }

            // 2. 3 Pillar Cards stagger entrance
            if (cardsGridRef.current) {
              const cards = cardsGridRef.current.querySelectorAll('.gsap-contact-card');
              if (cards.length > 0) {
                tl.fromTo(
                  cards,
                  { opacity: 0, y: 22 },
                  { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: 'power2.out', clearProps: 'transform' },
                  '-=0.3'
                );
              }
            }

            // 3. About Dev Strip entrance
            if (devStripRef.current) {
              tl.fromTo(
                devStripRef.current,
                { opacity: 0, y: 14 },
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

  const stores = [
    {
      id: 1,
      badge: 'Store 1',
      name: 'Time Center',
      address: 'Shop # C-21, 2nd Floor, Time Center, Saddar, Peshawar',
      mapUrl:
        'https://www.google.com/maps/place/Time+Center/@33.9965045,71.5366193,19.18z/data=!4m6!3m5!1s0x38d9178e6b4106f7:0x9732ba9e170ca2da!8m2!3d33.996673!4d71.5366387!16s%2Fg%2F11lfdxjgkf?entry=ttu&g_ep=EgoyMDI2MTAyOC4wIKXMDSoASAFQAw%3D%3D',
    },
    {
      id: 2,
      badge: 'Store 2',
      name: 'City Center Mobile Plaza',
      address: 'Shop # 19, Basement, City Center, Ashraf Road, Peshawar',
      mapUrl:
        'https://www.google.com/maps/place/City+Center+Mobile+Plaza/@34.0138808,71.5731669,18z/data=!4m6!3m5!1s0x38d93d7d12b5d8b3:0x847f2989121e4066!8m2!3d34.0138834!4d71.5739051!16s%2Fg%2F11xkm3p_0?entry=ttu&g_ep=EgoyMDI2MTAyOC4wIKXMDSoASAFQAw%3D%3D',
    },
  ];

  const timings = [
    { days: 'Monday – Saturday', hours: '9:00 AM – 7:00 PM' },
    { days: 'Sunday', hours: 'Closed' },
  ];

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="w-full relative overflow-hidden bg-white border-b border-[#e6e2d8] min-h-[100dvh] lg:h-screen lg:max-h-screen flex flex-col justify-center py-6 sm:py-8 lg:py-4 px-6 z-10"
    >
      {/* Soft ambient corner aura */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-bl from-[#00FFFF]/10 to-transparent rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-amber-100/25 to-transparent rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative z-10 w-full my-auto">

        {/* Section Header */}
        <div ref={headerRef} className="text-center max-w-2xl mx-auto mb-4 sm:mb-5 lg:mb-4">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-[#1c1b18] tracking-tight">
            Contact{' '}
            <span className="text-[#00FFFF] font-normal [text-shadow:_0_1px_3px_rgba(0,0,0,0.35)]">
              Us
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-[#78746a] font-light mt-1.5">
            Visit our physical retail outlet, reach our direct support line, or explore the software engineering powering CellFocus.
          </p>
        </div>

        {/* 3 Pillar Cards: Shop Address, Shop Timings, About Dev */}
        <div ref={cardsGridRef} className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-4 mb-4 sm:mb-5 lg:mb-4">

          {/* 1. Shop Address Card with Direct Interactive Map Links */}
          <div className="gsap-contact-card bg-white/95 backdrop-blur-xs rounded-2xl p-4 sm:p-5 lg:p-4 border border-[#e5e1d5] shadow-xs hover:shadow-md hover:border-[#00FFFF]/50 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white to-[#e6ffff] border border-[#00FFFF]/40 flex items-center justify-center text-[#009999] shadow-2xs group-hover:scale-105 transition-transform">
                  <MapPin className="w-5 h-5 stroke-[1.8]" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[9px] font-semibold uppercase tracking-wider">
                  2 Physical Outlets
                </span>
              </div>

              <h3 className="text-base font-medium text-[#1c1b18] tracking-tight mb-2">
                Shop Locations
              </h3>

              {/* Direct Clickable Store Location Cards */}
              <div className="space-y-2">
                {stores.map((store) => (
                  <a
                    key={store.id}
                    href={store.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/item block p-2 sm:p-2.5 rounded-xl border border-[#e8e4d8] bg-[#faf8f4] hover:bg-white hover:border-[#00FFFF] hover:shadow-xs transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#1c1b18] text-[#00FFFF]">
                        {store.badge}
                      </span>
                      <span className="text-[10px] font-medium text-[#0d9488] group-hover/item:text-[#0f766e] flex items-center gap-1">
                        <span>Open Map</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-[#1c1b18] group-hover/item:text-[#0d9488] transition-colors">
                      {store.name}
                    </h4>

                    <p className="text-[10px] text-[#666258] mt-0.5 leading-snug line-clamp-1">
                      {store.address}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Shop Timings Card */}
          <div className="gsap-contact-card bg-white/95 backdrop-blur-xs rounded-2xl p-4 sm:p-5 lg:p-4 border border-[#e5e1d5] shadow-xs hover:shadow-md hover:border-[#00FFFF]/50 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white to-[#e6ffff] border border-[#00FFFF]/40 flex items-center justify-center text-[#009999] mb-3 shadow-2xs group-hover:scale-105 transition-transform">
                <Clock className="w-5 h-5 stroke-[1.8]" />
              </div>

              <div className="inline-block px-2 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-[9px] font-semibold uppercase tracking-wider mb-1.5">
                Operating Hours
              </div>

              <h3 className="text-base font-medium text-[#1c1b18] tracking-tight mb-2">
                Shop Timings
              </h3>

              <div className="space-y-2">
                {timings.map((slot, i) => (
                  <div key={i} className="flex flex-col text-xs pb-1.5 border-b border-[#f5f2eb] last:border-0 last:pb-0">
                    <span className="font-medium text-[#1c1b18]">{slot.days}</span>
                    <span className="text-[#78746a] font-mono text-[11px] mt-0.5">{slot.hours}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Direct Contact Info Card (Phone & Email) */}
          <div className="gsap-contact-card bg-white/95 backdrop-blur-xs rounded-2xl p-4 sm:p-5 lg:p-4 border border-[#e5e1d5] shadow-xs hover:shadow-md hover:border-[#00FFFF]/50 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white to-[#e6ffff] border border-[#00FFFF]/40 flex items-center justify-center text-[#009999] mb-3 shadow-2xs group-hover:scale-105 transition-transform">
                <Phone className="w-5 h-5 stroke-[1.8]" />
              </div>

              <div className="inline-block px-2 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-[9px] font-semibold uppercase tracking-wider mb-1.5">
                Official Channels
              </div>

              <h3 className="text-base font-medium text-[#1c1b18] tracking-tight mb-2">
                Contact Details
              </h3>

              {/* Static Phone Display */}
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 p-2 rounded-xl border border-[#e8e4d8] bg-[#faf8f4]">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#e5e1d5] flex items-center justify-center text-[#0d9488] shrink-0">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] uppercase font-semibold text-[#8a867c] tracking-wider block">Phone / Mobile</span>
                    <span className="text-xs font-semibold text-[#1c1b18] select-text block">
                      0326 9589597
                    </span>
                  </div>
                </div>

                {/* Static Email Display */}
                <div className="flex items-center gap-2.5 p-2 rounded-xl border border-[#e8e4d8] bg-[#faf8f4]">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#e5e1d5] flex items-center justify-center text-[#0d9488] shrink-0">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] uppercase font-semibold text-[#8a867c] tracking-wider block">Email Support</span>
                    <span className="text-xs font-semibold text-[#1c1b18] select-text truncate block">
                      cellfocusc21@gmail.com
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* At Last: About Developer Information Strip */}
        <div
          ref={devStripRef}
          className="p-3.5 sm:p-4 rounded-2xl bg-white/75 backdrop-blur-xs border border-[#e5e1d5] shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3"
        >
          <div className="flex flex-col sm:flex-row items-center gap-3.5 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-[#1c1b18] text-[#00FFFF] flex items-center justify-center shrink-0 shadow-xs">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="text-xs font-semibold text-[#1c1b18] tracking-tight">About Developer</span>
              </div>
              <p className="text-[11px] text-[#78746a] mt-0.5">
                Full-Stack Architecture &bull; Designed &amp; engineered for CellFocus.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2.5 sm:gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#dedad0] text-[#1c1b18] font-medium shadow-2xs text-[11px] sm:text-xs select-text">
              <Phone className="w-3.5 h-3.5 text-[#0d9488]" />
              <span>0341 7700233</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#dedad0] text-[#1c1b18] font-medium shadow-2xs text-[11px] sm:text-xs select-text">
              <Mail className="w-3.5 h-3.5 text-[#0d9488]" />
              <span>fahad_125397@yahoo.com</span>
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}

