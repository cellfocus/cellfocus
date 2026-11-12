import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Star, ShieldCheck, MessageSquarePlus, MapPin, CheckCircle2, User, Sparkles, X, Send, Play, Pause } from 'lucide-react';
import gsap from 'gsap';
import { ENDPOINTS } from '../config/api';

export default function ClientReviewsSection() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isPaused, setIsPaused] = useState(false);

  // New Review Form State
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    rating: 5,
    comment: '',
    productName: '',
  });

  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const trackRef = useRef(null);
  const tweenRef = useRef(null);

  // Fetch reviews from server
  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch(ENDPOINTS.REVIEWS.GET);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setReviews(json.data);
      }
    } catch (err) {
      console.warn('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // Duplicate reviews array for seamless infinite auto-scroll
  const displayReviews = useMemo(() => {
    if (!reviews || reviews.length === 0) return [];
    let list = [...reviews];
    while (list.length < 8) {
      list = [...list, ...reviews];
    }
    // Duplicate once more so xPercent: -50 seamlessly wraps to 0
    return [...list, ...list];
  }, [reviews]);

  // GSAP: Continuous Right-to-Left Auto-Scroll Animation
  useEffect(() => {
    if (!trackRef.current || displayReviews.length === 0) return;

    // Clean up any existing tween
    if (tweenRef.current) {
      tweenRef.current.kill();
    }

    gsap.set(trackRef.current, { xPercent: 0 });

    // Smooth duration proportional to list size so scrolling speed is pleasant and easily readable
    const duration = Math.max(30, displayReviews.length * 3.2);

    const tween = gsap.to(trackRef.current, {
      xPercent: -50,
      ease: 'none',
      duration: duration,
      repeat: -1,
    });

    tweenRef.current = tween;

    return () => {
      tween.kill();
    };
  }, [displayReviews]);

  // Entrance animation for header
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (headerRef.current) {
              gsap.fromTo(
                headerRef.current.children,
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out', clearProps: 'all' }
              );
            }
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Handle client review submission
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!formData.comment.trim()) return;
    setSubmitError('');

    try {
      setSubmitting(true);
      const res = await fetch(ENDPOINTS.REVIEWS.CREATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(`Reviews API unreachable (HTTP ${res.status}). Ensure backend server is running.`);
      }
      const json = await res.json();

      if (res.ok && json.success && json.data) {
        setReviews((prev) => [json.data, ...prev]);
        setSubmitSuccess(true);
        setTimeout(() => {
          setIsModalOpen(false);
          setSubmitSuccess(false);
          setSubmitError('');
          setFormData({ name: '', city: '', rating: 5, comment: '', productName: '' });
        }, 1600);
      } else {
        setSubmitError(json.message || 'Could not submit review. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setSubmitError(err?.message || 'Unable to connect to reviews service.');
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / reviews.length).toFixed(1)
    : '4.9';

  return (
    <section
      id="reviews"
      ref={sectionRef}
      className="py-12 sm:py-16 bg-[#f7f4ec] border-t border-[#e8e4d8] relative overflow-hidden"
    >
      {/* Background ambient decorative glow */}
      <div className="absolute top-1/3 -left-32 w-[500px] h-[500px] bg-amber-200/20 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 -right-32 w-[450px] h-[450px] bg-teal-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div ref={headerRef} className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-300 text-amber-900 text-[10px] font-bold uppercase tracking-widest mb-2 shadow-2xs">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              <span>Verified Customer Stories &bull; {avgRating} / 5.0 Rating</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-[#1c1b18] tracking-tight">
              What Our <span className="font-serif italic font-normal text-[#0d9488]">Clients Say</span>
            </h2>

            <p className="mt-1.5 text-xs sm:text-sm text-[#78746a] font-light max-w-xl">
              Real feedback from individual customers and phone shop resellers across Lahore, Karachi, Islamabad, and nationwide.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 border border-[#e5e1d5] text-[11px] text-[#78746a] font-mono shadow-2xs">
              <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
              <span>{isPaused ? 'Paused' : 'Hover card to pause'}</span>
            </span>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1c1b18] hover:bg-[#33312b] text-white text-xs sm:text-sm font-semibold transition-all shadow-xs hover:shadow active:scale-95 cursor-pointer"
            >
              <MessageSquarePlus className="w-4 h-4 text-[#00FFFF]" />
              <span>Share Your Feedback</span>
            </button>
          </div>
        </div>

        {/* Rating Metrics Highlights Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 p-3 sm:p-4 mb-8 bg-white/80 backdrop-blur-xs rounded-2xl border border-[#e5e1d5] shadow-2xs">
          <div className="flex flex-col items-center justify-center text-center p-2 border-r border-[#e8e4d8] last:border-0 sm:last:border-r-0">
            <span className="text-xl sm:text-2xl font-bold text-[#1c1b18] font-mono">{avgRating}★</span>
            <span className="text-[10px] sm:text-xs text-[#78746a] font-light">Overall Rating</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center p-2 border-r border-[#e8e4d8] sm:border-r last:border-0">
            <span className="text-xl sm:text-2xl font-bold text-[#0d9488] font-mono">100%</span>
            <span className="text-[10px] sm:text-xs text-[#78746a] font-light">Original Stock</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center p-2 border-r border-[#e8e4d8] last:border-0">
            <span className="text-xl sm:text-2xl font-bold text-[#1c1b18] font-mono">24h - 48h</span>
            <span className="text-[10px] sm:text-xs text-[#78746a] font-light">COD Delivery</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center p-2">
            <span className="text-xl sm:text-2xl font-bold text-amber-600 font-mono">7-Day</span>
            <span className="text-[10px] sm:text-xs text-[#78746a] font-light">Replacement Warranty</span>
          </div>
        </div>

      </div>

      {/* GSAP Auto-Scrolling Reviews Track (Right to Left) */}
      <div 
        className="relative w-full overflow-hidden py-4 select-none"
        onMouseEnter={() => {
          setIsPaused(true);
          if (tweenRef.current) tweenRef.current.pause();
        }}
        onMouseLeave={() => {
          setIsPaused(false);
          if (tweenRef.current) tweenRef.current.play();
        }}
        onTouchStart={() => {
          setIsPaused(true);
          if (tweenRef.current) tweenRef.current.pause();
        }}
        onTouchEnd={() => {
          setIsPaused(false);
          if (tweenRef.current) tweenRef.current.play();
        }}
      >
        {/* Luxury gradient edge masks for seamless infinity look */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-28 bg-gradient-to-r from-[#f7f4ec] via-[#f7f4ec]/80 to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-28 bg-gradient-to-l from-[#f7f4ec] via-[#f7f4ec]/80 to-transparent z-10" />

        {/* Scrolling Strip */}
        <div
          ref={trackRef}
          className="flex items-stretch gap-4 sm:gap-6 w-max pl-4"
        >
          {displayReviews.map((rev, idx) => (
            <div
              key={`${rev.id || rev._id || 'rev'}-${idx}`}
              className="w-[290px] sm:w-[350px] md:w-[380px] shrink-0 p-5 sm:p-6 bg-white/95 backdrop-blur-xs rounded-2xl border border-[#e5e1d5] hover:border-[#1c1b18]/40 transition-all duration-300 shadow-2xs hover:shadow-md flex flex-col justify-between group cursor-grab active:cursor-grabbing"
            >
              <div>
                {/* Header: Stars & Verified Badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < (Number(rev.rating) || 5)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-200'
                        }`}
                      />
                    ))}
                  </div>

                  {rev.verified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[10px] font-semibold">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Verified Buyer</span>
                    </span>
                  )}
                </div>

                {/* Comment Text */}
                <p className="text-xs sm:text-sm text-[#2d2b26] leading-relaxed font-light mb-4 italic line-clamp-4">
                  &ldquo;{rev.comment}&rdquo;
                </p>
              </div>

              {/* Reviewer Details */}
              <div className="pt-3 border-t border-[#f0ece1] flex items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#1c1b18] group-hover:text-[#0d9488] transition-colors">
                    {rev.name}
                  </h4>
                  <div className="flex items-center gap-1 text-[11px] text-[#8c887e] mt-0.5 font-light">
                    <MapPin className="w-3 h-3 text-[#8c887e]" />
                    <span>{rev.city || 'Pakistan'}</span>
                  </div>
                </div>

                {rev.productName && (
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-[#f5f2e8] text-[#78746a] rounded-md max-w-[130px] truncate text-right">
                    {rev.productName}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Write a Review Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#dedad0] relative">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-[#f6f4ee] hover:bg-[#eae6db] text-[#1c1b18] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <div className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#0d9488] mb-1">
                <Sparkles className="w-3 h-3" />
                <span>Your Experience Matters</span>
              </div>
              <h3 className="text-lg font-bold text-[#1c1b18]">Write a Client Review</h3>
              <p className="text-xs text-[#78746a] mt-0.5 font-light">
                Share your genuine feedback on CellFocus products and delivery.
              </p>
            </div>

            {submitSuccess ? (
              <div className="py-8 flex flex-col items-center text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-1">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-[#1c1b18]">Thank You!</h4>
                <p className="text-xs text-[#78746a]">Your feedback has been successfully published.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-3.5">
                {/* Rating selection */}
                <div>
                  <label className="block text-xs font-semibold text-[#1c1b18] mb-1">
                    Your Rating:
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, rating: star }))}
                        className="p-1 focus:outline-none cursor-pointer group"
                      >
                        <Star
                          className={`w-6 h-6 transition-all ${
                            star <= formData.rating
                              ? 'fill-amber-400 text-amber-400 scale-105'
                              : 'text-gray-300 hover:text-amber-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-xs font-bold text-[#1c1b18] font-mono">
                      {formData.rating} of 5 Stars
                    </span>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-[#1c1b18] mb-1">
                    Full Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Ali Raza"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#dedad0] bg-[#faf8f4] focus:bg-white focus:outline-none focus:border-[#1c1b18] transition-all"
                  />
                </div>

                {/* City & Product */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#1c1b18] mb-1">
                      City / Area:
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                      placeholder="e.g. Lahore, Gulberg"
                      className="w-full text-xs p-2.5 rounded-xl border border-[#dedad0] bg-[#faf8f4] focus:bg-white focus:outline-none focus:border-[#1c1b18] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1c1b18] mb-1">
                      Product Name:
                    </label>
                    <input
                      type="text"
                      value={formData.productName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, productName: e.target.value }))}
                      placeholder="e.g. GaN 65W Charger"
                      className="w-full text-xs p-2.5 rounded-xl border border-[#dedad0] bg-[#faf8f4] focus:bg-white focus:outline-none focus:border-[#1c1b18] transition-all"
                    />
                  </div>
                </div>

                {/* Feedback comment */}
                <div>
                  <label className="block text-xs font-semibold text-[#1c1b18] mb-1">
                    Your Review / Feedback:
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.comment}
                    onChange={(e) => setFormData((prev) => ({ ...prev, comment: e.target.value }))}
                    placeholder="Share details about build quality, delivery speed, or acoustic performance..."
                    className="w-full text-xs p-2.5 rounded-xl border border-[#dedad0] bg-[#faf8f4] focus:bg-white focus:outline-none focus:border-[#1c1b18] transition-all resize-none"
                  />
                </div>

                {submitError && (
                  <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                    {submitError}
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-[#dedad0] text-xs font-semibold text-[#78746a] hover:bg-[#faf8f4] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-xl bg-[#1c1b18] hover:bg-[#33312b] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Submitting...' : 'Post Review'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
