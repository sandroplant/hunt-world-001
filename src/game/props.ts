// Expands a prop into its placed instances. Pure, so the renderer and the walk map agree on where every piece is.
import type { PropData, Vec3 } from './types';
import { rng } from './geom';

export interface PropInstance {
  pos: Vec3;
  size: Vec3;
  /** Rotation in degrees, XYZ order (Three.js default). */
  rot: Vec3;
  /** Index into the palette, when the prop has one. */
  paletteIndex: number;
}

/** The number of instances shown for a prop at a quality tier. */
export function propCount(p: PropData, quality: 'high' | 'low'): number {
  const count = Math.max(1, p.count ?? 1);
  const dropForLow = quality === 'low' && count > 40 ? 0.5 : 1;
  return Math.max(1, Math.round(count * dropForLow));
}

export function propInstances(p: PropData, quality: 'high' | 'low' = 'high'): PropInstance[] {
  const n = propCount(p, quality);
  const baseRot: Vec3 = [p.rot?.[0] ?? 0, p.rot?.[1] ?? 0, p.rot?.[2] ?? 0];
  if (n === 1) return [{ pos: p.pos, size: p.size, rot: baseRot, paletteIndex: 0 }];
  const rand = rng(p.seed ?? 1);
  const spread = p.spread ?? [0, 0, 0];
  const out: PropInstance[] = [];
  for (let i = 0; i < n; i++) {
    const pos: Vec3 = [p.pos[0] + (rand() * 2 - 1) * spread[0], p.pos[1] + (rand() * 2 - 1) * spread[1], p.pos[2] + (rand() * 2 - 1) * spread[2]];
    const jitter = 0.7 + rand() * 0.6;
    const size: Vec3 = [p.size[0] * jitter, p.size[1] * (0.8 + rand() * 0.4), p.size[2] * jitter];
    const rot: Vec3 = [baseRot[0], baseRot[1] + ((rand() * 0.6 - 0.3) * 180) / Math.PI, baseRot[2]];
    const paletteIndex = p.palette ? Math.floor(rand() * p.palette.length) : 0;
    out.push({ pos, size, rot, paletteIndex });
  }
  return out;
}
