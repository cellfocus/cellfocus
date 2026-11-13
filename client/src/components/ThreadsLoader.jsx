import React, { useState, useEffect } from 'react';

/**
 * Brand-Aligned Monotone Loader
 * Designed to seamlessly blend with the CellFocus Navbar & Theme:
 * - Brand Lockup matching the Navbar
 * - 'CELL' in Black (#1c1b18) & 'FOCUS' in Sea Green (#2e8b57)
 * - Identical font family and tracking as the Navbar
 * - Smooth Sea Green progress line
 */
export default function ThreadsLoader({ minDuration = 650, onFinished }) {
  const [phase, setPhase] = useState('active'); // 'active' -> 'exiting' -> 'done'

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase('exiting');
      // Safety fallback in case transitionend is dropped by the browser or backgrounded tab
      const safetyTimer = setTimeout(() => {
        setPhase('done');
        if (onFinished) onFinished();
      }, 750);
      return () => clearTimeout(safetyTimer);
    }, minDuration);
    return () => clearTimeout(timer);
  }, [minDuration, onFinished]);

  const handleTransitionEnd = (e) => {
    if (e.target === e.currentTarget && phase === 'exiting') {
      setPhase('done');
      if (onFinished) onFinished();
    }
  };

  if (phase === 'done') return null;

  return (
    <aside
      aria-label="Loading CellFocus"
      role="status"
      onTransitionEnd={handleTransitionEnd}
      onClick={() => setPhase('exiting')}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between bg-[#f6f5f0] select-none cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${phase === 'exiting'
        ? 'opacity-0 -translate-y-2 pointer-events-none'
        : 'opacity-100 translate-y-0'
        }`}
    >
      <style>{`
        @keyframes seagreenSweep {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes subtleScale {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.035);
          }
        }

        .loader-brand-lockup {
          animation: subtleScale 2.4s ease-in-out infinite;
        }

        .loader-seagreen-line {
          animation: seagreenSweep 1.6s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .loader-brand-lockup, .loader-seagreen-line {
            animation: none !important;
          }
        }
      `}</style>

      {/* Top balance spacer */}
      <div className="h-16 w-full" />

      {/* Center Stage: Brand Lockup & Sea Green Progress Line */}
      <div className="relative flex flex-col items-center px-6">

        {/* Brand Lockup container matching Navbar */}
        <div className="loader-brand-lockup flex flex-col items-center">
          {/* Brand Crest matching Navbar */}
          <img
            src="/logo-full.png"
            alt="CellFocus Crest"
            className="h-14 sm:h-16 w-auto object-contain mb-3 drop-shadow-xs"
          />

          {/* Typography: CELL in black, FOCUS in sea green (matching navbar font) */}
          <h1 className="font-sans text-2xl sm:text-3xl font-extrabold tracking-tight select-none">
            <span className="text-[#1c1b18]">CELL</span>
            <span className="text-[#2e8b57] ml-0.5">FOCUS</span>
          </h1>
        </div>

        {/* Sea Green Animated Loader Line */}
        <div className="relative mt-6 h-[2.5px] w-36 sm:w-44 overflow-hidden rounded-full bg-[#dedad0]/80">
          <div className="loader-seagreen-line absolute inset-0 rounded-full bg-[#2e8b57] shadow-[0_0_8px_rgba(46,139,87,0.5)]" />
        </div>
      </div>

      {/* Bottom Subtext */}
      <div className="pb-10">
        <span className="font-sans text-[11px] font-medium tracking-[0.2em] uppercase text-[#78746a]">
          Retails and wholesale Dealers
        </span>
      </div>
    </aside>
  );
}
