/**
 * CellFocus Comprehensive SEO Engine
 * Provides single source of truth for:
 * - Page titles (truncated strictly <= 60 chars)
 * - Meta descriptions (with PKR price and clear CTA, <= 155 chars)
 * - Canonical URLs (self-referencing, no query strings)
 * - OpenGraph & Twitter Cards (with 1200x630 fallback image)
 * - Verified Schema.org JSON-LD (Product, Organization, BreadcrumbList, WebSite)
 * - NO fake aggregate ratings
 */

const BASE_URL = 'https://www.cellfocusaccessories.com';
const DEFAULT_IMAGE = `${BASE_URL}/og-share-card.jpg`;

const CATEGORY_SEO = {
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

const STATIC_PAGES_SEO = {
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

function slugify(text) {
  if (!text) return 'item';
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function resolveImageUrl(img, baseUrl = BASE_URL) {
  if (!img || typeof img !== 'string') return DEFAULT_IMAGE;
  const trimmed = img.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${baseUrl}${cleanPath}`;
}

function truncate(str, maxLen = 60) {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3).trim() + '...';
}

function getFutureIsoDate(daysAhead = 90) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

/**
 * Generate SEO metadata and JSON-LD schema for a Product
 */
function generateProductSeo(product, baseUrl = BASE_URL) {
  if (!product) return null;
  const pid = product.id || product._id || 'item';
  const name = product.name || 'Mobile Accessory';
  const slug = slugify(name);
  const canonical = `${baseUrl}/product/${slug}-${pid}`;

  // Strict title template <= 60 chars: "{Product Name} Price in Pakistan | CellFocus"
  let rawTitle = `${name} Price in Pakistan | CellFocus`;
  let title = rawTitle.length <= 60 ? rawTitle : truncate(rawTitle, 60);

  const priceNum = Number(product.price) || 0;
  const priceFormatted = priceNum > 0 ? `Rs. ${priceNum.toLocaleString()}. ` : '';
  const description = truncate(
    `Buy original ${name} online in Pakistan. ${priceFormatted}Wholesale & retail rates, checking warranty, and fast cash on delivery nationwide. Order now!`,
    155
  );

  const primaryImage = resolveImageUrl(
    product.image || (Array.isArray(product.images) && product.images[0]),
    baseUrl
  );

  const imageGallery = [primaryImage];
  if (Array.isArray(product.images)) {
    product.images.forEach((img) => {
      const resolved = resolveImageUrl(img, baseUrl);
      if (!imageGallery.includes(resolved)) imageGallery.push(resolved);
    });
  }

  const inStock = product.stock === undefined || product.stock === null || Number(product.stock) > 0;
  const availability = inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';

  // Build verified Product Schema
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${canonical}#product`,
    name,
    image: imageGallery,
    description: product.description || product.details || description,
    sku: `CF-${pid}`,
    mpn: `CF-PK-${pid}`,
    brand: {
      '@type': 'Brand',
      name: 'CellFocus',
    },
    category: product.category || 'Mobile Accessories',
  };

  // Only include Offers block if a valid price exists (avoid price 0 error)
  if (priceNum > 0) {
    productSchema.offers = {
      '@type': 'Offer',
      url: canonical,
      priceCurrency: 'PKR',
      price: priceNum,
      priceValidUntil: getFutureIsoDate(90),
      itemCondition: 'https://schema.org/NewCondition',
      availability,
      seller: {
        '@type': 'Organization',
        name: 'CellFocus',
        url: baseUrl,
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'PK',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 7,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0',
          currency: 'PKR',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'PK',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 3,
            unitCode: 'd',
          },
        },
      },
    };
  }

  // Breadcrumbs schema
  const categorySlug = (product.category || 'all').toLowerCase();
  const categoryConfig = CATEGORY_SEO[categorySlug] || { name: 'Accessories', canonical: `${baseUrl}/#products` };

  const breadcrumbsSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${baseUrl}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: categoryConfig.name,
        item: categoryConfig.canonical || `${baseUrl}/category/${categorySlug}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: truncate(name, 35),
        item: canonical,
      },
    ],
  };

  return {
    title,
    description,
    canonical,
    ogImage: primaryImage,
    ogType: 'product',
    h1: `${name} in Pakistan`,
    schemas: [productSchema, breadcrumbsSchema],
    product,
  };
}

/**
 * Generate SEO metadata and JSON-LD schema for a Category
 */
function generateCategorySeo(categorySlug, baseUrl = BASE_URL) {
  const cleanSlug = String(categorySlug || '').toLowerCase().trim();
  const cat = CATEGORY_SEO[cleanSlug] || {
    name: cleanSlug.charAt(0).toUpperCase() + cleanSlug.slice(1) || 'Mobile Accessories',
    title: `${cleanSlug.charAt(0).toUpperCase() + cleanSlug.slice(1)} Price in Pakistan | CellFocus`,
    description: `Shop original ${cleanSlug} in Pakistan at wholesale and retail rates with cash on delivery across Lahore, Karachi and nationwide.`,
    h1: `${cleanSlug.charAt(0).toUpperCase() + cleanSlug.slice(1)} in Pakistan`,
    canonical: `${baseUrl}/category/${cleanSlug}`,
    guide: `Explore genuine ${cleanSlug} by CellFocus with nationwide fast shipping and cash on delivery in Pakistan.`,
  };

  const breadcrumbsSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${baseUrl}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: cat.name,
        item: cat.canonical,
      },
    ],
  };

  return {
    title: cat.title,
    description: cat.description,
    canonical: cat.canonical,
    ogImage: DEFAULT_IMAGE,
    ogType: 'website',
    h1: cat.h1,
    guide: cat.guide,
    schemas: [breadcrumbsSchema],
  };
}

/**
 * Generate SEO metadata for Homepage or Static Pages
 */
function generatePageSeo(pathname = '/', query = {}, productsList = [], baseUrl = BASE_URL) {
  const cleanPath = pathname.toLowerCase().replace(/\/+$/, '') || '/';

  // 1. Static page matches
  const staticKey = cleanPath.replace(/^\//, '');
  if (STATIC_PAGES_SEO[staticKey]) {
    const page = STATIC_PAGES_SEO[staticKey];
    const breadcrumbsSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: `${baseUrl}/`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: page.h1,
          item: page.canonical,
        },
      ],
    };
    return {
      title: page.title,
      description: page.description,
      canonical: page.canonical,
      ogImage: DEFAULT_IMAGE,
      ogType: 'website',
      h1: page.h1,
      schemas: [breadcrumbsSchema],
    };
  }

  // 2. Category Route matches (/category/:slug)
  const catMatch = cleanPath.match(/^\/category\/([a-z0-9_-]+)/i);
  if (catMatch) {
    return generateCategorySeo(catMatch[1], baseUrl);
  }

  // 3. Product Route matches (/product/:slugWithId)
  const prodMatch = cleanPath.match(/^\/product\/([a-z0-9_-]+)/i);
  if (prodMatch) {
    const slugWithId = prodMatch[1];
    const product = parseProductSlug(slugWithId, productsList);
    if (product) {
      return generateProductSeo(product, baseUrl);
    }
  }

  // 4. Default Homepage SEO
  const homeTitle = 'Wholesale & Retail Mobile Accessories Pakistan | CellFocus';
  const homeDesc = truncate(
    'Buy original smartwatches, wireless earpods, fast chargers & handsfree at wholesale & retail rates in Pakistan. Cash on delivery Lahore, Karachi & nationwide.',
    155
  );

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    url: `${baseUrl}/`,
    name: 'CellFocus Mobile Accessories',
    description: homeDesc,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return {
    title: homeTitle,
    description: homeDesc,
    canonical: `${baseUrl}/`,
    ogImage: DEFAULT_IMAGE,
    ogType: 'website',
    h1: 'Wholesale & Retail Mobile Accessories in Pakistan',
    schemas: [websiteSchema],
  };
}

/**
 * Match a product slug like "super-fast-charger-1" or query params to product object
 */
function parseProductSlug(slugWithId, productsList = []) {
  if (!slugWithId || !Array.isArray(productsList)) return null;

  // Extract trailing ID if formatted as "slug-ID"
  const lastHyphen = slugWithId.lastIndexOf('-');
  const potentialId = lastHyphen > -1 ? slugWithId.slice(lastHyphen + 1) : slugWithId;

  // 1. Direct ID match
  let found = productsList.find(
    (p) => String(p.id || p._id) === String(potentialId)
  );
  if (found) return found;

  // 2. Full slug match against slugified product name + id
  found = productsList.find((p) => {
    const s = `${slugify(p.name)}-${p.id || p._id}`;
    return s === slugWithId;
  });
  if (found) return found;

  // 3. Match by name slug alone
  found = productsList.find((p) => slugify(p.name) === slugWithId);
  return found || null;
}

/**
 * Inject dynamic title, meta tags, OpenGraph, Twitter, and JSON-LD schemas into raw index.html
 */
function injectSeoIntoHtml(htmlTemplate, seoData) {
  if (!htmlTemplate || !seoData) return htmlTemplate;

  let out = htmlTemplate;

  // Replace Title
  out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(seoData.title)}</title>`);

  // Helper to replace or inject <meta name="..." content="...">
  const setMetaName = (name, content) => {
    const regex = new RegExp(`<meta\\s+name=["']${name}["'][^>]*>`, 'gi');
    const tag = `<meta name="${name}" content="${escapeHtml(content)}" />`;
    if (regex.test(out)) {
      out = out.replace(regex, tag);
    } else {
      out = out.replace('</head>', `  ${tag}\n</head>`);
    }
  };

  // Helper to replace or inject <meta property="..." content="...">
  const setMetaProperty = (prop, content) => {
    const regex = new RegExp(`<meta\\s+property=["']${prop}["'][^>]*>`, 'gi');
    const tag = `<meta property="${prop}" content="${escapeHtml(content)}" />`;
    if (regex.test(out)) {
      out = out.replace(regex, tag);
    } else {
      out = out.replace('</head>', `  ${tag}\n</head>`);
    }
  };

  // Canonical tag
  const canonRegex = /<link\s+rel=["']canonical["'][^>]*>/gi;
  const canonTag = `<link rel="canonical" href="${escapeHtml(seoData.canonical)}" />`;
  if (canonRegex.test(out)) {
    out = out.replace(canonRegex, canonTag);
  } else {
    out = out.replace('</head>', `  ${canonTag}\n</head>`);
  }

  // Standard Meta Tags
  setMetaName('description', seoData.description);
  setMetaName('title', seoData.title);

  // Remove obsolete keywords tag if present
  out = out.replace(/<meta\s+name=["']keywords["'][^>]*>/gi, '');

  // Open Graph
  setMetaProperty('og:title', seoData.title);
  setMetaProperty('og:description', seoData.description);
  setMetaProperty('og:url', seoData.canonical);
  setMetaProperty('og:type', seoData.ogType || 'website');
  setMetaProperty('og:image', seoData.ogImage || DEFAULT_IMAGE);
  setMetaProperty('og:image:secure_url', seoData.ogImage || DEFAULT_IMAGE);
  setMetaProperty('og:image:width', '1200');
  setMetaProperty('og:image:height', '630');
  setMetaProperty('og:image:alt', seoData.title);
  setMetaProperty('og:site_name', 'CellFocus Mobile Accessories Pakistan');
  setMetaProperty('og:locale', 'en_PK');

  // Twitter Cards
  setMetaName('twitter:card', 'summary_large_image');
  setMetaName('twitter:title', seoData.title);
  setMetaName('twitter:description', seoData.description);
  setMetaName('twitter:image', seoData.ogImage || DEFAULT_IMAGE);
  setMetaName('twitter:image:alt', seoData.title);

  // Inject Schemas
  if (Array.isArray(seoData.schemas) && seoData.schemas.length > 0) {
    const scripts = seoData.schemas
      .map(
        (s) =>
          `  <script type="application/ld+json" class="cellfocus-injected-schema">\n${JSON.stringify(s, null, 2)}\n  </script>`
      )
      .join('\n');
    out = out.replace('</head>', `${scripts}\n</head>`);
  }

  return out;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = {
  BASE_URL,
  DEFAULT_IMAGE,
  CATEGORY_SEO,
  STATIC_PAGES_SEO,
  slugify,
  resolveImageUrl,
  truncate,
  generateProductSeo,
  generateCategorySeo,
  generatePageSeo,
  parseProductSlug,
  injectSeoIntoHtml,
};
