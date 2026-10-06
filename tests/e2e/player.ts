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

/** The frame time measured in the street at the start of the last playPlaceOne. */
export let lastFrameMs = 0;

/** Milliseconds per frame the page manages right now (a software renderer here runs at 100 to 1000 ms). */
export async function frameMs(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let n = 0;
        const t0 = performance.now();
        const f = () => (++n >= 8 ? resolve((performance.now() - t0) / 8) : requestAnimationFrame(f));
        requestAnimationFrame(f);
      }),
  );
}

/** A walk of `metres` at 3 m/s, plus slack for slow frames (game time advances at most 0.1 s per frame). */
export async function waitForWalk(page: Page, metres: number): Promise<void> {
  const ms = await frameMs(page);
  const gameMs = (metres / 3) * 1000 + 400;
  await page.waitForTimeout(Math.max(gameMs, (gameMs / 100) * ms) + 300);
}

/** The screen row where the ground `metres` ahead appears, for an eye 1.6 m up looking `pitchDeg` (negative = down). */
export function groundRow(size: { width: number; height: number }, metres: number, pitchDeg = 0): number {
  const narrowHalf = Math.tan((BASE_FOV / 2) * Math.PI / 180);
  const aspect = size.width / size.height;
  const vHalf = aspect >= 1 ? narrowHalf : narrowHalf / aspect;
  const below = Math.atan(1.6 / metres) + (pitchDeg * Math.PI) / 180; // angle below the view centre
  return size.height / 2 + (size.height / 2) * (Math.tan(below) / vHalf);
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
export async function scanForVerb(page: Page, hand: Hand, verb: string, stepDeg = 5, rangeDeg = 25, diveOnly = false): Promise<boolean> {
  return (await scanOffset(page, hand, verb, stepDeg, rangeDeg, [0], diveOnly)) !== null;
}

/**
 * Like scanForVerb, but sweeps yaw at each of the given pitch offsets and returns where the verb was found
 * (yaw and pitch offsets in degrees), or null with the view put back.
 */
export async function scanOffset(page: Page, hand: Hand, verb: string | string[], stepDeg = 5, rangeDeg = 25, pitches: number[] = [0], diveOnly = false): Promise<{ yaw: number; pitch: number } | null> {
  const verbs = Array.isArray(verb) ? verb : [verb];
  const verbEl = page.locator('#verb');
  // "Look closer" shows on dive openings and on hidden finds alike; an opening also turns the crosshair amber and
  // dashed (what the player sees), so a dive scan asks for that too (round 5: a starfish lies on the way to the door).
  const hit = async () => verbs.includes((await verbEl.textContent()) ?? '') && (!diveOnly || (await page.locator('#crosshair.dive').count()) > 0);
  // The verb changes on the next frame after a turn; on a slow software renderer that is longer than a fixed pause.
  const settle = Math.max(90, (await frameMs(page)) * 1.6);
  const offsets: number[] = [0];
  for (let k = stepDeg; k <= rangeDeg; k += stepDeg) offsets.push(k, -k);
  let at = 0;
  let pitchAt = 0;
  for (const p of pitches) {
    await turn(page, hand, 0, p - pitchAt);
    pitchAt = p;
    for (const o of offsets) {
      await turn(page, hand, o - at);
      at = o;
      await page.waitForTimeout(settle);
      if (await hit()) return { yaw: at, pitch: pitchAt };
    }
  }
  await turn(page, hand, -at, -pitchAt);
  return null;
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
  // Begin says "Loading…" until the street's assets are in; the player's clock starts at play.
  await expect(page.getByRole('button', { name: 'Begin' })).toBeEnabled({ timeout: 120_000 });
  await tap(page, hand, ...(await center(page.getByRole('button', { name: 'Begin' }))));
  await expect(page.locator('#title')).not.toHaveClass(/show/);
  cdp = null;
  const t0 = Date.now();
  lastFrameMs = await frameMs(page); // the street's own frame time, for the 60 s rule
  const size = page.viewportSize()!;
  // Look left, toward the shop's open door (it glows), then walk toward it in strides of about 4 m
  // until the crosshair reacts to the doorway.
  await turn(page, hand, 37);
  for (let attempt = 0; attempt < 6; attempt++) {
    await tap(page, hand, size.width / 2, groundRow(size, 4));
    await waitForWalk(page, 4);
    if (await scanForVerb(page, hand, 'Look closer', 6, 18, true)) break;
  }
  await expect(page.locator('#verb')).toHaveText('Look closer');
  await expect(page.locator('#crosshair')).toHaveClass(/dive/);
  await holdLensUntil(page, hand, 'Shop');
  return (Date.now() - t0) / 1000;
}

async function center(locator: ReturnType<Page['locator']>): Promise<[number, number]> {
  const b = (await locator.boundingBox())!;
  return [b.x + b.width / 2, b.y + b.height / 2];
}

/** The screen centre. */
export function centre(page: Page): [number, number] {
  const size = page.viewportSize()!;
  return [size.width / 2, size.height / 2];
}

/**
 * Round 5 (D-011): from the arrival in the shop, play to the end the way a new player would, with mouse or touch:
 * the goal card opens the sketchbook; walk to the counter; take the key; pick up the spectacles beside it (a find:
 * the counter goes to 1); cross to the low chest; unlock the blue drawer; hold the lens on the open drawer. The
 * playtest build then ends with "To be continued". Reads only the screen.
 */
export async function playShopToEnd(page: Page, hand: Hand): Promise<void> {
  const size = page.viewportSize()!;
  let yaw = 0; // relative to the arrival view, which faces into the shop
  let pitch = 0;
  const lookTo = async (y: number, p: number) => {
    await turn(page, hand, y - yaw, p - pitch);
    yaw = y;
    pitch = p;
  };
  const found = async (verb: string | string[], step: number, range: number, pitches: number[], diveOnly = false) => {
    const off = await scanOffset(page, hand, verb, step, range, pitches, diveOnly);
    if (off) {
      yaw += off.yaw;
      pitch += off.pitch;
    }
    return off;
  };
  // The goal card is on screen and opens the sketchbook.
  await expect(page.locator('#goal')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('#counter')).toHaveText('0 of 12 found');
  await tap(page, hand, ...(await middleOf(page.locator('#goal'))));
  await expect(page.locator('#book')).toHaveClass(/show/);
  await expect(page.locator('#book .page.current canvas')).toHaveCount(1);
  await page.locator('#book').getByRole('button', { name: 'Close' }).click();
  await expect(page.locator('#book')).not.toHaveClass(/show/);

  // Walk up to the counter and take the key.
  await lookTo(0, -20);
  await tap(page, hand, size.width / 2, groundRow(size, 2.8, -20));
  await waitForWalk(page, 2.8);
  await lookTo(0, -34);
  expect(await found('Take', 2, 10, [0, -3, 3, -6, 6]), 'the key shows "Take" when centred').not.toBeNull();
  await tap(page, hand, ...centre(page));
  await expect(page.locator('#pocket')).toContainText('key');

  // A find: the spectacles lie on the counter to the left. Close enough to need no lens.
  await lookTo(55, -19);
  expect(await found('Take', 3, 15, [0, -4, 4]), 'the spectacles show "Take" when centred').not.toBeNull();
  await tap(page, hand, ...centre(page));
  await expect(page.locator('#counter')).toHaveText('1 of 12 found', { timeout: 15_000 });

  // Cross to the low chest of drawers on the right; unlock the blue drawer.
  await lookTo(-83, -25);
  await tap(page, hand, size.width / 2, groundRow(size, 1.6, -25));
  await waitForWalk(page, 1.6);
  await lookTo(-90, -36);
  expect(await found(['Unlock', 'Use'], 3, 24, [0, -5, 5, -10]), 'the blue drawer shows a verb when centred').not.toBeNull();
  await expect(page.locator('#verb')).toHaveText('Unlock');
  await tap(page, hand, ...centre(page));
  await expect(page.locator('#pocket')).not.toContainText('key');

  // The open drawer glows: hold the lens on it. The playtest build ends here.
  await lookTo(yaw, -44);
  expect(await found('Look closer', 3, 18, [0, -4, 4], true), 'the open drawer offers "Look closer"').not.toBeNull();
  const box = (await page.locator('#lens').boundingBox())!;
  const lx = box.x + box.width / 2;
  const ly = box.y + box.height / 2;
  if (hand === 'mouse') {
    await page.mouse.move(lx, ly);
    await page.mouse.down();
    await expect(page.locator('#end')).toHaveClass(/show/, { timeout: 60_000 });
    await page.mouse.up();
  } else {
    const t = await touchSession(page);
    await t.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: lx, y: ly, id: 1 }] });
    await expect(page.locator('#end')).toHaveClass(/show/, { timeout: 60_000 });
    await t.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
}

/** The ending screen of the playtest build: "To be continued", with time, finds and hints. */
export async function expectEnding(page: Page, finds: string): Promise<void> {
  const end = page.locator('#end');
  await expect(end.locator('h1')).toHaveText('To be continued');
  await expect(end).toContainText(/Time: \d+ min \d+ s/);
  await expect(end).toContainText(`Finds: ${finds}`);
  await expect(end).toContainText('Hints used: 0');
}

async function middleOf(locator: ReturnType<Page['locator']>): Promise<[number, number]> {
  const b = (await locator.boundingBox())!;
  return [b.x + b.width / 2, b.y + b.height / 2];
}
