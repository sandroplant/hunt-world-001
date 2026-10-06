// Writes 512 px siblings (*_512.jpg) of every *_1k.jpg in the Poly Haven pack, and for every model a
// <name>_512.gltf whose images point at them (the .bin stays shared). Originals are never touched.
// Resizing runs in Playwright's Chromium (no image library in the container): 2D canvas, smoothing 'high',
// JPEG quality 0.88. Normal, ARM, roughness and opacity maps are linear data, so they are decoded with
// colorSpaceConversion 'none' (an embedded ICC profile is ignored, as WebGL does for NoColorSpace textures);
// colour maps (diffuse, emission) get the browser's default conversion to sRGB, as WebGL does for them.
// Idempotent: a 512 file newer than its source is skipped. Usage: node tools/resize_assets.mjs [--force]
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets', 'polyhaven');
const SIZE = 512;
const QUALITY = 0.88;
const force = process.argv.includes('--force');

const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
const sources = [...walk(join(ROOT, 'textures')), ...walk(join(ROOT, 'models'))].filter((f) => f.endsWith('_1k.jpg')).sort();
const isColour = (f) => /_(diff|emission)_1k\.jpg$/.test(f);
const rel = (f) => f.slice(ROOT.length + 1);

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? '/opt/pw-browsers/chromium' });
const page = await browser.newPage();
await page.setContent('<!doctype html><title>resize</title>');

let before = 0;
let after = 0;
let written = 0;
let normalCheck = null;
for (const src of sources) {
  const dst = src.replace(/_1k\.jpg$/, `_${SIZE}.jpg`);
  before += statSync(src).size;
  const isNormalProbe = rel(src) === 'textures/cobblestone_floor_08/cobblestone_floor_08_nor_gl_1k.jpg';
  const upToDate = !force && existsSync(dst) && statSync(dst).mtimeMs >= statSync(src).mtimeMs;
  if (upToDate && !isNormalProbe) {
    after += statSync(dst).size;
    continue;
  }
  const res = await page.evaluate(
    async ({ b64, size, quality, colour }) => {
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      let img = await createImageBitmap(new Blob([bytes], { type: 'image/jpeg' }), { colorSpaceConversion: colour ? 'default' : 'none', premultiplyAlpha: 'none' });
      const draw = (source, w, h) => {
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d', { colorSpace: 'srgb', willReadFrequently: true });
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(source, 0, 0, w, h);
        return c;
      };
      const mean = (c) => {
        const d = c.getContext('2d', { colorSpace: 'srgb' }).getImageData(0, 0, c.width, c.height, { colorSpace: 'srgb' }).data;
        const s = [0, 0, 0];
        for (let i = 0; i < d.length; i += 4) for (let k = 0; k < 3; k++) s[k] += d[i + k];
        return s.map((v) => v / (d.length / 4));
      };
      const srcMean = mean(draw(img, img.width, img.height));
      // Halve until within 2x of the target, then a last draw to the exact size.
      let w = img.width;
      let h = img.height;
      let cur = img;
      while (w / 2 > size || h / 2 > size) {
        w = Math.max(size, Math.round(w / 2));
        h = Math.max(size, Math.round(h / 2));
        cur = draw(cur, w, h);
      }
      const out = draw(cur, Math.min(size, img.width), Math.min(size, img.height));
      const url = out.toDataURL('image/jpeg', quality);
      const enc = new Image();
      enc.src = url;
      await enc.decode();
      const encBmp = await createImageBitmap(enc, { colorSpaceConversion: 'none' });
      img.close();
      return { b64: url.slice(url.indexOf(',') + 1), srcMean, outMean: mean(draw(encBmp, encBmp.width, encBmp.height)), w: out.width, h: out.height };
    },
    { b64: readFileSync(src).toString('base64'), size: SIZE, quality: QUALITY, colour: isColour(src) },
  );
  if (isNormalProbe) normalCheck = res;
  if (upToDate) {
    after += statSync(dst).size;
    continue;
  }
  const buf = Buffer.from(res.b64, 'base64');
  writeFileSync(dst, buf);
  after += buf.length;
  written++;
  const drift = Math.max(...res.srcMean.map((v, k) => Math.abs(v - res.outMean[k])));
  if (drift > 2) console.warn(`mean colour moved by ${drift.toFixed(2)} in ${rel(dst)}`);
}
await browser.close();

// glTF siblings: same file, image URIs pointing at the 512 jpgs. The .bin is referenced unchanged.
let gltfs = 0;
for (const name of readdirSync(join(ROOT, 'models')).sort()) {
  const src = join(ROOT, 'models', name, `${name}_1k.gltf`);
  if (!existsSync(src)) continue;
  const g = JSON.parse(readFileSync(src, 'utf8'));
  for (const im of g.images ?? []) {
    const uri = im.uri.replace(/_1k\.jpg$/, `_${SIZE}.jpg`);
    if (uri === im.uri) throw new Error(`${basename(src)}: unexpected image uri ${im.uri}`);
    if (!existsSync(join(dirname(src), uri))) throw new Error(`${basename(src)}: missing ${uri}`);
    im.uri = uri;
  }
  writeFileSync(join(dirname(src), `${name}_${SIZE}.gltf`), JSON.stringify(g, null, 2) + '\n');
  gltfs++;
}

console.log(`${sources.length} jpgs (${written} written now), ${gltfs} gltf files`);
console.log(`jpg bytes: 1k ${before} (${(before / 1e6).toFixed(1)} MB) -> ${SIZE} ${after} (${(after / 1e6).toFixed(1)} MB)`);
if (normalCheck) {
  const f = (m) => m.map((v) => v.toFixed(1)).join(', ');
  console.log(`normal-map check (cobblestone_floor_08 nor_gl): mean RGB 1k (${f(normalCheck.srcMean)}) -> ${SIZE} (${f(normalCheck.outMean)})`);
}
