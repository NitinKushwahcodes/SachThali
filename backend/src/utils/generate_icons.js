// Helper utility to generate PWA icons inside frontend/public/icons directory.
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generates 192x192, 512x512, apple touch, and favicon icon assets.
export async function generateIcons() {
  const dir = path.resolve(__dirname, '../../../frontend/public/icons');
  const favDir = path.resolve(__dirname, '../../../frontend/public');
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
  await sharp(svgBuffer).resize(64, 64).toFile(path.join(favDir, 'favicon.ico'));

  console.log('PWA icons generated successfully in frontend/public!');
}

generateIcons().catch(console.error);
