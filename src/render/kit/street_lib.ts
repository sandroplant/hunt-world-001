// Helpers for the street kit builders: fitting to the box, seeded noise, pixel and canvas textures, grid
// geometry and the common surfaces (iron, brass, paint, cloth, rope, cork, wood from the pack).
import * as THREE from 'three';
import { texturedMaterial, type TextureSet } from '../assets';
import { canvasTexture, type Owned } from './util';
import type { KitOptions } from './types';

export type Size3 = [number, number, number];
export type Align = 'min' | 'center' | 'max';
export type RGB = [number, number, number];

/** Segment count by quality. */
export const q = (opts: KitOptions, hi: number, lo: number): number => (opts.quality === 'high' ? hi : lo);

/**
 * Scale `content` uniformly so it fits `size` (axes flagged in `ignore` do not limit the scale) and align it in
 * the box: 'min' puts it against the low side (bottom, back), 'max' the high side, 'center' in the middle.
 */
export function fit(content: THREE.Object3D, size: Size3, align: [Align, Align, Align] = ['center', 'min', 'center'], ignore: [boolean, boolean, boolean] = [false, false, false]): THREE.Group {
  content.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(content, true);
  const ext = box.getSize(new THREE.Vector3());
  let s = Infinity;
  for (let i = 0; i < 3; i++) {
    const e = ext.getComponent(i);
    if (!ignore[i] && e > 1e-6) s = Math.min(s, size[i]! / e);
  }
  if (!Number.isFinite(s)) s = 1;
  const inner = new THREE.Group();
  inner.add(content);
  inner.scale.setScalar(s);
  for (let i = 0; i < 3; i++) {
    const lo = box.min.getComponent(i) * s;
    const hi = box.max.getComponent(i) * s;
    const half = size[i]! / 2;
    const a = align[i];
    inner.position.setComponent(i, a === 'min' ? -half - lo : a === 'max' ? half - hi : -(lo + hi) / 2);
  }
  const outer = new THREE.Group();
  outer.add(inner);
  return outer;
}

// ---- maths -------------------------------------------------------------------------------------------------

export const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const smooth = (e0: number, e1: number, x: number): number => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
export const mix3 = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const mul3 = (a: RGB, k: number): RGB => [a[0] * k, a[1] * k, a[2] * k];
export function hex(c: string): RGB {
  const n = parseInt(c.replace('#', ''), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
/** Shift a hex colour's lightness a little (for seeded variation). */
export function shade(c: string, k: number): string {
  const col = new THREE.Color(c);
  col.offsetHSL(0, 0, k);
  return `#${col.getHexString()}`;
}

/** Seeded 2D value noise in [0, 1]; `px`/`py` make it tile with that lattice period. */
export function noise2(seed: number): (x: number, y: number, px?: number, py?: number) => number {
  const h = (ix: number, iy: number): number => {
    const s = Math.sin(ix * 127.1 + iy * 311.7 + seed * 74.7) * 43758.5453;
    return s - Math.floor(s);
  };
  return (x, y, px = 0, py = 0) => {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    const wx = (a: number): number => (px ? ((a % px) + px) % px : a);
    const wy = (a: number): number => (py ? ((a % py) + py) % py : a);
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const a = h(wx(x0), wy(y0));
    const b = h(wx(x0 + 1), wy(y0));
    const c = h(wx(x0), wy(y0 + 1));
    const d = h(wx(x0 + 1), wy(y0 + 1));
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
}

export type Noise = ReturnType<typeof noise2>;

/** Fractal noise (tiles when `p` > 0: the base lattice period). */
export function fbm(n: Noise, x: number, y: number, oct = 4, p = 0): number {
  let s = 0;
  let a = 0.5;
  let f = 1;
  let norm = 0;
  for (let i = 0; i < oct; i++) {
    s += a * n(x * f, y * f, p * f, p * f);
    norm += a;
    a *= 0.5;
    f *= 2;
  }
  return s / norm;
}

// ---- textures ----------------------------------------------------------------------------------------------

function wrap(t: THREE.Texture, repeat?: [number, number]): void {
  if (!repeat) return;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
}

/**
 * A texture computed per pixel. `fn` gets UV coordinates (u right, v up, as the mesh sees them) and returns
 * sRGB colour 0..1 (optionally with alpha). Owned by `o`.
 */
export function pixelTex(o: Owned, w: number, h: number, fn: (u: number, v: number) => number[], opts: { repeat?: [number, number]; linear?: boolean } = {}): THREE.CanvasTexture {
  const t = canvasTexture(w, h, (ctx) => {
    const img = ctx.createImageData(w, h);
    const d = img.data;
    for (let y = 0; y < h; y++) {
      const v = 1 - (y + 0.5) / h;
      for (let x = 0; x < w; x++) {
        const c = fn((x + 0.5) / w, v);
        const k = (y * w + x) * 4;
        d[k] = clamp01(c[0] ?? 0) * 255;
        d[k + 1] = clamp01(c[1] ?? 0) * 255;
        d[k + 2] = clamp01(c[2] ?? 0) * 255;
        d[k + 3] = clamp01(c[3] ?? 1) * 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  });
  if (opts.linear) t.colorSpace = THREE.NoColorSpace;
  wrap(t, opts.repeat);
  return o.tex(t);
}

/** A texture drawn with the 2D canvas API (canvas y runs down, so canvas top = UV v 1). Owned by `o`. */
export function drawTex(o: Owned, w: number, h: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, repeat?: [number, number]): THREE.CanvasTexture {
  const t = canvasTexture(w, h, draw);
  wrap(t, repeat);
  return o.tex(t);
}

/** Multiply every pixel by seeded noise (chalk grain, paper fibre, paint wear). */
export function grain(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number, amount: number, onlyBright = false): void {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  let s = seed >>> 0 || 1;
  for (let k = 0; k < d.length; k += 4) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const r = s / 4294967296;
    if (onlyBright && d[k]! + d[k + 1]! + d[k + 2]! < 240) continue;
    const f = 1 - amount * r;
    d[k] = d[k]! * f;
    d[k + 1] = d[k + 1]! * f;
    d[k + 2] = d[k + 2]! * f;
  }
  ctx.putImageData(img, 0, 0);
}

// ---- surfaces ----------------------------------------------------------------------------------------------

/** A pack texture material whose cloned maps are owned (and freed) by this item. */
export function woodMat(o: Owned, set: TextureSet, rx: number, ry: number, opts: { color?: string; rough?: number } = {}): THREE.MeshStandardMaterial {
  const m = texturedMaterial(set, rx, ry, opts);
  for (const t of [m.map, m.normalMap, m.aoMap, m.roughnessMap, m.metalnessMap]) if (t) o.tex(t);
  return o.mat(m);
}

/** Dark wrought/cast iron with grime and rust blooms. */
export function ironMat(o: Owned, seed: number, repeat: [number, number] = [1, 1], rust = 0.35, tint = '#ffffff'): THREE.MeshStandardMaterial {
  const n = noise2(seed);
  const map = pixelTex(
    o,
    128,
    128,
    (u, v) => {
      const f = fbm(n, u * 6, v * 6, 4, 6);
      const r = smooth(0.66 - rust * 0.25, 0.8, fbm(n, u * 8 + 31, v * 8 + 17, 3, 8)) * rust * 2;
      const base = 0.13 + 0.07 * f;
      return [lerp(base, 0.34, r), lerp(base, 0.19, r), lerp(base * 1.05, 0.11, r)];
    },
    { repeat },
  );
  return o.mat(new THREE.MeshStandardMaterial({ map, color: tint, metalness: 0.65, roughness: 0.55 }));
}

/** Brass with soft tarnish. */
export function brassMat(o: Owned, seed: number, rough = 0.3, repeat: [number, number] = [1, 1]): THREE.MeshStandardMaterial {
  const n = noise2(seed + 7);
  const map = pixelTex(
    o,
    128,
    128,
    (u, v) => {
      const t = smooth(0.45, 0.8, fbm(n, u * 5, v * 5, 4, 5)) * 0.55;
      const s = 0.92 + 0.08 * n(u * 64, v * 4, 64, 4);
      return mul3(mix3([0.93, 0.74, 0.42], [0.45, 0.36, 0.2], t), s);
    },
    { repeat },
  );
  return o.mat(new THREE.MeshStandardMaterial({ map, metalness: 1, roughness: rough }));
}

/** Paint over metal or wood, with brush streaks, grime and chips showing `under`. */
export function paintMat(o: Owned, seed: number, color: string, opts: { repeat?: [number, number]; under?: string; chips?: number; rough?: number; metal?: number; streakAlongV?: boolean } = {}): THREE.MeshStandardMaterial {
  const n = noise2(seed + 3);
  const base = hex(color);
  const under = hex(opts.under ?? '#3a3330');
  const chips = opts.chips ?? 0.25;
  const map = pixelTex(
    o,
    256,
    256,
    (u, v) => {
      const a = opts.streakAlongV ? u : v;
      const b = opts.streakAlongV ? v : u;
      const streak = 0.94 + 0.06 * n(a * 90, b * 3, 90, 3);
      const grime = 0.82 + 0.18 * fbm(n, u * 4, v * 4, 4, 4);
      const chip = smooth(0.74 - chips * 0.2, 0.76 - chips * 0.2, fbm(n, u * 12 + 9, v * 12 + 5, 4, 12)) * (chips > 0 ? 1 : 0);
      return mix3(mul3(base, streak * grime), under, chip);
    },
    { repeat: opts.repeat ?? [1, 1] },
  );
  return o.mat(new THREE.MeshStandardMaterial({ map, metalness: opts.metal ?? 0, roughness: opts.rough ?? 0.65 }));
}

/** Woven cloth: `color(u, v)` gives the dye, the weave and wear are added. */
export function clothTex(o: Owned, seed: number, color: (u: number, v: number) => RGB, opts: { w?: number; h?: number; weave?: number; repeat?: [number, number]; dirt?: number } = {}): THREE.CanvasTexture {
  const n = noise2(seed + 11);
  const wv = opts.weave ?? 96;
  const dirt = opts.dirt ?? 0.2;
  return pixelTex(
    o,
    opts.w ?? 256,
    opts.h ?? 256,
    (u, v) => {
      const weave = 0.9 + 0.05 * Math.sin(u * Math.PI * 2 * wv) + 0.05 * Math.sin(v * Math.PI * 2 * wv);
      const g = 1 - dirt * smooth(0.45, 0.85, fbm(n, u * 3, v * 3, 4, 3));
      const fib = 0.96 + 0.04 * n(u * 200, v * 8, 200, 8);
      return mul3(color(u, v), weave * g * fib);
    },
    { repeat: opts.repeat },
  );
}

/** Three-strand rope; one texture tile = one twist pitch along U and the whole round along V. */
export function ropeMat(o: Owned, seed: number, color: string, repeatU: number): THREE.MeshStandardMaterial {
  const n = noise2(seed + 19);
  const c = hex(color);
  const fn = (u: number, v: number): number => {
    const ph = (((u + v) * 3) % 1 + 1) % 1;
    const strand = Math.pow(Math.sin(Math.PI * ph), 0.5);
    const fibre = 0.9 + 0.1 * Math.sin((u - v * 0.6) * Math.PI * 2 * 14);
    return strand * fibre * (0.85 + 0.15 * n(u * 16, v * 16, 16, 16));
  };
  const map = pixelTex(o, 128, 128, (u, v) => mul3(c, 0.35 + 0.75 * fn(u, v)), { repeat: [repeatU, 1] });
  const bump = pixelTex(o, 128, 128, (u, v) => {
    const b = fn(u, v);
    return [b, b, b];
  }, { repeat: [repeatU, 1], linear: true });
  return o.mat(new THREE.MeshStandardMaterial({ map, bumpMap: bump, bumpScale: 2, roughness: 0.9, metalness: 0 }));
}

/** Natural cork with pores. */
export function corkMat(o: Owned, seed: number, repeat: [number, number] = [1, 1]): THREE.MeshStandardMaterial {
  const n = noise2(seed + 23);
  const map = pixelTex(
    o,
    128,
    128,
    (u, v) => {
      const pore = smooth(0.7, 0.8, n(u * 40, v * 40, 40, 40)) * 0.55;
      const t = 0.85 + 0.15 * fbm(n, u * 6, v * 6, 3, 6);
      return mul3(mix3([0.72, 0.53, 0.33], [0.3, 0.2, 0.12], pore), t);
    },
    { repeat },
  );
  return o.mat(new THREE.MeshStandardMaterial({ map, roughness: 0.92, metalness: 0 }));
}

/** Glossy dark eye or enamel bead. */
export function glossMat(o: Owned, color: string, rough = 0.15): THREE.MeshStandardMaterial {
  return o.mat(new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0 }));
}

// ---- geometry ----------------------------------------------------------------------------------------------

/**
 * A (nu x nv) grid surface from `fn(u, v) -> point`. UV is (u, v); the front face is dP/du x dP/dv.
 * `wrapU` averages the normals across the u seam; `poleV0` averages the v = 0 row (a fan centre).
 */
export function gridGeometry(nu: number, nv: number, fn: (u: number, v: number, out: THREE.Vector3) => void, opts: { wrapU?: boolean; poleV0?: boolean; poleV1?: boolean } = {}): THREE.BufferGeometry {
  const cols = nu + 1;
  const pos = new Float32Array(cols * (nv + 1) * 3);
  const uv = new Float32Array(cols * (nv + 1) * 2);
  const p = new THREE.Vector3();
  for (let j = 0; j <= nv; j++) {
    for (let i = 0; i <= nu; i++) {
      const k = j * cols + i;
      fn(i / nu, j / nv, p);
      pos[k * 3] = p.x;
      pos[k * 3 + 1] = p.y;
      pos[k * 3 + 2] = p.z;
      uv[k * 2] = i / nu;
      uv[k * 2 + 1] = j / nv;
    }
  }
  const idx: number[] = [];
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const a = j * cols + i;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      idx.push(a, b, d, a, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setIndex(idx);
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.computeVertexNormals();
  const nrm = g.getAttribute('normal') as THREE.BufferAttribute;
  const avg = (ks: number[]): void => {
    const s = new THREE.Vector3();
    for (const k of ks) s.add(new THREE.Vector3(nrm.getX(k), nrm.getY(k), nrm.getZ(k)));
    s.normalize();
    for (const k of ks) nrm.setXYZ(k, s.x, s.y, s.z);
  };
  if (opts.wrapU) for (let j = 0; j <= nv; j++) avg([j * cols, j * cols + nu]);
  if (opts.poleV0) avg(Array.from({ length: cols }, (_, i) => i));
  if (opts.poleV1) avg(Array.from({ length: cols }, (_, i) => nv * cols + i));
  return g;
}

/** A small boat hull: the lower half of an ellipsoid along X, pinched to a bow at +X. UV v 0.5 = gunwale, 0 = keel. */
export function hullGeometry(L: number, B: number, D: number, segU: number, segV: number): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(1, segU, segV, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  const p = g.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const pinch = x > 0 ? 1 - 0.75 * x * x : 1 - 0.3 * x * x;
    p.setXYZ(i, (x * L) / 2, p.getY(i) * D * (1 - 0.25 * x * x), ((p.getZ(i) * B) / 2) * pinch);
  }
  g.computeVertexNormals();
  return g;
}

/** The deck that closes `hullGeometry` at y = 0. */
export function deckGeometry(L: number, B: number, seg: number): THREE.BufferGeometry {
  const g = new THREE.CircleGeometry(1, seg);
  g.rotateX(-Math.PI / 2);
  const p = g.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const pinch = x > 0 ? 1 - 0.75 * x * x : 1 - 0.3 * x * x;
    p.setXYZ(i, (x * L) / 2, 0, ((p.getZ(i) * B) / 2) * pinch);
  }
  g.computeVertexNormals();
  return g;
}

/** A triangle of cloth (sail, pennant) from a, b, c with a gentle billow along `normal`. UV: u from a, v from b to c. */
export function clothTriangle(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, normal: THREE.Vector3, billow: number, nu: number, nv: number): THREE.BufferGeometry {
  const bc = new THREE.Vector3();
  return gridGeometry(nu, nv, (u, v, out) => {
    bc.copy(b).lerp(c, v);
    out.copy(a).lerp(bc, u);
    out.addScaledVector(normal, billow * Math.sin(Math.PI * u) * Math.sin(Math.PI * Math.min(1, v * 0.9 + 0.05)) * (1 - 0.3 * u));
  });
}
