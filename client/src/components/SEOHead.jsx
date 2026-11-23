import { useEffect } from 'react';
import {
  BASE_URL,
  DEFAULT_IMAGE,
  CATEGORY_SEO,
  STATIC_PAGES_SEO,
  slugify,
  resolveImageUrl,
  truncate,
  getFutureIsoDate,
} from '../config/seoConfig';

/**
 * SEOHead - Dynamic Meta, Canonical, and JSON-LD Schema Engine for CellFocus
 * Automatically synchronizes document title, meta descriptions, canonical URLs,
 * Open Graph, Twitter Cards, and Product/Breadcrumb schemas based on user navigation.
 * 
 * Complies with strict Google Search guidelines:
 * - NO fake aggregateRating (only real review markup)
 * - Real dynamic prices with PKR currency
 * - Dynamic availability based on stock
 * - Dynamic priceValidUntil (90 days forward)
 * - No meta keywords
 */
export default function SEOHead({ category, product, pagePath }) {
  useEffect(() => {
    let title = 'Wholesale & Retail Mobile Accessories Pakistan | CellFocus';
    let description =
      'Buy original smartwatches, wireless earpods, fast chargers & handsfree at wholesale & retail rates in Pakistan. Cash on delivery Lahore, Karachi & nationwide.';
    let canonical = `${BASE_URL}/`;
    let ogImage = DEFAULT_IMAGE;
    let ogType = 'website';
    let dynamicSchemas = [];

    // 1. SPECIFIC PRODUCT VIEW
    if (product) {
      const pid = product.id || product._id || 'item';
      const name = product.name || 'Mobile Accessory';
      const slug = slugify(name);
      canonical = `${BASE_URL}/product/${slug}-${pid}`;

      const rawTitle = `${name} Price in Pakistan | CellFocus`;
      title = rawTitle.length <= 60 ? rawTitle : truncate(rawTitle, 60);

      const priceNum = Number(product.price) || 0;
      const priceFormatted = priceNum > 0 ? `Rs. ${priceNum.toLocaleString()}. ` : '';
      description = truncate(
        `Buy original ${name} online in Pakistan. ${priceFormatted}Wholesale & retail rates, checking warranty, and fast cash on delivery nationwide. Order now!`,
        155
      );

      const primaryImg = resolveImageUrl(
        product.image || (Array.isArray(product.images) && product.images[0])
      );
      ogImage = primaryImg;
      ogType = 'product';

      const inStock = product.stock === undefined || product.stock === null || Number(product.stock) > 0;
      const availability = inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';

      const imageGallery = [primaryImg];
      if (Array.isArray(product.images)) {
        product.images.forEach((img) => {
          const res = resolveImageUrl(img);
          if (!imageGallery.includes(res)) imageGallery.push(res);
        });
      }

      // Build strictly compliant Product schema WITHOUT fake ratings
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
            url: BASE_URL,
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
          },
        };
      }

      const catSlug = (product.category || 'all').toLowerCase();
      const catConfig = CATEGORY_SEO[catSlug] || { name: 'Accessories', canonical: `${BASE_URL}/#products` };

      const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${BASE_URL}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: catConfig.name,
            item: catConfig.canonical || `${BASE_URL}/category/${catSlug}`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: truncate(name, 35),
            item: canonical,
          },
        ],
      };

      dynamicSchemas = [productSchema, breadcrumbSchema];
    }
    // 2. CATEGORY VIEW
    else if (category && category !== 'all') {
      const cleanCat = String(category).toLowerCase().trim();
      const cat = CATEGORY_SEO[cleanCat] || {
        name: cleanCat.charAt(0).toUpperCase() + cleanCat.slice(1),
        title: `${cleanCat.charAt(0).toUpperCase() + cleanCat.slice(1)} Price in Pakistan | CellFocus`,
        description: `Shop original ${cleanCat} in Pakistan at wholesale and retail rates with cash on delivery across Lahore, Karachi and nationwide.`,
        canonical: `${BASE_URL}/category/${cleanCat}`,
      };

      title = cat.title;
      description = cat.description;
      canonical = cat.canonical;

      const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${BASE_URL}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: cat.name,
            item: canonical,
          },
        ],
      };

      dynamicSchemas = [breadcrumbSchema];
    }
    // 3. STATIC PAGE VIEW
    else if (pagePath) {
      const staticKey = pagePath.replace(/^\//, '').toLowerCase();
      if (STATIC_PAGES_SEO[staticKey]) {
        const page = STATIC_PAGES_SEO[staticKey];
        title = page.title;
        description = page.description;
        canonical = page.canonical;

        const breadcrumbSchema = {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: `${BASE_URL}/`,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: page.h1,
              item: page.canonical,
            },
          ],
        };

        dynamicSchemas = [breadcrumbSchema];
      }
    }
    // 4. HOMEPAGE VIEW
    else {
      const websiteSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': `${BASE_URL}/#website`,
        url: `${BASE_URL}/`,
        name: 'CellFocus Mobile Accessories',
        description,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${BASE_URL}/?search={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      };
      dynamicSchemas = [websiteSchema];
    }

    // Apply Document Title
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
    setMeta('name', 'title', title);

    // Open Graph
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', canonical);
    setMeta('property', 'og:type', ogType);
    setMeta('property', 'og:image', ogImage);
    setMeta('property', 'og:image:secure_url', ogImage);
    setMeta('property', 'og:image:width', '1200');
    setMeta('property', 'og:image:height', '630');
    setMeta('property', 'og:image:alt', title);
    setMeta('property', 'og:site_name', 'CellFocus Mobile Accessories Pakistan');
    setMeta('property', 'og:locale', 'en_PK');

    // Twitter Cards
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', ogImage);
    setMeta('name', 'twitter:image:alt', title);

    // Remove obsolete meta keywords tag if still present
    const oldKeywords = document.querySelector('meta[name="keywords"]');
    if (oldKeywords) oldKeywords.remove();

    // Canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonical);

    // Dynamic JSON-LD Schema
    const SCRIPT_ID = 'cellfocus-dynamic-schema';
    let scriptEl = document.getElementById(SCRIPT_ID);
    if (dynamicSchemas.length > 0) {
      if (!scriptEl) {
        scriptEl = document.createElement('script');
        scriptEl.id = SCRIPT_ID;
        scriptEl.type = 'application/ld+json';
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify(
        dynamicSchemas.length === 1 ? dynamicSchemas[0] : { '@context': 'https://schema.org', '@graph': dynamicSchemas }
      );
    } else if (scriptEl) {
      scriptEl.remove();
    }
  }, [category, product, pagePath]);

  return null;
}
