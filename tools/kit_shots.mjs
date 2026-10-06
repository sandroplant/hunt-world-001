// Screenshots of kit items for checking by eye (dev tool). Starts its own dev server on port 4190.
// Usage: node tools/kit_shots.mjs <out.png> "<name:WxHxD,name:WxHxD,...>" [--mode=shop|street] [--state=open]
//        [--yaw=25] [--pitch=12] [--size=1100x700]
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const args = process.argv.slice(2);
const flag = (k, d) => (args.find((a) => a.startsWith(`--${k}=`)) ?? `--${k}=${d}`).split('=')[1];
const [out, items] = args.filter((a) => !a.startsWith('--'));
if (!out || !items) {
  console.log('usage: node tools/kit_shots.mjs <out.png> "<name:WxHxD,...>" [--mode=shop] [--state=open] [--yaw=25] [--pitch=12]');
  process.exit(1);
}
mkdirSync(dirname(out), { recursive: true });
const [w, h] = flag('size', '1100x700').split('x').map(Number);
const server = await createServer({ server: { port: Number(process.env.KIT_PORT ?? 4190), strictPort: true, host: '127.0.0.1', hmr: false, watch: null }, logLevel: 'error' });
await server.listen();
const port = server.config.server.port;
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: w, height: h } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));
const qs = new URLSearchParams({ items, mode: flag('mode', 'street'), yaw: flag('yaw', '25'), pitch: flag('pitch', '12') });
const st = flag('state', '');
if (st) qs.set('state', st);
await page.goto(`http://127.0.0.1:${port}/tools/kit/preview.html?${qs}`);
await page.waitForFunction(() => window.__kitReady === true, null, { timeout: 120000 });
const err = await page.evaluate(() => window.__kitError);
await page.waitForTimeout(300);
await page.screenshot({ path: out });
console.log('wrote', out);
if (err) console.log('ERROR', err);
if (errors.length) console.log('console:', errors.slice(0, 8).join('\n'));
await browser.close();
await server.close();
process.exit(err ? 2 : 0);
