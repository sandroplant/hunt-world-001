// Takes one screenshot per place (and the sketchbook) from a dev build with ?debug=1&test=1.
// Usage: node tools/screenshots.mjs [outDir]   (expects `npm run preview` on port 4173, or starts it)
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
const answers = JSON.parse(readFileSync('src/world/answers.json', 'utf8'));
const S = (id) => { const a = answers.sketches[id]; return [a.place, a.viewpoint, a.yaw, a.pitch, a.zoom]; };

const out = process.argv[2] ?? 'REVIEW/screenshots/graybox';
mkdirSync(out, { recursive: true });
const server = spawn('npx', ['vite', 'preview', '--port', '4178', '--strictPort'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 2500));
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://127.0.0.1:4178/?debug=1&test=1');
await page.waitForTimeout(1500);
await page.click('text=Begin');
await page.waitForTimeout(500);
await page.evaluate(() => { document.getElementById('debug').style.display = 'none'; });
const shots = [
  ['street', 'A', 0, 0, 1], S('S1'), ['street', 'B', 0, 0, 1],
  S('S2'), ['shop', 'B', 0, 0, 1],
  ['drawer', 'A', 0, -5, 1], S('S3'),
  ['cat', 'A', 5, 30, 1], S('S4'),
  ['eye', 'A', 0, 20, 1], S('S5'), ['eye', 'B', 0, 0, 1],
  ['moon', 'A', 0, 0, 1], S('S6'),
  ['street_night', 'A', 0, 0, 1], ['street_night', 'A', -15, 40, 1.5],
];
let last = '';
for (const [place, vp, yaw, pitch, zoom] of shots) {
  if (place !== last) { await page.evaluate((p) => window.__hunt.jump(p), place); await page.waitForTimeout(400); last = place; }
  if (place === 'street_night') await page.evaluate(() => document.getElementById('end').classList.remove('show'));
  await page.evaluate((v) => window.__hunt.stand(v), vp);
  await page.waitForTimeout(1000);
  await page.evaluate(([y, p, z]) => window.__hunt.setView(y, p, z), [yaw, pitch, zoom]);
  await page.waitForTimeout(300);
  const name = `${place}_${vp}_yaw${yaw}_pitch${pitch}_zoom${zoom}.png`;
  await page.screenshot({ path: `${out}/${name}` });
  console.log('shot', name);
}
await page.evaluate(() => window.__hunt.jump('street'));
await page.waitForTimeout(400);
await page.keyboard.press('b');
await page.waitForTimeout(400);
await page.screenshot({ path: `${out}/sketchbook_street.png` });
console.log('errors', errors);
await browser.close();
server.kill();
process.exit(0);
