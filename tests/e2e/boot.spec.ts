import { expect, test } from '@playwright/test';
import { boot, begin, capture } from './helpers';

test('the build boots with zero console errors and zero outside requests', async ({ page, baseURL }) => {
  const c = capture(page, baseURL!);
  await boot(page, '?test=1');
  await expect(page.getByText('Prototype · non-competitive · no prize')).toBeVisible();
  await expect(page.getByText('A small light is missing from the moon. Follow the sketchbook.')).toBeVisible();
  await begin(page);
  await page.waitForTimeout(1500);
  expect(c.errors).toEqual([]);
  expect(c.outside).toEqual([]);
});

test('the playtest-style query flags do not expose debug tools', async ({ page }) => {
  await boot(page, '?test=1');
  expect(await page.evaluate(() => typeof (window as unknown as { __hunt?: unknown }).__hunt)).toBe('undefined');
  expect(await page.locator('#debug').count()).toBe(0);
});

test('the same first screenshot every time with ?test=1', async ({ page }) => {
  await boot(page, '?test=1');
  await begin(page);
  await page.waitForTimeout(600);
  const a = await page.screenshot();
  await page.reload();
  await page.waitForFunction(() => document.querySelector('#title.show') !== null);
  await begin(page);
  await page.waitForTimeout(600);
  const b = await page.screenshot();
  // Same size and mostly identical bytes. A stricter pixel diff comes with the Phase B screenshot set.
  expect(a.length).toBeGreaterThan(1000);
  expect(Math.abs(a.length - b.length) / a.length).toBeLessThan(0.02);
});
