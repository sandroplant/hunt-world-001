// The sleeping shop cat: a curled ginger tabby (fur mound, head resting at the front with ears up, tail wrapped
// round the front, tucked paws). Stripes are drawn on canvas; the fur is soft (rough, with sheen).
import * as THREE from 'three';
import type { KitBuilder } from './types';
import { Owned, rng } from './util';
import { blotches, fit, hi, ownedCanvas, specks, varTube } from './shop_util';

const GINGER = '#cf8b4a';
const DARK = 'rgba(120,56,20,0.78)';
const CREAM = '#f1d9b0';

function furBase(ctx: CanvasRenderingContext2D, w: number, h: number, r: () => number, base = GINGER): void {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  blotches(ctx, w, h, r, 60, ['rgba(255,200,130,0.18)', 'rgba(120,50,10,0.12)'], w * 0.01, w * 0.06);
}

function furStrands(ctx: CanvasRenderingContext2D, w: number, h: number, r: () => number, n: number): void {
  specks(ctx, w, h, r, n, (x) => (x < 0.5 ? `rgba(100,40,10,${0.1 + x * 0.25})` : `rgba(255,225,170,${(x - 0.5) * 0.35})`), 4, Math.PI / 2 + (r() - 0.5) * 0.3);
}

/** A wavy dark band from (x, y0) down to y1, tapering. */
function stripe(ctx: CanvasRenderingContext2D, x: number, y0: number, y1: number, wid: number, r: () => number): void {
  const n = 12;
  const ph = r() * 6;
  const amp = wid * (0.6 + r() * 0.6);
  const left: [number, number][] = [];
  const right: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const y = y0 + (y1 - y0) * t;
    const cx = x + Math.sin(t * 5 + ph) * amp;
    const ww = wid * (1 - t * 0.75) * (0.8 + 0.4 * Math.sin(t * 9 + ph));
    left.push([cx - ww / 2, y]);
    right.push([cx + ww / 2, y]);
  }
  ctx.beginPath();
  ctx.moveTo(left[0]![0], left[0]![1]);
  for (const [px, py] of left) ctx.lineTo(px, py);
  for (const [px, py] of right.reverse()) ctx.lineTo(px, py);
  ctx.closePath();
  ctx.fill();
}

function bodyFur(ctx: CanvasRenderingContext2D, w: number, h: number, r: () => number): void {
  furBase(ctx, w, h, r);
  // Underside cream (sphere v: canvas bottom is the underside).
  const g = ctx.createLinearGradient(0, h * 0.62, 0, h * 0.85);
  g.addColorStop(0, 'rgba(241,217,176,0)');
  g.addColorStop(1, 'rgba(241,217,176,1)');
  ctx.fillStyle = g;
  ctx.fillRect(0, h * 0.62, w, h * 0.38);
  // A darker saddle over the top, then broken stripes running down the sides from it.
  const sad = ctx.createLinearGradient(0, 0, 0, h * 0.3);
  sad.addColorStop(0, 'rgba(150,72,26,0.55)');
  sad.addColorStop(1, 'rgba(150,72,26,0)');
  ctx.fillStyle = sad;
  ctx.fillRect(0, 0, w, h * 0.3);
  ctx.fillStyle = DARK;
  const n = 24;
  for (let i = 0; i < n; i++) {
    const x = ((i + r() * 0.4) / n) * w;
    const y0 = h * (0.08 + r() * 0.08);
    const mid = h * (0.3 + r() * 0.08);
    stripe(ctx, x, y0, mid, (w / n) * 0.4, r);
    stripe(ctx, x + (w / n) * 0.25, mid + h * 0.02, h * (0.58 + r() * 0.08), (w / n) * 0.32, r);
  }
  furStrands(ctx, w, h, r, 9000);
}

function headFur(ctx: CanvasRenderingContext2D, w: number, h: number, r: () => number): void {
  furBase(ctx, w, h, r);
  const fx = w * 0.25;
  const ey = h * 0.47;
  // Cream round the lower face.
  const g = ctx.createRadialGradient(fx, h * 0.62, 0, fx, h * 0.62, w * 0.12);
  g.addColorStop(0, CREAM);
  g.addColorStop(0.7, 'rgba(241,217,176,0.8)');
  g.addColorStop(1, 'rgba(241,217,176,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const ch = ctx.createLinearGradient(0, h * 0.7, 0, h);
  ch.addColorStop(0, 'rgba(241,217,176,0)');
  ch.addColorStop(1, 'rgba(241,217,176,1)');
  ctx.fillStyle = ch;
  ctx.fillRect(0, h * 0.7, w, h * 0.3);
  ctx.fillStyle = DARK;
  // Forehead "M" and stripes over the crown and round the back of the head.
  for (const dx of [-0.045, -0.015, 0.015, 0.045]) stripe(ctx, fx + dx * w, h * 0.1, h * 0.36, w * 0.014, r);
  for (let i = 0; i < 12; i++) {
    const x = fx + w * 0.1 + (i / 12) * w * 0.8;
    stripe(ctx, x, h * 0.05, h * 0.6, w * 0.022, r);
  }
  // Cheek stripes.
  ctx.strokeStyle = DARK;
  ctx.lineCap = 'round';
  for (const s of [-1, 1]) {
    for (const k of [0, 1]) {
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(fx + s * w * 0.06, ey + h * (0.04 + k * 0.06));
      ctx.quadraticCurveTo(fx + s * w * 0.09, ey + h * (0.02 + k * 0.06), fx + s * w * 0.12, ey + h * (0.05 + k * 0.06));
      ctx.stroke();
    }
  }
  // Closed eyes: dark curved lids.
  ctx.strokeStyle = '#2a140a';
  ctx.lineWidth = 6;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(fx + s * w * 0.018, ey);
    ctx.quadraticCurveTo(fx + s * w * 0.04, ey + h * 0.045, fx + s * w * 0.064, ey - h * 0.01);
    ctx.stroke();
  }
  furStrands(ctx, w, h, r, 3000);
}

function tailFur(ctx: CanvasRenderingContext2D, w: number, h: number, r: () => number): void {
  furBase(ctx, w, h, r);
  ctx.fillStyle = DARK;
  // Rings along the tail (u runs along it), the tip dark.
  const n = 9;
  for (let i = 0; i < n; i++) {
    const x = ((i + 0.6) / (n + 1)) * w;
    const ww = (w / (n + 1)) * 0.42;
    ctx.beginPath();
    ctx.moveTo(x - ww / 2, 0);
    ctx.bezierCurveTo(x - ww, h * 0.3, x + ww * 0.2, h * 0.7, x - ww / 2, h);
    ctx.lineTo(x + ww / 2, h);
    ctx.bezierCurveTo(x + ww * 1.2, h * 0.7, x, h * 0.3, x + ww / 2, 0);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillRect(w * 0.93, 0, w * 0.07, h);
  furStrands(ctx, w, h, r, 2000);
}

/** A unit sphere geometry deformed by a function of its unit-sphere point. */
function blob(ws: number, hs: number, f: (p: THREE.Vector3) => THREE.Vector3): THREE.SphereGeometry {
  const g = new THREE.SphereGeometry(1, ws, hs);
  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  const p = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    const q = f(p.clone());
    pos.setXYZ(i, q.x, q.y, q.z);
  }
  g.computeVertexNormals();
  return g;
}

export const cat_sleeping: KitBuilder = async (size, opts) => {
  const o = new Owned();
  const r = rng(opts.seed * 61 + 11);
  const fur = (map: THREE.Texture, sheen = '#ffb878'): THREE.MeshPhysicalMaterial =>
    o.mat(new THREE.MeshPhysicalMaterial({ map, roughness: 0.92, sheen: 0.7, sheenRoughness: 0.55, sheenColor: new THREE.Color(sheen) }));
  const bodyM = fur(ownedCanvas(o, 1024, 512, (ctx, w, h) => bodyFur(ctx, w, h, r)));
  const headM = fur(ownedCanvas(o, 512, 256, (ctx, w, h) => headFur(ctx, w, h, r)));
  const tailM = fur(ownedCanvas(o, 512, 64, (ctx, w, h) => tailFur(ctx, w, h, r)));
  const creamM = fur(
    ownedCanvas(o, 128, 128, (ctx, w, h) => {
      furBase(ctx, w, h, r, CREAM);
      furStrands(ctx, w, h, r, 500);
    }),
    '#fff0d8',
  );
  const pink = o.mat(new THREE.MeshPhysicalMaterial({ color: '#d98f86', roughness: 0.7, sheen: 0.4, sheenColor: new THREE.Color('#ffc8c0') }));
  const g = new THREE.Group();
  const floor = 0.006;
  const soft = (q: THREE.Vector3): THREE.Vector3 => {
    if (q.y < floor) q.y = floor + (q.y - floor) * 0.12;
    return q;
  };

  // Body: an egg-shaped fur mound, fuller at the rump (+X), a dip at the front-left where the head lies.
  const body = o.mesh(
    blob(hi(opts, 36, 20), hi(opts, 22, 12), (p) => {
      const rx = 0.2 * (1 + 0.1 * Math.max(0, p.x));
      const q = new THREE.Vector3(0.025 + p.x * rx, 0.085 + p.y * 0.092, -0.025 + p.z * 0.155);
      q.y -= 0.02 * Math.max(0, -p.x) * Math.max(0, p.z) * Math.max(0, p.y);
      return soft(q);
    }),
    bodyM,
  );
  body.rotation.y = 0.05;
  g.add(body);
  // Haunch: the folded hind leg on the right side, its pole turned outward so the stripes ring it.
  const haunch = o.mesh(
    blob(hi(opts, 18, 10), hi(opts, 12, 8), (p) => new THREE.Vector3(p.x * 0.07, p.y * 0.035, p.z * 0.075)),
    bodyM,
  );
  haunch.position.set(0.15, 0.078, 0.062);
  haunch.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0.45, 0.3, 0.85).normalize());
  g.add(haunch);

  // Tail: from the rump round the front, tip under the chin.
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.2, 0.06, -0.03),
    new THREE.Vector3(0.225, 0.032, 0.07),
    new THREE.Vector3(0.17, 0.026, 0.155),
    new THREE.Vector3(0.05, 0.024, 0.185),
    new THREE.Vector3(-0.07, 0.024, 0.18),
    new THREE.Vector3(-0.16, 0.026, 0.14),
  ]);
  g.add(o.mesh(varTube(tailCurve, hi(opts, 36, 18), hi(opts, 9, 6), (t) => [0.028 * (1 - t * 0.35), 0.024 * (1 - t * 0.35)], 0.002), tailM));

  // Front paws tucked under the chin.
  for (const [x, z, a] of [
    [-0.095, 0.13, 0.6],
    [-0.045, 0.142, 0.35],
  ] as const) {
    const paw = o.mesh(
      blob(hi(opts, 12, 8), hi(opts, 8, 6), (p) => soft(new THREE.Vector3(p.x * 0.024, 0.017 + p.y * 0.017, p.z * 0.04))),
      creamM,
    );
    paw.position.set(x, 0, z);
    paw.rotation.y = a;
    g.add(paw);
  }

  // Head: resting at the front-left, face turned toward the front and the tail, slightly rolled.
  const head = new THREE.Group();
  head.position.set(-0.11, 0.105, 0.08);
  head.rotation.set(0.25, 0.55, 0.2);
  g.add(head);
  const skull = o.mesh(new THREE.SphereGeometry(0.078, hi(opts, 28, 16), hi(opts, 18, 10)), headM);
  skull.scale.set(1.08, 0.9, 0.95);
  head.add(skull);
  const muzzle = o.mesh(new THREE.SphereGeometry(0.032, hi(opts, 14, 10), hi(opts, 10, 6)), creamM);
  muzzle.scale.set(1.15, 0.72, 0.8);
  muzzle.position.set(0, -0.026, 0.055);
  head.add(muzzle);
  const nose = o.mesh(new THREE.SphereGeometry(0.008, 8, 6), pink);
  nose.scale.set(1.2, 0.7, 0.8);
  nose.position.set(0, -0.012, 0.079);
  head.add(nose);
  for (const s of [-1, 1]) {
    const ear = o.mesh(new THREE.ConeGeometry(0.034, 0.06, hi(opts, 10, 6)), headM);
    ear.scale.set(1, 1, 0.42);
    ear.position.set(s * 0.044, 0.064, -0.008);
    ear.rotation.set(-0.15, s * -0.25, s * -0.38);
    head.add(ear);
    const inner = o.mesh(new THREE.ConeGeometry(0.02, 0.036, hi(opts, 8, 5)), pink);
    inner.scale.set(1, 1, 0.3);
    inner.position.set(s * 0.044, 0.059, 0.0);
    inner.rotation.copy(ear.rotation);
    head.add(inner);
  }
  return o.item(fit(g, size));
};
