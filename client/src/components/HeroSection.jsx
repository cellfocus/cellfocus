import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';

const heroSlides = [
  {
    id: 'airpods',
    eyebrow: 'Acoustic Edition 01',
    title: 'Bass True Wireless AirPods',
    tagline: 'Precision acoustic engineering delivering punchy studio bass, crystal clear highs, and all-day sports stability.',
    specs: ['Super Lightweight', 'CVC 6.0 Noise Cancelling', '30 Hours Playback'],
    cta: 'Explore AirPods',
    image: '/hero-cellfocus-store-airpods.jpg',
    filter: 'contrast-[1.03] brightness-[0.98] saturate-[1.04]',
    mobilePosition: 'max-sm:object-[58%_center]',
  },
  {
    id: 'chargers',
    eyebrow: 'Fast Charging 02',
    title: 'Precision GaN Power',
    tagline: 'High-density gallium nitride chargers engineered for silent, temperature-controlled rapid charging.',
    cta: 'Explore Chargers',
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1800&q=85',
  },
  {
    id: 'airpods',
    eyebrow: 'True Wireless 03',
    title: 'Acoustic Clarity & ANC',
    tagline: 'Engineered for seamless spatial presence, adaptive noise cancellation, and ergonomic all-day comfort.',
    cta: 'Explore AirPods',
    image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=1800&q=85',
  },
  {
    id: 'handsfree',
    eyebrow: 'Wired Fidelity 04',
    title: 'Lossless Studio Audio',
    tagline: 'Pure copper braided cores with integrated digital-to-analog decoding for true high-resolution playback.',
    cta: 'Explore Handsfree',
    image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1800&q=85',
  },
];

export default function HeroSection({ onExploreCategory }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);
  const overlayRef = useRef(null);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  useEffect(() => {
    if (!isPaused) {
      timerRef.current = setInterval(nextSlide, 5500);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, currentIndex]);

  // GSAP animation triggering smooth minimal text reveal on slide change
  useEffect(() => {
    if (!overlayRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.gsap-hero-item',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.55, stagger: 0.06, ease: 'power2.out', clearProps: 'transform' }
      );
    }, overlayRef);
    return () => ctx.revert();
  }, [currentIndex]);

  const currentSlide = heroSlides[currentIndex];

  return (
    <section 
      className="relative w-full overflow-hidden bg-[#1c1b18] border-b border-[#e2dfd5] h-[calc(100dvh-4rem)] sm:h-[calc(100vh-5rem)] min-h-[520px] sm:min-h-[440px] sm:max-h-[850px] flex items-end rounded-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Horizontal Slide Track */}
      <div 
        className="absolute inset-0 flex transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {heroSlides.map((slide, idx) => (
          <div
            key={idx}
            onClick={() => onExploreCategory && onExploreCategory(slide.id)}
            className="relative min-w-full w-full h-full shrink-0 cursor-pointer flex items-center justify-center bg-[#1c1b18]"
          >
            <img
              src={slide.image}
              alt={slide.title}
              className={`w-full h-full object-cover sm:object-center ${slide.filter || ''} ${slide.mobilePosition || 'object-center'}`}
            />
            {/* Cinematic subtle vignette overlay for aesthetic depth */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Slide Content Overlay with GSAP Minimal Typography */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-10 pb-16 sm:pb-12 pt-4 flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 pointer-events-none">
        <div ref={overlayRef} className="max-w-xl space-y-2 sm:space-y-3 pointer-events-auto">
          <h1 className="gsap-hero-item text-2xl sm:text-4xl lg:text-5xl font-light tracking-tight text-white leading-[1.1] drop-shadow-md">
            {currentSlide.title}
          </h1>
          <p className="gsap-hero-item text-xs sm:text-sm md:text-base text-stone-200 font-light leading-relaxed max-w-lg line-clamp-3 sm:line-clamp-none drop-shadow-xs">
            {currentSlide.tagline}
          </p>
        </div>

        {/* Desktop Slider Controls */}
        <div className="hidden md:flex items-center gap-4 self-end bg-[#f6f5f0]/90 backdrop-blur-md px-4 py-2 rounded-full border border-[#e2dfd5] shadow-xs pointer-events-auto">
          <span className="text-xs text-[#78746a] tracking-widest font-mono">
            0{currentIndex + 1} / 0{heroSlides.length}
          </span>

          <div className="flex items-center gap-1.5">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex ? 'w-6 bg-[#2e8b57]' : 'w-2 bg-[#cfcdc4]'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
