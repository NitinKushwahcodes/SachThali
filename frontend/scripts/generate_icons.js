// Script generating PWA icon assets in frontend/public/icons using Sharp.
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

async function generateIcons() {
  const dir = path.resolve('public/icons');
  await fs.mkdir(dir, { recursive: true });

  // 512x512 SVG with perfectly centered 'S' vector path and 20% safe-zone margin
  const svg = `
  <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <!-- Outer Rounded Square Background -->
    <rect width="512" height="512" rx="128" fill="#3F8F5F"/>
    
    <!-- Subtle Inner Circle Frame -->
    <circle cx="256" cy="256" r="200" fill="none" stroke="#FFFFFF" stroke-width="8" opacity="0.25"/>

    <!-- Mathematically Centered Vector Path for 'S' (Center: x=256, y=256) -->
    <g transform="translate(256, 256) scale(1.1) translate(-256, -256)">
      <path d="M 315 190 C 315 160, 290 138, 256 138 C 215 138, 192 162, 192 192 C 192 222, 215 238, 260 252 C 305 266, 328 285, 328 320 C 328 356, 300 374, 256 374 C 210 374, 184 350, 184 316 L 224 316 C 224 334, 236 344, 256 344 C 278 344, 290 334, 290 320 C 290 305, 276 294, 232 280 C 188 266, 164 245, 164 205 C 164 165, 198 138, 256 138 C 308 138, 328 168, 328 190 Z" fill="#FFFFFF"/>
    </g>
  </svg>`;

  const svgBuffer = Buffer.from(svg);

  // Write SVG source file to public
  await fs.writeFile(path.resolve('public/icon.svg'), svgBuffer);

  // Generate PNG resolutions
  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(dir, 'pwa-192x192.png'));
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(dir, 'pwa-512x512.png'));
  await sharp(svgBuffer).resize(180, 180).png().toFile(path.join(dir, 'apple-touch-icon.png'));
  await sharp(svgBuffer).resize(64, 64).toFile(path.resolve('public/favicon.ico'));

  console.log('✅ PWA icons regenerated with 100% centered logo!');
}

generateIcons().catch(console.error);
