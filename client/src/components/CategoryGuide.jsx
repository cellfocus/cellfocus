import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ShieldCheck, Truck, Zap, Headphones, AudioLines, Watch, Cable } from 'lucide-react';
import { CATEGORY_SEO } from '../config/seoConfig';

const CATEGORY_CONTENT = {
  chargers: {
    icon: Zap,
    h1: 'Fast Chargers & Power Adapters in Pakistan',
    tagline: 'GaN 65W, Dual-Port & Multi-Pin Adapters at Wholesale & Retail Rates',
    p1: 'Finding a reliable mobile charger in Pakistan requires balancing charging speed, thermal safety, and pin durability. CellFocus fast chargers utilize advanced GaN (Gallium Nitride) architecture to deliver up to 65W Power Delivery (PD) and Quick Charge protocols without excessive heating. Whether you need a universal Type-C charger, standard USB-Micro adapter, or our innovative Dual-Pin options for Android and multi-device homes, our chargers are built to prevent voltage fluctuations.',
    p2: 'Sasta charger price doesn’t have to mean poor quality. We inspect every adapter to ensure authentic wattage output compatible with Samsung, Xiaomi, Infinix, Tecno, and iPhone. Available with 7-day checking warranty and fast Cash on Delivery across Lahore, Karachi, Rawalpindi, and nationwide.',
    keywords: ['GaN 65W Fast Charger', 'Type-C Adapter', 'Dual Pin Mobile Charger', 'Wholesale Chargers Lahore']
  },
  airpods: {
    icon: Headphones,
    h1: 'Wireless Earpods & Bluetooth AirPods in Pakistan',
    tagline: 'Active Noise Cancellation, Deep Bass & Ergonomic Long-Battery Audio',
    p1: 'Upgrade your audio experience with premium wireless earpods engineered for deep bass acoustic tuning and crystal-clear calls. Featuring Bluetooth 5.3 instant auto-pairing, ultra-low latency for mobile gaming (PUBG/Free Fire), and environmental noise cancellation (ENC) microphones for busy Pakistani traffic and outdoor calls.',
    p2: 'Tired of duplicate airpods that stop working in two weeks? CellFocus wireless earbuds are backed by verified battery standby tests and premium charging cases with Type-C fast recharge. Shop retail with cash on delivery or purchase bulk cartons at wholesale Hall Road rates.',
    keywords: ['ANC Wireless Earbuds', 'AirPods Price in Pakistan', 'Gaming Earpods', 'Original Wireless Earbuds']
  },
  handsfree: {
    icon: AudioLines,
    h1: 'Original Handsfree & Wired Earphones in Pakistan',
    tagline: 'High-Definition Mic, Extra Bass & Tangle-Free Heavy Duty Wires',
    p1: 'For online classes, office meetings, and uninterrupted music listening, nothing beats the zero-latency reliability of a high-grade wired handsfree. CellFocus handsfree earphones feature gold-plated 3.5mm audio jacks and digital Type-C connectors with built-in DAC chips for crisp audio fidelity.',
    p2: 'Constructed with reinforced, tangle-resistant cables and ergonomic silicon ear cushions that remain comfortable throughout long Pakistani workdays. Retailers can order bulk assorted packs with guaranteed checking warranty and nationwide COD.',
    keywords: ['3.5mm Bass Handsfree', 'Type-C Handsfree Pakistan', 'Earphones with HD Mic', 'Handsfree Wholesale Rate']
  },
  smartwatches: {
    icon: Watch,
    h1: 'Smartwatches & Fitness Trackers in Pakistan',
    tagline: 'Bluetooth Calling, AMOLED Displays & Waterproof Sport Trackers',
    p1: 'Stay connected on the move with CellFocus Bluetooth calling smartwatches. Receive WhatsApp notifications, answer incoming phone calls directly from your wrist, and track heart rate, blood oxygen (SpO2), sleep cycles, and daily step counts with high precision.',
    p2: 'Featuring vibrant HD and AMOLED touchscreens, customizable watch faces, and water-resistant zinc alloy casings designed for daily wear. Available at competitive prices across Pakistan with checking warranty.',
    keywords: ['Smart Watch Price in Pakistan', 'Calling Smartwatch', 'Ultra Smartwatch', 'Fitness Watch COD']
  },
  cables: {
    icon: Cable,
    h1: 'Fast Charging & High-Speed Data Cables in Pakistan',
    tagline: 'Nylon Braided, 65W/100W PD & Multi-Pin USB Connectors',
    p1: 'Standard charging cables often fray and stop charging after a few weeks. CellFocus cables are built with military-grade braided nylon jackets, reinforced strain-relief collars, and pure copper cores that support up to 65W/100W fast power transfer.',
    p2: 'Available in Type-C to Type-C, Type-C to Lightning, and Micro USB variations. Enjoy swift file transfers between phone and PC, durable longevity through 10,000+ bend tests, and direct wholesale pricing.',
    keywords: ['Fast Charging Cable', 'Braided Type-C Wire', 'Micro USB Data Cable', 'Durable Charging Cord']
  }
};

export default function CategoryGuide({ category }) {
  if (!category || category === 'all') return null;

  const catKey = String(category).toLowerCase().trim();
  const content = CATEGORY_CONTENT[catKey] || CATEGORY_CONTENT.chargers;
  const catConfig = CATEGORY_SEO[catKey] || { name: catKey };
  const IconComponent = content.icon;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e5e2d6] mb-8 shadow-2xs">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs text-[#78746a]">
        <Link to="/" className="hover:text-[#1c1b18] transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#a8a497]" />
        <span className="text-[#1c1b18] font-medium">{catConfig.name}</span>
      </nav>

      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-[#eeebe2] flex items-center justify-center text-[#1c1b18] shrink-0">
          <IconComponent className="w-6 h-6 text-[#1c1b18]" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#1c1b18] tracking-tight">
            {content.h1}
          </h1>
          <p className="text-xs sm:text-sm text-[#78746a] mt-0.5 font-medium">
            {content.tagline}
          </p>
        </div>
      </div>

      <div className="space-y-3 text-xs sm:text-sm text-[#5c584e] leading-relaxed border-t border-[#eeebe2] pt-4">
        <p>{content.p1}</p>
        <p>{content.p2}</p>
      </div>

      {/* Localized Tags / Quick Links */}
      <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-[#eeebe2]">
        <span className="text-[11px] font-bold text-[#78746a] uppercase tracking-wider">Popular Searches:</span>
        {content.keywords.map((kw, i) => (
          <span key={i} className="px-2.5 py-1 rounded-lg bg-[#faf8f4] border border-[#e5e2d6] text-[11px] text-[#4a473f] font-medium">
            {kw}
          </span>
        ))}
      </div>
    </div>
  );
}

