// Street kit, gulls: one sitting (facing +Z), one flying (body along Z, wings along X).
import * as THREE from 'three';
import type { KitBuilder, KitOptions } from './types';
import { Owned, rng } from './util';
import { fbm, fit, glossMat, gridGeometry, hex, mix3, mul3, noise2, pixelTex, q, shade, smooth, type RGB } from './street_lib';

const WHITE: RGB = hex('#ecebe6');
const BLACK: RGB = hex('#18191b');

interface GullParts {
  o: Owned;
  grey: RGB;
  white: THREE.MeshStandardMaterial;
  body: THREE.MeshStandardMaterial;
  beak: THREE.MeshStandardMaterial;
  eye: THREE.MeshStandardMaterial;
  skin: THREE.MeshStandardMaterial;
  sw: number;
  sh: number;
}

/** Materials shared by both gulls. Body texture: sphere turned so its poles lie on Z (u 0.75 = back, 0.25 = belly). */
function gullParts(opts: KitOptions): GullParts {
  const o = new Owned();
  const r = rng(opts.seed);
  const n = noise2(opts.seed);
  const grey = hex(shade('#8d969d', (r() - 0.5) * 0.06));
  const whiteMap = pixelTex(o, 128, 128, (u, v) => mul3(WHITE, 0.9 + 0.1 * fbm(n, u * 16, v * 8, 3, 8) - 0.06 * smooth(0.62, 0.9, n(u * 40, v * 20, 40, 20))));
  const bodyMap = pixelTex(o, 256, 128, (u, v) => {
    const back = smooth(0.2, 0.07, Math.abs(u - 0.75));
    const scal = 0.93 + 0.07 * Math.sin(u * 90) * Math.sin(v * 50);
    return mul3(mix3(WHITE, grey, back), scal * (0.92 + 0.08 * fbm(n, u * 12, v * 6, 3, 6)));
  });
  const beakMap = pixelTex(o, 64, 64, (u, v) => {
    const spot = v > 0.68 && v < 0.84 && (u < 0.14 || u > 0.86) ? 1 : 0;
    return mix3(mul3(hex('#e9c03a'), 0.9 + 0.1 * v), hex('#c8321e'), spot);
  });
  const skinMap = pixelTex(o, 32, 64, (_u, v) => mul3(hex('#e0957a'), 0.82 + 0.18 * Math.abs(Math.sin(v * 40))));
  return {
    o,
    grey,
    white: o.mat(new THREE.MeshStandardMaterial({ map: whiteMap, roughness: 0.85, side: THREE.DoubleSide })),
    body: o.mat(new THREE.MeshStandardMaterial({ map: bodyMap, roughness: 0.85 })),
    beak: o.mat(new THREE.MeshStandardMaterial({ map: beakMap, roughness: 0.45 })),
    eye: glossMat(o, '#121010', 0.12),
    skin: o.mat(new THREE.MeshStandardMaterial({ map: skinMap, roughness: 0.6, side: THREE.DoubleSide })),
    sw: q(opts, 22, 12),
    sh: q(opts, 14, 8),
  };
}

/** An ellipsoid with its poles on Z (texture v 1 = front). */
function ovoid(p: GullParts, m: THREE.Material, rx: number, ry: number, rz: number): THREE.Mesh {
  const g = new THREE.SphereGeometry(1, p.sw, p.sh);
  g.rotateX(Math.PI / 2);
  g.scale(rx, ry, rz);
  return p.o.mesh(g, m);
}

function headAndBeak(p: GullParts, root: THREE.Object3D, at: THREE.Vector3, R: number): void {
  const head = ovoid(p, p.white, R * 0.92, R * 0.95, R * 1.1);
  head.position.copy(at);
  root.add(head);
  const beakG = new THREE.ConeGeometry(R * 0.27, R * 1.1, 10);
  beakG.rotateX(Math.PI / 2);
  const beak = p.o.mesh(beakG, p.beak);
  beak.position.set(at.x, at.y - R * 0.18, at.z + R * 1.45);
  beak.rotation.x = 0.12;
  root.add(beak);
  for (const s of [1, -1]) {
    const eye = p.o.mesh(new THREE.SphereGeometry(R * 0.15, 8, 6), p.eye);
    eye.position.set(at.x + s * R * 0.74, at.y + R * 0.22, at.z + R * 0.5);
    root.add(eye);
  }
}

/** A seagull sitting, facing +Z. Nominal 0.28 x 0.2 x 0.34 (fits any box, standing on its floor). */
export const gull: KitBuilder = async (size, opts) => {
  const p = gullParts(opts);
  const { o } = p;
  const n = noise2(opts.seed + 2);
  const root = new THREE.Group();
  const body = ovoid(p, p.body, 0.075, 0.068, 0.13);
  body.position.set(0, 0.095, -0.01);
  body.rotation.x = -0.15;
  root.add(body);
  const neck = ovoid(p, p.white, 0.05, 0.056, 0.056);
  neck.position.set(0, 0.135, 0.072);
  root.add(neck);
  headAndBeak(p, root, new THREE.Vector3(0, 0.165, 0.1), 0.042);
  // Folded wings: texture v 1 = shoulder, 0 = tip.
  const wingMap = pixelTex(o, 128, 256, (u, v) => {
    let c = mul3(p.grey, 0.93 + 0.07 * fbm(n, u * 10, v * 20, 3, 10));
    c = mul3(c, (v * 9) % 1 > 0.9 && v > 0.36 ? 0.94 : 1);
    if (v < 0.37) c = mix3(c, WHITE, smooth(0.3, 0.34, v));
    if (v < 0.31) {
      const mirror = v > 0.07 && v < 0.13 && Math.sin(u * Math.PI * 8) > 0.55 ? 1 : 0;
      c = mix3(mul3(BLACK, 1 + 0.4 * ((v * 14) % 1)), WHITE, mirror * 0.85);
    }
    return c;
  });
  const wingMat = o.mat(new THREE.MeshStandardMaterial({ map: wingMap, roughness: 0.8 }));
  for (const s of [1, -1]) {
    const w = ovoid(p, wingMat, 0.02, 0.05, 0.15);
    w.position.set(s * 0.054, 0.108, -0.05);
    w.rotation.set(-0.1, s * 0.1, s * 0.32);
    root.add(w);
  }
  const tail = ovoid(p, p.white, 0.045, 0.013, 0.06);
  tail.position.set(0, 0.098, -0.145);
  tail.rotation.x = 0.12;
  root.add(tail);
  // Legs and webbed feet.
  const foot = new THREE.Shape([new THREE.Vector2(0, 0.006), new THREE.Vector2(-0.018, -0.036), new THREE.Vector2(0, -0.03), new THREE.Vector2(0.018, -0.036)]);
  for (const s of [1, -1]) {
    const leg = o.mesh(new THREE.CylinderGeometry(0.0055, 0.005, 0.05, 6), p.skin);
    leg.position.set(s * 0.026, 0.025, 0.0);
    root.add(leg);
    const fg = new THREE.ShapeGeometry(foot);
    fg.rotateX(-Math.PI / 2);
    const f = o.mesh(fg, p.skin);
    f.position.set(s * 0.026, 0.002, 0.0);
    f.rotation.y = s * 0.15;
    root.add(f);
  }
  return o.item(fit(root, size));
};

/** A gull in flight: body along Z (head +Z), wings spread along X. Nominal 0.8 x 0.1 x 0.35. */
export const gull_flying: KitBuilder = async (size, opts) => {
  const p = gullParts(opts);
  const { o } = p;
  const n = noise2(opts.seed + 4);
  const root = new THREE.Group();
  root.add(ovoid(p, p.body, 0.046, 0.04, 0.13));
  headAndBeak(p, root, new THREE.Vector3(0, 0.014, 0.13), 0.032);
  const tail = o.mesh(
    gridGeometry(4, 3, (u, v, out) => {
      const a = (u - 0.5) * 0.9;
      const len = 0.02 + v * 0.07;
      out.set(Math.sin(a) * len * 0.9, 0.006 - v * 0.004, -0.1 - Math.cos(a) * len);
    }),
    p.white,
  );
  root.add(tail);
  // Wing grid: u along the span (0 shoulder, 1 tip), v along the chord (0 leading, 1 trailing edge).
  const L = 0.38;
  const wingG = gridGeometry(q(opts, 18, 9), q(opts, 5, 3), (u, v, out) => {
    const zle = 0.055 + 0.035 * u - 0.13 * u * u * u;
    const chord = 0.13 * Math.sqrt(Math.max(0, 1 - Math.pow(u, 2.5))) * (1 - 0.35 * u) + 0.004;
    const y = u < 0.42 ? 0.032 * Math.sin((u / 0.42) * (Math.PI / 2)) : 0.032 - 0.055 * Math.pow((u - 0.42) / 0.58, 1.6);
    out.set(0.022 + u * L, y + 0.008 * Math.sin(Math.PI * v) * (1 - u), zle - v * chord);
  });
  const topMap = pixelTex(o, 256, 64, (u, v) => {
    let c = mul3(p.grey, (v > 0.45 ? 0.93 + 0.07 * Math.sin(u * Math.PI * 2 * 22) : 1) * (0.93 + 0.07 * fbm(n, u * 12, v * 4, 3)));
    if (v < 0.07) c = mix3(c, WHITE, 0.25);
    if (u < 0.74) c = mix3(c, WHITE, smooth(0.84, 0.92, v));
    c = mix3(c, BLACK, smooth(0.66, 0.74, u + (v - 0.5) * 0.1));
    const mirror = smooth(0.06, 0.035, Math.hypot((u - 0.92) * 0.9, (v - 0.5) * 0.35));
    return mix3(c, WHITE, mirror * 0.9);
  });
  const underMap = pixelTex(o, 128, 32, (u, v) => {
    const c = mul3(hex('#d9dde0'), 0.92 + 0.08 * fbm(n, u * 10, v * 4, 3));
    return mix3(c, hex('#3a3c40'), smooth(0.76, 0.86, u + (v - 0.5) * 0.1) * 0.85);
  });
  const top = o.mat(new THREE.MeshStandardMaterial({ map: topMap, roughness: 0.8, side: THREE.FrontSide }));
  const under = o.mat(new THREE.MeshStandardMaterial({ map: underMap, roughness: 0.85, side: THREE.BackSide }));
  for (const s of [1, -1]) {
    const wt = o.mesh(wingG, top);
    const wu = o.mesh(wingG, under);
    wt.scale.x = wu.scale.x = s;
    root.add(wt, wu);
  }
  return o.item(fit(root, size, ['center', 'center', 'center']));
};
