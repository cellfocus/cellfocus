import React from 'react';

/**
 * PageSkeleton Component
 * Monotone shimmer skeleton accurately mirroring CellFocus layout:
 * - Top sticky header (Logo, Navigation links, Cart button)
 * - Hero carousel zone (Eyebrow, Headline, Description, CTA, Image container)
 * - Category filter pills
 * - 6-card Product Grid with media preview, badges, text, and add buttons
 */
export default function PageSkeleton() {
  return (
    <div className="min-h-screen bg-[#f6f5f0] text-[#1c1b18] flex flex-col font-sans select-none animate-pulse">
      {/* 1. Header Skeleton */}
      <header className="sticky top-0 z-40 w-full bg-[#f2f2f4]/80 border-b border-white/80 h-16 sm:h-20 px-6 sm:px-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-[#dedad0]" />
          <div className="h-4 w-28 rounded bg-[#dedad0]" />
        </div>
        <div className="hidden md:flex items-center space-x-8">
          <div className="h-3.5 w-16 rounded bg-[#dedad0]" />
          <div className="h-3.5 w-16 rounded bg-[#dedad0]" />
          <div className="h-3.5 w-16 rounded bg-[#dedad0]" />
          <div className="h-8 w-20 rounded-full bg-[#dedad0]" />
          <div className="h-8 w-8 rounded-full bg-[#dedad0]" />
        </div>
        <div className="flex md:hidden items-center space-x-2">
          <div className="h-8 w-8 rounded bg-[#dedad0]" />
          <div className="h-8 w-8 rounded bg-[#dedad0]" />
        </div>
      </header>

      {/* 2. Hero Section Skeleton */}
      <section className="relative w-full bg-[#eeebe2] border-b border-[#e2dfd5] h-[calc(100dvh-4rem)] sm:h-[calc(100vh-5rem)] min-h-[520px] sm:min-h-[440px] sm:max-h-[850px] flex items-end p-4 sm:p-10">
        <div className="max-w-2xl w-full flex flex-col gap-4">
          <div className="h-3 w-28 rounded bg-[#dedad0]" />
          <div className="h-10 sm:h-12 w-4/5 rounded bg-[#dedad0]" />
          <div className="h-4 w-full rounded bg-[#dedad0]/80" />
          <div className="h-4 w-3/4 rounded bg-[#dedad0]/80" />
          <div className="mt-4 flex gap-3">
            <div className="h-11 w-36 rounded-full bg-[#1c1b18]/20" />
            <div className="h-11 w-11 rounded-full bg-[#dedad0]" />
          </div>
        </div>
      </section>

      {/* 3. Catalog Section Skeleton */}
      <main className="max-w-7xl mx-auto px-6 sm:px-10 py-12 w-full flex-1">
        {/* Shop Now & Category Icons Skeleton Centered */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="h-2.5 w-24 rounded-none bg-[#dedad0] mb-2" />
          <div className="h-8 w-36 rounded-none bg-[#dedad0] mb-2" />
          <div className="h-3 w-56 rounded-none bg-[#dedad0]/60 mb-5" />
          <div className="flex items-center justify-center gap-2 overflow-hidden">
            <div className="h-8 w-20 rounded-none bg-[#dedad0]" />
            <div className="h-8 w-24 rounded-none bg-[#dedad0]/60" />
            <div className="h-8 w-24 rounded-none bg-[#dedad0]/60" />
            <div className="h-8 w-24 rounded-none bg-[#dedad0]/60" />
          </div>
        </div>

        {/* Product Grid Skeleton: 2-col mobile, square box corners */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex flex-col bg-white rounded-none border border-[#dedad0]/70 overflow-hidden p-2.5 sm:p-3.5"
            >
              <div className="w-full aspect-square rounded-none bg-[#eeebe2] mb-3" />
              <div className="h-2.5 w-14 rounded-none bg-[#dedad0] mb-2" />
              <div className="h-4 w-4/5 rounded-none bg-[#dedad0] mb-2" />
              <div className="h-2.5 w-full rounded-none bg-[#dedad0]/70 mb-3" />
              <div className="mt-auto pt-2 border-t border-[#f0ede6] flex items-center justify-between">
                <div className="h-4 w-12 rounded-none bg-[#dedad0]" />
                <div className="h-7 w-20 rounded-none bg-[#dedad0]" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

