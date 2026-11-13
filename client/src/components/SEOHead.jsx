import { useEffect } from 'react';

/**
 * SEOHead - Dynamic Meta, Canonical, and JSON-LD Schema Engine for CellFocus
 * Automatically synchronizes document title, meta descriptions, canonical URLs,
 * Open Graph, and rich Product/Breadcrumb schemas based on user navigation.
 */
export default function SEOHead({ category, product }) {
  useEffect(() => {
    const BASE_URL = 'https://www.cellfocusaccessories.com';
    const DEFAULT_TITLE = 'Wholesale & Retail Mobile Accessories Pakistan | CellFocus';
    const DEFAULT_DESC =
      'Buy original smartwatches, wireless earpods, fast chargers & handsfree at wholesale & retail rates in Pakistan. Cash on delivery Lahore, Karachi & nationwide.';
    const DEFAULT_CANONICAL = `${BASE_URL}/`;
    const DEFAULT_KEYWORDS =
      'smart watch price in pakistan, sasta charger price, best smart watch pakistan mein, original earpods wholesale price lahore karachi islamabad, mobile accessories ki wholesale market, fast charger online shopping pakistan, handsfree wholesale rate, cellfocus';

    let title = DEFAULT_TITLE;
    let description = DEFAULT_DESC;
    let canonical = DEFAULT_CANONICAL;
    let keywords = DEFAULT_KEYWORDS;
    let dynamicSchema = null;

    if (product) {
      // 1. SPECIFIC PRODUCT MODAL VIEW
      const pid = product.id || product._id || 'item';
      const cleanSlug = (product.name || 'product')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      title = `${product.name} Price in Pakistan (Wholesale & Retail) | CellFocus`;
      description = `Buy original ${product.name} online in Pakistan. Guaranteed authentic, best wholesale & retail rate, 7-day warranty, and fast cash on delivery nationwide.`;
      canonical = `${BASE_URL}/?product=${cleanSlug}&id=${pid}`;
      keywords = `${product.name}, ${product.name} price in pakistan, ${product.name} wholesale rate, sasta ${product.name}, original ${product.name} lahore karachi, cellfocus`;

      const imageUrl =
        product.image && product.image.startsWith('http')
          ? product.image
          : `${BASE_URL}/logo.png`;

      dynamicSchema = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Product',
            '@id': `${BASE_URL}/#product-${pid}`,
            name: product.name,
            image: [imageUrl],
            description:
              product.description ||
              `Original ${product.name} available at competitive retail and wholesale rates across Pakistan by CellFocus.`,
            sku: String(pid),
            mpn: `CF-${pid}`,
            brand: {
              '@type': 'Brand',
              name: 'CellFocus',
            },
            offers: {
              '@type': 'Offer',
              url: canonical,
              priceCurrency: 'PKR',
              price: Number(product.price) || 0,
              priceValidUntil: '2027-12-31',
              itemCondition: 'https://schema.org/NewCondition',
              availability: 'https://schema.org/InStock',
              seller: {
                '@type': 'Organization',
                name: 'CellFocus',
                url: BASE_URL,
              },
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.9',
              reviewCount: '128',
              bestRating: '5',
              worstRating: '1',
            },
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: BASE_URL,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: product.category
                  ? product.category.toUpperCase()
                  : 'Accessories',
                item: `${BASE_URL}/?category=${product.category || 'all'}`,
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: product.name,
                item: canonical,
              },
            ],
          },
        ],
      };
    } else if (category && category !== 'all') {
      // 2. CATEGORY-FILTERED VIEW
      if (category === 'chargers') {
        title = 'Fast Chargers & Power Adapters Price in Pakistan | Wholesale & Retail CellFocus';
        description =
          'Buy original GaN fast chargers, 65W dual-port adapters & type-c cables in Pakistan at wholesale & retail prices. Sasta charger price, 24h dispatch & COD.';
        canonical = `${BASE_URL}/?category=chargers`;
        keywords =
          'sasta charger price, fast charger online shopping pakistan, wholesale charger price in pakistan, gan 65w charger lahore, type c fast charging adapter karachi, mobile charger wholesale supplier pakistan, cellfocus chargers';
      } else if (category === 'airpods') {
        title = 'Original Wireless Earpods & AirPods Price in Pakistan | CellFocus Wholesale';
        description =
          'Buy premium wireless earpods & airpods in Lahore, Karachi, Islamabad with active noise cancellation and heavy bass at wholesale rates. Cash on delivery.';
        canonical = `${BASE_URL}/?category=airpods`;
        keywords =
          'original earpods wholesale price lahore karachi islamabad, airpods wholesale rate pakistan, sasta wireless earbuds, hall road airpods wholesale, best earbuds in pakistan mein, cellfocus wireless audio';
      } else if (category === 'handsfree') {
        title = 'Original Handsfree & Earphones Price in Pakistan | CellFocus Wholesale Rate';
        description =
          'Premium bass handsfree & in-ear earphones with HD mic across Pakistan. Handsfree wholesale rate for phone retailers and bulk buyers in Shah Alam & Hall Road.';
        canonical = `${BASE_URL}/?category=handsfree`;
        keywords =
          'handsfree wholesale rate, original handsfree sasti price, bass handsfree pakistan, mobile accessories ki wholesale market, 3.5mm jack handsfree, type c handsfree pakistan, cellfocus handsfree';
      }

      dynamicSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: BASE_URL,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: category.charAt(0).toUpperCase() + category.slice(1),
            item: canonical,
          },
        ],
      };
    }

    // Apply document title
    document.title = title;

    // Helper to set or create meta tag
    const setMeta = (attr, key, val) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', val);
    };

    setMeta('name', 'description', description);
    setMeta('name', 'keywords', keywords);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', canonical);
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);

    // Apply Canonical Link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonical);

    // Inject Dynamic JSON-LD Schema
    const SCRIPT_ID = 'cellfocus-dynamic-schema';
    let scriptEl = document.getElementById(SCRIPT_ID);
    if (dynamicSchema) {
      if (!scriptEl) {
        scriptEl = document.createElement('script');
        scriptEl.id = SCRIPT_ID;
        scriptEl.type = 'application/ld+json';
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify(dynamicSchema);
    } else if (scriptEl) {
      scriptEl.remove();
    }
  }, [category, product]);

  return null;
}

