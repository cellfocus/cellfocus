const express = require('express');
const router = express.Router();
const repo = require('../storage');

function resolveSiteUrl() {
  const raw =
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.BASE_URL ||
    process.env.DOMAIN ||
    'https://www.cellfocusaccessories.com';
  let clean = String(raw).trim().replace(/\/+$/, '');
  // Canonicalize old domain or non-www variant to primary production domain
  if (
    clean.includes('cellfocus.pk') ||
    clean === 'https://cellfocusaccessories.com' ||
    clean === 'http://cellfocusaccessories.com'
  ) {
    clean = 'https://www.cellfocusaccessories.com';
  }
  return clean;
}

// Helper to remove any URL hash fragment (RFC/Google Sitemaps reject fragments)
function stripHash(url) {
  if (!url) return '';
  return String(url).split('#')[0];
}

// Helper to escape XML characters
function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Helper to create an SEO-friendly slug
function createSlug(name) {
  if (!name) return 'product';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Dynamic XML Sitemap endpoint
 * Returns a complete, valid XML sitemap including static routes, categories, and dynamic products.
 * Guarantees all <loc> entries use the canonical domain and contain NO hash fragments.
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = resolveSiteUrl();
    const products = await repo.getAllProducts();
    const today = new Date().toISOString().split('T')[0];

    const seenLocs = new Set();
    let entriesXml = '';

    const addEntry = ({ loc, lastmod = today, changefreq = 'daily', priority = '0.8', images = [], alternates = [] }) => {
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

    // 1. Primary Storefront Homepage
    addEntry({
      loc: `${baseUrl}/`,
      priority: '1.0',
      changefreq: 'daily',
      alternates: [
        { hreflang: 'en-pk', href: `${baseUrl}/` },
        { hreflang: 'ur-pk', href: `${baseUrl}/` },
        { hreflang: 'x-default', href: `${baseUrl}/` },
      ],
      images: [
        {
          loc: `${baseUrl}/hero-cellfocus-airpods-pro.jpg`,
          title: 'CellFocus Original Wireless Earpods Pakistan',
          caption: 'Wholesale and retail wireless earpods with active noise cancellation in Pakistan.',
        },
        {
          loc: `${baseUrl}/hero-cellfocus-cyber-charger.jpg`,
          title: 'CellFocus Cyber Fast Charger 65W GaN Pakistan',
          caption: 'High-speed GaN fast charger with dual type-c power delivery.',
        },
        {
          loc: `${baseUrl}/hero-cellfocus-gan-charger.jpg`,
          title: 'CellFocus Ultra Fast Power Adapter Pakistan',
          caption: 'Sasta fast charger price in Pakistan with 24h nationwide dispatch.',
        },
      ],
    });

    // 2. High-Intent Category Views (clean query params with NO # hash fragment)
    const categoryConfigs = [
      {
        slug: 'chargers',
        title: 'Wholesale Fast Chargers Price in Pakistan | CellFocus',
        img: `${baseUrl}/hero-cellfocus-cyber-charger.jpg`,
      },
      {
        slug: 'airpods',
        title: 'Original Earpods Wholesale Price Lahore Karachi | CellFocus',
        img: `${baseUrl}/hero-cellfocus-airpods-pro.jpg`,
      },
      {
        slug: 'handsfree',
        title: 'Handsfree Wholesale Rate in Pakistan | CellFocus',
        img: `${baseUrl}/cellfocus-airpods.png`,
      },
      {
        slug: 'smartwatches',
        title: 'Best Smart Watch Pakistan Mein | CellFocus Smartwatches',
        img: `${baseUrl}/hero-cellfocus-pro.jpg`,
      },
      {
        slug: 'powerbanks',
        title: 'Fast Charging Power Banks Wholesale Pakistan | CellFocus',
        img: `${baseUrl}/hero-cellfocus-gan-charger.jpg`,
      },
    ];

    for (const cat of categoryConfigs) {
      addEntry({
        loc: `${baseUrl}/?category=${cat.slug}`,
        priority: '0.9',
        changefreq: 'daily',
        images: [{ loc: cat.img, title: cat.title }],
      });
    }

    // 3. Dynamic Products from Database
    if (Array.isArray(products)) {
      products.forEach((p) => {
        const pid = p.id || p._id;
        if (!pid) return;
        const slug = createSlug(p.name);
        const pUrl = `${baseUrl}/?product=${encodeURIComponent(slug)}&id=${encodeURIComponent(pid)}`;
        const lastMod = p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : today;
        const imageUrl = p.image && p.image.startsWith('http') ? p.image : `${baseUrl}/logo.png`;

        addEntry({
          loc: pUrl,
          lastmod: lastMod,
          changefreq: 'weekly',
          priority: '0.8',
          images: [
            {
              loc: imageUrl,
              title: `${p.name} - CellFocus Pakistan Wholesale & Retail`,
              caption: p.description || p.name,
            },
          ],
        });
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
Allow: /sitemap.xml

# Block internal admin, private APIs, and cart checkout payloads
Disallow: /admin
Disallow: /cf-admin
Disallow: /?admin=*
Disallow: /?portal=*
Disallow: /?token=*
Disallow: /api/admin/
Disallow: /api/upload/
Disallow: /api/orders/track

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
 * Handles /googlefea0ecee8dade37b.html (and any standard Google verification file)
 */
router.get('/google:code.html', (req, res, next) => {
  const code = req.params.code;
  if (/^[a-f0-9]+$/i.test(code)) {
    res.header('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`google-site-verification: google${code}.html\n`);
  }
  next();
});

module.exports = router;

