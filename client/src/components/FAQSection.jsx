import React, { useState, useEffect, useRef } from 'react';
import { Plus, HelpCircle, MessageCircle, ShieldCheck, Truck, Banknote, Award, RotateCcw } from 'lucide-react';
import gsap from 'gsap';

const FAQS = [
  {
    id: 'genuine',
    question: 'Are your products genuine?',
    tag: 'Authenticity',
    color: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/30 text-emerald-800',
    tagBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    icon: ShieldCheck,
    answer:
      'Yes, 100%. Every single charger, cable, and true wireless audio device is sourced directly from verified manufacturers. Each unit undergoes strict multi-point quality, thermal regulation, and acoustic benchmarking before being packaged.',
  },
  {
    id: 'delivery',
    question: 'How long does delivery take?',
    tag: 'Fast Shipping',
    color: 'from-blue-500/10 to-indigo-500/10 border-blue-500/30 text-blue-800',
    tagBg: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: Truck,
    answer:
      'Orders confirmed before 4:00 PM leave our fulfillment center the same day. Deliveries typically arrive in 2 to 3 business days nationwide across Pakistan, complete with automated real-time SMS & courier dispatch tracking.',
  },
  {
    id: 'cod',
    question: 'Can I pay on delivery?',
    tag: 'Payment',
    color: 'from-amber-500/10 to-orange-500/10 border-amber-500/30 text-amber-800',
    tagBg: 'bg-amber-100 text-amber-800 border-amber-300',
    icon: Banknote,
    answer:
      'Absolutely! We offer Cash on Delivery (COD) across all cities and regions. You can open and inspect the parcel upon rider arrival before handing over the cash payment for 100% peace of mind.',
  },
  {
    id: 'warranty',
    question: 'How does the warranty work?',
    tag: '7-Day Guarantee',
    color: 'from-purple-500/10 to-violet-500/10 border-purple-500/30 text-purple-800',
    tagBg: 'bg-purple-100 text-purple-800 border-purple-300',
    icon: Award,
    answer:
      'All CellFocus accessories include a 7-day direct replacement warranty. If any technical fault occurs within 7 days of delivery, message our support desk with your order number and we dispatch a brand-new replacement promptly.',
  },
  {
    id: 'return',
    question: 'Can I return a product?',
    tag: 'Easy Returns',
    color: 'from-rose-500/10 to-pink-500/10 border-rose-500/30 text-rose-800',
    tagBg: 'bg-rose-100 text-rose-800 border-rose-300',
    icon: RotateCcw,
    answer:
      'Yes, we provide a 7-day hassle-free return and exchange guarantee. If the product does not meet your expectations or does not match your phone specs, contact us and we will arrange a fast pickup or instant replacement.',
  },
];

export default function FAQSection() {
  const [openId, setOpenId] = useState(null); // Collapsed by default so entire section fits in single screen view
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const faqListRef = useRef(null);

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

            // 2. Staggered FAQ cards entrance
            if (faqListRef.current) {
              const items = faqListRef.current.querySelectorAll('.gsap-faq-item');
              if (items.length > 0) {
                tl.fromTo(
                  items,
                  { opacity: 0, y: 18 },
                  { opacity: 1, y: 0, duration: 0.45, stagger: 0.05, ease: 'power2.out', clearProps: 'transform' },
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
  }, []);

  const toggleItem = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      id="faq"
      ref={sectionRef}
      className="w-full relative overflow-hidden bg-gradient-to-b from-[#f6f2e8] via-[#f9f5ec] to-[#f6f2e8] border-b border-[#e5dfd2] min-h-[100dvh] lg:h-screen lg:max-h-screen flex flex-col justify-center py-6 sm:py-8 lg:py-4 z-10"
    >
      {/* Soft ambient corner aura */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-bl from-[#00FFFF]/12 to-transparent rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-amber-200/20 to-transparent rounded-full blur-[100px] pointer-events-none" />

      {/* Centered content strictly sized for single laptop screen view */}
      <div className="max-w-4xl mx-auto px-6 relative z-10 w-full my-auto">
        
        {/* Header */}
        <div ref={headerRef} className="mb-3 sm:mb-4 lg:mb-3">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-[#1c1b18] tracking-tight">
            FAQ
          </h2>
          <p className="text-[11px] sm:text-xs text-[#78746a] mt-1 font-light max-w-lg">
            Quick clarity on orders, nationwide delivery, authentic guarantees, and warranty support.
          </p>
        </div>

        {/* Accordion List - Compact vertical footprint */}
        <div ref={faqListRef} className="space-y-1.5 sm:space-y-2">
          {FAQS.map((faq) => {
            const isOpen = openId === faq.id;
            const Icon = faq.icon;

            return (
              <div
                key={faq.id}
                className={`gsap-faq-item rounded-xl transition-all duration-300 border overflow-hidden ${
                  isOpen
                    ? `bg-white shadow-sm border-[#dedad0] ring-1 ring-black/5`
                    : 'bg-white/70 hover:bg-white border-[#e5e2d6] hover:border-[#dedad0]'
                }`}
              >
                {/* Accordion Question Header */}
                <button
                  type="button"
                  onClick={() => toggleItem(faq.id)}
                  className="w-full py-2 sm:py-2.5 px-3.5 sm:px-4 flex items-center justify-between gap-3 text-left cursor-pointer transition select-none"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isOpen
                          ? 'bg-[#1c1b18] text-white shadow-2xs'
                          : 'bg-[#f4f2ea] text-[#78746a]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>

                    <span className="text-xs sm:text-sm font-medium text-[#1c1b18] truncate">
                      {faq.question}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`hidden sm:inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${faq.tagBg}`}
                    >
                      {faq.tag}
                    </span>

                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-300 ${
                        isOpen
                          ? 'bg-[#1c1b18] text-white rotate-45'
                          : 'bg-[#f4f2eb] text-[#78746a] hover:bg-[#eae6dc]'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </button>

                {/* Accordion Answer Content */}
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-3.5 pt-0.5 border-t border-[#f2efe9]">
                    <div className="p-3 rounded-lg bg-gradient-to-r from-[#faf8f4] to-white border border-[#ece8df]">
                      <p className="text-[11px] sm:text-xs text-[#4a473f] leading-relaxed font-light">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Direct WhatsApp / Support Callout */}
        <div className="mt-4 sm:mt-5 p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-blue-50/80 border border-emerald-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#0f172a]">
                Still have another question?
              </h4>
              <p className="text-[10px] sm:text-[11px] text-[#64748b]">
                Our team is available 7 days a week for live support and order guidance.
              </p>
            </div>
          </div>

          <a
            href="https://wa.me/?text=Hi%20CellFocus%20Support,%20I%20have%20a%20question%20about%20my%20order"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-1.5 rounded-lg bg-[#1c1b18] hover:bg-emerald-700 text-white text-[11px] sm:text-xs font-semibold tracking-wide transition shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <MessageCircle className="w-3 h-3" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>

      </div>
    </section>
  );
}
