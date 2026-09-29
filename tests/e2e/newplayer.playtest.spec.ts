import { expect, test } from '@playwright/test';
import { capture } from './helpers';
import { playPlaceOne } from './player';

// Founder rule (third round): a feature counts as working only when an end-to-end test reaches it with real
// clicks or taps on the playtest build. This test uses no debug hooks (the playtest build has none).
test('a new player starts, walks and dives into the shop with real clicks, within 60 s', async ({ page, baseURL }) => {
  test.setTimeout(120_000);
  const c = capture(page, baseURL!);
  await page.goto('/');
  const seconds = await playPlaceOne(page, 'mouse');
  expect(seconds).toBeLessThan(60);
  expect(await page.evaluate(() => typeof (window as unknown as { __hunt?: unknown }).__hunt)).toBe('undefined');
  expect(c.errors).toEqual([]);
  expect(c.outside).toEqual([]);
});

test('the sketchbook, hints and menu open and close with real clicks on the playtest build', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Begin' }).click();
  await page.getByRole('button', { name: 'Sketchbook' }).click();
  await expect(page.locator('#book')).toHaveClass(/show/);
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.locator('#book')).not.toHaveClass(/show/);
  await page.getByRole('button', { name: 'Hints' }).click();
  await expect(page.locator('#hints')).toHaveClass(/show/);
  await page.locator('#hints').getByRole('button', { name: 'Close' }).click();
  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(page.locator('#menu')).toHaveClass(/show/);
  await expect(page.getByRole('button', { name: 'Copy log' })).toBeVisible();
  await page.getByRole('button', { name: 'Resume' }).click();
  await expect(page.locator('#menu')).not.toHaveClass(/show/);
});
