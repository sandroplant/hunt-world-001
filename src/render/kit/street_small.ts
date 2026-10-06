// Street kit, small things: umbrella, ship in a bottle, doorbell, notice, starfish, toy sailboat, glass float.
import * as THREE from 'three';
import type { KitBuilder } from './types';
import { Owned, rng } from './util';
import {
  brassMat, clothTex, clothTriangle, corkMat, deckGeometry, drawTex, fbm, fit, glossMat, grain, gridGeometry, hex, hullGeometry,
  lerp, mix3, mul3, noise2, paintMat, pixelTex, q, ropeMat, shade, smooth, woodMat,
} from './street_lib';

const V = (x: number, y: number, z: number): THREE.Vector3 => new THREE.Vector3(x, y, z);
const steel = (o: Owned, color = '#b9bdc2', rough = 0.35): THREE.MeshStandardMaterial => o.mat(new THREE.MeshStandardMaterial({ color, metalness: 1, roughness: rough }));

/** A furled red umbrella, tip down, crook handle up (long axis Y). Nominal 0.12 x 0.9 x 0.12. */
export const umbrella: KitBuilder = async (size, opts) => {
  const o = new Owned();
  const r = rng(opts.seed);
  const planks = await opts.assets.textureSet('dark_wooden_planks');
  const root = new THREE.Group();
  const y0 = -0.38;
  const y1 = 0.17;
  const pleats = 8;
  const twist = 9;
  const rad = (t: number): number => 0.006 + (0.026 * (Math.pow(t, 1.3) * Math.pow(1 - t, 0.4))) / 0.396;
  const N = q(opts, 26, 12);
  const prof: THREE.Vector2[] = [];
  for (let i = 0; i <= N; i++) prof.push(new THREE.Vector2(rad(i / N), lerp(y0, y1, i / N)));
  const canopyG = new THREE.LatheGeometry(prof, q(opts, 40, 16));
  const p = canopyG.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const f = Math.abs(Math.sin((Math.atan2(x, z) * pleats) / 2 + y * twist));
    const k = 0.86 + 0.2 * f;
    p.setXYZ(i, x * k, y, z * k);
  }
  canopyG.computeVertexNormals();
  const red = hex(shade('#9a1a1c', (r() - 0.5) * 0.06));
  const fabricMap = clothTex(o, opts.seed, (u, v) => {
    const f = Math.abs(Math.sin(u * Math.PI * pleats + lerp(y0, y1, v) * twist));
    return mul3(red, 0.5 + 0.5 * Math.pow(f, 0.6));
  }, { weave: 140 });
  root.add(o.mesh(canopyG, o.mat(new THREE.MeshStandardMaterial({ map: fabricMap, roughness: 0.82, side: THREE.DoubleSide }))));

  // Strap with a press stud.
  const ys = lerp(y0, y1, 0.5);
  const rs = rad(0.5) * 1.09;
  const strapMap = clothTex(o, opts.seed + 1, (_u, v) => mul3(red, v < 0.12 || v > 0.88 ? 0.45 : 0.7), { weave: 60 });
  const strap = o.mesh(new THREE.CylinderGeometry(rs, rs * 1.03, 0.024, q(opts, 24, 12), 1, true), o.mat(new THREE.MeshStandardMaterial({ map: strapMap, roughness: 0.75, side: THREE.DoubleSide })));
  strap.position.y = ys;
  root.add(strap);
  const brass = brassMat(o, opts.seed, 0.3);
  const stud = o.mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.003, 12), brass);
  stud.rotation.x = Math.PI / 2;
  stud.position.set(0, ys, rs + 0.001);
  root.add(stud);

  // Metal tip, collar, shaft.
  const tip = o.mesh(new THREE.CylinderGeometry(0.0048, 0.0028, 0.07, 10), steel(o));
  tip.position.y = y0 - 0.03;
  root.add(tip);
  const tipBall = o.mesh(new THREE.SphereGeometry(0.0038, 10, 6), steel(o));
  tipBall.position.y = y0 - 0.066;
  root.add(tipBall);
  const collar = o.mesh(new THREE.CylinderGeometry(0.0085, 0.0075, 0.02, 12), brass);
  collar.position.y = y1 + 0.004;
  root.add(collar);
  const shaft = o.mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.13, 10), steel(o, '#6e7276', 0.4));
  shaft.position.y = y1 + 0.065;
  root.add(shaft);
  const ferrule = o.mesh(new THREE.CylinderGeometry(0.0125, 0.0115, 0.022, 14), brass);
  ferrule.position.y = 0.3;
  root.add(ferrule);

  // Wooden crook handle.
  const pts: THREE.Vector3[] = [V(0, 0.29, 0), V(0, 0.33, 0), V(0, 0.37, 0)];
  const R = 0.036;
  for (let a = Math.PI - 0.25; a >= -0.75; a -= 0.25) pts.push(V(R + R * Math.cos(a), 0.37 + R * Math.sin(a), 0));
  const curve = new THREE.CatmullRomCurve3(pts);
  const wood = woodMat(o, planks, 0.12, 0.03, { color: '#c4895a', rough: 0.55 });
  root.add(o.mesh(new THREE.TubeGeometry(curve, q(opts, 40, 16), 0.011, q(opts, 10, 6), false), wood));
  const cap = o.mesh(new THREE.SphereGeometry(0.011, 10, 8), wood);
  cap.position.copy(curve.getPoint(1));
  root.add(cap);

  return o.item(fit(root, size, ['center', 'center', 'center']));
};

/** A glass bottle on its side (long axis X) on a small cradle, with a ship inside and a cork. Nominal 0.22 x 0.1 x 0.08. */
export const ship_bottle: KitBuilder = async (size, opts) => {
  const o = new Owned();
  const planks = await opts.assets.textureSet('dark_wooden_planks');
  const root = new THREE.Group();
  const prof = [[0, -0.105], [0.03, -0.105], [0.036, -0.1], [0.037, -0.088], [0.037, 0.03], [0.031, 0.047], [0.016, 0.058], [0.0115, 0.064], [0.0115, 0.077], [0.0135, 0.079], [0.0135, 0.086], [0.0105, 0.087]].map(([a, b]) => new THREE.Vector2(a, b));
  const glassG = new THREE.LatheGeometry(prof, q(opts, 32, 14));
  glassG.rotateZ(-Math.PI / 2);
  const glass = o.mat(new THREE.MeshPhysicalMaterial({ color: '#b9dcc8', roughness: 0.04, metalness: 0, transparent: true, opacity: 0.3, depthWrite: false, clearcoat: 1, side: THREE.DoubleSide }));
  const bottle = o.mesh(glassG, glass);
  bottle.renderOrder = 2;
  bottle.castShadow = false;
  root.add(bottle);
  const cork = o.mesh(new THREE.CylinderGeometry(0.0103, 0.0096, 0.03, 14), corkMat(o, opts.seed));
  cork.rotation.z = -Math.PI / 2;
  cork.position.x = 0.09;
  root.add(cork);

  // Putty sea.
  const n = noise2(opts.seed + 5);
  const seaMap = pixelTex(o, 128, 64, (u, v) => {
    const c = mix3(hex('#173e57'), hex('#3d7c86'), fbm(n, u * 8, v * 4, 3));
    const crest = smooth(0.82, 0.95, Math.sin(u * 70 + n(u * 10, v * 6) * 5) * (v > 0.55 ? 1 : 0.4));
    return mix3(c, [0.9, 0.93, 0.92], crest);
  });
  const sea = o.mesh(new THREE.SphereGeometry(1, 24, 10), o.mat(new THREE.MeshStandardMaterial({ map: seaMap, roughness: 0.5 })));
  sea.scale.set(0.074, 0.011, 0.029);
  sea.position.y = -0.024;
  root.add(sea);

  // The ship.
  const hullMap = pixelTex(o, 128, 64, (_u, v) => (v > 0.4 && v < 0.47 ? hex('#c99a3a') : v < 0.16 ? hex('#151210') : hex('#3b2416')));
  const hull = o.mesh(hullGeometry(0.088, 0.021, 0.012, 20, 6), o.mat(new THREE.MeshStandardMaterial({ map: hullMap, roughness: 0.6 })));
  hull.position.y = -0.009;
  root.add(hull);
  const deck = o.mesh(deckGeometry(0.088, 0.021, 20), woodMat(o, planks, 0.05, 0.02, { color: '#d8b48a' }));
  deck.position.y = -0.009;
  root.add(deck);
  const mastMat = paintMat(o, opts.seed, '#4a3020', { chips: 0 });
  const sailMat = o.mat(new THREE.MeshStandardMaterial({ map: clothTex(o, opts.seed + 2, () => hex('#e6dcc2'), { weave: 40, dirt: 0.35 }), roughness: 0.9, side: THREE.DoubleSide }));
  const masts: [number, number][] = [[0.025, 0.037], [0, 0.042], [-0.024, 0.034]];
  for (const [mx, mh] of masts) {
    const m = o.mesh(new THREE.CylinderGeometry(0.0011, 0.0013, mh, 5), mastMat);
    m.position.set(mx, -0.009 + mh / 2, 0);
    root.add(m);
    for (let k = 0; k < 2; k++) {
      const w = 0.028 - k * 0.007;
      const s = o.mesh(new THREE.PlaneGeometry(w, mh * 0.32), sailMat);
      s.position.set(mx + 0.001, -0.009 + mh * (0.36 + k * 0.34), 0);
      s.rotation.y = 0.75;
      root.add(s);
    }
  }
  root.add(o.mesh(clothTriangle(V(0.025, 0.026, 0), V(0.056, -0.007, 0), V(0.027, -0.005, 0), V(0, 0, 1), 0.002, 4, 3), sailMat));
  const flagMat = o.mat(new THREE.MeshStandardMaterial({ map: clothTex(o, opts.seed + 3, () => hex('#a8241e'), { weave: 20 }), roughness: 0.85, side: THREE.DoubleSide }));
  root.add(o.mesh(clothTriangle(V(0, 0.033, 0), V(0, 0.027, 0), V(-0.013, 0.03, 0), V(0, 0, 1), 0.001, 2, 1), flagMat));

  // Wooden cradle.
  const base = o.mesh(new THREE.BoxGeometry(0.17, 0.008, 0.05), woodMat(o, planks, 0.09, 0.025, { color: '#c89a70' }));
  base.position.y = -0.054;
  root.add(base);
  for (const x of [-0.055, 0.055]) {
    const b = o.mesh(new THREE.BoxGeometry(0.02, 0.018, 0.05), woodMat(o, planks, 0.02, 0.01, { color: '#c89a70' }));
    b.position.set(x, -0.041, 0);
    root.add(b);
  }
  return o.item(fit(root, size));
};

/** A brass bell-push: round engraved plate, collar and a white porcelain button. Front +Z. Nominal 0.08 x 0.08 x 0.04. */
export const doorbell: KitBuilder = async (size, opts) => {
  const o = new Owned();
  const root = new THREE.Group();
  const seg = q(opts, 40, 20);
  const brass = brassMat(o, opts.seed, 0.28);
  const face = drawTex(o, 256, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2);
    g.addColorStop(0, '#e9c47a');
    g.addColorStop(1, '#b78d48');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(70,45,15,0.85)';
    ctx.lineWidth = 3;
    for (const rr of [0.46, 0.42, 0.25]) {
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, rr * w, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(60,38,12,0.9)';
    ctx.font = 'bold 34px Georgia, "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PUSH', w / 2, h * 0.17);
    ctx.fillText('BELL', w / 2, h * 0.83);
    grain(ctx, w, h, opts.seed, 0.12);
  });
  const faceMat = o.mat(new THREE.MeshStandardMaterial({ map: face, metalness: 1, roughness: 0.3 }));
  const plateG = new THREE.CylinderGeometry(0.034, 0.034, 0.006, seg);
  plateG.rotateX(Math.PI / 2);
  plateG.rotateZ(Math.PI / 2);
  const plate = o.mesh(plateG, [brass, faceMat, brass]);
  plate.position.z = 0.003;
  root.add(plate);
  const rim = o.mesh(new THREE.TorusGeometry(0.034, 0.003, 8, seg), brass);
  rim.position.z = 0.004;
  root.add(rim);
  const boss = new THREE.LatheGeometry([[0.016, 0], [0.016, 0.004], [0.0135, 0.009], [0.0105, 0.012], [0.0098, 0.012]].map(([a, b]) => new THREE.Vector2(a, b)), seg);
  boss.rotateX(Math.PI / 2);
  const bossM = o.mesh(boss, brass);
  bossM.position.z = 0.006;
  root.add(bossM);
  const button = o.mesh(new THREE.SphereGeometry(0.0098, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), glossMat(o, '#f1ebdd', 0.1));
  button.rotation.x = Math.PI / 2;
  button.scale.set(1, 0.75, 1);
  button.position.z = 0.016;
  root.add(button);
  for (const y of [0.025, -0.025]) {
    const s = o.mesh(new THREE.SphereGeometry(0.0032, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), brass);
    s.rotation.x = Math.PI / 2;
    s.position.set(0, y, 0.006);
    root.add(s);
  }
  return o.item(fit(root, size, ['center', 'center', 'min']));
};

/** A paper notice taped to glass, one corner curling. Front +Z. Nominal 0.22 x 0.3 x 0.02. */
export const notice: KitBuilder = async (size, opts) => {
  const o = new Owned();
  const r = rng(opts.seed);
  const root = new THREE.Group();
  const W = 0.21;
  const H = 0.29;
  const curl = (u: number, v: number): number => {
    const s = Math.max(0, u + (1 - v) - 1.42);
    return 0.055 * s * s;
  };
  const paperG = gridGeometry(q(opts, 12, 6), q(opts, 16, 8), (u, v, out) => {
    const c = curl(u, v);
    out.set((u - 0.5) * W - c * 0.25, (v - 0.5) * H + c * 0.25, 0.0015 + c + 0.0012 * Math.sin(v * 7 + u * 3));
  });
  const print = drawTex(o, 256, 352, (ctx, w, h) => {
    ctx.fillStyle = '#e8dec4';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = `rgba(150,110,50,${0.05 + r() * 0.06})`;
      ctx.beginPath();
      ctx.arc(r() * w, r() * h, 20 + r() * 50, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#1f1a16';
    ctx.textAlign = 'center';
    ctx.font = 'bold 44px Georgia, "Times New Roman", serif';
    ctx.fillText('NOTICE', w / 2, 62);
    ctx.fillRect(40, 76, w - 80, 3);
    ctx.font = '19px Georgia, "Times New Roman", serif';
    const lines = ['The shop is open daily', 'from nine until dusk.', '', 'Curios bought & sold.', 'Ring the bell for', 'the keeper.'];
    lines.forEach((l, i) => ctx.fillText(l, w / 2, 118 + i * 28));
    ctx.font = 'italic 17px Georgia, serif';
    ctx.fillText('— by order —', w / 2, 300);
    ctx.strokeStyle = 'rgba(150,30,25,0.65)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(w * 0.78, h * 0.86, 24, 0, Math.PI * 2);
    ctx.stroke();
    grain(ctx, w, h, opts.seed, 0.1);
  });
  const back = clothTex(o, opts.seed, () => hex('#ddd2b6'), { weave: 0, dirt: 0.15, w: 64, h: 64 });
  root.add(o.mesh(paperG, o.mat(new THREE.MeshStandardMaterial({ map: print, roughness: 0.92, side: THREE.FrontSide }))));
  root.add(o.mesh(paperG, o.mat(new THREE.MeshStandardMaterial({ map: back, roughness: 0.92, side: THREE.BackSide }))));
  const tapeMap = pixelTex(o, 64, 32, (u, v) => {
    const edge = u < 0.04 || u > 0.96 ? 0.9 : 0.55;
    return [0.93, 0.85, 0.6, edge * (0.85 + 0.15 * Math.sin(v * 40))];
  });
  const tape = o.mat(new THREE.MeshStandardMaterial({ map: tapeMap, transparent: true, roughness: 0.3, depthWrite: false }));
  const strips: [number, number, number][] = [[-W / 2 + 0.01, H / 2 - 0.01, 0.75], [W / 2 - 0.01, H / 2 - 0.01, -0.75], [-W / 2 + 0.012, -H / 2 + 0.012, -0.7]];
  for (const [x, y, a] of strips) {
    const t = o.mesh(new THREE.PlaneGeometry(0.055, 0.017), tape);
    t.position.set(x, y, 0.004);
    t.rotation.z = a + (r() - 0.5) * 0.2;
    t.renderOrder = 1;
    root.add(t);
  }
  return o.item(fit(root, size, ['center', 'center', 'min']));
};

/** An orange-red starfish lying flat, five arms, bumpy top. Nominal 0.22 x 0.04 x 0.22. */
export const starfish: KitBuilder = async (size, opts) => {
  const o = new Owned();
  const r = rng(opts.seed);
  const root = new THREE.Group();
  const Rout = 0.11;
  const Rin = 0.042;
  const Ht = 0.026;
  const th0 = r() * Math.PI * 2;
  const lens = Array.from({ length: 5 }, () => 0.86 + r() * 0.14);
  const curls = Array.from({ length: 5 }, () => (r() - 0.3) * 0.02);
  const lobe = (th: number): number => Math.pow(0.5 + 0.5 * Math.cos(5 * (th - th0)), 1.25);
  const arm = (th: number): number => (((Math.round((th - th0) / ((Math.PI * 2) / 5)) % 5) + 5) % 5);
  const radius = (th: number): number => Rin + (Rout * lens[arm(th)]! - Rin) * lobe(th);
  const nu = q(opts, 110, 60);
  const nv = q(opts, 8, 5);
  const n = noise2(opts.seed);
  const point = (u: number, v: number, out: THREE.Vector3, top: boolean): void => {
    const th = (top ? u : 1 - u) * Math.PI * 2;
    const R = radius(th);
    const rf = v;
    const k = arm(th);
    const y = top ? Ht * Math.sqrt(Math.max(0, 1 - rf * rf)) * (0.55 + 0.45 * (1 - rf * 0.7)) * (0.7 + 0.3 * lobe(th)) + 0.0015 * n(u * 60, v * 8) : 0;
    out.set(Math.cos(th) * R * rf, y + curls[k]! * Math.pow(rf * lobe(th), 3), Math.sin(th) * R * rf);
  };
  const topG = gridGeometry(nu, nv, (u, v, out) => point(u, v, out, true), { wrapU: true, poleV0: true });
  const botG = gridGeometry(nu, nv, (u, v, out) => point(u, v, out, false), { wrapU: true, poleV0: true });
  const planar = (g: THREE.BufferGeometry): void => {
    const p = g.getAttribute('position');
    const uv = g.getAttribute('uv');
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / (Rout * 2.2) + 0.5, -p.getZ(i) / (Rout * 2.2) + 0.5);
  };
  planar(topG);
  planar(botG);
  const base = hex(shade('#c4481c', (r() - 0.5) * 0.08));
  const spot = (u: number, v: number): number => smooth(0.62, 0.75, n(u * 70, v * 70));
  const map = pixelTex(o, 256, 256, (u, v) => {
    const x = (u - 0.5) * Rout * 2.2;
    const z = -(v - 0.5) * Rout * 2.2;
    const th = Math.atan2(z, x);
    const rho = Math.hypot(x, z) / Math.max(1e-4, radius(th));
    const ridge = smooth(0.85, 1, lobe(th)) * (1 - smooth(0.7, 1, rho));
    const c = mix3(base, hex('#e48a4a'), ridge * 0.6 + spot(u, v) * 0.5);
    return mul3(c, 0.8 + 0.2 * fbm(n, u * 8, v * 8, 3));
  });
  const bump = pixelTex(o, 256, 256, (u, v) => {
    const b = spot(u, v);
    return [b, b, b];
  }, { linear: true });
  const mat = o.mat(new THREE.MeshStandardMaterial({ map, bumpMap: bump, bumpScale: 1.5, roughness: 0.75 }));
  root.add(o.mesh(topG, mat));
  root.add(o.mesh(botG, o.mat(new THREE.MeshStandardMaterial({ map, roughness: 0.85, color: '#e0b090' }))));
  return o.item(fit(root, size));
};

/** A wooden toy sailboat with a red hull and a cloth sail; long axis X, bow +X. Nominal 0.25 x 0.3 x 0.1. */
export const toy_sailboat: KitBuilder = async (size, opts) => {
  const o = new Owned();
  const r = rng(opts.seed);
  const [planks, brownPlanks] = await Promise.all([opts.assets.textureSet('dark_wooden_planks'), opts.assets.textureSet('brown_planks_05')]);
  const root = new THREE.Group();
  const L = 0.24;
  const B = 0.08;
  const D = 0.055;
  const n = noise2(opts.seed + 9);
  const red = hex(shade('#a5221d', (r() - 0.5) * 0.06));
  const hullMap = pixelTex(o, 256, 128, (u, v) => {
    if (v > 0.43 && v <= 0.5) return mul3(hex('#e8e0cc'), 0.9 + 0.1 * n(u * 50, v * 10));
    if (v < 0.12) return hex('#2a2422');
    const chip = smooth(0.78, 0.8, fbm(n, u * 20, v * 12, 3));
    return mix3(mul3(red, 0.88 + 0.12 * n(u * 120, v * 4)), hex('#8a6440'), chip);
  });
  root.add(o.mesh(hullGeometry(L, B, D, q(opts, 32, 16), q(opts, 8, 4)), o.mat(new THREE.MeshStandardMaterial({ map: hullMap, roughness: 0.45 }))));
  const deck = o.mesh(deckGeometry(L, B, q(opts, 32, 16)), woodMat(o, brownPlanks, 0.15, 0.05, { color: '#e0c49a' }));
  root.add(deck);
  const keel = o.mesh(new THREE.BoxGeometry(0.08, 0.035, 0.006), paintMat(o, opts.seed, '#2a2422', { chips: 0.2, under: '#7a5a3a' }));
  keel.position.set(-0.01, -D - 0.012, 0);
  root.add(keel);
  const wood = woodMat(o, planks, 0.12, 0.02, { color: '#d0a070', rough: 0.6 });
  const mastX = 0.025;
  const mast = o.mesh(new THREE.CylinderGeometry(0.0035, 0.0045, 0.22, 8), wood);
  mast.position.set(mastX, 0.11, 0);
  root.add(mast);
  const boom = o.mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.11, 8), wood);
  boom.rotation.z = Math.PI / 2;
  boom.position.set(mastX - 0.055, 0.032, 0);
  root.add(boom);
  const sailMap = clothTex(o, opts.seed + 4, (u, v) => {
    const seam = Math.abs(((v * 6) % 1) - 0.5) > 0.47 ? 0.8 : 1;
    return mul3(hex('#ece2c8'), seam * (u > 0.97 ? 0.85 : 1));
  }, { weave: 80, dirt: 0.25 });
  const sail = o.mat(new THREE.MeshStandardMaterial({ map: sailMap, roughness: 0.92, side: THREE.DoubleSide }));
  const nz = V(0, 0, 1);
  root.add(o.mesh(clothTriangle(V(mastX - 0.004, 0.21, 0), V(mastX - 0.004, 0.036, 0), V(mastX - 0.1, 0.036, 0), nz, 0.012, 8, 8), sail));
  root.add(o.mesh(clothTriangle(V(mastX + 0.004, 0.18, 0), V(mastX + 0.004, 0.02, 0), V(0.115, 0.012, 0), nz, 0.008, 6, 6), sail));
  const pennant = o.mat(new THREE.MeshStandardMaterial({ map: clothTex(o, opts.seed + 5, () => red, { weave: 30 }), roughness: 0.85, side: THREE.DoubleSide }));
  const flag = o.mesh(clothTriangle(V(mastX, 0.228, 0), V(mastX, 0.21, 0), V(mastX - 0.045, 0.217, 0), nz, 0.003, 3, 2), pennant);
  root.add(flag);
  return o.item(fit(root, size));
};

/** A green glass fishing float in a rope net with a loop on top. Nominal 0.16 x 0.16 x 0.16. */
export const glass_float: KitBuilder = async (size, opts) => {
  const o = new Owned();
  const r = rng(opts.seed);
  const root = new THREE.Group();
  const R = 0.068;
  const green = shade('#2f8a5a', (r() - 0.5) * 0.08);
  const glass = o.mat(new THREE.MeshPhysicalMaterial({ color: green, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.62, clearcoat: 1, clearcoatRoughness: 0.05, depthWrite: false, side: THREE.DoubleSide }));
  const ball = o.mesh(new THREE.SphereGeometry(R, q(opts, 36, 18), q(opts, 24, 12)), glass);
  ball.renderOrder = 2;
  root.add(ball);
  const core = o.mesh(new THREE.SphereGeometry(R * 0.55, 16, 10), o.mat(new THREE.MeshStandardMaterial({ color: shade(green, -0.12), roughness: 0.2, transparent: true, opacity: 0.45, depthWrite: false })));
  root.add(core);
  const seal = o.mesh(new THREE.SphereGeometry(0.012, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), glass);
  seal.position.y = -R + 0.002;
  seal.rotation.x = Math.PI;
  root.add(seal);
  const rope = ropeMat(o, opts.seed, '#9c8358', 10);
  const tube = 0.0032;
  const ts = q(opts, 40, 20);
  const rs = q(opts, 5, 4);
  for (const lat of [-0.62, 0, 0.62]) {
    const rr = Math.cos(lat) * (R + tube);
    const ring = o.mesh(new THREE.TorusGeometry(rr, tube, rs, ts), rope);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = Math.sin(lat) * (R + tube);
    root.add(ring);
  }
  for (let k = 0; k < 3; k++) {
    const m = o.mesh(new THREE.TorusGeometry(R + tube, tube, rs, ts), rope);
    m.rotation.y = (k * Math.PI) / 3 + 0.3;
    root.add(m);
  }
  const loop = o.mesh(new THREE.TorusGeometry(0.014, 0.0038, rs, 16), rope);
  loop.position.y = R + 0.017;
  root.add(loop);
  const knot = o.mesh(new THREE.SphereGeometry(0.008, 10, 8), rope);
  knot.position.y = R + 0.004;
  root.add(knot);
  return o.item(fit(root, size));
};
