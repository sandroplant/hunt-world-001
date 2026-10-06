// Helpers for the shop kit builders: fitting a design into its box, wood with UVs in metres, lathes, rods, varying
// tubes, canvas drawing bits (paper, leather, noise) and a material flag that ignores per-instance tint.
import * as THREE from 'three';
import type { TextureSet } from '../assets';
import { texturedMaterial } from '../assets';
import type { KitOptions } from './types';
import { Owned, canvasTexture } from './util';

export type Size = [number, number, number];
export type Grain = 'x' | 'y' | 'z';

export const hi = (opts: KitOptions, h: number, l: number): number => (opts.quality === 'high' ? h : l);

/**
 * Wraps a design built in its own metres into a group that fits `size`: uniform scale (never stretched), centred in
 * x/z (or the back on -Z for wall things) and resting on the bottom of the box (or centred in y).
 */
export function fit(design: THREE.Object3D, size: Size, anchor: { y?: 'bottom' | 'centre'; z?: 'centre' | 'back' } = {}, box?: THREE.Box3): THREE.Group {
  const inner = new THREE.Group();
  inner.add(design);
  inner.updateMatrixWorld(true);
  const b = box ?? new THREE.Box3().setFromObject(inner, true);
  const e = b.getSize(new THREE.Vector3());
  const c = b.getCenter(new THREE.Vector3());
  const s = Math.min(size[0] / Math.max(e.x, 1e-6), size[1] / Math.max(e.y, 1e-6), size[2] / Math.max(e.z, 1e-6));
  inner.scale.setScalar(s);
  inner.position.set(-c.x * s, -c.y * s, -c.z * s);
  if ((anchor.y ?? 'bottom') === 'bottom') inner.position.y = -size[1] / 2 - b.min.y * s;
  if (anchor.z === 'back') inner.position.z = -size[2] / 2 - b.min.z * s;
  const outer = new THREE.Group();
  outer.add(inner);
  return outer;
}

/** A pack wood (or plaster) material whose geometry UVs are already in tiles (repeat 1), maybe turned 90°. */
export function woodMat(o: Owned, set: TextureSet, opt: { color?: string; rough?: number; rot?: boolean } = {}): THREE.MeshStandardMaterial {
  const m = o.mat(texturedMaterial(set, 1, 1, { color: opt.color, rough: opt.rough }));
  for (const t of [m.map, m.normalMap, m.aoMap, m.roughnessMap, m.metalnessMap]) {
    if (!t) continue;
    o.tex(t);
    if (opt.rot) {
      t.center.set(0.5, 0.5);
      t.rotation = Math.PI / 2;
    }
  }
  return m;
}

/** A box whose UVs are in texture tiles (metres / tile) with the planks' grain running along `grain`. */
export function woodBox(w: number, h: number, d: number, tile: number, grain: Grain, off: [number, number] = [0, 0]): THREE.BoxGeometry {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.getAttribute('uv') as THREE.BufferAttribute;
  // Face order px, nx, py, ny, pz, nz; each face's u and v axes and their lengths.
  const faces: [Grain, number, Grain, number][] = [
    ['z', d, 'y', h],
    ['z', d, 'y', h],
    ['x', w, 'z', d],
    ['x', w, 'z', d],
    ['x', w, 'y', h],
    ['x', w, 'y', h],
  ];
  const per = uv.count / 6;
  for (let f = 0; f < 6; f++) {
    const [ua, U, va, V] = faces[f]!;
    for (let i = f * per; i < (f + 1) * per; i++) {
      const u = uv.getX(i);
      const v = uv.getY(i);
      if (grain === va && grain !== ua) uv.setXY(i, (v * V) / tile + off[0], (u * U) / tile + off[1]);
      else uv.setXY(i, (u * U) / tile + off[0], (v * V) / tile + off[1]);
    }
  }
  uv.needsUpdate = true;
  return g;
}

/** Scales (and offsets) a geometry's UVs, optionally swapping u and v first (grain along a lathe's axis). */
export function scaleUV(g: THREE.BufferGeometry, su: number, sv: number, swap = false, off: [number, number] = [0, 0]): THREE.BufferGeometry {
  const uv = g.getAttribute('uv') as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) {
    let u = uv.getX(i);
    let v = uv.getY(i);
    if (swap) [u, v] = [v, u];
    uv.setXY(i, u * su + off[0], v * sv + off[1]);
  }
  uv.needsUpdate = true;
  return g;
}

/** A lathe from [radius, y] pairs. */
export function lathe(pts: [number, number][], segs: number, phiStart = 0, phiLength = Math.PI * 2): THREE.LatheGeometry {
  return new THREE.LatheGeometry(
    pts.map(([r, y]) => new THREE.Vector2(Math.max(0, r), y)),
    segs,
    phiStart,
    phiLength,
  );
}

/** A cylinder running from a to b. */
export function rod(o: Owned, a: THREE.Vector3, b: THREE.Vector3, r: number, mat: THREE.Material, segs = 6, r2 = r): THREE.Mesh {
  const len = a.distanceTo(b);
  const m = o.mesh(new THREE.CylinderGeometry(r2, r, len, segs, 1), mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return m;
}

/**
 * A tube along a curve with a varying elliptical cross-section: radius(t) gives [side, up] radii. UV u runs along the
 * curve (0..1), v around it (0 at the outer side, 0.25 on top). `floor` flattens anything below that height.
 */
export function varTube(curve: THREE.Curve<THREE.Vector3>, n: number, radial: number, radius: (t: number) => [number, number], floor = -Infinity, closeEnds = true): THREE.BufferGeometry {
  const pos: number[] = [];
  const uvs: number[] = [];
  const idx: number[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const c = curve.getPointAt(t);
    const T = curve.getTangentAt(t).normalize();
    const side = new THREE.Vector3().crossVectors(T, up);
    if (side.lengthSq() < 1e-8) side.set(1, 0, 0);
    side.normalize();
    const nrm = new THREE.Vector3().crossVectors(side, T).normalize();
    const [rs, ru] = radius(t);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const p = c.clone().addScaledVector(side, Math.cos(a) * rs).addScaledVector(nrm, Math.sin(a) * ru);
      if (p.y < floor) p.y = floor + (p.y - floor) * 0.08;
      pos.push(p.x, p.y, p.z);
      uvs.push(t, j / radial);
    }
  }
  const row = radial + 1;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * row + j;
      const b = a + row;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  if (closeEnds) {
    for (const [ri, t] of [
      [0, 0],
      [n, 1],
    ] as const) {
      const c = curve.getPointAt(t);
      const ci = pos.length / 3;
      pos.push(c.x, Math.max(c.y, floor), c.z);
      uvs.push(t, 0.5);
      for (let j = 0; j < radial; j++) {
        const a = ri * row + j;
        if (ri === 0) idx.push(ci, a + 1, a);
        else idx.push(ci, a, a + 1);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Brass: metalness 1, a warm yellow, polished by default. */
export function brass(o: Owned, rough = 0.3): THREE.MeshStandardMaterial {
  return o.mat(new THREE.MeshStandardMaterial({ color: '#dcae58', metalness: 1, roughness: rough }));
}

/** A canvas texture owned by the item. Linear (not sRGB) when it is a data mask. */
export function ownedCanvas(o: Owned, w: number, h: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, data = false): THREE.CanvasTexture {
  const t = o.tex(canvasTexture(w, h, draw));
  if (data) t.colorSpace = THREE.NoColorSpace;
  return t;
}

/** Soft random blotches (mottling) of the given rgba colours. */
export function blotches(ctx: CanvasRenderingContext2D, w: number, h: number, rnd: () => number, n: number, colors: string[], rmin: number, rmax: number): void {
  for (let i = 0; i < n; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const r = rmin + rnd() * (rmax - rmin);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, colors[Math.floor(rnd() * colors.length)]!);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

/** Tiny specks/fibres. */
export function specks(ctx: CanvasRenderingContext2D, w: number, h: number, rnd: () => number, n: number, color: (r: number) => string, len = 2, angle?: number): void {
  for (let i = 0; i < n; i++) {
    ctx.strokeStyle = color(rnd());
    ctx.lineWidth = 1;
    const x = rnd() * w;
    const y = rnd() * h;
    const a = angle ?? rnd() * Math.PI * 2;
    const l = len * (0.5 + rnd());
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    ctx.stroke();
  }
}

/** Aged paper: a base colour, blotchy stains and darker edges. */
export function paper(ctx: CanvasRenderingContext2D, w: number, h: number, rnd: () => number, base = '#eadbb4'): void {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  blotches(ctx, w, h, rnd, 40, ['rgba(150,100,40,0.10)', 'rgba(255,245,220,0.12)', 'rgba(120,80,30,0.07)'], w * 0.03, w * 0.18);
  specks(ctx, w, h, rnd, Math.floor((w * h) / 400), (r) => `rgba(90,60,20,${0.05 + r * 0.08})`, 1.5);
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(100,60,20,0.35)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** Leather: base colour, mottling, fine grain and lighter wear. */
export function leather(ctx: CanvasRenderingContext2D, w: number, h: number, rnd: () => number, base: string): void {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  blotches(ctx, w, h, rnd, 120, ['rgba(0,0,0,0.16)', 'rgba(255,220,170,0.07)', 'rgba(0,0,0,0.10)'], w * 0.01, w * 0.09);
  specks(ctx, w, h, rnd, Math.floor((w * h) / 60), (r) => (r < 0.5 ? `rgba(0,0,0,${0.06 + r * 0.1})` : `rgba(255,230,200,${(r - 0.5) * 0.1})`), 2);
}

/** Lines of grey "text" in a block. */
export function textLines(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, lh: number, rnd: () => number, color = 'rgba(40,30,20,0.7)'): void {
  ctx.fillStyle = color;
  let yy = y;
  let n = 0;
  while (yy + lh * 0.5 < y + h) {
    const end = rnd() < 0.12 ? w * (0.3 + rnd() * 0.5) : w;
    let xx = x + (n === 0 ? w * 0.06 : 0);
    while (xx < x + end) {
      const word = lh * (0.5 + rnd() * 1.6);
      ctx.fillRect(xx, yy, Math.min(word, x + end - xx), Math.max(2, lh * 0.32));
      xx += word + lh * 0.35;
    }
    n = end < w ? 0 : n + 1;
    yy += lh;
  }
}

/** Makes a material ignore an InstancedMesh's per-instance colour (labels, pages, clear glass). */
export function untinted<T extends THREE.Material>(m: T): T {
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace('#include <color_vertex>', THREE.ShaderChunk.color_vertex.replace('vColor.rgb *= instanceColor.rgb;', ''));
  };
  m.customProgramCacheKey = () => 'kit-untinted';
  return m;
}

/** A five-pointed star path. */
export function starPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, inner = 0.45): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * inner;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}
