import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const objectsJson = JSON.parse(readFileSync(new URL('../../src/world/objects.json', import.meta.url), 'utf8')) as { objects: Array<{ id: string; at?: [string, number, number, number] }> };

/** [yaw, pitch, spot] of an object placed with `at` (world yaw). */
export function objectAt(id: string): [number, number, string] {
  const o = objectsJson.objects.find((x) => x.id === id);
  if (!o?.at) throw new Error(`no at for ${id}`);
  return [o.at[1], o.at[2], o.at[0]];
}

declare global {
  interface Window {
    __hunt: {
      state(): { place: string; viewpoint: string; steps: Record<string, true>; found: Record<string, true>; items: string[]; ended: boolean; stack: unknown[] };
      view(): { place: string; viewpoint: string; yaw: number; pitch: number; zoom: number };
      setView(yaw: number, pitch: number, zoom: number): void;
      stand(vp: string): void;
      act(): void;
      lens(held: boolean): void;
      jump(place: string): void;
      nextStep(): void;
      holdUp(id: string | null): void;
      back(): void;
      enter(): void;
      diving(): boolean;
      tap(x: number, y: number): void;
      move(dir: 'forward' | 'back' | 'left' | 'right'): void;
      glint(): void;
      freezeDive(t: number | null): void;
      stats(): { calls: number; triangles: number; geometries: number; textures: number };
      frames(): { count: number; median: number; p95: number; p99: number };
      heap(): number | null;
      gc(): void;
      disposeAll(): void;
      sceneCount(): number;
    };
  }
}

export interface Capture {
  errors: string[];
  outside: string[];
}

/** Attach console and request listeners. Errors are console errors and page errors; GPU driver warnings are not errors. */
export function capture(page: Page, origin: string): Capture {
  const c: Capture = { errors: [], outside: [] };
  page.on('console', (m) => {
    if (m.type() === 'error') c.errors.push(m.text());
  });
  page.on('pageerror', (e) => c.errors.push(e.message));
  page.on('request', (r) => {
    if (!r.url().startsWith(origin)) c.outside.push(r.url());
  });
  return c;
}

export async function boot(page: Page, query = '?debug=1&test=1'): Promise<void> {
  await page.goto('/' + query);
  await page.waitForFunction(() => document.querySelector('#title.show') !== null, null, { timeout: 30_000 });
}

export async function begin(page: Page): Promise<void> {
  await page.getByRole('button', { name: /Begin|Continue/ }).click();
  await page.waitForFunction(() => document.querySelector('#title.show') === null);
}

export async function waitForDive(page: Page, place: string): Promise<void> {
  await page.waitForFunction((p) => !window.__hunt.diving() && window.__hunt.state().place === p, place, { timeout: 15_000 });
}

export const world = {
  order: ['street', 'shop', 'drawer', 'cat', 'eye', 'moon', 'street_night'],
};
