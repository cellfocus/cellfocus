import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function AboutUsSection() {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const paragraphRef = useRef(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    // IntersectionObserver triggers GSAP reveal smoothly when scrolled into view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

            // 1. Heading Reveal
            tl.fromTo(
              headingRef.current,
              { opacity: 0, y: 20 },
              { opacity: 1, y: 0, duration: 0.65, clearProps: 'transform' }
            )
            // 2. Silky paragraph text glide
            .fromTo(
              paragraphRef.current?.querySelectorAll('.gsap-p-word'),
              {
                opacity: 0,
                y: 12,
              },
              {
                opacity: 1,
                y: 0,
                duration: 0.45,
                stagger: 0.012,
                ease: 'power2.out',
                clearProps: 'transform'
              },
              '-=0.4'
            );

            observer.unobserve(el);
          }
        });
      },
      { rootMargin: '0px 0px -40px 0px', threshold: 0.05 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const statement =
    "“With 15 years of industry experience, cellfocus was founded to challenge overpriced market trends. We believe you shouldn’t have to overpay for premium protection and connectivity. Our mission is simple: delivering exceptional, high-quality mobile accessories at a consistently fair price.”";

  const words = statement.split(' ');

  return (
    <section
      id="about-us"
      ref={sectionRef}
      className="w-full relative overflow-hidden bg-white border-b border-[#e6e2d8] min-h-[100dvh] lg:h-screen lg:max-h-screen flex flex-col justify-center py-8 lg:py-6 px-6 z-10"
    >
      {/* Soft ambient corner aura */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-bl from-[#00FFFF]/10 to-transparent rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-amber-100/25 to-transparent rounded-full blur-[100px] pointer-events-none" />

      {/* Upward-positioned content container avoiding unnecessary dead space */}
      <div className="max-w-3xl mx-auto text-center relative z-10 w-full my-auto">
        
        {/* Minimal About Us Heading with #00FFFF on "Us" */}
        <h2
          ref={headingRef}
          className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight mb-5 sm:mb-7 text-[#1c1b18]"
        >
          About{' '}
          <span className="text-[#00FFFF] font-normal [text-shadow:_0_1px_3px_rgba(0,0,0,0.35)]">
            Us
          </span>
        </h2>

        {/* Minimal Animated Text Paragraph closed in inverted commas with reduced font size */}
        <p
          ref={paragraphRef}
          className="text-base sm:text-lg lg:text-xl font-light text-[#2e2c26] leading-relaxed sm:leading-relaxed lg:leading-8 tracking-normal max-w-2xl mx-auto [perspective:1000px]"
        >
          {words.map((word, idx) => (
            <span
              key={idx}
              className="inline-block mr-[0.26em] gsap-p-word text-[#2e2c26] will-change-transform will-change-[filter]"
            >
              {word}
            </span>
          ))}
        </p>

      </div>
    </section>
  );
}
