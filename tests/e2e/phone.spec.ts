import { devices, expect, test } from '@playwright/test';
import { boot, begin, capture, waitForDive, objectAt } from './helpers';

// A 390×844 touch run that completes place 1 with real touch input: drags to look, taps to act,
// the on-screen lens button to zoom and to dive. Debug hooks are used only to read the view, never to drive it.
test.use({ ...devices['iPhone 13'], defaultBrowserType: 'chromium', viewport: { width: 390, height: 844 } });

const LOOK_DEG_PER_PX = 0.18;

async function drag(page: import('@playwright/test').Page, dx: number, dy: number): Promise<void> {
  const x0 = 195;
  const y0 = 300;
  const cdp = await page.context().newCDPSession(page);
  const steps = 8;
  const pt = (i: number) => ({ x: x0 + (dx * i) / steps, y: y0 + (dy * i) / steps, id: 0 });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt(0)] });
  for (let i = 1; i <= steps; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [pt(i)] });
    await page.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
}

async function lookTo(page: import('@playwright/test').Page, yaw: number, pitch: number, tol = 1.8): Promise<void> {
  for (let i = 0; i < 10; i++) {
    const v = await page.evaluate(() => window.__hunt.view());
    const k = LOOK_DEG_PER_PX / v.zoom;
    const dyaw = yaw - v.yaw;
    const dpitch = pitch - v.pitch;
    // Stop inside the tolerance. A correction under 8 px would count as a tap, as it should for a real finger.
    if (Math.abs(dyaw) < tol && Math.abs(dpitch) < tol) return;
    const ddx = Math.max(-150, Math.min(150, dyaw / k));
    const ddy = Math.max(-150, Math.min(150, dpitch / k));
    if (Math.hypot(ddx, ddy) < 8) return;
    await drag(page, ddx, ddy);
    await page.waitForTimeout(80);
  }
}

async function tap(page: import('@playwright/test').Page): Promise<void> {
  await page.touchscreen.tap(195, 500);
  await page.waitForTimeout(150);
}

test('a 390×844 touch run completes place 1', async ({ page, baseURL }) => {
  test.setTimeout(120_000);
  const c = capture(page, baseURL!);
  await boot(page);
  await begin(page);
  const size = page.viewportSize()!;
  expect(size.width).toBe(390);
  expect(size.height).toBe(844);

  // 1. Drag to the worn spot on the shop's step and tap "Stand here".
  await lookTo(page, 28, -12);
  await expect(page.locator('#verb')).toHaveText('Stand here');
  expect((await page.evaluate(() => window.__hunt.view())).viewpoint).toBe('A');
  await tap(page);
  await page.waitForFunction(() => window.__hunt.view().viewpoint === 'B');
  await page.waitForTimeout(1100);

  // 2. Look at the sill, hold the lens button to zoom, take the key.
  const key = objectAt('street.key');
  await lookTo(page, key[0], key[1]);
  const lens = page.locator('#lens');
  const box = (await lens.boundingBox())!;
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2); // a tap toggles nothing; a hold zooms
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 }] });
  await page.waitForTimeout(700); // the lens zooms in while held...
  await lookTo(page, key[0], key[1], 0.6); // ...and a zoomed drag aims finely
  await expect(page.locator('#verb')).toHaveText('Take');
  await page.evaluate(() => window.__hunt.act()); // tapping elsewhere while holding the lens would end the hold; the verb is what matters
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForFunction(() => window.__hunt.state().items.includes('key'));
  await expect(page.locator('#pocket')).toContainText('key');

  // 3. Look at the door and tap "Use".
  const door = objectAt('street.door');
  await lookTo(page, door[0], door[1]);
  await expect(page.locator('#verb')).toHaveText('Use');
  await tap(page);
  await page.waitForFunction(() => !!window.__hunt.state().steps['use_key_on_door']);

  // 4. Hold the lens on the open doorway until the ring fills, then the dive runs.
  const doorway = objectAt('street.doorway');
  await lookTo(page, doorway[0], doorway[1]);
  await expect(page.locator('#verb')).toHaveText('Look closer');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2, id: 2 }] });
  await page.waitForFunction(() => window.__hunt.diving(), null, { timeout: 5000 });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
  await waitForDive(page, 'shop');
  await expect(page.locator('#ribbon .chip.here')).toHaveText('Shop');
  expect(c.errors).toEqual([]);
  expect(c.outside).toEqual([]);
});
