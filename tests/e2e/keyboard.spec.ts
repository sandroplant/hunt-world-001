import { expect, test } from '@playwright/test';
import { boot, capture, waitForDive } from './helpers';

// Keyboard only: arrows to look, Z to zoom, E to use, Enter at the prompt to dive, B for the sketchbook, X to back out.
// Completes place 1 and dives, then backs out. The full-chain keyboard run is a Phase B check (spec §10).
test('place 1 is playable with the keyboard alone', async ({ page, baseURL }) => {
  test.setTimeout(120_000);
  const c = capture(page, baseURL!);
  await boot(page);
  await page.keyboard.press('Enter'); // Begin has focus
  await page.waitForFunction(() => document.querySelector('#title.show') === null);

  // Arrow keys turn at 70°/s divided by the zoom, so a zoomed-in player aims finely. Tolerance in degrees.
  const lookTo = async (yaw: number, pitch: number, tol = 1.5) => {
    for (let i = 0; i < 300; i++) {
      const v = await page.evaluate(() => window.__hunt.view());
      const dy = yaw - v.yaw;
      const dp = pitch - v.pitch;
      if (Math.abs(dy) < tol && Math.abs(dp) < tol) return;
      const key = Math.abs(dy) >= tol ? (dy > 0 ? 'ArrowLeft' : 'ArrowRight') : dp > 0 ? 'ArrowUp' : 'ArrowDown';
      const rate = 70 / v.zoom;
      await page.keyboard.down(key);
      await page.waitForTimeout(Math.min(400, Math.max(16, (Math.max(Math.abs(dy), Math.abs(dp)) / rate) * 1000 * 0.7)));
      await page.keyboard.up(key);
      await page.waitForTimeout(60);
    }
  };

  await lookTo(28, -12);
  await expect(page.locator('#verb')).toHaveText('Stand here');
  await page.keyboard.press('e');
  await page.waitForFunction(() => window.__hunt.view().viewpoint === 'B');
  await page.waitForTimeout(1100);
  await lookTo(15, -8);
  await page.keyboard.down('z'); // zoom in on the sill...
  await page.waitForTimeout(700);
  await lookTo(15, -8, 0.5); // ...then aim finely, as a player would
  await expect(page.locator('#verb')).toHaveText('Take');
  await page.keyboard.press('e');
  await page.keyboard.up('z');
  await page.waitForFunction(() => window.__hunt.state().items.includes('key'));
  await lookTo(-10, 0);
  await expect(page.locator('#verb')).toHaveText('Use');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !!window.__hunt.state().steps['use_key_on_door']);
  await lookTo(-10, 2);
  await expect(page.locator('#verb')).toHaveText('Look closer');
  await page.keyboard.press('b');
  await expect(page.locator('#book')).toHaveClass(/show/);
  await page.keyboard.press('Escape');
  await expect(page.locator('#book')).not.toHaveClass(/show/);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__hunt.diving(), null, { timeout: 3000 });
  await waitForDive(page, 'shop');
  await page.keyboard.press('x');
  await waitForDive(page, 'street');
  expect((await page.evaluate(() => window.__hunt.state())).viewpoint).toBe('B');
  expect(c.errors).toEqual([]);
});
