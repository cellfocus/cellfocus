import React, { useState, useEffect } from 'react';

/**
 * CellFocus Brand Starter Page (Splash Screen)
 * - Centered CellFocus brand logo
 * - "CELL FOCUS" typography
 * - "Wholesale & Retail" subtitle right below the logo
 * - Smooth sea green progress indicator
 * - Lasts exactly 2 seconds before smoothly fading into the storefront
 */
export default function ThreadsLoader({ minDuration = 2000, onFinished }) {
  const [phase, setPhase] = useState('active'); // 'active' -> 'exiting' -> 'done'

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase('exiting');
      const safetyTimer = setTimeout(() => {
        setPhase('done');
        if (onFinished) onFinished();
      }, 500);
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
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#f6f5f0] select-none cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        phase === 'exiting'
          ? 'opacity-0 scale-[1.02] pointer-events-none'
          : 'opacity-100 scale-100'
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

        @keyframes subtlePulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.025);
            opacity: 0.96;
          }
        }

        .loader-center-box {
          animation: subtlePulse 2s ease-in-out infinite;
        }

        .loader-seagreen-line {
          animation: seagreenSweep 1.5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .loader-center-box, .loader-seagreen-line {
            animation: none !important;
          }
        }
      `}</style>

      {/* Center Stage: CellFocus Logo & Wholesale and Retail Below It */}
      <div className="loader-center-box flex flex-col items-center justify-center text-center px-6 -mt-4">
        {/* CellFocus Brand Logo */}
        <div className="relative mb-3 flex items-center justify-center">
          <img
            src="/logo-full.png"
            alt="CellFocus Logo"
            className="h-16 sm:h-20 w-auto object-contain drop-shadow-sm"
          />
        </div>

        {/* Brand Name */}
        <h1 className="font-sans text-3xl sm:text-4xl font-extrabold tracking-tight select-none leading-none">
          <span className="text-[#1c1b18]">CELL</span>
          <span className="text-[#2e8b57] ml-1">FOCUS</span>
        </h1>

        {/* Below Logo & Name: Wholesale and Retail */}
        <p className="font-sans text-xs sm:text-sm font-semibold tracking-[0.28em] uppercase text-[#78746a] mt-3 select-none">
          Wholesale and Retail
        </p>

        {/* Smooth Sea Green Loading Progress Line */}
        <div className="relative mt-6 h-[3px] w-40 sm:w-48 overflow-hidden rounded-full bg-[#dedad0]/80">
          <div className="loader-seagreen-line absolute inset-0 rounded-full bg-[#2e8b57] shadow-[0_0_10px_rgba(46,139,87,0.6)]" />
        </div>
      </div>
    </aside>
  );
}
