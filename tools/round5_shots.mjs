// Round-5 look check (dev tool): screenshots of the street and the shop from named spots, through the debug hooks
// on a dev server (port 4195). Not evidence of play; the real-click playtest tests are.
// Usage: node tools/round5_shots.mjs <outDir> '<json list of [name, place, spot, yaw, pitch, zoom, extra?]>' [--phone] [--low]
//   extra: "open" = take the key and open the blue drawer first (shop only).
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { mkdirSync } from 'node:fs';

const args = process.argv.slice(2);
const phone = args.includes('--phone');
const low = args.includes('--low');
const [out, listJson] = args.filter((a) => !a.startsWith('--'));
const shots = JSON.parse(listJson ?? '[["street_arrival","street","A",0,0,1],["shop_from_door","shop","A",0,-6,1],["blue_drawer","shop","B",-90,-32,1]]');
mkdirSync(out, { recursive: true });
const server = await createServer({ server: { port: 4195, strictPort: true, host: '127.0.0.1', hmr: false, watch: null }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: phone ? { width: 390, height: 844 } : { width: 1280, height: 800 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`http://127.0.0.1:4195/?debug=1&test=1&scope=playtest&quality=${low ? 'low' : 'high'}`);
await page.waitForFunction(() => !!window.__hunt, null, { timeout: 60000 });
await page.evaluate(() => window.__hunt.ready());
await page.evaluate(() => document.getElementById('begin').click());
await page.evaluate(() => { const d = document.getElementById('debug'); if (d) d.style.display = 'none'; });
let place = 'street';
for (const [name, where, spot, yaw, pitch, zoom, extra] of shots) {
  if (where !== place) {
    await page.evaluate((p) => window.__hunt.jump(p), where);
    await page.evaluate(() => window.__hunt.ready());
    place = where;
  }
  if (extra === 'open') {
    await page.evaluate(() => { window.__hunt.nextStep(); window.__hunt.nextStep(); });
  }
  await page.evaluate((v) => window.__hunt.stand(v), spot);
  await page.evaluate(([y, p, z]) => window.__hunt.setView(y, p, z), [yaw, pitch, zoom]);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/${name}.png` });
  console.log('shot', name);
}
console.log('errors/warnings:', errors.filter((e) => !e.includes('GPU stall')).slice(0, 10).join('\n'));
await browser.close();
await server.close();
process.exit(0);
