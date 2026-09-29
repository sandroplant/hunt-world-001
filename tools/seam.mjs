// Seam check for the dive (founder change 6): freeze a dive just before and just after the hand-over,
// screenshot both, and measure how different the two frames are. Prints a per-dive score.
// Usage: node tools/seam.mjs [outDir]   (starts its own preview on port 4179)
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { PNG } from './_png.mjs';

const out = process.argv[2] ?? 'REVIEW/screenshots/seam';
mkdirSync(out, { recursive: true });
const answers = JSON.parse(readFileSync('src/world/answers.json', 'utf8'));
const objects = JSON.parse(readFileSync('src/world/objects.json', 'utf8')).objects;
const server = spawn('npx', ['vite', 'preview', '--port', '4179', '--strictPort'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 2500));
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('http://127.0.0.1:4179/?debug=1&test=1');
await page.waitForTimeout(1500);
await page.click('text=Begin');
await page.waitForTimeout(400);
await page.evaluate(() => { document.getElementById('debug').style.display = 'none'; document.getElementById('ui').style.display = 'none'; });

function diff(a, b) {
  const pa = PNG.decode(a), pb = PNG.decode(b);
  let sum = 0; let n = 0;
  for (let i = 0; i < pa.data.length; i += 4) {
    sum += Math.abs(pa.data[i] - pb.data[i]) + Math.abs(pa.data[i + 1] - pb.data[i + 1]) + Math.abs(pa.data[i + 2] - pb.data[i + 2]);
    n += 3;
  }
  return sum / n; // mean absolute difference per channel, 0..255
}

const order = answers.order;
const results = [];
for (let i = 0; i < order.length - 1; i++) {
  const place = order[i];
  await page.evaluate((p) => window.__hunt.jump(p), place);
  await page.waitForTimeout(300);
  const steps = answers.requiredSteps[place];
  for (let k = 0; k < steps.length; k++) await page.evaluate(() => window.__hunt.nextStep());
  const target = answers.diveTargets[place];
  const obj = objects.find((o) => o.id === target.object);
  await page.evaluate((v) => window.__hunt.stand(v), obj.at[0]);
  await page.waitForTimeout(2600);
  await page.evaluate(([y, p]) => window.__hunt.setView(y, p, 1), [obj.at[1], obj.at[2]]);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/${place}_0_before.png` });
  await page.evaluate(() => window.__hunt.enter());
  await page.waitForFunction(() => window.__hunt.diving());
  const shots = {};
  for (const t of [0.25, 0.4999, 0.5001, 0.75]) {
    await page.evaluate((tt) => window.__hunt.freezeDive(tt), t);
    await page.waitForTimeout(250);
    const buf = await page.screenshot({ path: `${out}/${place}_t${t}.png` });
    shots[t] = buf;
  }
  await page.evaluate(() => window.__hunt.freezeDive(null));
  await page.waitForFunction(() => !window.__hunt.diving(), null, { timeout: 8000 });
  const seam = diff(shots[0.4999], shots[0.5001]);
  const motion = diff(shots[0.25], shots[0.4999]);
  results.push({ place, to: target.to, seam: seam.toFixed(2), motion: motion.toFixed(2) });
  console.log(`dive ${place} → ${target.to}: seam ${seam.toFixed(2)} (frame-to-frame motion for reference: ${motion.toFixed(2)})`);
}
console.log(JSON.stringify(results));
await browser.close();
server.kill();
process.exit(0);
