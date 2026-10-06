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
  if (p.rows) return rowInstances(p, n, baseRot, rand);
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

/** Books on shelves: packed side by side along each row, a little varied in width, height and lean. */
function rowInstances(p: PropData, n: number, baseRot: Vec3, rand: () => number): PropInstance[] {
  const r = p.rows!;
  const axis = r.along === 'x' ? 0 : 2;
  const gap = r.gap ?? 0.004;
  const out: PropInstance[] = [];
  const perRow = Math.ceil(n / r.y.length);
  for (const y of r.y) {
    let cursor = -r.length / 2;
    for (let k = 0; k < perRow && out.length < n; k++) {
      const size: Vec3 = [p.size[0], p.size[1] * (0.82 + rand() * 0.22), p.size[2]];
      size[axis] = p.size[axis] * (0.7 + rand() * 0.6);
      if (cursor + size[axis] > r.length / 2) break;
      // Now and then a gap on the shelf.
      if (rand() < 0.08) cursor += p.size[axis] * 1.5;
      const pos: Vec3 = [p.pos[0], p.pos[1] + y + size[1] / 2, p.pos[2]];
      pos[axis] += cursor + size[axis] / 2;
      if (pos[axis] - p.pos[axis] + size[axis] / 2 > r.length / 2) break;
      cursor += size[axis] + gap;
      const lean = (rand() * 2 - 1) * 2.5;
      const rot: Vec3 = axis === 2 ? [baseRot[0] + lean, baseRot[1], baseRot[2]] : [baseRot[0], baseRot[1], baseRot[2] + lean];
      out.push({ pos, size, rot, paletteIndex: p.palette ? Math.floor(rand() * p.palette.length) : 0 });
    }
  }
  return out;
}
