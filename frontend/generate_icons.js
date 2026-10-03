import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

async function generateIcons() {
  const dir = path.resolve('public/icons');
  await fs.mkdir(dir, { recursive: true });

  // 1. Standard rounded icon SVG with centered vector 'S' path
  const standardSvg = `
  <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="128" fill="#3F8F5F"/>
    <path d="M 335 190 C 335 150, 300 128, 256 128 C 212 128, 178 152, 178 192 C 178 268, 334 252, 334 328 C 334 372, 298 396, 256 396 C 206 396, 170 368, 166 324 L 218 318 C 222 344, 238 354, 256 354 C 276 354, 284 342, 284 328 C 284 262, 128 274, 128 192 C 128 138, 178 84, 256 84 C 326 84, 381 128, 383 190 Z" fill="#FFFFFF"/>
  </svg>`;

  // 2. Maskable PWA icon (with 15% inner safe zone padding for Android circular/squircle launchers)
  const maskableSvg = `
  <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" fill="#3F8F5F"/>
    <g transform="translate(51.2, 51.2) scale(0.8)">
      <path d="M 335 190 C 335 150, 300 128, 256 128 C 212 128, 178 152, 178 192 C 178 268, 334 252, 334 328 C 334 372, 298 396, 256 396 C 206 396, 170 368, 166 324 L 218 318 C 222 344, 238 354, 256 354 C 276 354, 284 342, 284 328 C 284 262, 128 274, 128 192 C 128 138, 178 84, 256 84 C 326 84, 381 128, 383 190 Z" fill="#FFFFFF"/>
    </g>
  </svg>`;

  const standardBuffer = Buffer.from(standardSvg);
  const maskableBuffer = Buffer.from(maskableSvg);

  await sharp(standardBuffer).resize(192, 192).png().toFile(path.join(dir, 'pwa-192x192.png'));
  await sharp(standardBuffer).resize(512, 512).png().toFile(path.join(dir, 'pwa-512x512.png'));
  await sharp(maskableBuffer).resize(512, 512).png().toFile(path.join(dir, 'pwa-maskable-512x512.png'));
  await sharp(standardBuffer).resize(180, 180).png().toFile(path.join(dir, 'apple-touch-icon.png'));
  await sharp(standardBuffer).resize(64, 64).toFile(path.resolve('public/favicon.ico'));

  console.log('✅ Perfectly centered vector PWA icons generated successfully!');
}

generateIcons().catch(console.error);
