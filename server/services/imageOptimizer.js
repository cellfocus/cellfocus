const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Target directory for optimized product image assets
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'client', 'public', 'uploads');

// Ensure directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Checks if a string is a base64 image data URI.
 */
function isBase64Image(str) {
  if (typeof str !== 'string') return false;
  return str.startsWith('data:image/');
}

/**
 * Automatically optimizes and saves a base64 image to a lightweight WebP file on disk.
 * Resizes to max 800x800, auto-orients, and compresses to WebP (~30-60KB).
 *
 * @param {string} base64DataUri - The data:image/...;base64 string
 * @param {string} namePrefix - Filename prefix (e.g. product id or category)
 * @returns {Promise<string>} The public relative URL (e.g. '/uploads/prod-1-123.webp')
 */
async function optimizeAndSaveBase64(base64DataUri, namePrefix = 'item') {
  if (!isBase64Image(base64DataUri)) {
    return base64DataUri;
  }

  try {
    const matches = base64DataUri.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!matches || !matches[2]) {
      return base64DataUri;
    }

    const buffer = Buffer.from(matches[2], 'base64');
    const cleanPrefix = String(namePrefix)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .slice(0, 30);
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const filename = `${cleanPrefix}-${uniqueSuffix}.webp`;
    const targetPath = path.join(UPLOADS_DIR, filename);

    // Optimize with sharp
    await sharp(buffer)
      .rotate() // auto-orient camera rotation
      .resize({
        width: 800,
        height: 800,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 80, effort: 4 })
      .toFile(targetPath);

    return `/uploads/${filename}`;
  } catch (err) {
    console.error('[ImageOptimizer] Failed to optimize base64 image:', err.message);
    return base64DataUri; // fallback to original if sharp fails
  }
}

/**
 * Automatically processes all image fields of a product object (image, image2, image3, image4, images, colors)
 * and replaces any base64 data URIs with optimized static WebP files.
 *
 * @param {Object} product - Product data object
 * @returns {Promise<Object>} Updated product object with lightweight file URLs
 */
async function processProductImages(product) {
  if (!product || typeof product !== 'object') return product;

  const clone = { ...product };
  const pid = clone.id || clone._id || 'prod';

  // 1. Primary and secondary image slots
  if (isBase64Image(clone.image)) {
    clone.image = await optimizeAndSaveBase64(clone.image, `${pid}-1`);
  }
  if (isBase64Image(clone.image2)) {
    clone.image2 = await optimizeAndSaveBase64(clone.image2, `${pid}-2`);
  }
  if (isBase64Image(clone.image3)) {
    clone.image3 = await optimizeAndSaveBase64(clone.image3, `${pid}-3`);
  }
  if (isBase64Image(clone.image4)) {
    clone.image4 = await optimizeAndSaveBase64(clone.image4, `${pid}-4`);
  }

  // 2. images array
  if (Array.isArray(clone.images) && clone.images.length > 0) {
    const updatedImages = [];
    for (let i = 0; i < clone.images.length; i++) {
      const img = clone.images[i];
      if (isBase64Image(img)) {
        updatedImages.push(await optimizeAndSaveBase64(img, `${pid}-arr-${i + 1}`));
      } else {
        updatedImages.push(img);
      }
    }
    clone.images = updatedImages;
  } else {
    clone.images = [clone.image, clone.image2, clone.image3, clone.image4].filter(Boolean);
  }

  // 3. colors array
  if (Array.isArray(clone.colors) && clone.colors.length > 0) {
    const updatedColors = [];
    for (let i = 0; i < clone.colors.length; i++) {
      const col = clone.colors[i];
      if (col && typeof col === 'object') {
        const colClone = { ...col };
        if (isBase64Image(colClone.image)) {
          const cName = colClone.name ? colClone.name.toLowerCase().replace(/[^a-z0-9]/g, '') : `c${i}`;
          colClone.image = await optimizeAndSaveBase64(colClone.image, `${pid}-col-${cName}`);
        }
        updatedColors.push(colClone);
      } else {
        updatedColors.push(col);
      }
    }
    clone.colors = updatedColors;
  }

  return clone;
}

module.exports = {
  optimizeAndSaveBase64,
  processProductImages,
  isBase64Image,
  UPLOADS_DIR,
};

