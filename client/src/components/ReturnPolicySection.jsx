import React, { useEffect, useRef } from 'react';
import { RotateCcw, Clock, ShieldCheck, CheckCircle2, MessageCircle, ArrowRightLeft } from 'lucide-react';
import gsap from 'gsap';

export default function ReturnPolicySection() {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const stepsGridRef = useRef(null);
  const policyBoxRef = useRef(null);

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

            // 2. 3 Step Process Cards stagger entrance
            if (stepsGridRef.current) {
              const cards = stepsGridRef.current.querySelectorAll('.gsap-step-card');
              if (cards.length > 0) {
                tl.fromTo(
                  cards,
                  { opacity: 0, y: 22 },
                  { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: 'power2.out', clearProps: 'transform' },
                  '-=0.3'
                );
              }
            }

            // 3. Conditions & WhatsApp support card
            if (policyBoxRef.current) {
              tl.fromTo(
                policyBoxRef.current,
                { opacity: 0, y: 18 },
                { opacity: 1, y: 0, duration: 0.5, clearProps: 'transform' },
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

  const steps = [
    {
      icon: Clock,
      step: '01',
      title: '7-Day Window',
      desc: 'Submit your return or exchange request within 7 calendar days from the day you receive your parcel.',
    },
    {
      icon: ArrowRightLeft,
      step: '02',
      title: 'Doorstep Swap or Pickup',
      desc: 'Our rider arrives at your doorstep to inspect and pick up the item or deliver your exchange unit.',
    },
    {
      icon: ShieldCheck,
      step: '03',
      title: 'Instant Refund or Replacement',
      desc: 'Receive a brand-new sealed replacement or an immediate refund transfer to your bank/JazzCash.',
    },
  ];

  const guidelines = [
    'Item must be in its original condition with all accessories, cables, and packaging intact.',
    'Applicable for technical faults, compatibility issues, transit damage, or change of mind.',
    'Zero return fees on verified defective or mistakenly shipped items.',
    'Replacement dispatch is processed within 24 to 48 business hours.',
  ];

  return (
    <section
      id="returns"
      ref={sectionRef}
      className="w-full relative overflow-hidden bg-gradient-to-b from-[#f5f1e7] via-[#f8f5ec] to-[#f5f1e7] border-b border-[#e5ded0] min-h-[100dvh] lg:h-screen lg:max-h-screen flex flex-col justify-center py-6 sm:py-8 lg:py-4 px-6 z-10"
    >
      {/* Soft ambient corner aura */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-bl from-[#00FFFF]/12 to-transparent rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-amber-200/20 to-transparent rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10 w-full my-auto">
        
        {/* Section Header */}
        <div ref={headerRef} className="text-center max-w-2xl mx-auto mb-4 sm:mb-5 lg:mb-4">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-[#1c1b18] tracking-tight">
            Return &amp; Exchange <span className="font-medium">Policy</span>
          </h2>

          <p className="text-xs sm:text-sm text-[#78746a] font-light mt-1.5">
            Shop with total peace of mind. If your product is not 100% satisfactory, swap or return it within 7 days of delivery.
          </p>
        </div>

        {/* 3 Step Process Grid */}
        <div ref={stepsGridRef} className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-4 mb-4 sm:mb-5 lg:mb-4">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="gsap-step-card bg-white rounded-2xl p-4 sm:p-5 lg:p-4 border border-[#e5e2d6] shadow-2xs hover:shadow-sm hover:border-[#1c1b18]/40 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#f6f5f0] border border-[#e5e2d6] flex items-center justify-center text-[#1c1b18]">
                      <Icon className="w-4 h-4 text-[#0d9488]" />
                    </div>
                    <span className="font-mono text-xs font-semibold text-[#a8a29e] tracking-wider">
                      {item.step}
                    </span>
                  </div>

                  <h3 className="text-base font-medium text-[#1c1b18] tracking-tight mb-1.5">
                    {item.title}
                  </h3>

                  <p className="text-xs text-[#78746a] font-light leading-relaxed line-clamp-2 sm:line-clamp-3">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Policy Terms & Fast WhatsApp Support Bar */}
        <div
          ref={policyBoxRef}
          className="bg-white rounded-2xl p-4 sm:p-5 lg:p-4 border border-[#e5e2d6] shadow-2xs flex flex-col lg:flex-row items-center justify-between gap-4"
        >
          <div className="w-full lg:w-2/3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1c1b18] mb-3">
              Policy Conditions &amp; Criteria
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {guidelines.map((text, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0d9488] shrink-0 mt-0.5" />
                  <span className="text-xs text-[#57534e] leading-snug">
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full lg:w-1/3 flex flex-col items-start lg:items-end border-t lg:border-t-0 lg:border-l border-[#e5e2d6] pt-4 lg:pt-0 lg:pl-6">
            <span className="text-xs text-[#78746a] mb-2">Need to initiate a return?</span>
            <a
              href="https://wa.me/923269589597?text=Hi%20CellFocus,%20I%20would%20like%20to%20request%20a%207-day%20return/exchange%20for%20my%20order."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1c1b18] hover:bg-black text-white text-xs font-medium rounded-xl transition-all shadow-xs hover:scale-[1.02] cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-[#00FFFF]" />
              <span>WhatsApp Support</span>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}

