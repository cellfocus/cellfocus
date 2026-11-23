const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const repo = require('../storage');
const {
  BASE_URL,
  DEFAULT_IMAGE,
  CATEGORY_SEO,
  STATIC_PAGES_SEO,
  slugify,
  resolveImageUrl,
  generatePageSeo,
  generateProductSeo,
  generateCategorySeo,
  parseProductSlug,
  injectSeoIntoHtml,
} = require('../services/seoEngine');

function resolveSiteUrl() {
  const raw =
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.BASE_URL ||
    process.env.DOMAIN ||
    BASE_URL;
  let clean = String(raw).trim().replace(/\/+$/, '');
  if (
    clean.includes('cellfocus.pk') ||
    clean === 'https://cellfocusaccessories.com' ||
    clean === 'http://cellfocusaccessories.com'
  ) {
    clean = BASE_URL;
  }
  return clean;
}

function stripHash(url) {
  if (!url) return '';
  return String(url).split('#')[0];
}

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 301 Permanent Redirects for legacy query-string URLs:
 * e.g., /?product=slug&id=123 -> /product/slug-123
 * e.g., /?category=chargers -> /category/chargers
 */
router.use((req, res, next) => {
  if (req.method !== 'GET') return next();

  const queryProduct = req.query.product;
  const queryId = req.query.id;
  const queryCat = req.query.category;

  if (queryProduct && queryId) {
    const cleanSlug = slugify(queryProduct);
    const cleanId = String(queryId).trim();
    return res.redirect(301, `/product/${cleanSlug}-${cleanId}`);
  }

  if (queryCat && queryCat !== 'all') {
    const cleanCat = String(queryCat).toLowerCase().trim();
    return res.redirect(301, `/category/${cleanCat}`);
  }

  next();
});

/**
 * Dynamic XML Sitemap endpoint
 * Returns a complete, valid XML sitemap with clean canonical URLs.
 * Guarantees NO query strings and NO hash fragments.
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = resolveSiteUrl();
    const products = await repo.getAllProducts();
    const today = new Date().toISOString().split('T')[0];

    const seenLocs = new Set();
    let entriesXml = '';

    const addEntry = ({
      loc,
      lastmod = today,
      changefreq = 'daily',
      priority = '0.8',
      images = [],
      alternates = [],
    }) => {
      const cleanLoc = stripHash(loc);
      if (!cleanLoc || seenLocs.has(cleanLoc)) return;
      seenLocs.add(cleanLoc);

      let entry = '  <url>\n';
      entry += `    <loc>${escapeXml(cleanLoc)}</loc>\n`;
      entry += `    <lastmod>${lastmod}</lastmod>\n`;
      entry += `    <changefreq>${changefreq}</changefreq>\n`;
      entry += `    <priority>${priority}</priority>\n`;

      for (const alt of alternates) {
        entry += `    <xhtml:link rel="alternate" hreflang="${escapeXml(alt.hreflang)}" href="${escapeXml(stripHash(alt.href))}" />\n`;
      }

      for (const img of images) {
        if (!img || !img.loc) continue;
        entry += '    <image:image>\n';
        entry += `      <image:loc>${escapeXml(stripHash(img.loc))}</image:loc>\n`;
        if (img.title) entry += `      <image:title>${escapeXml(img.title)}</image:title>\n`;
        if (img.caption) entry += `      <image:caption>${escapeXml(img.caption)}</image:caption>\n`;
        entry += '    </image:image>\n';
      }

      entry += '  </url>\n';
      entriesXml += entry;
    };

    // 1. Storefront Homepage
    addEntry({
      loc: `${baseUrl}/`,
      priority: '1.0',
      changefreq: 'daily',
      alternates: [
        { hreflang: 'en-pk', href: `${baseUrl}/` },
        { hreflang: 'x-default', href: `${baseUrl}/` },
      ],
      images: [
        {
          loc: `${baseUrl}/og-share-card.jpg`,
          title: 'CellFocus Wholesale & Retail Mobile Accessories Pakistan',
          caption: 'Original smartwatches, earpods, fast chargers & handsfree nationwide.',
        },
      ],
    });

    // 2. High-Intent Dedicated Wholesale Page
    addEntry({
      loc: `${baseUrl}/wholesale`,
      priority: '0.95',
      changefreq: 'weekly',
      images: [
        {
          loc: `${baseUrl}/og-share-card.jpg`,
          title: 'CellFocus Mobile Accessories Wholesale Pakistan',
          caption: 'Wholesale mobile accessories bulk supplier in Pakistan.',
        },
      ],
    });

    // 3. Clean Category Pages
    const categories = Object.keys(CATEGORY_SEO);
    for (const catKey of categories) {
      const cat = CATEGORY_SEO[catKey];
      addEntry({
        loc: `${baseUrl}/category/${catKey}`,
        priority: '0.9',
        changefreq: 'daily',
        images: [{ loc: DEFAULT_IMAGE, title: cat.title }],
      });
    }

    // 4. Clean Product Pages
    if (Array.isArray(products)) {
      products.forEach((p) => {
        const pid = p.id || p._id;
        if (!pid) return;
        const slug = slugify(p.name);
        const pUrl = `${baseUrl}/product/${slug}-${pid}`;
        const lastMod = p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : today;
        const imageUrl = resolveImageUrl(
          p.image || (Array.isArray(p.images) && p.images[0]),
          baseUrl
        );

        addEntry({
          loc: pUrl,
          lastmod: lastMod,
          changefreq: 'weekly',
          priority: '0.85',
          images: [
            {
              loc: imageUrl,
              title: `${p.name} Price in Pakistan | CellFocus`,
              caption: p.description || p.name,
            },
          ],
        });
      });
    }

    // 5. Static Policy & Information Pages
    const staticSlugs = ['about', 'contact', 'shipping-policy', 'warranty-policy', 'privacy-policy'];
    for (const s of staticSlugs) {
      addEntry({
        loc: `${baseUrl}/${s}`,
        priority: '0.6',
        changefreq: 'monthly',
      });
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entriesXml}</urlset>`;

    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.header('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(xml);
  } catch (err) {
    console.error('Sitemap generation error:', err);
    res.status(500).send('Error generating sitemap');
  }
});

/**
 * Dynamic robots.txt endpoint
 */
router.get('/robots.txt', (req, res) => {
  const baseUrl = resolveSiteUrl();
  const robots = `# ==========================================
# Robots.txt for CellFocus Pakistan
# Website: ${baseUrl}/
# ==========================================

User-agent: *
Allow: /
Allow: /category/
Allow: /product/
Allow: /wholesale
Allow: /about
Allow: /contact
Allow: /shipping-policy
Allow: /warranty-policy
Allow: /privacy-policy
Allow: /sitemap.xml

# Block internal admin, private APIs, and checkout flows
Disallow: /admin
Disallow: /cf-admin
Disallow: /?admin=*
Disallow: /?portal=*
Disallow: /?token=*
Disallow: /api/
Disallow: /checkout
Disallow: /cart

# Crawl-delay for polite indexing
Crawl-delay: 1

# XML Sitemaps
Sitemap: ${baseUrl}/sitemap.xml
`;

  res.header('Content-Type', 'text/plain; charset=utf-8');
  res.header('Cache-Control', 'public, max-age=86400');
  return res.status(200).send(robots);
});

/**
 * Google Search Console HTML Verification Route
 */
router.get('/google:code.html', (req, res, next) => {
  const code = req.params.code;
  if (/^[a-f0-9]+$/i.test(code)) {
    res.header('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`google-site-verification: google${code}.html\n`);
  }
  next();
});

/**
 * Server-Side HTML Delivery with Dynamic Meta & Schema Injection
 * Serves / , /category/:slug, /product/:slugWithId, /wholesale, and static pages
 */
async function handleSeoPage(req, res, next) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return next();
  }

  // Skip API routes, static assets, or uploads
  if (
    req.path.startsWith('/api') ||
    req.path.startsWith('/uploads') ||
    req.path.startsWith('/products') ||
    /\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|avif|json|woff|woff2|ttf|map)$/i.test(req.path)
  ) {
    return next();
  }

  // Admin route protection
  if (/^\/(cf-)?admin(\/|$)/i.test(req.path) || req.query.admin !== undefined) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  }

  try {
    const distHtmlPath = path.join(__dirname, '..', '..', 'client', 'dist', 'index.html');
    const devHtmlPath = path.join(__dirname, '..', '..', 'client', 'index.html');
    const templatePath = fs.existsSync(distHtmlPath) ? distHtmlPath : devHtmlPath;

    if (!fs.existsSync(templatePath)) {
      return next();
    }

    const htmlTemplate = fs.readFileSync(templatePath, 'utf8');
    const products = await repo.getAllProducts();
    const baseUrl = resolveSiteUrl();

    // Check if requesting a single product
    const prodMatch = req.path.match(/^\/product\/([a-z0-9_-]+)/i);
    if (prodMatch) {
      const slugWithId = prodMatch[1];
      const product = parseProductSlug(slugWithId, products);
      if (!product) {
        // Return a real 404 status with custom 404 HTML
        res.status(404);
        const notFoundSeo = {
          title: 'Product Not Found | CellFocus Pakistan',
          description: 'The requested mobile accessory could not be found. Explore our latest chargers, earpods, and smartwatches.',
          canonical: `${baseUrl}/`,
          ogImage: DEFAULT_IMAGE,
          ogType: 'website',
          schemas: [],
        };
        const rendered = injectSeoIntoHtml(htmlTemplate, notFoundSeo);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(rendered);
      }
    }

    const seoData = generatePageSeo(req.path, req.query, products, baseUrl);
    const renderedHtml = injectSeoIntoHtml(htmlTemplate, seoData);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=120, s-maxage=300');
    return res.status(200).send(renderedHtml);
  } catch (err) {
    console.error('SEO Page Rendering error:', err);
    next();
  }
}

// Attach SEO Page Renderer to relevant public routes
router.get('/', handleSeoPage);
router.get('/wholesale', handleSeoPage);
router.get('/category/:slug', handleSeoPage);
router.get('/product/:slugWithId', handleSeoPage);
router.get('/about', handleSeoPage);
router.get('/contact', handleSeoPage);
router.get('/shipping-policy', handleSeoPage);
router.get('/warranty-policy', handleSeoPage);
router.get('/privacy-policy', handleSeoPage);

router.handleSeoPage = handleSeoPage;
module.exports = router;
