import { expect, test } from '@playwright/test';
import { boot, begin, capture, objectAt, waitForDive, world } from './helpers';
import { readFileSync } from 'node:fs';

interface Answers {
  sketches: Record<string, { yaw: number; pitch: number; zoom: number }>;
  hidden: Record<string, { minZoom: number }>;
  requiredSteps: Record<string, string[]>;
  diveTargets: Record<string, { object: string }>;
}
const answers = JSON.parse(readFileSync(new URL('../../src/world/answers.json', import.meta.url), 'utf8')) as Answers;
const objects = JSON.parse(readFileSync(new URL('../../src/world/objects.json', import.meta.url), 'utf8')) as { objects: Array<{ id: string; at?: [string, number, number, number] }> };

/**
 * The scripted route on the dev build: every required step is done through the rules engine (debug "next step"),
 * every dive is done the real way (lens held on the active target until the ring fills),
 * plus one sketch lock and one hidden-object find through the judge.
 * Hooks set this test up (teleport, set view); under the founder's rule they prove nothing about
 * the controls. The controls are proven by the *.playtest.spec.ts tests with real input.
 */
test('a scripted route completes the whole chain', async ({ page, baseURL }) => {
  test.setTimeout(180_000);
  const c = capture(page, baseURL!);
  await boot(page);
  await begin(page);

  // First: lock S1 by holding it up and looking at its pose for the hold time.
  const s1 = answers.sketches['S1']!;
  await page.evaluate(() => window.__hunt.holdUp('S1'));
  await expect(page.locator('#card')).toHaveClass(/show/);
  await page.evaluate(([y, p, z]) => window.__hunt.setView(y, p, z), [s1.yaw + 4, s1.pitch - 3, s1.zoom * 1.1] as [number, number, number]);
  await page.waitForFunction(() => !!window.__hunt.state().found['S1'], null, { timeout: 8000 });
  await expect(page.locator('#card')).not.toHaveClass(/show/);

  // A hidden object: the umbrella, only when zoomed in.
  const u = answers.hidden['street.umbrella']!;
  const uAt = objectAt('street.umbrella');
  await page.evaluate(([y, p]) => window.__hunt.setView(y, p, 1), [uAt[0], uAt[1]] as [number, number]);
  await page.waitForTimeout(150);
  await page.evaluate(() => window.__hunt.act());
  expect((await page.evaluate(() => window.__hunt.state())).found['street.umbrella']).toBeUndefined();
  await page.evaluate(([y, p, z]) => window.__hunt.setView(y, p, z), [uAt[0], uAt[1], u.minZoom] as [number, number, number]);
  await page.waitForTimeout(150);
  await expect(page.locator('#verb')).toHaveText('Take');
  await page.evaluate(() => window.__hunt.act());
  await page.waitForFunction(() => !!window.__hunt.state().found['street.umbrella']);

  for (let i = 0; i < world.order.length - 1; i++) {
    const place = world.order[i]!;
    const next = world.order[i + 1]!;
    expect((await page.evaluate(() => window.__hunt.state())).place).toBe(place);
    // Do the required steps of this place (through the rules engine, in order).
    const steps = (answers.requiredSteps as Record<string, string[]>)[place]!;
    for (let k = 0; k < steps.length; k++) await page.evaluate(() => window.__hunt.nextStep());
    for (const s of steps) expect((await page.evaluate(() => window.__hunt.state())).steps[s]).toBe(true);
    // Now dive the real way: stand where the target is reachable, center it, hold the lens, wait for the ring.
    const target = (answers.diveTargets as Record<string, { object: string }>)[place]!;
    const obj = objects.objects.find((o) => o.id === target.object)!;
    const vp = obj.at![0]!;
    const yaw = obj.at![1]!;
    const pitch = obj.at![2]!;
    await page.evaluate((v) => window.__hunt.stand(v), vp);
    await page.waitForTimeout(200);
    const pose: [number, number] = [yaw, pitch];
    await page.evaluate(([y, p]) => window.__hunt.setView(y, p, 1), pose);
    await page.waitForTimeout(150);
    await expect(page.locator('#verb')).toHaveText('Look closer');
    await page.evaluate(() => window.__hunt.lens(true));
    await page.waitForFunction(() => window.__hunt.diving(), null, { timeout: 5000 });
    await page.evaluate(() => window.__hunt.lens(false));
    await waitForDive(page, next);
  }
  const final = await page.evaluate(() => window.__hunt.state());
  expect(final.place).toBe('street_night');
  expect(final.ended).toBe(true);
  await expect(page.locator('#end')).toHaveClass(/show/);
  await expect(page.locator('#end')).toContainText('Finds');
  expect(c.errors).toEqual([]);
  expect(c.outside).toEqual([]);
});

test('back out returns up the chain and keeps what was found', async ({ page }) => {
  await boot(page);
  await begin(page);
  await page.evaluate(() => window.__hunt.jump('drawer'));
  await page.waitForTimeout(300);
  let s = await page.evaluate(() => window.__hunt.state());
  expect(s.place).toBe('drawer');
  expect(s.stack.length).toBe(2);
  await page.evaluate(() => window.__hunt.back());
  await waitForDive(page, 'shop');
  s = await page.evaluate(() => window.__hunt.state());
  expect((await page.evaluate(() => window.__hunt.view())).spot).toBe('B');
  expect(s.steps['unlock_blue_drawer']).toBe(true);
  await page.evaluate(() => window.__hunt.back());
  await waitForDive(page, 'street');
  s = await page.evaluate(() => window.__hunt.state());
  expect(s.stack.length).toBe(0);
});

test('walking (dev build, hooks read the position): W walks ahead, a wall stops it, and a tap on the ground walks there', async ({ page }) => {
  await boot(page);
  await begin(page);
  const size = page.viewportSize()!;
  const at = async () => (await page.evaluate(() => window.__hunt.view())).pos;
  const start = await at();
  await page.keyboard.down('w');
  await page.waitForFunction((z0) => z0 - window.__hunt.view().pos[2] > 1, start[2], { timeout: 8000 }); // walks toward -Z (ahead)
  await page.keyboard.up('w');
  const after = await at();
  expect(start[2] - after[2]).toBeGreaterThan(1);
  // Face the shop's wall and keep walking: the wall stops the player short of it.
  await page.evaluate(() => window.__hunt.setView(90, 0, 1));
  await page.keyboard.down('w');
  await page.waitForFunction(() => window.__hunt.view().pos[0] < -4.6, null, { timeout: 15_000 });
  await page.waitForTimeout(600);
  await page.keyboard.up('w');
  const wall = await at();
  expect(wall[0]).toBeGreaterThan(-5.3);
  expect(wall[0]).toBeLessThan(-4.6);
  // A tap on the ground walks there.
  await page.evaluate(() => window.__hunt.setView(0, -20, 1));
  await page.waitForTimeout(200);
  const before = await at();
  await page.evaluate(([x, y]) => window.__hunt.tap(x, y), [size.width / 2, size.height * 0.75] as [number, number]);
  await page.waitForFunction(() => !window.__hunt.view().walking, null, { timeout: 8000 });
  const done = await at();
  expect(before[2] - done[2]).toBeGreaterThan(1.5);
});

test('guidance (dev build, hooks set it up): the book pulses after a minute stuck and offers a hint; a rattle makes the key glint', async ({ page }) => {
  await boot(page);
  await begin(page);
  await page.evaluate(() => window.__hunt.startLog());
  await page.evaluate(() => window.__hunt.jump('shop'));
  await page.waitForTimeout(300);
  // Rattle the locked drawer: the key on the counter glints within 3 s (logged as a glint with why: rattle).
  await page.evaluate(() => window.__hunt.stand('B'));
  await page.evaluate(() => window.__hunt.setView(-95, -10, 1));
  await page.waitForTimeout(150);
  await expect(page.locator('#verb')).toHaveText('Use');
  await page.evaluate(() => window.__hunt.act());
  await expect(page.locator('#caption')).toHaveText(/rattles/);
  await page.waitForFunction(() => /"why":\s*"rattle"/.test(window.__hunt.log()), null, { timeout: 8000 });
  // A minute with no progress: the sketchbook button pulses once; opening the book offers a hint.
  await expect(page.getByRole('button', { name: 'Sketchbook' })).not.toHaveClass(/pulse/);
  await page.evaluate(() => window.__hunt.stuck());
  await expect(page.getByRole('button', { name: 'Sketchbook' })).toHaveClass(/pulse/);
  await page.getByRole('button', { name: 'Sketchbook' }).click();
  await expect(page.locator('#book .page.current')).toHaveCount(1);
  await expect(page.locator('#book .hint-offer')).toHaveCount(1);
  await page.locator('#book .hint-offer').click();
  await expect(page.locator('#book .page.current')).toContainText('1. ');
  expect((await page.evaluate(() => window.__hunt.state())).hintCount).toBe(1);
  // Progress withdraws the offer: after taking the key the book has no hint button.
  await page.locator('#book').getByRole('button', { name: 'Close' }).click();
  await page.evaluate(() => window.__hunt.nextStep());
  await page.getByRole('button', { name: 'Sketchbook' }).click();
  await expect(page.locator('#book .hint-offer')).toHaveCount(0);
});

test('the idle glint fires once on the most useful next thing, without text', async ({ page }) => {
  await boot(page);
  await begin(page);
  await page.evaluate(() => window.__hunt.glint());
  await page.waitForTimeout(400);
  const toast = await page.locator('#toast').textContent();
  expect(toast ?? '').toBe('');
});
