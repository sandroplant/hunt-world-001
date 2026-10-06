// Street kit, fixtures on walls and roofs: the curiosity shop's hanging sign, an iron letterbox, a weathervane and
// the far lighthouse's lantern top.
import * as THREE from 'three';
import type { KitBuilder } from './types';
import { Owned, rng } from './util';
import { brassMat, drawTex, fit, grain, hex, ironMat, mix3, mul3, noise2, paintMat, pixelTex, q, shade, smooth, woodMat, fbm } from './street_lib';

/** The curiosity shop's sign: a painted board with an amber cat's eye, hung by two short chains. Front +Z. Nominal 0.45 x 0.35 x 0.04. */
export const hanging_sign: KitBuilder = async (size, opts) => {
  const o = new Owned();
  const r = rng(opts.seed);
  const planks = await opts.assets.textureSet('old_planks_02');
  const root = new THREE.Group();
  const W = 0.42;
  const H = 0.24;
  const T = 0.028;
  const ground = shade('#1f3d3a', (r() - 0.5) * 0.04);
  const face = drawTex(o, 512, 292, (ctx, w, h) => {
    ctx.fillStyle = ground;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) {
      ctx.strokeStyle = `rgba(${r() < 0.5 ? '0,0,0' : '120,150,140'},${0.05 + r() * 0.07})`;
      ctx.lineWidth = 1 + r() * 2;
      const y = r() * h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(w * 0.3, y + (r() - 0.5) * 8, w * 0.6, y + (r() - 0.5) * 8, w, y + (r() - 0.5) * 6);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, h / 3, w, 2);
    ctx.fillRect(0, (2 * h) / 3, w, 2);
    ctx.strokeStyle = '#c9a24a';
    ctx.lineWidth = 6;
    ctx.strokeRect(16, 16, w - 32, h - 32);
    ctx.lineWidth = 2;
    ctx.strokeRect(28, 28, w - 56, h - 56);
    const cx = w / 2;
    const cy = h / 2;
    const ew = 150;
    const eye = (): void => {
      ctx.beginPath();
      ctx.moveTo(cx - ew, cy);
      ctx.quadraticCurveTo(cx, cy - 150, cx + ew, cy);
      ctx.quadraticCurveTo(cx, cy + 150, cx - ew, cy);
      ctx.closePath();
    };
    const g = ctx.createRadialGradient(cx, cy, 6, cx, cy, ew * 0.8);
    g.addColorStop(0, '#ffe07a');
    g.addColorStop(0.45, '#f0a224');
    g.addColorStop(1, '#8a4510');
    eye();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    eye();
    ctx.clip();
    ctx.strokeStyle = 'rgba(120,60,10,0.35)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 22, cy + Math.sin(a) * 22);
      ctx.lineTo(cx + Math.cos(a) * 110, cy + Math.sin(a) * 110);
      ctx.stroke();
    }
    ctx.fillStyle = '#0d0a08';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 15, 66, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,250,235,0.85)';
    ctx.beginPath();
    ctx.ellipse(cx + 34, cy - 30, 11, 8, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#120d0a';
    ctx.lineWidth = 9;
    eye();
    ctx.stroke();
    ctx.strokeStyle = '#c9a24a';
    ctx.lineWidth = 4;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + s * (ew + 14), cy);
      ctx.lineTo(cx + s * (ew + 50), cy);
      ctx.stroke();
    }
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(110,80,50,${0.3 + r() * 0.4})`;
      ctx.fillRect(r() * w, r() * h, 2 + r() * 10, 1 + r() * 3);
    }
    grain(ctx, w, h, opts.seed, 0.16);
  });
  const paint = o.mat(new THREE.MeshStandardMaterial({ map: face, roughness: 0.7 }));
  const edge = woodMat(o, planks, 0.05, 0.2, { color: '#b89a7a' });
  const board = o.mesh(new THREE.BoxGeometry(W, H, T), [edge, edge, edge, edge, paint, paint]);
  root.add(board);
  const iron = ironMat(o, opts.seed, [1, 1], 0.4);
  const ts = q(opts, 12, 8);
  for (const x of [-0.15, 0.15]) {
    const bolt = o.mesh(new THREE.TorusGeometry(0.008, 0.0028, 6, ts), iron);
    bolt.position.set(x, H / 2 + 0.006, 0);
    root.add(bolt);
    let y = H / 2 + 0.03;
    for (let i = 0; i < 3; i++) {
      const link = o.mesh(new THREE.TorusGeometry(0.0085, 0.0024, 6, ts), iron);
      link.scale.y = 1.6;
      link.rotation.y = i % 2 === 0 ? Math.PI / 2 : 0;
      link.position.set(x, y, 0);
      root.add(link);
      y += 0.023;
    }
    const ring = o.mesh(new THREE.TorusGeometry(0.014, 0.003, 6, ts), iron);
    ring.position.set(x, y + 0.006, 0);
    root.add(ring);
  }
  return o.item(fit(root, size, ['center', 'max', 'center']));
};

/** An iron letterbox on a wall: back plate, box, a slot with a small hinged flap (state 'open' lifts it). Front +Z. Nominal 0.25 x 0.12 x 0.08. */
export const letterbox: KitBuilder = async (size, opts) => {
  const o = new Owned();
  const root = new THREE.Group();
  const black = shade('#1c1e1d', 0);
  const paint = paintMat(o, opts.seed, black, { chips: 0.25, under: '#5a3a24', rough: 0.55, metal: 0.4 });
  const front = drawTex(o, 512, 221, (ctx, w, h) => {
    const n = noise2(opts.seed);
    ctx.fillStyle = black;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#3a3c3b';
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.fillStyle = '#8a8478';
    ctx.font = 'bold 46px Georgia, "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LETTERS', w / 2, h * 0.24);
    ctx.fillStyle = '#060606';
    ctx.fillRect(w * 0.18, h * 0.5, w * 0.64, h * 0.12);
    for (let i = 0; i < 26; i++) {
      const x = (i * 97) % w;
      const len = 20 + n(i, 1) * 60;
      const g = ctx.createLinearGradient(x, h * 0.62, x, h * 0.62 + len);
      g.addColorStop(0, 'rgba(120,60,25,0.5)');
      g.addColorStop(1, 'rgba(120,60,25,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x, h * 0.62, 3 + n(i, 2) * 4, len);
    }
    grain(ctx, w, h, opts.seed, 0.25);
  });
  const frontMat = o.mat(new THREE.MeshStandardMaterial({ map: front, roughness: 0.55, metalness: 0.4 }));
  const plate = o.mesh(new THREE.BoxGeometry(0.25, 0.12, 0.008), paint);
  plate.position.z = -0.036;
  root.add(plate);
  const body = o.mesh(new THREE.BoxGeometry(0.22, 0.095, 0.05), [paint, paint, paint, paint, frontMat, paint]);
  body.position.set(0, -0.004, -0.007);
  root.add(body);
  const hood = o.mesh(new THREE.BoxGeometry(0.232, 0.008, 0.064), paint);
  hood.position.set(0, 0.048, -0.004);
  hood.rotation.x = 0.12;
  root.add(hood);
  const brass = brassMat(o, opts.seed, 0.35);
  const hinge = new THREE.Group();
  hinge.position.set(0, -0.001, 0.0185);
  root.add(hinge);
  const flap = o.mesh(new THREE.BoxGeometry(0.15, 0.03, 0.004), brass);
  flap.position.set(0, -0.015, 0.002);
  hinge.add(flap);
  const pin = o.mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.16, 8), brass);
  pin.rotation.z = Math.PI / 2;
  pin.position.z = 0.002;
  hinge.add(pin);
  for (const [x, y] of [[-0.112, 0.048], [0.112, 0.048], [-0.112, -0.048], [0.112, -0.048]] as const) {
    const s = o.mesh(new THREE.SphereGeometry(0.0045, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), paint);
    s.rotation.x = Math.PI / 2;
    s.position.set(x, y, -0.032);
    root.add(s);
  }
  const setState = (s: string): void => {
    hinge.rotation.x = s === 'open' ? -1.1 : 0;
  };
  return o.item(fit(root, size, ['center', 'center', 'min']), setState);
};

/** An iron weathervane silhouette, flat in the XY plane: arrow along X (point +X) with a cockerel on it. Nominal 0.8 x 0.3 x 0.05. */
export const weathervane: KitBuilder = async (size, opts) => {
  const o = new Owned();
  const root = new THREE.Group();
  const iron = ironMat(o, opts.seed, [3, 3], 0.45);
  const depth = 0.008;
  const shapes: THREE.Shape[] = [];
  const poly = (pts: [number, number][], s = 1, dx = 0, dy = 0): void => {
    shapes.push(new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x * s + dx, y * s + dy))));
  };
  const ellipse = (cx: number, cy: number, rx: number, ry: number, s: number, dx: number, dy: number): void => {
    const sh = new THREE.Shape();
    sh.absellipse(cx * s + dx, cy * s + dy, rx * s, ry * s, 0, Math.PI * 2, false, 0);
    shapes.push(sh);
  };
  // Arrow.
  poly([[-0.36, -0.006], [0.3, -0.006], [0.3, 0.006], [-0.36, 0.006]]);
  poly([[0.29, -0.045], [0.4, 0], [0.29, 0.045], [0.31, 0]]);
  poly([[-0.28, 0], [-0.33, 0.05], [-0.41, 0.05], [-0.36, 0], [-0.41, -0.05], [-0.33, -0.05]]);
  // Cockerel, facing +X, standing on the arrow.
  const S = 0.24;
  const dx = -0.03;
  const dy = 0.006;
  ellipse(0, 0.42, 0.25, 0.16, S, dx, dy);
  poly([[0.08, 0.5], [0.17, 0.75], [0.32, 0.72], [0.24, 0.42]], S, dx, dy);
  ellipse(0.26, 0.76, 0.075, 0.07, S, dx, dy);
  for (const [cx, cy, rr] of [[0.2, 0.84, 0.035], [0.25, 0.865, 0.04], [0.31, 0.84, 0.035]] as const) ellipse(cx, cy, rr, rr, S, dx, dy);
  poly([[0.32, 0.79], [0.42, 0.76], [0.32, 0.73]], S, dx, dy);
  ellipse(0.3, 0.67, 0.025, 0.045, S, dx, dy);
  for (let k = 0; k < 3; k++) {
    const sh = new THREE.Shape();
    const P = (x: number, y: number): [number, number] => [x * S + dx, y * S + dy];
    sh.moveTo(...P(-0.1, 0.52));
    sh.quadraticCurveTo(...P(-0.22, 0.88 - k * 0.12), ...P(-0.5 + k * 0.05, 1.0 - k * 0.18));
    sh.quadraticCurveTo(...P(-0.3, 0.62 - k * 0.12), ...P(-0.18, 0.36));
    shapes.push(sh);
  }
  poly([[-0.05, 0.32], [0.0, 0.32], [0.0, 0.04], [-0.035, 0.04]], S, dx, dy);
  poly([[0.06, 0.32], [0.11, 0.32], [0.1, 0.04], [0.065, 0.04]], S, dx, dy);
  poly([[-0.16, 0], [0.22, 0], [0.22, 0.05], [-0.16, 0.05]], S, dx, dy);
  const geo = new THREE.ExtrudeGeometry(shapes, { depth, bevelEnabled: false, curveSegments: q(opts, 10, 5) });
  geo.translate(0, 0, -depth / 2);
  root.add(o.mesh(geo, iron));
  // Pivot sleeve and ball under the arrow.
  const sleeve = o.mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.07, 10), iron);
  sleeve.position.set(0, -0.03, 0);
  root.add(sleeve);
  const ball = o.mesh(new THREE.SphereGeometry(0.018, 12, 8), brassMat(o, opts.seed, 0.45));
  ball.position.set(0, -0.05, 0);
  root.add(ball);
  return o.item(fit(root, size, ['center', 'center', 'center']));
};

/** The far lighthouse's top: gallery deck with rail, glazed lantern room with a lit lens, red domed cap. Nominal 3.6 x 1.6 x 3.6. States: 'on' (default), 'off'. */
export const lighthouse_lantern: KitBuilder = async (size, opts) => {
  const o = new Owned();
  const seg = q(opts, 48, 24);
  const root = new THREE.Group();
  const iron = ironMat(o, opts.seed, [8, 1], 0.3);
  const deckPaint = paintMat(o, opts.seed, '#2c2f31', { chips: 0.15, under: '#5a3a24', repeat: [6, 1], metal: 0.3, rough: 0.6 });
  const deck = o.mesh(new THREE.CylinderGeometry(1.75, 1.7, 0.12, seg), deckPaint);
  deck.position.y = 0.06;
  root.add(deck);
  const posts = q(opts, 18, 10);
  for (let i = 0; i < posts; i++) {
    const a = (i / posts) * Math.PI * 2;
    const p = o.mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.5, 6), iron);
    p.position.set(Math.cos(a) * 1.7, 0.37, Math.sin(a) * 1.7);
    root.add(p);
  }
  for (const [y, t] of [[0.62, 0.03], [0.38, 0.016]] as const) {
    const rail = o.mesh(new THREE.TorusGeometry(1.7, t, 6, seg), iron);
    rail.rotation.x = Math.PI / 2;
    rail.position.y = y;
    root.add(rail);
  }
  const white = paintMat(o, opts.seed + 1, '#d9d6cc', { chips: 0.12, under: '#6a4a34', repeat: [6, 1], rough: 0.55, streakAlongV: true });
  const wall = o.mesh(new THREE.CylinderGeometry(1.05, 1.08, 0.3, 12), white);
  wall.position.y = 0.27;
  root.add(wall);
  const glass = o.mat(new THREE.MeshPhysicalMaterial({ color: '#cfe0e6', roughness: 0.05, metalness: 0, transparent: true, opacity: 0.22, depthWrite: false, clearcoat: 1, side: THREE.DoubleSide }));
  const glazing = o.mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.7, 12, 1, true), glass);
  glazing.position.y = 0.77;
  glazing.renderOrder = 2;
  glazing.castShadow = false;
  root.add(glazing);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const m = o.mesh(new THREE.BoxGeometry(0.04, 0.7, 0.04), iron);
    m.position.set(Math.sin(a) * 1.0, 0.77, Math.cos(a) * 1.0);
    m.rotation.y = a;
    root.add(m);
  }
  for (const [y, t] of [[0.42, 0.035], [0.77, 0.018], [1.12, 0.035]] as const) {
    const ring = o.mesh(new THREE.TorusGeometry(1.0, t, 5, 12), iron);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    root.add(ring);
  }
  // The lens: banded glass glowing warm.
  const lensMap = pixelTex(o, 64, 128, (u, v) => {
    const band = 0.55 + 0.45 * Math.pow(Math.abs(Math.sin(v * Math.PI * 9)), 0.5);
    const pane = (u * 8) % 1 < 0.05 ? 0.4 : 1;
    return mul3(hex('#ffd690'), band * pane);
  });
  const lensMat = o.mat(new THREE.MeshStandardMaterial({ map: lensMap, emissiveMap: lensMap, emissive: '#ffcf7a', emissiveIntensity: 1.6, roughness: 0.2 }));
  const lens = o.mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.5, 16), lensMat);
  lens.position.y = 0.75;
  root.add(lens);
  const pedestal = o.mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.12, 12), brassMat(o, opts.seed, 0.4));
  pedestal.position.y = 0.46;
  root.add(pedestal);
  // Red dome with seams, cornice, ventilator ball.
  const n = noise2(opts.seed + 8);
  const red = hex('#9a2a22');
  const domeMap = pixelTex(o, 256, 64, (u, v) => {
    const seam = (u * 16) % 1 < 0.035 ? 0.7 : 1;
    const streak = 0.85 + 0.15 * fbm(n, u * 40, v * 2, 3, 40);
    return mix3(mul3(red, seam * streak), hex('#4a2a22'), smooth(0.7, 0.9, n(u * 60, v * 8, 60, 8)) * 0.4);
  });
  const domeG = new THREE.SphereGeometry(1.1, seg, q(opts, 10, 6), 0, Math.PI * 2, 0, Math.PI / 2);
  domeG.scale(1, 0.36, 1);
  const dome = o.mesh(domeG, o.mat(new THREE.MeshStandardMaterial({ map: domeMap, roughness: 0.5, metalness: 0.2 })));
  dome.position.y = 1.13;
  root.add(dome);
  const cornice = o.mesh(new THREE.TorusGeometry(1.1, 0.045, 6, seg), iron);
  cornice.rotation.x = Math.PI / 2;
  cornice.position.y = 1.13;
  root.add(cornice);
  const neck = o.mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.08, 10), iron);
  neck.position.y = 1.53;
  root.add(neck);
  const ball = o.mesh(new THREE.SphereGeometry(0.08, 12, 8), iron);
  ball.position.y = 1.6;
  root.add(ball);
  const spike = o.mesh(new THREE.ConeGeometry(0.015, 0.1, 6), iron);
  spike.position.y = 1.72;
  root.add(spike);
  const setState = (s: string): void => {
    lensMat.emissiveIntensity = s === 'off' ? 0.04 : 1.6;
  };
  return o.item(fit(root, size), setState);
};
