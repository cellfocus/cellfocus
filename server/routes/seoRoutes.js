const express = require('express');
const router = express.Router();
const repo = require('../storage');

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
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = process.env.SITE_URL || 'https://cellfocus.pk';
    const products = await repo.getAllProducts();
    const today = new Date().toISOString().split('T')[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  
  <!-- Primary Storefront -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="en-pk" href="${baseUrl}/" />
    <xhtml:link rel="alternate" hreflang="ur-pk" href="${baseUrl}/" />
    <image:image>
      <image:loc>${baseUrl}/hero-cellfocus-airpods-pro.jpg</image:loc>
      <image:title>CellFocus Original Wireless Earpods Pakistan</image:title>
    </image:image>
  </url>

  <!-- Categories -->
  <url>
    <loc>${baseUrl}/?category=chargers#products</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/?category=airpods#products</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/?category=handsfree#products</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/?category=smartwatches#products</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/?category=powerbanks#products</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- High-Intent Landing Sections -->
  <url>
    <loc>${baseUrl}/#bulk</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>${baseUrl}/#best-sellers</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>${baseUrl}/#why-us</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/#faq</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/#returns</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${baseUrl}/#contact</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.65</priority>
  </url>
`;

    // Append dynamic products
    if (Array.isArray(products)) {
      products.forEach((p) => {
        const pid = p.id || p._id;
        const slug = createSlug(p.name);
        const pUrl = `${baseUrl}/?product=${encodeURIComponent(slug)}&amp;id=${encodeURIComponent(pid)}`;
        const lastMod = p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : today;
        const imageUrl = p.image && p.image.startsWith('http') ? escapeXml(p.image) : `${baseUrl}/logo.png`;

        xml += `  <url>
    <loc>${pUrl}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <image:image>
      <image:loc>${imageUrl}</image:loc>
      <image:title>${escapeXml(p.name)} - CellFocus Pakistan Wholesale &amp; Retail</image:title>
      <image:caption>${escapeXml(p.description || p.name)}</image:caption>
    </image:image>
  </url>
`;
      });
    }

    xml += `</urlset>`;

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
  const baseUrl = process.env.SITE_URL || 'https://cellfocus.pk';
  const robots = `# ==========================================
# Robots.txt for CellFocus Pakistan
# Website: ${baseUrl}/
# ==========================================

User-agent: *
Allow: /
Allow: /#products
Allow: /#bulk
Allow: /#why-us
Allow: /#faq
Allow: /#about-us
Allow: /#returns
Allow: /#contact
Allow: /sitemap.xml

# Block internal admin, private APIs, and cart checkout payloads
Disallow: /admin
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

module.exports = router;

