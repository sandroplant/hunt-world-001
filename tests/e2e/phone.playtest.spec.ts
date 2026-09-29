import { devices, expect, test } from '@playwright/test';
import { capture } from './helpers';
import { playPlaceOne } from './player';

// The same new-player run on a 390x844 phone, with touch only, on the playtest build. No debug hooks.
test.use({ ...devices['iPhone 13'], defaultBrowserType: 'chromium', viewport: { width: 390, height: 844 } });

test('a 390x844 touch run of place 1: start, walk, dive into the shop within 60 s', async ({ page, baseURL }) => {
  test.setTimeout(120_000);
  const c = capture(page, baseURL!);
  await page.goto('/');
  const size = page.viewportSize()!;
  expect(size.width).toBe(390);
  expect(size.height).toBe(844);
  const seconds = await playPlaceOne(page, 'touch');
  expect(seconds).toBeLessThan(60);
  // The trail sits below the buttons on a phone (founder change 7).
  const ribbon = (await page.locator('#ribbon').boundingBox())!;
  const menu = (await page.getByRole('button', { name: 'Menu' }).boundingBox())!;
  expect(ribbon.y).toBeGreaterThanOrEqual(menu.y + menu.height - 1);
  expect(c.errors).toEqual([]);
  expect(c.outside).toEqual([]);
});
