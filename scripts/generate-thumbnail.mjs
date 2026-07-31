import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = 'http://localhost:9000';
const OUT_DIR = path.resolve('public/promo');
const THUMB_W = 1920;
const THUMB_H = 1080;

async function captureScreenshots(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  const shots = [];

  for (const { name, url, waitMs = 1200 } of [
    { name: 'home', url: `${BASE_URL}/` },
    { name: 'consumidores', url: `${BASE_URL}/consumidores` },
  ]) {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(waitMs);
    const file = path.join(OUT_DIR, `screenshot-${name}.png`);
    await page.screenshot({ path: file, fullPage: false });
    shots.push({ name, file });
  }

  await context.close();
  return shots;
}

async function buildThumbnail(sourceShot, logoPath, outputName, title, subtitle) {
  const screenshot = sharp(sourceShot);
  const meta = await screenshot.metadata();

  const cropW = meta.width;
  const cropH = Math.round(meta.width * (THUMB_H / THUMB_W));
  const top = Math.max(0, Math.round((meta.height - cropH) * 0.04));

  const base = await screenshot
    .extract({ left: 0, top, width: cropW, height: Math.min(cropH, meta.height - top) })
    .resize(THUMB_W, THUMB_H, { fit: 'cover', position: 'top' })
    .png()
    .toBuffer();

  const logo = await sharp(logoPath)
    .resize(160, null, { fit: 'inside' })
    .png()
    .toBuffer();

  const logoMeta = await sharp(logo).metadata();

  const overlaySvg = `
    <svg width="${THUMB_W}" height="${THUMB_H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bottom" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#0b1220;stop-opacity:0" />
          <stop offset="45%" style="stop-color:#0b1220;stop-opacity:0.55" />
          <stop offset="100%" style="stop-color:#0b1220;stop-opacity:0.92" />
        </linearGradient>
        <linearGradient id="top" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#0b1220;stop-opacity:0.45" />
          <stop offset="100%" style="stop-color:#0b1220;stop-opacity:0" />
        </linearGradient>
      </defs>
      <rect width="100%" height="140" fill="url(#top)" />
      <rect y="${THUMB_H - 260}" width="100%" height="260" fill="url(#bottom)" />
      <text x="72" y="${THUMB_H - 150}" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="700">${title}</text>
      <text x="74" y="${THUMB_H - 95}" fill="#cbd5e1" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="500">${subtitle}</text>
      <rect x="72" y="${THUMB_H - 72}" width="110" height="40" rx="20" fill="rgba(37,99,235,0.9)" />
      <text x="127" y="${THUMB_H - 46}" text-anchor="middle" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="600">Excel</text>
      <rect x="198" y="${THUMB_H - 72}" width="110" height="40" rx="20" fill="rgba(37,99,235,0.9)" />
      <text x="253" y="${THUMB_H - 46}" text-anchor="middle" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="600">PDF</text>
      <rect x="324" y="${THUMB_H - 72}" width="130" height="40" rx="20" fill="rgba(37,99,235,0.9)" />
      <text x="389" y="${THUMB_H - 46}" text-anchor="middle" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="600">Mobile</text>
      <text x="${THUMB_W - 72}" y="${THUMB_H - 46}" text-anchor="end" fill="#94a3b8" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="500">CGB Engenharia</text>
    </svg>
  `;

  const output = path.join(OUT_DIR, outputName);

  await sharp(base)
    .composite([
      { input: Buffer.from(overlaySvg), top: 0, left: 0 },
      { input: logo, top: 48, left: THUMB_W - logoMeta.width - 72 },
    ])
    .png({ quality: 95 })
    .toFile(output);

  return output;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const shots = await captureScreenshots(browser);
    const logoPath = path.resolve('public/template/cgb-logo.png');
    const home = shots.find((s) => s.name === 'home')?.file;
    const consumidores = shots.find((s) => s.name === 'consumidores')?.file;

    const thumbs = [
      await buildThumbnail(
        home,
        logoPath,
        'cgb-formularios-thumbnail-real.png',
        'Formulários CGB',
        'Plataforma digital de formulários operacionais',
      ),
      await buildThumbnail(
        consumidores,
        logoPath,
        'cgb-formularios-thumbnail-consumidores.png',
        'Formulários CGB',
        'Consumidores ligados na obra',
      ),
    ];

    await sharp(home)
      .resize(THUMB_W, THUMB_H, { fit: 'cover', position: 'top' })
      .png()
      .toFile(path.join(OUT_DIR, 'cgb-formularios-thumbnail-clean.png'));

    console.log('Screenshots:', shots.map((s) => s.file).join(', '));
    console.log('Thumbnails:', thumbs.join(', '));
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
