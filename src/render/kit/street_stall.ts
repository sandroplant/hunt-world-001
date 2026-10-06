// Street kit, the fish stall: chalkboard, brass scale, rope coil, fishing net heap, striped canopy.
import * as THREE from 'three';
import type { KitBuilder } from './types';
import { Owned, rng } from './util';
import { brassMat, clothTex, corkMat, drawTex, fbm, fit, grain, gridGeometry, hex, ironMat, mix3, mul3, noise2, paintMat, pixelTex, q, ropeMat, shade, smooth, woodMat } from './street_lib';

const V = (x: number, y: number, z: number): THREE.Vector3 => new THREE.Vector3(x, y, z);

/** Hand-lettered chalk: each letter a little rotated and lifted. */
function chalkText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, px: number, r: () => number, align: 'left' | 'center' | 'right' = 'left'): void {
  ctx.font = `bold ${px}px "Comic Sans MS", "Chalkboard SE", "Segoe Print", sans-serif`;
  const widths = [...text].map((c) => ctx.measureText(c).width * 1.04);
  const total = widths.reduce((a, b) => a + b, 0);
  let cx = align === 'left' ? x : align === 'center' ? x - total / 2 : x - total;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  for (const [i, c] of [...text].entries()) {
    ctx.save();
    ctx.translate(cx, y + (r() - 0.5) * px * 0.08);
    ctx.rotate((r() - 0.5) * 0.12);
    ctx.fillText(c, 0, 0);
    ctx.restore();
    cx += widths[i]!;
  }
}

/** A chalk fish outline: body, tail, eye, gill, a few scales. */
function chalkFish(ctx: CanvasRenderingContext2D, cx: number, cy: number, len: number, dir: 1 | -1): void {
  const L = len / 2;
  const H = len * 0.22;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(dir, 1);
  for (const j of [0, 1.5]) {
    ctx.beginPath();
    ctx.moveTo(-L * 0.7 + j, j);
    ctx.quadraticCurveTo(0, -H * 1.7 + j, L, j);
    ctx.quadraticCurveTo(0, H * 1.5 + j, -L * 0.7 + j, j);
    ctx.moveTo(-L * 0.7, 0);
    ctx.lineTo(-L - j, -H * 0.85);
    ctx.lineTo(-L * 0.9, 0);
    ctx.lineTo(-L - j, H * 0.85);
    ctx.closePath();
    ctx.moveTo(-L * 0.15, -H * 0.75);
    ctx.lineTo(L * 0.05, -H * 1.15 - j);
    ctx.lineTo(L * 0.25, -H * 0.7);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(L * 0.38, 0, H * 0.75, -0.9, 0.9);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(L * 0.66, -H * 0.18, len * 0.022, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth *= 0.6;
  for (let i = 0; i < 4; i++) {
    for (let k = -1; k <= 1; k++) {
      ctx.beginPath();
      ctx.arc(-L * 0.3 + i * L * 0.16, k * H * 0.4, H * 0.22, -1.2, 1.2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** A wooden-framed chalkboard with chalk fish and words. Front +Z. Nominal 0.6 x 0.8 x 0.05. */
export const chalkboard: KitBuilder = async (size, opts) => {
  const o = new Owned();
  const r = rng(opts.seed);
  const planks = await opts.assets.textureSet('dark_wooden_planks');
  const W = 0.6;
  const H = 0.8;
  const D = 0.04;
  const F = 0.05;
  const root = new THREE.Group();
  const face = drawTex(o, 384, 512, (ctx, w, h) => {
    ctx.fillStyle = '#1c201e';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 14; i++) {
      const x = r() * w;
      const y = r() * h;
      const g = ctx.createRadialGradient(x, y, 2, x, y, 40 + r() * 90);
      g.addColorStop(0, 'rgba(200,205,195,0.09)');
      g.addColorStop(1, 'rgba(200,205,195,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.fillStyle = ctx.strokeStyle = 'rgba(238,238,228,0.92)';
    ctx.lineWidth = 4;
    ctx.lineCap = ctx.lineJoin = 'round';
    chalkText(ctx, 'FRESH', w / 2, 66, 58, r, 'center');
    chalkText(ctx, 'FISH', w / 2, 128, 58, r, 'center');
    ctx.beginPath();
    ctx.moveTo(70, 146);
    ctx.bezierCurveTo(150, 138, 230, 154, 314, 142);
    ctx.stroke();
    chalkFish(ctx, w / 2, 210, 230, 1);
    ctx.fillStyle = ctx.strokeStyle = 'rgba(232,232,222,0.85)';
    const rows: [string, string][] = [['COD', '6d'], ['MACKEREL', '4d'], ['HERRING', '3d']];
    rows.forEach(([a, b], i) => {
      chalkText(ctx, a, 34, 314 + i * 46, 32, r);
      chalkText(ctx, b, w - 34, 314 + i * 46, 32, r, 'right');
    });
    ctx.fillStyle = ctx.strokeStyle = 'rgba(240,200,140,0.85)';
    chalkFish(ctx, w * 0.7, 470, 110, -1);
    chalkText(ctx, 'today', 40, 482, 30, r);
    grain(ctx, w, h, opts.seed, 0.55, true);
    grain(ctx, w, h, opts.seed + 1, 0.12);
  });
  const slate = o.mat(new THREE.MeshStandardMaterial({ map: face, roughness: 0.92 }));
  const woodH = woodMat(o, planks, 0.3, 0.025, { color: '#c49a72' });
  const woodV = woodMat(o, planks, 0.4, 0.025, { color: '#c49a72' });
  const board = o.mesh(new THREE.BoxGeometry(W - 2 * F + 0.012, H - 2 * F + 0.012, 0.012), [woodH, woodH, woodH, woodH, slate, woodH]);
  board.position.z = -0.002;
  root.add(board);
  for (const s of [1, -1]) {
    const bar = o.mesh(new THREE.BoxGeometry(W, F, D), woodH);
    bar.position.y = s * (H / 2 - F / 2);
    root.add(bar);
    const post = o.mesh(new THREE.BoxGeometry(H - 2 * F, F, D), woodV);
    post.rotation.z = Math.PI / 2;
    post.position.x = s * (W / 2 - F / 2);
    root.add(post);
  }
  const ledge = o.mesh(new THREE.BoxGeometry(W - 2 * F, 0.012, 0.026), woodH);
  ledge.position.set(0, -H / 2 + F + 0.006, D / 2 + 0.006);
  root.add(ledge);
  const chalkMap = pixelTex(o, 32, 32, (u, v) => mul3([0.93, 0.92, 0.88], 0.85 + 0.15 * Math.sin(u * 40 + v * 13)));
  const chalk = o.mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.055, 8), o.mat(new THREE.MeshStandardMaterial({ map: chalkMap, roughness: 1 })));
  chalk.rotation.z = Math.PI / 2 + 0.1;
  chalk.position.set(0.12, -H / 2 + F + 0.017, D / 2 + 0.008);
  root.add(chalk);
  return o.item(fit(root, size, ['center', 'center', 'center']));
};

/** The fish stall's brass scale: painted iron base, brass drum with a round dial on the front, pan on top. Nominal 0.4 x 0.5 x 0.3. */
export const fish_scale: KitBuilder = async (size, opts) => {
  const o = new Owned();
  const seg = q(opts, 48, 20);
  const root = new THREE.Group();
  const brass = brassMat(o, opts.seed, 0.28);
  const polished = brassMat(o, opts.seed + 1, 0.18);
  const paint = paintMat(o, opts.seed, shade('#22382e', 0), { chips: 0.3, under: '#2a2724', rough: 0.5, metal: 0.2 });
  const base = o.mesh(new THREE.BoxGeometry(0.36, 0.05, 0.26), paint);
  base.position.y = 0.025;
  root.add(base);
  const trim = o.mesh(new THREE.BoxGeometry(0.366, 0.012, 0.266), brass);
  trim.position.y = 0.038;
  root.add(trim);
  const ped = o.mesh(new THREE.CylinderGeometry(0.05, 0.075, 0.045, seg), paint);
  ped.position.y = 0.075;
  root.add(ped);
  const cy = 0.215;
  const drumG = new THREE.CylinderGeometry(0.12, 0.12, 0.08, seg);
  drumG.rotateX(Math.PI / 2);
  const drum = o.mesh(drumG, brass);
  drum.position.y = cy;
  root.add(drum);
  const dial = drawTex(o, 512, 512, (ctx, w, h) => {
    const c = w / 2;
    const g = ctx.createRadialGradient(c, c, 20, c, c, c);
    g.addColorStop(0, '#f2ead6');
    g.addColorStop(1, '#d9ccab');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#2a2018';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(c, c, c * 0.9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#231a12';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const a0 = Math.PI * 0.75;
    const span = Math.PI * 1.5;
    for (let i = 0; i <= 40; i++) {
      const a = a0 + (span * i) / 40;
      const long = i % 4 === 0;
      ctx.lineWidth = long ? 5 : 2.5;
      ctx.beginPath();
      ctx.moveTo(c + Math.cos(a) * c * 0.84, c + Math.sin(a) * c * 0.84);
      ctx.lineTo(c + Math.cos(a) * c * (long ? 0.7 : 0.76), c + Math.sin(a) * c * (long ? 0.7 : 0.76));
      ctx.stroke();
      if (long) {
        ctx.font = 'bold 40px Georgia, "Times New Roman", serif';
        ctx.fillText(String(i / 4), c + Math.cos(a) * c * 0.56, c + Math.sin(a) * c * 0.56);
      }
    }
    ctx.font = 'bold 30px Georgia, serif';
    ctx.fillText('LBS', c, c + c * 0.42);
    ctx.font = 'italic 24px Georgia, serif';
    ctx.fillText('Harbour Scale Co.', c, c - c * 0.3);
    const a = a0 + span * 0.37;
    ctx.strokeStyle = '#9e1c18';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(c - Math.cos(a) * c * 0.15, c - Math.sin(a) * c * 0.15);
    ctx.lineTo(c + Math.cos(a) * c * 0.8, c + Math.sin(a) * c * 0.8);
    ctx.stroke();
    grain(ctx, w, h, opts.seed, 0.08);
  });
  const faceM = o.mesh(new THREE.CircleGeometry(0.106, seg), o.mat(new THREE.MeshStandardMaterial({ map: dial, roughness: 0.35 })));
  faceM.position.set(0, cy, 0.041);
  root.add(faceM);
  const bezel = o.mesh(new THREE.TorusGeometry(0.11, 0.012, 10, seg), polished);
  bezel.position.set(0, cy, 0.042);
  root.add(bezel);
  const cap = o.mesh(new THREE.SphereGeometry(0.01, 12, 8), polished);
  cap.position.set(0, cy, 0.043);
  root.add(cap);
  const glass = o.mesh(new THREE.CircleGeometry(0.108, seg), o.mat(new THREE.MeshPhysicalMaterial({ color: '#dfeff2', roughness: 0.03, transparent: true, opacity: 0.12, depthWrite: false, clearcoat: 1 })));
  glass.position.set(0, cy, 0.049);
  glass.renderOrder = 2;
  root.add(glass);
  const post = o.mesh(new THREE.CylinderGeometry(0.013, 0.016, 0.11, 16), brass);
  post.position.y = 0.39;
  root.add(post);
  const cup = o.mesh(new THREE.CylinderGeometry(0.045, 0.02, 0.018, 20), brass);
  cup.position.y = 0.452;
  root.add(cup);
  const pan = o.mesh(new THREE.LatheGeometry([[0, 0], [0.08, 0.002], [0.12, 0.008], [0.138, 0.02], [0.145, 0.034], [0.149, 0.037]].map(([a, b]) => new THREE.Vector2(a, b)), seg), o.mat(polished.clone()));
  (pan.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
  pan.position.y = 0.461;
  root.add(pan);
  const lip = o.mesh(new THREE.TorusGeometry(0.149, 0.0035, 6, seg), polished);
  lip.rotation.x = Math.PI / 2;
  lip.position.y = 0.498;
  root.add(lip);
  return o.item(fit(root, size));
};

/** A coiled ship's rope lying flat, the end crossing the top. Nominal 0.45 x 0.14 x 0.45. */
export const rope_coil: KitBuilder = async (size, opts) => {
  const o = new Owned();
  const r = rng(opts.seed);
  const root = new THREE.Group();
  const rad = 0.019;
  const loops = 3.4;
  const per = 14;
  const a0 = r() * Math.PI * 2;
  const ph = r() * 6;
  const pts: THREE.Vector3[] = [];
  pts.push(V(Math.cos(a0 - 0.9) * 0.235, rad, Math.sin(a0 - 0.9) * 0.235));
  pts.push(V(Math.cos(a0 - 0.45) * 0.2, rad, Math.sin(a0 - 0.45) * 0.2));
  for (let i = 0; i <= loops * per; i++) {
    const t = i / per;
    const a = a0 + t * Math.PI * 2;
    const rr = 0.163 + 0.013 * Math.sin(t * 4.1 + ph) - 0.012 * t;
    pts.push(V(Math.cos(a) * rr, rad + t * 0.029 + 0.003 * Math.sin(a * 3), Math.sin(a) * rr));
  }
  const last = a0 + loops * Math.PI * 2;
  const topY = rad + loops * 0.029 + 0.012;
  pts.push(V(Math.cos(last + 0.5) * 0.07, topY, Math.sin(last + 0.5) * 0.07));
  pts.push(V(Math.cos(last + 1.6) * 0.1, topY - 0.004, Math.sin(last + 1.6) * 0.1));
  pts.push(V(Math.cos(last + 2.1) * 0.19, topY - 0.03, Math.sin(last + 2.1) * 0.19));
  pts.push(V(Math.cos(last + 2.3) * 0.23, rad, Math.sin(last + 2.3) * 0.23));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const len = curve.getLength();
  const mat = ropeMat(o, opts.seed, shade('#a48a5c', (r() - 0.5) * 0.06), len / 0.07);
  root.add(o.mesh(new THREE.TubeGeometry(curve, q(opts, 260, 110), rad, q(opts, 8, 5), false), mat));
  const whip = paintMat(o, opts.seed, '#3a2a20', { chips: 0 });
  for (const t of [0, 1]) {
    const p = curve.getPointAt(t);
    const tan = curve.getTangentAt(t);
    const end = o.mesh(new THREE.CylinderGeometry(rad * 1.04, rad * 1.04, 0.022, q(opts, 10, 6)), whip);
    end.quaternion.setFromUnitVectors(V(0, 1, 0), tan);
    end.position.copy(p).addScaledVector(tan, t === 0 ? 0.008 : -0.008);
    root.add(end);
    const cap = o.mesh(new THREE.SphereGeometry(rad, 8, 6), mat);
    cap.position.copy(p);
    root.add(cap);
  }
  return o.item(fit(root, size));
};

/** A heap of fishing net: lumpy mound, diamond mesh, cork floats on a float line. Nominal 1.2 x 0.3 x 1.2. */
export const fish_net: KitBuilder = async (size, opts) => {
  const o = new Owned();
  const r = rng(opts.seed);
  const root = new THREE.Group();
  const Rb = 0.56;
  const H = 0.27;
  const ph = Array.from({ length: 8 }, () => r() * Math.PI * 2);
  const edgeR = (th: number): number => Rb * (1 + 0.07 * Math.sin(3 * th + ph[0]!) + 0.05 * Math.sin(5 * th + ph[1]!) + 0.025 * Math.sin(11 * th + ph[2]!));
  const height = (th: number, rf: number): number => {
    const dome = Math.pow(Math.max(0, 1 - rf * rf), 0.85);
    const lumps = 0.2 * Math.sin(th * 3 + ph[3]!) * Math.sin(rf * 5 + ph[4]!) + 0.12 * Math.sin(th * 7 + ph[5]!) * rf + 0.07 * Math.sin(th * 15 + rf * 7 + ph[6]!) * rf;
    return H * dome * (0.85 + lumps) + 0.004;
  };
  const surf = (th: number, rf: number, out: THREE.Vector3): THREE.Vector3 => out.set(Math.cos(th) * edgeR(th) * rf, height(th, rf), Math.sin(th) * edgeR(th) * rf);
  const nu = q(opts, 56, 28);
  const nv = q(opts, 14, 7);
  const g = gridGeometry(nu, nv, (u, v, out) => surf(u * Math.PI * 2, v, out), { wrapU: true, poleV0: true });
  const p = g.getAttribute('position');
  const uv = g.getAttribute('uv');
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) + 0.5 + p.getY(i) * 0.3, p.getZ(i) + 0.5);
  const outer = g.clone();
  const op = outer.getAttribute('position');
  const on = outer.getAttribute('normal');
  for (let i = 0; i < op.count; i++) op.setXYZ(i, op.getX(i) + on.getX(i) * 0.016, op.getY(i) + on.getY(i) * 0.016, op.getZ(i) + on.getZ(i) * 0.016);
  const tar = hex(shade('#3a3324', (r() - 0.5) * 0.05));
  const twine = hex(shade('#8d7a52', (r() - 0.5) * 0.05));
  const n = noise2(opts.seed);
  const cells = 8;
  const mesh = (u: number, v: number): number => {
    const a = (u + v) * cells;
    const b = (u - v) * cells;
    const da = Math.abs(a - Math.round(a));
    const db = Math.abs(b - Math.round(b));
    return Math.max(1 - smooth(0.04, 0.09, da), 1 - smooth(0.04, 0.09, db), (1 - smooth(0.05, 0.13, da)) * (1 - smooth(0.05, 0.13, db)));
  };
  const baseMap = pixelTex(o, 256, 256, (u, v) => {
    const depth = 0.55 + 0.45 * fbm(n, u * 4, v * 4, 3, 4);
    return mix3(mul3(tar, depth), mul3(twine, 0.8), mesh(u + 0.031, v + 0.017) * 0.85);
  }, { repeat: [3.5, 3.5] });
  const topMap = pixelTex(o, 256, 256, (u, v) => {
    const m = mesh(u, v);
    return [...mul3(twine, 0.85 + 0.15 * n(u * 90, v * 90, 90, 90)), m];
  }, { repeat: [3.5, 3.5] });
  root.add(o.mesh(g, o.mat(new THREE.MeshStandardMaterial({ map: baseMap, roughness: 0.95 }))));
  root.add(o.mesh(outer, o.mat(new THREE.MeshStandardMaterial({ map: topMap, alphaTest: 0.5, roughness: 0.9, side: THREE.DoubleSide }))));

  // Float line with corks, winding up the heap.
  const tmp = new THREE.Vector3();
  const fpts: THREE.Vector3[] = [];
  const thA = r() * Math.PI * 2;
  for (let k = 0; k <= 10; k++) {
    const t = k / 10;
    const pt = surf(thA + t * Math.PI * 1.5, 0.92 - t * 0.6, tmp).clone();
    pt.y += 0.012;
    fpts.push(pt);
  }
  const fl = new THREE.CatmullRomCurve3(fpts);
  root.add(o.mesh(new THREE.TubeGeometry(fl, q(opts, 80, 30), 0.007, 5, false), ropeMat(o, opts.seed + 2, '#b39d6c', fl.getLength() / 0.03)));
  const cork = corkMat(o, opts.seed);
  for (let t = 0.08; t < 0.98; t += 0.15) {
    const c = o.mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.045, q(opts, 14, 8)), cork);
    c.quaternion.setFromUnitVectors(V(0, 1, 0), fl.getTangentAt(t));
    c.position.copy(fl.getPointAt(t));
    root.add(c);
  }
  return o.item(fit(root, size));
};

/** A striped canvas stall canopy (red and cream) with a slight sag and a scalloped front valance. Built to the box's X and Z. Nominal 2.4 x 0.06 x 3. */
export const canopy: KitBuilder = async (size, opts) => {
  const o = new Owned();
  const r = rng(opts.seed);
  const root = new THREE.Group();
  const W = size[0];
  const D = size[2];
  const stripes = Math.max(4, Math.round(W / 0.2));
  const sag = Math.min(0.06, Math.min(W, D) * 0.02);
  const val = Math.min(0.11, Math.max(0.05, W * 0.045));
  const red = hex(shade('#9c2224', (r() - 0.5) * 0.05));
  const cream = hex(shade('#e2d6b8', (r() - 0.5) * 0.04));
  const n = noise2(opts.seed + 31);
  const stripe = (u: number): [number, number, number] => (Math.floor(u * stripes) % 2 === 0 ? red : cream);
  const topMap = clothTex(o, opts.seed, (u, v) => {
    const hem = u < 0.008 || u > 0.992 || v < 0.006 || v > 0.994 ? 0.75 : 1;
    const streak = 1 - 0.18 * smooth(0.5, 0.9, n(u * 30, v * 3)) * Math.sin(Math.PI * u);
    return mul3(stripe(u), hem * streak);
  }, { w: 512, h: 512, weave: 220, dirt: 0.3 });
  const fabric = o.mat(new THREE.MeshStandardMaterial({ map: topMap, roughness: 0.88, side: THREE.DoubleSide }));
  const top = gridGeometry(q(opts, 24, 10), q(opts, 30, 12), (u, v, out) => {
    out.set((u - 0.5) * W, -sag * Math.sin(Math.PI * u) * Math.sin(Math.PI * v) - 0.006 * Math.abs(Math.sin(Math.PI * u * 4)), (0.5 - v) * D);
  });
  root.add(o.mesh(top, fabric));
  const valMap = clothTex(o, opts.seed + 1, (u, v) => (v < 0.13 ? mul3(red, 0.7) : v > 0.9 ? mul3(stripe(u), 0.8) : stripe(u)), { w: 512, h: 64, weave: 200, dirt: 0.25 });
  const scallop = (u: number): number => {
    const k = (u * stripes) % 1;
    return val * (0.45 + 0.55 * Math.sqrt(Math.max(0, 1 - (2 * k - 1) * (2 * k - 1))));
  };
  const valG = gridGeometry(stripes * q(opts, 8, 4), 2, (u, v, out) => {
    out.set((u - 0.5) * W, -scallop(u) * (1 - v), D / 2 + 0.004);
  });
  root.add(o.mesh(valG, o.mat(new THREE.MeshStandardMaterial({ map: valMap, roughness: 0.88, side: THREE.DoubleSide }))));
  const frameMat = ironMat(o, opts.seed, [4, 1], 0.2);
  const rail = o.mesh(new THREE.CylinderGeometry(0.012, 0.012, W, 8), frameMat);
  rail.rotation.z = Math.PI / 2;
  rail.position.set(0, -0.004, D / 2);
  root.add(rail);
  return o.item(fit(root, size, ['center', 'max', 'center'], [false, true, false]));
};
