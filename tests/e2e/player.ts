// Real input only: these helpers drive the game the way a person does, with mouse or touch, and read nothing but the screen.
// They are used by the *.playtest.spec.ts tests, which run against the playtest build (no debug hooks exist there).
import { expect, type Page } from '@playwright/test';

export const LOOK_DEG_PER_PX = 0.18;
export const BASE_FOV = 60; // degrees on the narrow screen axis
export type Hand = 'mouse' | 'touch';

let cdp: import('@playwright/test').CDPSession | null = null;
async function touchSession(page: Page): Promise<import('@playwright/test').CDPSession> {
  cdp ??= await page.context().newCDPSession(page);
  return cdp;
}

/** Drag on the screen. The world follows the finger: drag right to look left (+yaw), drag down to look up. */
export async function drag(page: Page, hand: Hand, dx: number, dy: number): Promise<void> {
  const size = page.viewportSize()!;
  const x0 = size.width / 2;
  const y0 = size.height * 0.4;
  const steps = 6;
  if (hand === 'mouse') {
    await page.mouse.move(x0, y0);
    await page.mouse.down();
    for (let i = 1; i <= steps; i++) {
      await page.mouse.move(x0 + (dx * i) / steps, y0 + (dy * i) / steps);
      await page.waitForTimeout(12);
    }
    await page.mouse.up();
  } else {
    const t = await touchSession(page);
    const pt = (i: number) => ({ x: x0 + (dx * i) / steps, y: y0 + (dy * i) / steps, id: 0 });
    await t.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt(0)] });
    for (let i = 1; i <= steps; i++) {
      await t.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [pt(i)] });
      await page.waitForTimeout(12);
    }
    await t.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  await page.waitForTimeout(40);
}

/** The screen row where the ground `metres` ahead appears, for an eye 1.6 m up looking level. */
export function groundRow(size: { width: number; height: number }, metres: number): number {
  const narrowHalf = Math.tan((BASE_FOV / 2) * Math.PI / 180);
  const aspect = size.width / size.height;
  const vHalf = aspect >= 1 ? narrowHalf : narrowHalf / aspect;
  const down = 1.6 / metres; // tan of the angle below level
  return size.height / 2 + (size.height / 2) * (down / vHalf);
}

/** Turn by degrees (at 1x zoom): +yaw looks left, +pitch looks up. */
export async function turn(page: Page, hand: Hand, yawDeg: number, pitchDeg = 0): Promise<void> {
  const limit = 140; // a comfortable single drag
  let y = yawDeg / LOOK_DEG_PER_PX;
  let p = pitchDeg / LOOK_DEG_PER_PX;
  while (Math.abs(y) > 0.5 || Math.abs(p) > 0.5) {
    const dy = Math.max(-limit, Math.min(limit, y));
    const dp = Math.max(-limit, Math.min(limit, p));
    await drag(page, hand, dy, dp);
    y -= dy;
    p -= dp;
  }
}

/** A tap or click on the screen. */
export async function tap(page: Page, hand: Hand, x: number, y: number): Promise<void> {
  if (hand === 'mouse') await page.mouse.click(x, y);
  else await page.touchscreen.tap(x, y);
  await page.waitForTimeout(80);
}

/** Look left and right in small steps until the crosshair shows the verb. Leaves the view there. */
export async function scanForVerb(page: Page, hand: Hand, verb: string, stepDeg = 5, rangeDeg = 25): Promise<boolean> {
  const verbEl = page.locator('#verb');
  const offsets: number[] = [0];
  for (let k = stepDeg; k <= rangeDeg; k += stepDeg) offsets.push(k, -k);
  let at = 0;
  for (const o of offsets) {
    await turn(page, hand, o - at);
    at = o;
    await page.waitForTimeout(90);
    if ((await verbEl.textContent()) === verb) return true;
  }
  await turn(page, hand, -at);
  return false;
}

/** Hold the on-screen lens button until the trail says the player is in `place`, then let go. */
export async function holdLensUntil(page: Page, hand: Hand, place: string, timeout = 8000): Promise<void> {
  const box = (await page.locator('#lens').boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  if (hand === 'mouse') {
    await page.mouse.move(x, y);
    await page.mouse.down();
    await expect(page.locator('#ribbon .chip.here')).toHaveText(place, { timeout });
    await page.mouse.up();
  } else {
    const t = await touchSession(page);
    await t.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
    await expect(page.locator('#ribbon .chip.here')).toHaveText(place, { timeout });
    await t.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
}

/**
 * Plays place 1 like a new player: begin, look toward the glowing door, tap the ground to walk closer until
 * the crosshair reacts, hold the lens on the doorway, arrive in the shop. Returns the seconds it took after Begin.
 */
export async function playPlaceOne(page: Page, hand: Hand): Promise<number> {
  await expect(page.locator('#title')).toHaveClass(/show/, { timeout: 30_000 });
  // The start screen shows three pictures: drag to look, tap the ground to walk, hold the lens on a glowing opening.
  await expect(page.locator('#title .tile')).toHaveCount(3);
  await tap(page, hand, ...(await center(page.getByRole('button', { name: 'Begin' }))));
  await expect(page.locator('#title')).not.toHaveClass(/show/);
  cdp = null;
  const t0 = Date.now();
  const size = page.viewportSize()!;
  // Look left, toward the shop's open door (it glows), then walk toward it in strides of about 4 m
  // until the crosshair reacts to the doorway.
  await turn(page, hand, 37);
  for (let attempt = 0; attempt < 6; attempt++) {
    await tap(page, hand, size.width / 2, groundRow(size, 4));
    await page.waitForTimeout(1700);
    if (await scanForVerb(page, hand, 'Look closer')) break;
  }
  await expect(page.locator('#verb')).toHaveText('Look closer');
  await holdLensUntil(page, hand, 'Shop');
  return (Date.now() - t0) / 1000;
}

async function center(locator: ReturnType<Page['locator']>): Promise<[number, number]> {
  const b = (await locator.boundingBox())!;
  return [b.x + b.width / 2, b.y + b.height / 2];
}
