/**
 * Client-Side Automatic Image Compressor & Size Reducer
 * Converts heavy pictures (5MB-10MB) into lightweight WebP format (~30KB-60KB)
 * directly in the browser using HTML5 Canvas before uploading.
 */

export async function compressImageFile(file, options = {}) {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.8,
    mimeType = 'image/webp',
  } = options;

  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file (PNG, JPG, WebP, etc.)');
  }

  const originalSize = file.size;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read image file'));

    reader.onload = (e) => {
      const img = new Image();

      img.onerror = () => reject(new Error('Failed to load image into browser canvas'));

      img.onload = () => {
        let { width, height } = img;

        // Proportional resize preserving aspect ratio within max bounds
        if (width > maxWidth || height > maxHeight) {
          if (width / maxWidth > height / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) {
          return reject(new Error('Could not initialize canvas graphics context'));
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export as WebP with quality compression
        let targetMime = mimeType;
        let dataUrl = canvas.toDataURL(targetMime, quality);

        // Fallback to JPEG if older browser fails WebP export
        if (!dataUrl.startsWith('data:image/webp') && targetMime === 'image/webp') {
          targetMime = 'image/jpeg';
          dataUrl = canvas.toDataURL(targetMime, quality);
        }

        // Approximate size in bytes from base64 string
        const base64Content = dataUrl.split(',')[1] || '';
        const compressedSize = Math.round(base64Content.length * 0.75);
        const savingsPercent = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));

        resolve({
          dataUrl,
          width,
          height,
          originalSize,
          compressedSize,
          savingsPercent,
          format: targetMime,
          summary: `${(originalSize / 1024).toFixed(0)} KB → ${(compressedSize / 1024).toFixed(0)} KB (-${savingsPercent}%)`,
        });
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
}

