import { expect, test } from '@playwright/test';

// The realistic street renders in software here; a smaller window and the low tier keep frames coming.
test.use({ viewport: { width: 960, height: 600 } });
import { capture } from './helpers';
import { groundRow, playPlaceOne, scanOffset, tap, turn, waitForWalk } from './player';

// Founder, fourth round, change 11: a new player completes the shop (key, drawer, dive) using only the sketchbook,
// with no hints, with real clicks on the playtest build. No debug hooks exist on that build.
test('a new player completes the shop with the sketchbook only, no hints', async ({ page, baseURL }) => {
  test.setTimeout(420_000);
  const c = capture(page, baseURL!);
  await page.goto('/?quality=low');
  await playPlaceOne(page, 'mouse');
  await page.waitForTimeout(9000); // the dive itself: 2 s of game time, many more here on a software renderer
  const size = page.viewportSize()!;
  const hand = 'mouse';
  const center: [number, number] = [size.width / 2, size.height / 2];
  let yaw = 0; // world yaw after arrival
  let pitch = 0;
  const lookTo = async (y: number, p: number) => {
    await turn(page, hand, y - yaw, p - pitch);
    yaw = y;
    pitch = p;
  };

  // 1. The sketchbook's current page shows the next thing (drawn, unnamed). Open it, look, close it.
  await page.getByRole('button', { name: 'Sketchbook' }).click();
  await expect(page.locator('#book')).toHaveClass(/show/);
  await expect(page.locator('#book .page.current canvas')).toHaveCount(1);
  expect(await page.locator('#book').textContent()).not.toMatch(/key|drawer/i); // the page names nothing
  await page.locator('#book').getByRole('button', { name: 'Close' }).click();

  // 2. Walk up to the counter (the counter itself stops the walk) and take the key from it.
  await lookTo(0, -20);
  await tap(page, hand, size.width / 2, groundRow(size, 2.8, -20));
  await waitForWalk(page, 2.8);
  await lookTo(0, -37); // the key lies about a metre away on the counter top, well below eye level
  // The key is tiny: fine steps, and a small sweep of pitches, since the walk may stop a little nearer or farther.
  let off = await scanOffset(page, hand, 'Take', 2, 10, [0, -2, 2, -4, 4]);
  expect(off, 'the key shows "Take" when centred').not.toBeNull();
  yaw += off!.yaw;
  pitch += off!.pitch;
  await tap(page, hand, ...center);
  await expect(page.locator('#pocket')).toContainText('key');

  // 3. Cross to the chest of drawers, find the locked blue drawer, unlock it with the key.
  await lookTo(-84, -25);
  await tap(page, hand, size.width / 2, groundRow(size, 2.2, -25));
  await waitForWalk(page, 2.2);
  await lookTo(-95, -10);
  off = await scanOffset(page, hand, ['Unlock', 'Use'], 4, 32, [0, -6, 6]);
  expect(off, 'the blue drawer shows a verb when centred').not.toBeNull();
  yaw += off!.yaw;
  pitch += off!.pitch;
  await expect(page.locator('#verb')).toHaveText('Unlock');
  await tap(page, hand, ...center);
  await expect(page.locator('#pocket')).not.toContainText('key');

  // 4. The open drawer is the way on: hold the lens on it.
  off = await scanOffset(page, hand, 'Look closer', 4, 24, [0, -8]);
  expect(off, 'the open drawer offers "Look closer"').not.toBeNull();
  const box = (await page.locator('#lens').boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(page.locator('#ribbon .chip.here')).toHaveText('Drawer', { timeout: 8000 });
  await page.mouse.up();

  // No hints were used: the hints panel never opened and the book never offered one.
  await expect(page.locator('#hints')).not.toHaveClass(/show/);
  expect(c.errors).toEqual([]);
  expect(c.outside).toEqual([]);
});
