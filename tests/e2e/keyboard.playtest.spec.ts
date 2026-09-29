import { expect, test } from '@playwright/test';
import { capture } from './helpers';

// Keyboard only, on the playtest build, no hooks: arrows to look, W to walk, Enter to dive, X to back out,
// B for the sketchbook. Completes place 1 and returns. The full-chain keyboard run is a Phase B check (spec §10).
test('place 1 is playable with the keyboard alone', async ({ page, baseURL }) => {
  test.setTimeout(120_000);
  const c = capture(page, baseURL!);
  await page.goto('/');
  await expect(page.locator('#title')).toHaveClass(/show/, { timeout: 30_000 });
  await page.keyboard.press('Enter'); // Begin has focus
  await expect(page.locator('#title')).not.toHaveClass(/show/);
  const verb = page.locator('#verb');
  // Arrow keys turn at about 70 degrees per second. Look left toward the open shop door.
  const hold = async (key: string, ms: number) => {
    await page.keyboard.down(key);
    await page.waitForTimeout(ms);
    await page.keyboard.up(key);
    await page.waitForTimeout(60);
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
      if ((await verb.textContent()) === 'Look closer') return true;
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
