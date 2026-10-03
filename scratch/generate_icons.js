// Script generating PWA icon assets in frontend/public/icons using Sharp.
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

async function generateIcons() {
  const dir = path.resolve('frontend/public/icons');
  await fs.mkdir(dir, { recursive: true });

  const svg = `
  <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="128" fill="#3F8F5F"/>
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="280" fill="#FFFFFF">S</text>
  </svg>`;

  const svgBuffer = Buffer.from(svg);

  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(dir, 'pwa-192x192.png'));
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(dir, 'pwa-512x512.png'));
  await sharp(svgBuffer).resize(180, 180).png().toFile(path.join(dir, 'apple-touch-icon.png'));
  await sharp(svgBuffer).resize(64, 64).toFile(path.resolve('frontend/public/favicon.ico'));

  console.log('PWA icons created successfully!');
}

generateIcons().catch(console.error);
