import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

async function generateIcons() {
  const dir = path.resolve('public/icons');
  await fs.mkdir(dir, { recursive: true });

  // Clean, ultra-bold, modern sans-serif capital 'S' vector path
  // Perfectly centered on 512x512 canvas (bounds: X [158, 350], Y [118, 386])
  const cleanBoldSPath = `M 346 195 L 294 195 C 294 175, 280 162, 256 162 C 232 162, 218 174, 218 190 C 218 206, 230 216, 268 226 C 316 238, 350 256, 350 306 C 350 358, 308 386, 256 386 C 198 386, 160 354, 158 305 L 210 305 C 212 328, 230 342, 256 342 C 282 342, 296 328, 296 310 C 296 292, 282 282, 244 272 C 198 260, 164 242, 164 192 C 164 142, 206 118, 256 118 C 310 118, 344 148, 346 195 Z`;

  // 1. Standard rounded PWA icon SVG (rx=112 for modern app squircle)
  const standardSvg = `
  <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="112" fill="#3F8F5F"/>
    <path d="${cleanBoldSPath}" fill="#FFFFFF"/>
  </svg>`;

  // 2. Maskable PWA icon (with 15% inner safe zone padding for Android launcher circular/squircle crops)
  const maskableSvg = `
  <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" fill="#3F8F5F"/>
    <g transform="translate(51.2, 51.2) scale(0.8)">
      <path d="${cleanBoldSPath}" fill="#FFFFFF"/>
    </g>
  </svg>`;

  const standardBuffer = Buffer.from(standardSvg);
  const maskableBuffer = Buffer.from(maskableSvg);

  await sharp(standardBuffer).resize(192, 192).png().toFile(path.join(dir, 'pwa-192x192.png'));
  await sharp(standardBuffer).resize(512, 512).png().toFile(path.join(dir, 'pwa-512x512.png'));
  await sharp(maskableBuffer).resize(512, 512).png().toFile(path.join(dir, 'pwa-maskable-512x512.png'));
  await sharp(standardBuffer).resize(180, 180).png().toFile(path.join(dir, 'apple-touch-icon.png'));
  await sharp(standardBuffer).resize(64, 64).toFile(path.resolve('public/favicon.ico'));

  console.log('✅ Clean, bold sans-serif vector PWA icons generated successfully!');
}

generateIcons().catch(console.error);
