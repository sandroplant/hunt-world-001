// What a player downloads for the playtest build (the street and the shop): every response body, summed, after the
// page has gone quiet. Serves dist-playtest on port 4196 (run `npm run build:playtest` first).
// Usage: node tools/download_size.mjs
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

const server = spawn('npx', ['vite', 'preview', '--outDir', 'dist-playtest', '--port', '4196', '--strictPort'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 2500));
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 960, height: 600 } });
const files = new Map();
let last = Date.now();
page.on('response', async (r) => {
  last = Date.now();
  try {
    const body = await r.body();
    files.set(r.url().replace('http://127.0.0.1:4196/', ''), body.length);
  } catch {
    /* redirects have no body */
  }
});
await page.goto('http://127.0.0.1:4196/?quality=high');
await page.getByRole('button', { name: 'Begin' }).waitFor({ state: 'visible', timeout: 120000 });
await page.waitForFunction(() => !(document.getElementById('begin')?.hasAttribute('disabled')), null, { timeout: 180000 });
// The shop loads behind the street (its live picture shows in the door); wait until nothing new arrives for 8 s.
while (Date.now() - last < 8000) await page.waitForTimeout(1000);
const total = [...files.values()].reduce((a, b) => a + b, 0);
const assets = [...files.entries()].filter(([u]) => u.includes('assets/polyhaven/')).reduce((a, [, n]) => a + n, 0);
console.log(`playtest download: ${(total / 1e6).toFixed(2)} MB in ${files.size} files (asset pack ${(assets / 1e6).toFixed(2)} MB, code and page ${((total - assets) / 1e6).toFixed(2)} MB)`);
console.log([...files.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([f, n]) => `${(n / 1e6).toFixed(2)} MB ${f}`).join('\n'));
console.log('shop models requested:', [...files.keys()].filter((u) => /vintage|bookshelf|display|tea_set|mantel|WoodenTable/.test(u) && u.endsWith('.gltf')).length);
await browser.close();
server.kill();
process.exit(0);
