import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// SVG with high aesthetic design matching KraftSchmiede automotive identity
const svgContentStandard = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#090d16" />
    </linearGradient>
    <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="50%" stop-color="#2563eb" />
      <stop offset="100%" stop-color="#1d4ed8" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#94a3b8" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#2563eb" flood-opacity="0.45"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" rx="104" fill="url(#bgGrad)"/>
  <rect width="504" height="504" x="4" y="4" rx="100" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="3"/>

  <!-- Subtle geometric workshop background accent -->
  <circle cx="256" cy="256" r="190" fill="none" stroke="#334155" stroke-width="2" stroke-dasharray="8 8" opacity="0.4"/>
  
  <!-- Outer Gear Teeth / Mechanic Ring Accent -->
  <circle cx="256" cy="256" r="160" fill="none" stroke="url(#primaryGrad)" stroke-width="4" opacity="0.8"/>
  <circle cx="256" cy="256" r="148" fill="none" stroke="#0ea5e9" stroke-width="1.5" opacity="0.3"/>

  <!-- Central Crest Shield -->
  <g filter="url(#glow)">
    <!-- Stylized "KS" Automotive Monogram -->
    <!-- K letter -->
    <path d="M 160 160 L 195 160 L 195 352 L 160 352 Z" fill="url(#metalGrad)" />
    <path d="M 195 240 L 255 160 L 298 160 L 225 252 L 305 352 L 260 352 L 195 268 Z" fill="url(#metalGrad)" />
    
    <!-- S letter / Precision curve with German engineering sharpness -->
    <path d="M 350 178 C 340 166 322 158 298 158 C 265 158 245 174 245 198 C 245 220 260 232 290 242 L 308 248 C 335 257 348 270 348 292 C 348 322 322 342 284 342 C 258 342 238 332 225 318 L 246 295 C 256 306 270 314 286 314 C 304 314 318 305 318 292 C 318 276 305 268 280 260 L 262 254 C 232 244 218 228 218 200 C 218 172 242 148 282 148 C 306 148 328 156 342 168 Z" fill="url(#primaryGrad)" />
  </g>

  <!-- Wrench badge accent -->
  <circle cx="256" cy="385" r="18" fill="url(#accentGrad)"/>
  <path d="M 250 380 L 262 380 L 262 390 L 250 390 Z" fill="#0f172a" opacity="0.8"/>
  <circle cx="256" cy="385" r="5" fill="#ffffff"/>

  <!-- Subtitle Text -->
  <text x="256" y="440" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="800" font-size="28" fill="#e2e8f0" text-anchor="middle" letter-spacing="6">KRAFTSCHMIEDE</text>
  <text x="256" y="470" font-family="system-ui, sans-serif" font-weight="600" font-size="14" fill="#38bdf8" text-anchor="middle" letter-spacing="4">AUTO WORKSHOP</text>
</svg>`;

// Maskable icon with 25% safe zone margin
const svgContentMaskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGradM" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#090d16" />
    </linearGradient>
    <linearGradient id="primaryGradM" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="50%" stop-color="#2563eb" />
      <stop offset="100%" stop-color="#1d4ed8" />
    </linearGradient>
    <linearGradient id="accentGradM" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <linearGradient id="metalGradM" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#94a3b8" />
    </linearGradient>
  </defs>

  <!-- Solid Full Bleed Background for Maskable Icon -->
  <rect width="512" height="512" fill="url(#bgGradM)"/>

  <!-- Scaled content to fit within 65% safe circle (radius 166 from center 256, 256) -->
  <g transform="translate(64, 64) scale(0.75)">
    <!-- Ring Accent -->
    <circle cx="256" cy="256" r="170" fill="none" stroke="url(#primaryGradM)" stroke-width="6" opacity="0.8"/>
    <circle cx="256" cy="256" r="150" fill="none" stroke="#0ea5e9" stroke-width="2" opacity="0.3"/>

    <!-- K letter -->
    <path d="M 160 160 L 195 160 L 195 352 L 160 352 Z" fill="url(#metalGradM)" />
    <path d="M 195 240 L 255 160 L 298 160 L 225 252 L 305 352 L 260 352 L 195 268 Z" fill="url(#metalGradM)" />
    
    <!-- S letter -->
    <path d="M 350 178 C 340 166 322 158 298 158 C 265 158 245 174 245 198 C 245 220 260 232 290 242 L 308 248 C 335 257 348 270 348 292 C 348 322 322 342 284 342 C 258 342 238 332 225 318 L 246 295 C 256 306 270 314 286 314 C 304 314 318 305 318 292 C 318 276 305 268 280 260 L 262 254 C 232 244 218 228 218 200 C 218 172 242 148 282 148 C 306 148 328 156 342 168 Z" fill="url(#primaryGradM)" />

    <!-- Accent badge -->
    <circle cx="256" cy="385" r="18" fill="url(#accentGradM)"/>
    <circle cx="256" cy="385" r="5" fill="#ffffff"/>

    <text x="256" y="440" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="800" font-size="28" fill="#e2e8f0" text-anchor="middle" letter-spacing="6">KRAFTSCHMIEDE</text>
  </g>
</svg>`;

async function buildIcons() {
  const svgBuf = Buffer.from(svgContentStandard);
  const svgMaskableBuf = Buffer.from(svgContentMaskable);

  // Write SVG files
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContentStandard);
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContentStandard);

  // Generate PNG 512
  await sharp(svgBuf)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  // Generate PNG 192
  await sharp(svgBuf)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  // Generate Apple Touch Icon 180x180
  await sharp(svgBuf)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // Generate Maskable 512
  await sharp(svgMaskableBuf)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  // Generate Maskable 192
  await sharp(svgMaskableBuf)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-192x192.png'));

  // Generate Favicon 64 & 32 PNG fallback
  await sharp(svgBuf)
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon-64.png'));

  console.log('Successfully generated all PWA icons in /public:');
  console.log('- icon.svg');
  console.log('- favicon.svg');
  console.log('- pwa-512x512.png');
  console.log('- pwa-192x192.png');
  console.log('- pwa-maskable-512x512.png');
  console.log('- pwa-maskable-192x192.png');
  console.log('- apple-touch-icon.png');
}

buildIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
