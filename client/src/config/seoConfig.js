/**
 * Client-Side SEO Config and Helper Module for CellFocus
 * Mirrors the server-side rules for consistent canonicals, titles, and schemas.
 */

export const BASE_URL = 'https://www.cellfocusaccessories.com';
export const DEFAULT_IMAGE = `${BASE_URL}/og-share-card.jpg`;

export const CATEGORY_SEO = {
  chargers: {
    name: 'Fast Chargers',
    title: 'Fast Charger Price in Pakistan | GaN & Type-C | CellFocus',
    description: 'Buy original GaN fast chargers, 65W dual-port adapters & Type-C chargers in Pakistan. Best wholesale & retail rates with nationwide cash on delivery.',
    h1: 'Fast Chargers & Power Adapters in Pakistan',
    canonical: `${BASE_URL}/category/chargers`,
    guide: 'Looking for fast charging in Pakistan? CellFocus offers high-efficiency GaN (Gallium Nitride) and dual-port chargers with Type-C and USB-Micro pin support. Safe, durable, and compatible with Samsung, Xiaomi, iPhone, and Android devices across Lahore, Karachi, and nationwide with COD.'
  },
  airpods: {
    name: 'Wireless Earpods & AirPods',
    title: 'Wireless Earbuds Price in Pakistan | ANC Earpods | CellFocus',
    description: 'Shop premium wireless earpods & AirPods in Pakistan. Active noise cancellation, deep bass & long battery backup at wholesale & retail rates with COD.',
    h1: 'Wireless Earpods & Bluetooth AirPods in Pakistan',
    canonical: `${BASE_URL}/category/airpods`,
    guide: 'Experience rich acoustic bass and crystal-clear calling with CellFocus wireless earpods. Featuring ultra-low latency gaming modes, ergonomic comfort fits, and rapid Type-C charging cases. Available for individual buyers and wholesale retailers nationwide.'
  },
  earpods: {
    name: 'Wireless Earpods & AirPods',
    title: 'Wireless Earbuds Price in Pakistan | ANC Earpods | CellFocus',
    description: 'Shop premium wireless earpods & AirPods in Pakistan. Active noise cancellation, deep bass & long battery backup at wholesale & retail rates with COD.',
    h1: 'Wireless Earpods & Bluetooth AirPods in Pakistan',
    canonical: `${BASE_URL}/category/earpods`,
    guide: 'Experience rich acoustic bass and crystal-clear calling with CellFocus wireless earpods. Featuring ultra-low latency gaming modes, ergonomic comfort fits, and rapid Type-C charging cases. Available for individual buyers and wholesale retailers nationwide.'
  },
  handsfree: {
    name: 'Handsfree & Earphones',
    title: 'Handsfree Price in Pakistan | Heavy Bass Earphones | CellFocus',
    description: 'Original handsfree & earphones with HD mic across Pakistan. Best wholesale rates for retailers and retail buyers in Lahore, Karachi with fast COD.',
    h1: 'Handsfree & In-Ear Earphones in Pakistan',
    canonical: `${BASE_URL}/category/handsfree`,
    guide: 'Durable, tangle-free handsfree with high-definition microphone and gold-plated 3.5mm and Type-C connectors. Engineered for clear voice calls and deep punchy bass at unbeatable prices in Pakistan.'
  },
  smartwatches: {
    name: 'Smartwatches',
    title: 'Smart Watch Price in Pakistan | Calling Smartwatches | CellFocus',
    description: 'Buy original calling smartwatches & fitness trackers in Pakistan. AMOLED display, heart rate monitor & waterproof designs at wholesale rates with COD.',
    h1: 'Smartwatches & Fitness Bands in Pakistan',
    canonical: `${BASE_URL}/category/smartwatches`,
    guide: 'Explore the latest Bluetooth calling smartwatches in Pakistan. Featuring crystal-clear HD/AMOLED displays, multi-sport activity tracking, and long standby battery life. Backed by our checking warranty.'
  },
  cables: {
    name: 'Fast Charging Cables',
    title: 'Fast Charging Cable Price in Pakistan | Type-C & Micro | CellFocus',
    description: 'Heavy duty braided fast charging & data cables for Type-C, USB-Micro & Lightning. Unbeatable wholesale & retail rates in Pakistan with COD.',
    h1: 'Fast Charging & Data Cables in Pakistan',
    canonical: `${BASE_URL}/category/cables`,
    guide: 'Tired of broken wires? Our high-durability braided charging cables support up to 65W/100W PD fast charging and high-speed data transfer. Tested for 10,000+ bends for maximum longevity.'
  }
};

export const STATIC_PAGES_SEO = {
  wholesale: {
    title: 'Mobile Accessories Wholesale Pakistan | Bulk Rates | CellFocus',
    description: 'Pakistan premier wholesale mobile accessories supplier. Factory rates for smartwatches, chargers, earpods & cables. Direct WhatsApp bulk orders.',
    h1: 'Mobile Accessories Wholesale Pakistan',
    canonical: `${BASE_URL}/wholesale`,
  },
  about: {
    title: 'About CellFocus Pakistan | Trusted Mobile Accessories Brand',
    description: 'Learn about CellFocus, a top Pakistani mobile accessories brand delivering authentic fast chargers, wireless audio, and smart gadgets nationwide.',
    h1: 'About CellFocus Accessories',
    canonical: `${BASE_URL}/about`,
  },
  contact: {
    title: 'Contact Us | CellFocus Mobile Accessories Pakistan',
    description: 'Get in touch with CellFocus Pakistan for wholesale inquiries, retail orders, or tracking. Fast response via WhatsApp (+92 326 9589597) and phone.',
    h1: 'Contact CellFocus',
    canonical: `${BASE_URL}/contact`,
  },
  'shipping-policy': {
    title: 'Shipping & Delivery Policy | CellFocus Pakistan',
    description: 'CellFocus shipping policy: Fast 24h dispatch with nationwide Cash on Delivery (COD) across Lahore, Karachi, Islamabad, and all cities in Pakistan.',
    h1: 'Shipping & Delivery Policy',
    canonical: `${BASE_URL}/shipping-policy`,
  },
  'warranty-policy': {
    title: 'Warranty & Replacement Policy | CellFocus Pakistan',
    description: 'CellFocus checking warranty policy. 7-day checking warranty on all eligible electronic accessories with hassle-free replacements across Pakistan.',
    h1: 'Warranty & Replacement Policy',
    canonical: `${BASE_URL}/warranty-policy`,
  },
  'privacy-policy': {
    title: 'Privacy Policy | CellFocus Pakistan',
    description: 'CellFocus privacy policy: How we collect, safeguard, and process your order details securely without sharing with third parties.',
    h1: 'Privacy Policy',
    canonical: `${BASE_URL}/privacy-policy`,
  }
};

export function slugify(text) {
  if (!text) return 'item';
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function resolveImageUrl(img) {
  if (!img || typeof img !== 'string') return DEFAULT_IMAGE;
  const trimmed = img.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${BASE_URL}${cleanPath}`;
}

export function truncate(str, maxLen = 60) {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3).trim() + '...';
}

export function getFutureIsoDate(daysAhead = 90) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

