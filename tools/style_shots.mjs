// Style-frame screenshots of the street (founder direction A, realistic). Also reports the bytes the street
// downloads, headless frame times (indicative only), and where the HDRI's sun sits.
// Usage: node tools/style_shots.mjs [outDir] [--phone]   (starts its own preview on port 4180)
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const phone = process.argv.includes('--phone');
const low = process.argv.includes('--low');
const out = process.argv.find((a) => !a.startsWith('--') && a !== process.argv[0] && a !== process.argv[1]) ?? 'REVIEW/screenshots/style';
mkdirSync(out, { recursive: true });
const server = spawn('npx', ['vite', 'preview', '--port', '4180', '--strictPort'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 2500));
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: phone ? { width: 390, height: 844 } : { width: 1280, height: 800 } });
let bytes = 0;
const files = new Map();
page.on('response', async (r) => {
  const u = r.url();
  if (!u.includes('/assets/polyhaven/')) return;
  const len = Number(r.headers()['content-length'] ?? 0);
  bytes += len;
  files.set(u.split('/assets/polyhaven/')[1], len);
});
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));
const t0 = Date.now();
await page.goto(`http://127.0.0.1:4180/?debug=1&test=1&perf=1${low ? '&quality=low' : '&quality=high'}`);
await page.waitForTimeout(800);
await page.evaluate(() => window.__hunt.ready());
const loadMs = Date.now() - t0;
await page.click('text=Begin');
await page.waitForTimeout(500);
await page.evaluate(() => { document.getElementById('debug').style.display = 'none'; document.getElementById('onboard').style.display = 'none'; });
// Where is the sun in the HDRI? (u across, v up; three maps u to atan2(dir.z, dir.x))
const sun = await page.evaluate(async () => {
  const t = await window.__hunt.assets().hdri('belfast_sunset_puresky_2k');
  const { width: w, height: h, data } = t.image;
  let best = 0, bi = 0;
  const half = data instanceof Uint16Array;
  const dec = (x) => { if (!half) return x; const s = (x & 0x8000) ? -1 : 1, e = (x >> 10) & 0x1f, f = x & 0x3ff; return e === 0 ? s * Math.pow(2, -14) * (f / 1024) : s * Math.pow(2, e - 15) * (1 + f / 1024); };
  for (let i = 0; i < w * h; i++) { const l = dec(data[i * 4]) + dec(data[i * 4 + 1]) + dec(data[i * 4 + 2]); if (l > best) { best = l; bi = i; } }
  return { u: (bi % w) / w, v: Math.floor(bi / w) / h, peak: best, w, h };
});
console.log('HDRI sun at u', sun.u.toFixed(3), 'v', sun.v.toFixed(3), 'peak', sun.peak.toFixed(1));
const shots = phone
  ? [[low ? 'phone_arrival_low' : 'phone_arrival_high', 'A', 0, 0, 1]]
  : [['1_arrival', 'A', 0, 0, 1], ['2_toward_harbor', 'C', 10, 4, 1], ['3_shop_front', 'B', 62, 6, 1], ['4_closeup_stall', 'A', -40, -8, 2.2]];
for (const [name, spot, yaw, pitch, zoom] of shots) {
  await page.evaluate((v) => window.__hunt.stand(v), spot);
  await page.evaluate(([y, p, z]) => window.__hunt.setView(y, p, z), [yaw, pitch, zoom]);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/${name}.png` });
  console.log('shot', name);
}
await page.waitForTimeout(2500);
const frames = await page.evaluate(() => window.__hunt.frames());
console.log('frames (headless swiftshader, indicative only):', JSON.stringify(frames));
console.log('downloaded from the asset pack:', (bytes / 1e6).toFixed(1), 'MB in', files.size, 'files; page ready after', loadMs, 'ms');
console.log([...files.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([f, n]) => `${(n / 1e6).toFixed(2)} MB ${f}`).join('\n'));
console.log('errors', errors.slice(0, 5));
await browser.close();
server.kill();
process.exit(0);
