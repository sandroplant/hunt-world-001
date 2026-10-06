import { expect, test } from '@playwright/test';

// The realistic street renders in software here; a smaller window and the low tier keep frames coming.
test.use({ viewport: { width: 960, height: 600 } });
import { mkdirSync } from 'node:fs';
import { capture } from './helpers';
import { expectEnding, playPlaceOne, playShopToEnd } from './player';

// Round 5 acceptance (D-011), mouse: Begin, walk, dive into the shop, take the key, open the blue drawer, dive,
// and the ending screen, with real clicks on the playtest build and no hooks (it has none). On the way: the goal
// card opens the sketchbook, and one find makes the counter go from 0 to 1.
test('mouse: Begin to "To be continued" through the shop, with the goal card and the find counter', async ({ page, baseURL }) => {
  test.setTimeout(600_000);
  const c = capture(page, baseURL!);
  mkdirSync('REVIEW/screenshots/round5', { recursive: true });
  await page.goto('/?quality=low');
  await playPlaceOne(page, 'mouse');
  await expect(page.locator('#goal')).toBeVisible({ timeout: 60_000 });
  await page.screenshot({ path: 'REVIEW/screenshots/round5/2_shop_from_the_door.png' });
  await playShopToEnd(page, 'mouse');
  await expectEnding(page, '1 of 12');
  await page.screenshot({ path: 'REVIEW/screenshots/round5/4_ending.png' });
  // Keep looking returns to the shop; the game stays playable after the end.
  await page.getByRole('button', { name: 'Keep looking' }).click();
  await expect(page.locator('#end')).not.toHaveClass(/show/);
  await expect(page.locator('#counter')).toHaveText('1 of 12 found');
  expect(await page.evaluate(() => typeof (window as unknown as { __hunt?: unknown }).__hunt)).toBe('undefined');
  expect(c.errors).toEqual([]);
  expect(c.outside).toEqual([]);
});
