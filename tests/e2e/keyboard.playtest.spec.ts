import { expect, test } from '@playwright/test';

// The realistic street renders in software here; a smaller window and the low tier keep frames coming. (Not
// smaller than this: at 500 px high a tap 4 m ahead lands on the lens button.)
test.use({ viewport: { width: 960, height: 600 } });
import { capture } from './helpers';
import { expectEnding, frameMs } from './player';

// Keyboard only, on the playtest build, no hooks: arrows to look, W to walk, Enter to dive, X to back out,
// B for the sketchbook. Completes place 1 and returns. The full-chain keyboard run is a Phase B check (spec §10).
test('place 1 is playable with the keyboard alone', async ({ page, baseURL }) => {
  test.setTimeout(600_000);
  const c = capture(page, baseURL!);
  await page.goto('/?quality=low');
  await expect(page.locator('#title')).toHaveClass(/show/, { timeout: 30_000 });
  await expect(page.getByRole('button', { name: 'Begin' })).toBeEnabled({ timeout: 120_000 });
  await expect(page.getByRole('button', { name: 'Begin' })).toBeFocused();
  await page.keyboard.press('Enter'); // Begin has focus once the assets are in
  await expect(page.locator('#title')).not.toHaveClass(/show/);
  const verb = page.locator('#verb');
  // Arrow keys turn at about 70 degrees per second of game time. Game time runs at most 0.1 s per frame, so on a
  // slow software renderer a hold of `ms` game milliseconds needs longer on the wall clock (round 5: the street
  // now also draws the realistic shop in its door, and frames got slower).
  const perFrame = await frameMs(page);
  const hold = async (key: string, ms: number) => {
    await page.keyboard.down(key);
    await page.waitForTimeout(Math.max(ms, (ms / 100) * perFrame));
    await page.keyboard.up(key);
    await page.waitForTimeout(Math.max(60, perFrame * 1.5));
  };
  await hold('ArrowLeft', 530);
  const scan = async (): Promise<boolean> => {
    const offsets = [0, 60, -60, 120, -120, 180, -180, 240, -240, 300, -300, 380, -380, 470, -470];
    let at = 0;
    for (const o of offsets) {
      const d = o - at;
      if (d) await hold(d > 0 ? 'ArrowLeft' : 'ArrowRight', Math.abs(d));
      at = o;
      await page.waitForTimeout(120);
      if ((await verb.textContent()) === 'Look closer' && (await page.locator('#crosshair.dive').count()) > 0) return true;
    }
    if (at) await hold(at > 0 ? 'ArrowRight' : 'ArrowLeft', Math.abs(at));
    return false;
  };
  for (let attempt = 0; attempt < 8; attempt++) {
    if (await scan()) break;
    await hold('w', 900); // walk ahead
    await page.waitForTimeout(200);
  }
  await expect(verb).toHaveText('Look closer');
  await page.keyboard.press('b');
  await expect(page.locator('#book')).toHaveClass(/show/);
  await page.keyboard.press('Escape');
  await expect(page.locator('#book')).not.toHaveClass(/show/);
  await page.keyboard.press('Enter');
  await expect(page.locator('#ribbon .chip.here')).toHaveText('Shop', { timeout: 8000 });
  await page.waitForTimeout(2500); // the trail changes as the dive starts; the dive itself takes 2 s
  await page.keyboard.press('x');
  await expect(page.locator('#ribbon .chip.here')).toHaveText('Street', { timeout: 8000 });
  expect(c.errors).toEqual([]);
});

// Round 5 acceptance (D-011), keyboard only: into the shop, the goal card (Tab to it, Enter) and the sketchbook,
// the key, one find for the counter, the blue drawer, and the dive that ends the playtest. No hooks.
test('keyboard: the shop to "To be continued", with the goal card and the find counter', async ({ page, baseURL }) => {
  test.setTimeout(600_000);
  const c = capture(page, baseURL!);
  await page.goto('/?quality=low');
  await expect(page.getByRole('button', { name: 'Begin' })).toBeEnabled({ timeout: 120_000 });
  await expect(page.getByRole('button', { name: 'Begin' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#title')).not.toHaveClass(/show/);
  const verb = page.locator('#verb');
  let ms = await frameMs(page);
  // Game time runs at most 0.1 s per frame, so a key held for `game` seconds needs longer on a slow renderer.
  const real = (game: number) => Math.max(game * 1000, game * 10 * ms);
  const hold = async (key: string, game: number) => {
    await page.keyboard.down(key);
    await page.waitForTimeout(real(game));
    await page.keyboard.up(key);
    await page.waitForTimeout(Math.max(60, ms * 1.5));
  };
  // "Look closer" also shows on hidden finds; a dive opening also turns the crosshair amber and dashed.
  const is = async (v: string | string[]) =>
    (Array.isArray(v) ? v : [v]).includes((await verb.textContent()) ?? '') && (v !== 'Look closer' || (await page.locator('#crosshair.dive').count()) > 0);
  /** Turn in small steps (arrow keys, about 70 degrees a second) until the verb shows; sweep left and right. */
  const scan = async (v: string | string[], stepDeg: number, rangeDeg: number, vertical: 'ArrowUp' | 'ArrowDown' | null = null): Promise<boolean> => {
    const pitchSteps = vertical ? [0, 1, 2, 3, 4, 5] : [0];
    for (const k of pitchSteps) {
      if (k > 0) await hold(vertical!, stepDeg / 70);
      if (await is(v)) return true;
      let at = 0;
      for (let o = stepDeg; o <= rangeDeg; o += stepDeg) {
        for (const target of [o, -o]) {
          const d = target - at;
          await hold(d > 0 ? 'ArrowLeft' : 'ArrowRight', Math.abs(d) / 70);
          at = target;
          if (await is(v)) return true;
        }
      }
      if (at) await hold(at > 0 ? 'ArrowRight' : 'ArrowLeft', Math.abs(at) / 70);
    }
    return false;
  };
  /** Look around a small patch (yaw and pitch) for the verb; leaves the view on it, or puts the view back. */
  const patch = async (v: string | string[], stepDeg: number, yawRange: number, pitchRange: number): Promise<boolean> => {
    let py = 0;
    for (const p of [0, -stepDeg, stepDeg, -2 * stepDeg, 2 * stepDeg].filter((x) => Math.abs(x) <= pitchRange)) {
      const d = p - py;
      if (d) await hold(d > 0 ? 'ArrowUp' : 'ArrowDown', Math.abs(d) / 70);
      py = p;
      if (await scan(v, stepDeg, yawRange)) return true;
    }
    if (py) await hold(py > 0 ? 'ArrowDown' : 'ArrowUp', Math.abs(py) / 70);
    return false;
  };
  /** Walk ahead in short steps, looking around after each, the way a player edges closer. */
  const approach = async (v: string | string[], stepS: number, tries: number, stepDeg: number, rangeDeg: number): Promise<boolean> => {
    for (let i = 0; i < tries; i++) {
      if (await patch(v, stepDeg, rangeDeg, 2 * stepDeg)) return true;
      await hold('w', stepS);
    }
    return patch(v, stepDeg, rangeDeg, 2 * stepDeg);
  };
  const shot = (name: string) => page.screenshot({ path: `test-results/keyboard-shop-${name}.png` });
  // Place 1, the same moves as the place-1 keyboard test: left toward the glowing door, then walk ahead in
  // strides, sweeping left and right after each until the crosshair shows the opening; Enter.
  await hold('ArrowLeft', 0.53);
  const sweep = async (): Promise<boolean> => {
    const offsets = [0, 60, -60, 120, -120, 180, -180, 240, -240, 300, -300, 380, -380, 470, -470];
    let at = 0;
    for (const o of offsets) {
      const d = o - at;
      if (d) await hold(d > 0 ? 'ArrowLeft' : 'ArrowRight', Math.abs(d) / 1000);
      at = o;
      if (await is('Look closer')) return true;
    }
    if (at) await hold(at > 0 ? 'ArrowRight' : 'ArrowLeft', Math.abs(at) / 1000);
    return false;
  };
  for (let attempt = 0; attempt < 8 && !(await sweep()); attempt++) await hold('w', 0.9);
  await expect(verb).toHaveText('Look closer');
  await expect(page.locator('#crosshair')).toHaveClass(/dive/);
  await page.keyboard.press('Enter');
  await expect(page.locator('#ribbon .chip.here')).toHaveText('Shop', { timeout: 8000 });
  // The goal card: Tab reaches it, Enter opens the sketchbook; Escape closes it.
  await expect(page.locator('#goal')).toBeVisible({ timeout: 60_000 });
  ms = await frameMs(page); // the shop's own frame time
  await expect(page.locator('#counter')).toHaveText('0 of 12 found');
  for (let i = 0; i < 12 && !(await page.locator('#goal').evaluate((e) => e === document.activeElement)); i++) await page.keyboard.press('Tab');
  await expect(page.locator('#goal')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#book')).toHaveClass(/show/);
  await page.keyboard.press('Escape');
  await expect(page.locator('#book')).not.toHaveClass(/show/);
  await page.locator('#goal').evaluate((e) => (e as HTMLElement).blur());
  // Look down a little and edge toward the counter until the key answers.
  await hold('ArrowDown', 30 / 70);
  await shot('1-arrived');
  const key = await approach('Take', 0.25, 12, 4, 8);
  await shot('2-key');
  expect(key, 'the key shows "Take"').toBe(true);
  await page.keyboard.press('e');
  await expect(page.locator('#pocket')).toContainText('key');
  // The spectacles on the counter to the left: a find, no lens needed this close.
  await hold('ArrowLeft', 55 / 70);
  await hold('ArrowUp', 10 / 70);
  const spectacles = await patch('Take', 4, 24, 8);
  await shot('3-spectacles');
  expect(spectacles, 'the spectacles show "Take"').toBe(true);
  await page.keyboard.press('e');
  await expect(page.locator('#counter')).toHaveText('1 of 12 found', { timeout: 15_000 });
  // Turn right toward the low chest and edge toward it until the blue drawer answers.
  await hold('ArrowRight', 140 / 70);
  await hold('ArrowDown', 14 / 70);
  let ok = await approach(['Unlock', 'Use'], 0.25, 8, 5, 20);
  for (let step = 0; step < 4 && !ok; step++) {
    await hold('s', 0.25);
    ok = await scan(['Unlock', 'Use'], 5, 20, 'ArrowDown');
    if (!ok) await hold('ArrowUp', 25 / 70);
  }
  await shot('4-drawer');
  expect(ok, 'the blue drawer shows a verb').toBe(true);
  await expect(verb).toHaveText('Unlock');
  await page.keyboard.press('e');
  await expect(page.locator('#pocket')).not.toContainText('key');
  // The open drawer reaches out toward you: look down into it, stepping back if it is too steep.
  let inside = await scan('Look closer', 4, 16, 'ArrowDown');
  for (let step = 0; step < 3 && !inside; step++) {
    await hold('ArrowUp', 20 / 70);
    await hold('s', 0.2);
    inside = await scan('Look closer', 4, 16, 'ArrowDown');
  }
  await shot('5-inside');
  expect(inside, 'the open drawer offers "Look closer"').toBe(true);
  await page.keyboard.press('Enter');
  await expect(page.locator('#end')).toHaveClass(/show/, { timeout: 60_000 });
  await expectEnding(page, '1 of 12');
  // The ending's first button has focus; Enter keeps looking.
  await expect(page.getByRole('button', { name: 'Keep looking' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#end')).not.toHaveClass(/show/);
  expect(c.errors).toEqual([]);
});
