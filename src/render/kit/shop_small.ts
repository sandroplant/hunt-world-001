// Small shop objects: key, counter bell, scales, globe, music box, compass, snow globe, spectacles, marble, toy mouse,
// teacup with a star. Each is designed in metres at its nominal size and fitted to the asked size.
import * as THREE from 'three';
import type { KitBuilder } from './types';
import { Owned, rng, surfaces } from './util';
import { blotches, brass, fit, hi, lathe, ownedCanvas, paper, rod, scaleUV, specks, starPath, varTube, woodBox, woodMat } from './shop_util';

const V = (x: number, y: number, z: number): THREE.Vector3 => new THREE.Vector3(x, y, z);

export const key: KitBuilder = async (size, opts) => {
  const o = new Owned();
  const r = rng(opts.seed);
  const mat = brass(o, 0.25);
  mat.color.set('#e8bc62');
  mat.emissive.set('#3a2408');
  const g = new THREE.Group();
  const tub = hi(opts, 32, 16);
  const rad = hi(opts, 10, 6);
  // Bow: an outer ring and a small inner trefoil ring.
  const bow = o.mesh(new THREE.TorusGeometry(0.0108, 0.0029, rad, tub), mat);
  bow.rotation.x = Math.PI / 2;
  bow.position.x = -0.028;
  bow.scale.set(1, 1.08, 1);
  g.add(bow);
  const inner = o.mesh(new THREE.TorusGeometry(0.0042, 0.0013, 6, hi(opts, 16, 10)), mat);
  inner.rotation.x = Math.PI / 2;
  inner.position.x = -0.028;
  g.add(inner);
  for (const a of [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3]) {
    const s = rod(o, V(-0.028 + Math.cos(a) * 0.0045, 0, Math.sin(a) * 0.0045), V(-0.028 + Math.cos(a) * 0.009, 0, Math.sin(a) * 0.009), 0.0011, mat, 6);
    g.add(s);
  }
  // Collar and shaft.
  const collar = o.mesh(new THREE.CylinderGeometry(0.0046, 0.0046, 0.005, rad), mat);
  collar.rotation.z = Math.PI / 2;
  collar.position.x = -0.0145;
  g.add(collar);
  const collar2 = o.mesh(new THREE.CylinderGeometry(0.0038, 0.0038, 0.0025, rad), mat);
  collar2.rotation.z = Math.PI / 2;
  collar2.position.x = -0.009;
  g.add(collar2);
  g.add(rod(o, V(-0.017, 0, 0), V(0.036, 0, 0), 0.0027, mat, rad));
  const tip = o.mesh(new THREE.SphereGeometry(0.003, rad, 6), mat);
  tip.position.x = 0.036;
  g.add(tip);
  // Bit with wards (seeded notches).
  const cuts = [0.0125, 0.0085 + r() * 0.002, 0.012, 0.007 + r() * 0.002];
  const bw = 0.0034;
  for (const [i, len] of cuts.entries()) {
    const b = o.mesh(new THREE.BoxGeometry(bw, 0.0042, len), mat);
    b.position.set(0.0215 + i * bw, 0, -len / 2);
    g.add(b);
  }
  return o.item(fit(g, size));
};

export const counter_bell: KitBuilder = async (size, opts) => {
  const o = new Owned();
  const set = await opts.assets.textureSet('dark_wooden_planks');
  const segs = hi(opts, 40, 20);
  const wood = woodMat(o, set, { color: '#e0b896', rough: 0.55 });
  const g = new THREE.Group();
  const baseGeo = lathe(
    [
      [0, 0],
      [0.056, 0],
      [0.059, 0.004],
      [0.059, 0.015],
      [0.055, 0.021],
      [0.046, 0.024],
      [0, 0.024],
    ],
    segs,
  );
  g.add(o.mesh(scaleUV(baseGeo, 0.1 / 1.6, 0.35 / 1.6, true, [opts.seed * 0.13, 0.2]), wood));
  const dome = brass(o, 0.2);
  const domeGeo = lathe(
    [
      [0, 0.0235],
      [0.0475, 0.0235],
      [0.0485, 0.0265],
      [0.0465, 0.033],
      [0.043, 0.046],
      [0.036, 0.057],
      [0.026, 0.0655],
      [0.013, 0.0705],
      [0, 0.0715],
    ],
    segs,
  );
  g.add(o.mesh(domeGeo, dome));
  const pin = brass(o, 0.3);
  const collar = o.mesh(new THREE.CylinderGeometry(0.0075, 0.009, 0.004, 16), pin);
  collar.position.y = 0.0725;
  g.add(collar);
  g.add(rod(o, V(0, 0.072, 0), V(0, 0.09, 0), 0.0032, pin, 10));
  const knob = o.mesh(new THREE.SphereGeometry(0.0085, 16, 10), pin);
  knob.position.y = 0.0915;
  knob.scale.y = 0.85;
  g.add(knob);
  return o.item(fit(g, size));
};

export const brass_scales: KitBuilder = async (size, opts) => {
  const o = new Owned();
  const set = await opts.assets.textureSet('dark_wooden_planks');
  const wood = woodMat(o, set, { color: '#e2b894', rough: 0.55 });
  const b1 = brass(o, 0.32);
  const b2 = brass(o, 0.24);
  const segs = hi(opts, 32, 16);
  const g = new THREE.Group();
  const off: [number, number] = [opts.seed * 0.17, 0.1];
  const base = o.mesh(woodBox(0.34, 0.026, 0.15, 1.6, 'x', off), wood);
  base.position.y = 0.013;
  g.add(base);
  const step = o.mesh(woodBox(0.27, 0.014, 0.11, 1.6, 'x', off), wood);
  step.position.y = 0.033;
  g.add(step);
  const post = o.mesh(
    lathe(
      [
        [0, 0.04],
        [0.03, 0.04],
        [0.03, 0.045],
        [0.022, 0.05],
        [0.012, 0.062],
        [0.008, 0.075],
        [0.0065, 0.09],
        [0.0065, 0.29],
        [0.0105, 0.298],
        [0.0105, 0.31],
        [0.006, 0.315],
        [0, 0.315],
      ],
      segs,
    ),
    b1,
  );
  g.add(post);
  const pivot = o.mesh(new THREE.BoxGeometry(0.03, 0.022, 0.014), b1);
  pivot.position.y = 0.326;
  g.add(pivot);
  // Beam, with a slight taper made of two rods, and a pointer.
  g.add(rod(o, V(-0.155, 0.333, 0), V(0, 0.336, 0), 0.0042, b2, 10, 0.0028));
  g.add(rod(o, V(0.155, 0.333, 0), V(0, 0.336, 0), 0.0042, b2, 10, 0.0028));
  g.add(rod(o, V(0, 0.336, 0.008), V(0, 0.392, 0.008), 0.0025, b2, 8, 0.0006));
  const finial = o.mesh(new THREE.SphereGeometry(0.008, 14, 10), b2);
  finial.position.set(0, 0.336, 0.008);
  g.add(finial);
  for (const sx of [-1, 1]) {
    const x = sx * 0.152;
    const hook = o.mesh(new THREE.TorusGeometry(0.006, 0.0015, 6, 14), b2);
    hook.position.set(x, 0.327, 0);
    g.add(hook);
    const pan = o.mesh(
      lathe(
        [
          [0, 0.097],
          [0.028, 0.097],
          [0.044, 0.103],
          [0.052, 0.113],
          [0.0505, 0.1135],
          [0.042, 0.106],
          [0.027, 0.1],
          [0, 0.1],
        ],
        segs,
      ),
      b2,
    );
    pan.position.x = x;
    g.add(pan);
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + Math.PI / 2;
      g.add(rod(o, V(x, 0.321, 0), V(x + Math.cos(a) * 0.05, 0.113, Math.sin(a) * 0.05), 0.0011, b1, 4));
    }
  }
  return o.item(fit(g, size));
};

function drawMap(ctx: CanvasRenderingContext2D, w: number, h: number, r: () => number): void {
  const sea = ctx.createLinearGradient(0, 0, 0, h);
  sea.addColorStop(0, '#8a6538');
  sea.addColorStop(0.5, '#a97f48');
  sea.addColorStop(1, '#8a6538');
  ctx.fillStyle = sea;
  ctx.fillRect(0, 0, w, h);
  blotches(ctx, w, h, r, 60, ['rgba(90,55,20,0.12)', 'rgba(255,235,190,0.10)'], 20, 120);
  // Continents: noisy blobs, drawn wrapped across the seam.
  const blobs: { bx: number; by: number; pts: [number, number][] }[] = [];
  for (let i = 0; i < 9; i++) {
    const br = h * (0.08 + r() * 0.13);
    const pts: [number, number][] = [];
    const n = 40;
    const ph = [r() * 6, r() * 6, r() * 6];
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      const rr = br * (1 + 0.28 * Math.sin(a * 3 + ph[0]!) + 0.16 * Math.sin(a * 5 + ph[1]!) + 0.1 * Math.sin(a * 9 + ph[2]!));
      pts.push([Math.cos(a) * rr * 1.4, Math.sin(a) * rr]);
    }
    blobs.push({ bx: r() * w, by: h * (0.2 + r() * 0.6), pts });
  }
  for (const pass of [0, 1, 2]) {
    for (const { bx, by, pts } of blobs) {
      for (const dx of [-w, 0, w]) {
        ctx.beginPath();
        for (const [k, [px, py]] of pts.entries()) {
          if (k === 0) ctx.moveTo(bx + px + dx, by + py);
          else ctx.lineTo(bx + px + dx, by + py);
        }
        ctx.closePath();
        if (pass === 0) {
          ctx.strokeStyle = 'rgba(70,45,20,0.35)';
          ctx.lineWidth = 9;
          ctx.stroke();
        } else if (pass === 1) {
          ctx.fillStyle = '#efdcaa';
          ctx.fill();
        } else {
          ctx.strokeStyle = '#5a3a1a';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    }

  }
  // Grid: meridians every 30°, parallels every 30°, equator and tropics in red.
  ctx.strokeStyle = 'rgba(60,35,15,0.55)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i <= 12; i++) {
    ctx.beginPath();
    ctx.moveTo((i / 12) * w, 0);
    ctx.lineTo((i / 12) * w, h);
    ctx.stroke();
  }
  for (let j = 1; j < 6; j++) {
    ctx.beginPath();
    ctx.moveTo(0, (j / 6) * h);
    ctx.lineTo(w, (j / 6) * h);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(150,40,25,0.8)';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([10, 6]);
  for (const lat of [0, 23.5, -23.5]) {
    const y = h / 2 - (lat / 180) * h;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  specks(ctx, w, h, r, 5000, (x) => `rgba(60,35,10,${0.05 + x * 0.08})`, 2);
}

export const globe: KitBuilder = async (size, opts) => {
  const o = new Owned();
  const r = rng(opts.seed * 7 + 3);
  const set = await opts.assets.textureSet('dark_wooden_planks');
  const wood = woodMat(o, set, { color: '#e6b48c', rough: 0.5 });
  const b = brass(o, 0.3);
  const segs = hi(opts, 40, 20);
  const g = new THREE.Group();
  const foot = lathe(
    [
      [0, 0],
      [0.09, 0],
      [0.093, 0.006],
      [0.09, 0.013],
      [0.075, 0.018],
      [0.05, 0.022],
      [0.032, 0.03],
      [0.024, 0.04],
      [0.018, 0.05],
      [0.022, 0.058],
      [0.016, 0.064],
      [0, 0.064],
    ],
    segs,
  );
  g.add(o.mesh(scaleUV(foot, 0.2 / 1.6, 0.58 / 1.6, true, [opts.seed * 0.21, 0.3]), wood));
  const cup = o.mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.012, 20), b);
  cup.position.y = 0.068;
  g.add(cup);
  const cy = 0.205;
  const R = 0.125;
  const mapTex = ownedCanvas(o, 1024, 512, (ctx, w, h) => drawMap(ctx, w, h, r));
  const gm = o.mat(new THREE.MeshPhysicalMaterial({ map: mapTex, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.3 }));
  const tilt = (23.5 * Math.PI) / 180;
  const holder = new THREE.Group();
  holder.position.y = cy;
  holder.rotation.z = tilt;
  g.add(holder);
  const sphere = o.mesh(new THREE.SphereGeometry(R, segs, hi(opts, 28, 14)), gm);
  sphere.rotation.y = r() * Math.PI * 2;
  holder.add(sphere);
  // The meridian ring and its pins at the poles.
  const ring = o.mesh(new THREE.TorusGeometry(0.137, 0.0045, 8, Math.round(segs * 1.6)), b);
  holder.add(ring);
  for (const s of [-1, 1]) holder.add(rod(o, V(0, s * (R - 0.004), 0), V(0, s * 0.141, 0), 0.0035, b, 10));
  const finial = o.mesh(new THREE.SphereGeometry(0.006, 12, 8), b);
  finial.position.y = 0.143;
  holder.add(finial);
  // The ring rests in the cup on the stand (the ring's lowest point is under the centre).
  g.add(rod(o, V(0, 0.062, 0), V(0, cy - 0.137, 0), 0.006, b, 12));
  return o.item(fit(g, size));
};

export const music_box: KitBuilder = async (size, opts) => {
  const o = new Owned();
  const r = rng(opts.seed * 3 + 1);
  const set = await opts.assets.textureSet('dark_wooden_planks');
  const wood = woodMat(o, set, { color: '#f0b88a', rough: 0.45 });
  const b = brass(o, 0.3);
  const g = new THREE.Group();
  const off: [number, number] = [r(), r()];
  const W = 0.2;
  const D = 0.16;
  const body = o.mesh(woodBox(W, 0.085, D, 1.4, 'x', off), wood);
  body.position.y = 0.0085 + 0.0425;
  g.add(body);
  const lid = o.mesh(woodBox(W + 0.006, 0.03, D + 0.006, 1.4, 'x', [off[0] + 0.3, off[1]]), wood);
  lid.position.y = 0.0955 + 0.015;
  g.add(lid);
  const panel = o.mesh(woodBox(W - 0.03, 0.008, D - 0.03, 1.4, 'x', [off[0] + 0.5, off[1] + 0.2]), wood);
  panel.position.y = 0.1255 + 0.004;
  g.add(panel);
  // Inlay on the lid: a pale oval with a treble clef and a border line.
  const inlay = ownedCanvas(o, 512, 384, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(232,200,150,0.9)';
    ctx.lineWidth = 6;
    ctx.strokeRect(18, 18, w - 36, h - 36);
    ctx.fillStyle = 'rgba(226,190,135,0.92)';
    ctx.beginPath();
    ctx.ellipse(w / 2, h / 2, w * 0.28, h * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(90,50,20,0.9)';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = 'rgba(70,35,15,0.95)';
    ctx.font = `bold ${Math.floor(h * 0.42)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('♫', w / 2, h / 2 + 6);
  });
  const inlayMat = o.mat(new THREE.MeshStandardMaterial({ map: inlay, transparent: true, roughness: 0.45, polygonOffset: true, polygonOffsetFactor: -2 }));
  const inl = o.mesh(new THREE.PlaneGeometry(W - 0.04, D - 0.04), inlayMat);
  inl.rotation.x = -Math.PI / 2;
  inl.position.y = 0.1336;
  g.add(inl);
  // Brass band between lid and body, corner caps and ball feet.
  const band = o.mesh(new THREE.BoxGeometry(W + 0.003, 0.004, D + 0.003), b);
  band.position.y = 0.0945;
  g.add(band);
  const c = 0.016;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      for (const y of [0.0085 + c / 2 - 0.001, 0.1255 - c / 2 + 0.003]) {
        const cap = o.mesh(new THREE.BoxGeometry(c, c, c), b);
        cap.position.set(sx * (W / 2 - c / 2 + 0.0025), y, sz * (D / 2 - c / 2 + 0.0025));
        g.add(cap);
      }
      const foot = o.mesh(new THREE.SphereGeometry(0.0055, 12, 8), b);
      foot.position.set(sx * (W / 2 - 0.012), 0.0055, sz * (D / 2 - 0.012));
      g.add(foot);
    }
  }
  // Keyhole escutcheon on the front.
  const plate = o.mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.002, 16), b);
  plate.rotation.x = Math.PI / 2;
  plate.position.set(0, 0.07, D / 2 + 0.001);
  plate.scale.set(0.8, 1, 1.3);
  g.add(plate);
  const hole = new THREE.Shape();
  hole.absarc(0, 0.002, 0.0025, 0, Math.PI * 2, false);
  const slot = new THREE.Shape();
  slot.moveTo(-0.0012, 0.001);
  slot.lineTo(0.0012, 0.001);
  slot.lineTo(0.002, -0.006);
  slot.lineTo(-0.002, -0.006);
  const dark = surfaces.iron(o, '#0d0a08');
  for (const s of [hole, slot]) {
    const m = o.mesh(new THREE.ShapeGeometry(s, 10), dark);
    m.position.set(0, 0.07, D / 2 + 0.0022);
    g.add(m);
  }
  // Side crank on +X.
  const ax = W / 2 + 0.003;
  g.add(rod(o, V(ax - 0.004, 0.05, 0), V(ax + 0.014, 0.05, 0), 0.003, b, 12));
  const boss = o.mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.003, 16), b);
  boss.rotation.z = Math.PI / 2;
  boss.position.set(ax + 0.0005, 0.05, 0);
  g.add(boss);
  const arm = o.mesh(new THREE.BoxGeometry(0.004, 0.034, 0.007), b);
  arm.position.set(ax + 0.016, 0.037, 0);
  g.add(arm);
  const knob = o.mesh(scaleUV(lathe([[0, 0], [0.0045, 0.001], [0.005, 0.008], [0.0035, 0.014], [0, 0.015]], 12), 0.03, 0.02, true), wood);
  knob.rotation.z = -Math.PI / 2;
  knob.position.set(ax + 0.018, 0.023, 0);
  g.add(knob);
  return o.item(fit(g, size));
};

export const compass: KitBuilder = async (size, opts) => {
  const o = new Owned();
  const r = rng(opts.seed * 5 + 2);
  const segs = hi(opts, 40, 20);
  const b = brass(o, 0.28);
  const g = new THREE.Group();
  const R = 0.03;
  const caseGeo = lathe(
    [
      [0, 0],
      [0.026, 0],
      [0.0295, 0.002],
      [0.031, 0.006],
      [0.0305, 0.011],
      [0.0285, 0.0125],
      [0.0272, 0.0125],
      [0.0272, 0.006],
      [0, 0.006],
    ],
    segs,
  );
  g.add(o.mesh(caseGeo, b));
  const dial = ownedCanvas(o, 512, 512, (ctx, w) => {
    const c = w / 2;
    paper(ctx, w, w, r, '#efe2bd');
    ctx.strokeStyle = '#2a1d10';
    ctx.lineWidth = 3;
    for (const rr of [0.97, 0.82, 0.78]) {
      ctx.beginPath();
      ctx.arc(c, c, c * rr, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const l = i % 9 === 0 ? 0.14 : i % 3 === 0 ? 0.09 : 0.05;
      ctx.lineWidth = i % 9 === 0 ? 3 : 1.5;
      ctx.beginPath();
      ctx.moveTo(c + Math.cos(a) * c * 0.97, c + Math.sin(a) * c * 0.97);
      ctx.lineTo(c + Math.cos(a) * c * (0.97 - l), c + Math.sin(a) * c * (0.97 - l));
      ctx.stroke();
    }
    // Eight-point rose, half dark half light points.
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
      const len = i % 2 === 0 ? 0.62 : 0.4;
      const tip = [c + Math.cos(a) * c * len, c + Math.sin(a) * c * len] as const;
      const s1 = [c + Math.cos(a + Math.PI / 2) * c * 0.08, c + Math.sin(a + Math.PI / 2) * c * 0.08] as const;
      const s2 = [c + Math.cos(a - Math.PI / 2) * c * 0.08, c + Math.sin(a - Math.PI / 2) * c * 0.08] as const;
      ctx.fillStyle = i === 0 ? '#9c2a1c' : '#2a1d10';
      ctx.beginPath();
      ctx.moveTo(c, c);
      ctx.lineTo(...tip);
      ctx.lineTo(...s1);
      ctx.fill();
      ctx.fillStyle = '#d8c79c';
      ctx.beginPath();
      ctx.moveTo(c, c);
      ctx.lineTo(...tip);
      ctx.lineTo(...s2);
      ctx.fill();
      ctx.strokeStyle = '#2a1d10';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.fillStyle = '#1e140a';
    ctx.font = 'bold 54px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const L = ['N', 'E', 'S', 'W'];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
      ctx.fillStyle = i === 0 ? '#9c2a1c' : '#1e140a';
      ctx.fillText(L[i]!, c + Math.cos(a) * c * 0.7, c + Math.sin(a) * c * 0.7);
    }
  });
  const dialM = o.mat(new THREE.MeshStandardMaterial({ map: dial, roughness: 0.6 }));
  const face = o.mesh(new THREE.CircleGeometry(0.0272, segs), dialM);
  face.rotation.x = -Math.PI / 2;
  face.position.y = 0.0062;
  g.add(face);
  // Needle: north half red, south half blued steel, on a brass pivot.
  const needle = new THREE.Group();
  const half = (len: number): THREE.Shape => {
    const s = new THREE.Shape();
    s.moveTo(-0.0024, 0);
    s.lineTo(0, len);
    s.lineTo(0.0024, 0);
    s.closePath();
    return s;
  };
  const north = o.mesh(new THREE.ShapeGeometry(half(0.021)), o.mat(new THREE.MeshStandardMaterial({ color: '#b3301f', metalness: 0.4, roughness: 0.35, side: THREE.DoubleSide })));
  const south = o.mesh(new THREE.ShapeGeometry(half(0.021)), o.mat(new THREE.MeshStandardMaterial({ color: '#2a3140', metalness: 0.9, roughness: 0.3, side: THREE.DoubleSide })));
  south.rotation.z = Math.PI;
  needle.add(north, south);
  needle.rotation.x = -Math.PI / 2;
  needle.position.y = 0.0082;
  const turn = new THREE.Group();
  turn.rotation.y = (r() - 0.5) * 0.5;
  turn.add(needle);
  g.add(turn);
  const pivot = o.mesh(new THREE.SphereGeometry(0.0022, 10, 6), b);
  pivot.position.y = 0.0085;
  g.add(pivot);
  const glass = o.mesh(new THREE.CircleGeometry(0.0275, segs), surfaces.glass(o, '#f4f0e6', 0.07));
  glass.rotation.x = -Math.PI / 2;
  glass.position.y = 0.0115;
  g.add(glass);
  // Lid on a hinge at the back, opened past upright; its inside is engraved.
  const hinge = new THREE.Group();
  hinge.position.set(0, 0.0125, -R);
  hinge.rotation.x = (-138 * Math.PI) / 180;
  g.add(hinge);
  const lidGeo = lathe(
    [
      [0.0312, 0],
      [0.0312, 0.002],
      [0.029, 0.0045],
      [0.02, 0.0068],
      [0, 0.0075],
    ],
    segs,
  );
  const lid = o.mesh(lidGeo, b);
  lid.position.z = R;
  hinge.add(lid);
  const engr = ownedCanvas(o, 256, 256, (ctx, w) => {
    const c = w / 2;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, w);
    ctx.strokeStyle = 'rgba(90,60,20,0.75)';
    ctx.lineWidth = 2;
    for (const rr of [0.92, 0.84]) {
      ctx.beginPath();
      ctx.arc(c, c, c * rr, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(c + Math.cos(a) * c * 0.12, c + Math.sin(a) * c * 0.12);
      ctx.lineTo(c + Math.cos(a) * c * (i % 2 ? 0.55 : 0.75), c + Math.sin(a) * c * (i % 2 ? 0.55 : 0.75));
      ctx.stroke();
    }
  });
  const inner = o.mesh(new THREE.CircleGeometry(0.029, segs), o.mat(new THREE.MeshStandardMaterial({ map: engr, color: '#dcae58', metalness: 1, roughness: 0.35, side: THREE.DoubleSide })));
  inner.rotation.x = Math.PI / 2;
  inner.position.set(0, 0.0005, R);
  hinge.add(inner);
  const knuckle = rod(o, V(-0.006, 0, 0), V(0.006, 0, 0), 0.0018, b, 8);
  hinge.add(knuckle);
  // Crown and bow ring on the side.
  const crown = rod(o, V(0.03, 0.0065, 0), V(0.037, 0.0065, 0), 0.0028, b, 12);
  g.add(crown);
  const bow = o.mesh(new THREE.TorusGeometry(0.0065, 0.0014, 6, 20), b);
  bow.position.set(0.0435, 0.0065, 0);
  bow.rotation.x = Math.PI / 2;
  g.add(bow);
  return o.item(fit(g, size));
};

export const snow_globe: KitBuilder = async (size, opts) => {
  const o = new Owned();
  const r = rng(opts.seed * 11 + 5);
  const set = await opts.assets.textureSet('dark_wooden_planks');
  const wood = woodMat(o, set, { color: '#eab48c', rough: 0.45 });
  const segs = hi(opts, 40, 20);
  const g = new THREE.Group();
  const baseGeo = lathe(
    [
      [0, 0],
      [0.047, 0],
      [0.05, 0.004],
      [0.049, 0.012],
      [0.044, 0.024],
      [0.039, 0.031],
      [0.036, 0.034],
      [0, 0.034],
    ],
    segs,
  );
  g.add(o.mesh(scaleUV(baseGeo, 0.06 / 1.4, 0.3 / 1.4, true, [r(), r()]), wood));
  const b = brass(o, 0.3);
  const collar = o.mesh(new THREE.TorusGeometry(0.0345, 0.0024, 6, 32), b);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.034;
  g.add(collar);
  const R = 0.045;
  const cy = 0.034 + Math.sqrt(R * R - 0.034 * 0.034);
  const theta = Math.acos(-(cy - 0.034) / R);
  const glass = o.mesh(new THREE.SphereGeometry(R, hi(opts, 36, 20), hi(opts, 20, 12), 0, Math.PI * 2, 0, theta), surfaces.glass(o, '#eef6fa', 0.22));
  glass.position.y = cy;
  glass.renderOrder = 2;
  g.add(glass);
  // Snowy ground.
  const snowTex = ownedCanvas(o, 128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#f4f6f8';
    ctx.fillRect(0, 0, w, h);
    blotches(ctx, w, h, r, 30, ['rgba(150,170,200,0.25)', 'rgba(255,255,255,0.4)'], 4, 20);
  });
  const snow = o.mat(new THREE.MeshStandardMaterial({ map: snowTex, roughness: 0.8 }));
  const ground = o.mesh(new THREE.SphereGeometry(0.0345, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2), snow);
  ground.scale.y = 0.28;
  ground.position.y = 0.034;
  g.add(ground);
  // Lighthouse: striped tower, gallery, lit lantern room, red cap.
  const stripes = ownedCanvas(o, 64, 256, (ctx, w, h) => {
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#f2eee6' : '#b52a1f';
      ctx.fillRect(0, (i / 6) * h, w, h / 6);
    }
    specks(ctx, w, h, r, 300, (x) => `rgba(60,30,20,${x * 0.15})`, 2);
    ctx.fillStyle = '#2a1c14';
    ctx.fillRect(w * 0.45, h * 0.88, w * 0.1, h * 0.12);
    ctx.fillRect(w * 0.45, h * 0.45, w * 0.08, h * 0.06);
  });
  const lh = new THREE.Group();
  lh.position.set(0.006, 0.04, -0.004);
  g.add(lh);
  const tower = o.mesh(new THREE.CylinderGeometry(0.0055, 0.0085, 0.038, 16, 1), o.mat(new THREE.MeshStandardMaterial({ map: stripes, roughness: 0.6 })));
  tower.position.y = 0.019;
  lh.add(tower);
  const iron = surfaces.iron(o, '#1d1f22');
  const gallery = o.mesh(new THREE.CylinderGeometry(0.0078, 0.0078, 0.0015, 16), iron);
  gallery.position.y = 0.0385;
  lh.add(gallery);
  const lamp = o.mesh(new THREE.CylinderGeometry(0.0042, 0.0042, 0.006, 12), o.mat(new THREE.MeshStandardMaterial({ color: '#ffd27a', emissive: '#ffb347', emissiveIntensity: 1.6, roughness: 0.2 })));
  lamp.position.y = 0.0423;
  lh.add(lamp);
  const cap = o.mesh(new THREE.ConeGeometry(0.0058, 0.0055, 16), o.mat(new THREE.MeshStandardMaterial({ map: stripes, roughness: 0.5 })));
  cap.position.y = 0.048;
  lh.add(cap);
  // Two small snowy fir trees.
  const fir = ownedCanvas(o, 64, 64, (ctx, w, h) => {
    ctx.fillStyle = '#1f3f2a';
    ctx.fillRect(0, 0, w, h);
    specks(ctx, w, h, r, 300, (x) => (x < 0.5 ? `rgba(240,245,250,${0.5 + x})` : `rgba(10,30,15,0.6)`), 3, Math.PI * 0.1);
  });
  const firM = o.mat(new THREE.MeshStandardMaterial({ map: fir, roughness: 0.8 }));
  for (const [x, z, s] of [
    [-0.017, 0.006, 1],
    [-0.01, 0.017, 0.75],
  ] as const) {
    const t = o.mesh(new THREE.ConeGeometry(0.006 * s, 0.02 * s, 10), firM);
    t.position.set(x, 0.0395 + 0.01 * s, z);
    g.add(t);
  }
  // Flecks of snow drifting in the water.
  const n = hi(opts, 50, 25);
  const flecks = new THREE.InstancedMesh(o.geo(new THREE.IcosahedronGeometry(0.0009, 0)), o.mat(new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5 })), n);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < n; i++) {
    let p: THREE.Vector3;
    do p = V((r() * 2 - 1) * 0.037, (r() * 2 - 1) * 0.037, (r() * 2 - 1) * 0.037);
    while (p.length() > 0.037 || cy + p.y < 0.045);
    m4.makeRotationFromEuler(new THREE.Euler(r() * 3, r() * 3, 0)).setPosition(p.x, cy + p.y, p.z);
    flecks.setMatrixAt(i, m4);
  }
  g.add(flecks);
  return o.item(fit(g, size));
};

export const spectacles: KitBuilder = async (size, opts) => {
  const o = new Owned();
  const wire = brass(o, 0.3);
  const lensM = surfaces.glass(o, '#eef4f4', 0.16);
  const tub = hi(opts, 32, 18);
  const g = new THREE.Group();
  const front = new THREE.Group();
  const lr = 0.0185;
  for (const s of [-1, 1]) {
    const rim = o.mesh(new THREE.TorusGeometry(lr, 0.0011, 6, tub), wire);
    rim.position.x = s * 0.026;
    front.add(rim);
    const lens = o.mesh(new THREE.CircleGeometry(lr, tub), lensM);
    lens.position.x = s * 0.026;
    front.add(lens);
    // End piece and hinge going back from the outer side.
    front.add(rod(o, V(s * (0.026 + lr), 0.004, 0), V(s * (0.026 + lr + 0.003), 0.004, -0.004), 0.0011, wire, 5));
  }
  const bridge = o.mesh(new THREE.TorusGeometry(0.0078, 0.001, 5, 12, Math.PI), wire);
  bridge.position.y = 0.002;
  front.add(bridge);
  // Temples folded behind the lenses, crossing, each ending in a curled ear hook.
  for (const [s, y, z] of [
    [-1, 0.006, -0.006],
    [1, 0.0, -0.0095],
  ] as const) {
    const x0 = s * (0.026 + lr + 0.003);
    const x1 = -s * 0.032;
    front.add(rod(o, V(x0, 0.004, -0.004), V(x0, y, z), 0.001, wire, 5));
    front.add(rod(o, V(x0, y, z), V(x1, y, z), 0.001, wire, 5));
    const hook = o.mesh(new THREE.TorusGeometry(0.008, 0.001, 5, 12, Math.PI * 0.9), wire);
    hook.position.set(x1, y - 0.008, z);
    hook.rotation.z = s > 0 ? Math.PI * 0.5 : -Math.PI * 0.4;
    front.add(hook);
  }
  front.rotation.x = -0.32;
  g.add(front);
  return o.item(fit(g, size));
};

export const marble: KitBuilder = async (size, opts) => {
  const o = new Owned();
  const r = rng(opts.seed * 13 + 7);
  const R = 0.015;
  const g = new THREE.Group();
  const glass = o.mesh(
    new THREE.SphereGeometry(R, hi(opts, 32, 16), hi(opts, 24, 12)),
    o.mat(new THREE.MeshPhysicalMaterial({ color: '#f2fbf8', roughness: 0.03, metalness: 0, transparent: true, opacity: 0.16, clearcoat: 1, clearcoatRoughness: 0.03, depthWrite: false, specularIntensity: 1 })),
  );
  glass.renderOrder = 2;
  g.add(glass);
  const palettes = [
    ['#1f5fbf', '#f2f2f2', '#e8a020'],
    ['#c0302a', '#f2e6c8', '#2a7a4a'],
    ['#2a8a7a', '#f0c040', '#e8e8f0'],
  ];
  const pal = palettes[Math.floor(r() * palettes.length)]!;
  const swirl = new THREE.Group();
  const nb = 3;
  for (let k = 0; k < nb; k++) {
    const col = pal[k]!;
    const tex = ownedCanvas(o, 64, 64, (ctx, w, h) => {
      ctx.fillStyle = col;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)';
        ctx.fillRect((i / 8) * w, 0, w / 16, h);
      }
    });
    const mat = o.mat(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.25, side: THREE.DoubleSide, emissive: col, emissiveIntensity: 0.12 }));
    const nu = hi(opts, 28, 14);
    const nv = 4;
    const pos: number[] = [];
    const uv: number[] = [];
    const idx: number[] = [];
    const phase = (k / nb) * Math.PI * 2;
    const width = k === 0 ? 0.95 : 0.6;
    for (let i = 0; i <= nu; i++) {
      const t = (i / nu) * 2 - 1;
      const a = t * 2.4 + phase;
      const hw = Math.sqrt(Math.max(0, 1 - t * t)) * R * 0.82 * width;
      for (let j = 0; j <= nv; j++) {
        const s = (j / nv) * 2 - 1;
        pos.push(Math.cos(a) * s * hw + Math.cos(a + 1.57) * 0.002 * k, t * R * 0.86, Math.sin(a) * s * hw + Math.sin(a + 1.57) * 0.002 * k);
        uv.push(j / nv, i / nu);
      }
    }
    for (let i = 0; i < nu; i++) {
      for (let j = 0; j < nv; j++) {
        const a = i * (nv + 1) + j;
        idx.push(a, a + nv + 1, a + 1, a + 1, a + nv + 1, a + nv + 2);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    swirl.add(o.mesh(geo, mat));
  }
  swirl.rotation.set(r() * 1.2 + 0.4, r() * 3, r() * 0.8);
  g.add(swirl);
  return o.item(fit(g, size, {}, new THREE.Box3(V(-R, -R, -R), V(R, R, R))));
};

export const toy_mouse: KitBuilder = async (size, opts) => {
  const o = new Owned();
  const r = rng(opts.seed * 17 + 9);
  const segs = hi(opts, 28, 14);
  const felt = ownedCanvas(o, 256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#8d8a88';
    ctx.fillRect(0, 0, w, h);
    blotches(ctx, w, h, r, 40, ['rgba(0,0,0,0.12)', 'rgba(255,255,255,0.08)'], 6, 30);
    specks(ctx, w, h, r, 4000, (x) => (x < 0.5 ? `rgba(40,38,36,${0.15 + x * 0.3})` : `rgba(220,215,210,${(x - 0.5) * 0.4})`), 3);
    // Belly lighter (lathe u runs around; u = 0 and 1 face down after the body is turned).
    const gb = ctx.createLinearGradient(0, 0, w, 0);
    gb.addColorStop(0, 'rgba(230,225,215,0.4)');
    gb.addColorStop(0.2, 'rgba(230,225,215,0)');
    gb.addColorStop(0.8, 'rgba(230,225,215,0)');
    gb.addColorStop(1, 'rgba(230,225,215,0.4)');
    ctx.fillStyle = gb;
    ctx.fillRect(0, 0, w, h);
  });
  const fur = o.mat(new THREE.MeshPhysicalMaterial({ map: felt, roughness: 0.95, sheen: 0.6, sheenColor: new THREE.Color('#d8d4d0'), sheenRoughness: 0.7 }));
  const g = new THREE.Group();
  const bodyGeo = lathe(
    [
      [0, -0.04],
      [0.011, -0.0385],
      [0.019, -0.031],
      [0.0235, -0.019],
      [0.0245, -0.005],
      [0.0225, 0.008],
      [0.0175, 0.02],
      [0.011, 0.032],
      [0.005, 0.0415],
      [0, 0.045],
    ],
    segs,
  );
  const body = o.mesh(bodyGeo, fur);
  body.rotation.x = Math.PI / 2;
  body.scale.set(1, 1, 0.82);
  body.position.y = 0.0245 * 0.82 + 0.003;
  g.add(body);
  const pink = o.mat(new THREE.MeshPhysicalMaterial({ color: '#d79a98', roughness: 0.85, sheen: 0.4, sheenColor: new THREE.Color('#f0c0c0') }));
  for (const s of [-1, 1]) {
    const ear = o.mesh(new THREE.CylinderGeometry(0.0092, 0.0092, 0.0018, 18), fur);
    ear.rotation.set(Math.PI / 2 - 0.25, 0, s * 0.35);
    ear.position.set(s * 0.0115, 0.0415, 0.013);
    g.add(ear);
    const inner = o.mesh(new THREE.CylinderGeometry(0.0062, 0.0062, 0.0008, 16), pink);
    inner.rotation.copy(ear.rotation);
    inner.position.set(s * 0.0115, 0.0415, 0.0141);
    g.add(inner);
    const eye = o.mesh(new THREE.SphereGeometry(0.0024, 10, 8), o.mat(new THREE.MeshStandardMaterial({ color: '#0a0808', roughness: 0.15 })));
    eye.position.set(s * 0.0072, 0.0275, 0.031);
    g.add(eye);
  }
  const nose = o.mesh(new THREE.SphereGeometry(0.003, 10, 8), pink);
  nose.position.set(0, 0.0215, 0.0445);
  g.add(nose);
  // Tail: a thin pink-grey tube curling off the back and lying on the table.
  const tail = new THREE.CatmullRomCurve3([V(0, 0.012, -0.037), V(0.004, 0.006, -0.047), V(0.012, 0.0022, -0.054), V(0.022, 0.0018, -0.052), V(0.026, 0.0018, -0.042), V(0.022, 0.0018, -0.034)]);
  g.add(o.mesh(varTube(tail, hi(opts, 24, 12), 6, (t) => [0.0018 * (1 - t * 0.6), 0.0018 * (1 - t * 0.6)]), pink));
  // Clockwork key on the back: a shaft and a two-loop bow.
  const b = brass(o, 0.28);
  g.add(rod(o, V(0, 0.038, -0.014), V(0, 0.048, -0.014), 0.0016, b, 8));
  for (const s of [-1, 1]) {
    const loop = o.mesh(new THREE.TorusGeometry(0.0042, 0.0013, 6, 14), b);
    loop.position.set(s * 0.0045, 0.051, -0.014);
    g.add(loop);
  }
  return o.item(fit(g, size));
};

export const teacup_star: KitBuilder = async (size, opts) => {
  const o = new Owned();
  const model = await opts.assets.model('tea_set_01');
  const find = (name: string): THREE.Mesh | undefined => {
    let found: THREE.Mesh | undefined;
    model.traverse((c) => {
      if (!found && c.name === name && (c as THREE.Mesh).isMesh) found = c as THREE.Mesh;
    });
    return found;
  };
  const cupSrc = find('tea_set_01_cup_small_01');
  const saucerSrc = find('tea_set_01_saucer_circular_03');
  if (!cupSrc || !saucerSrc) throw new Error('teacup_star: tea_set_01 nodes missing');
  const own = (m: THREE.Mesh): THREE.Mesh => {
    const c = m.clone();
    c.position.set(0, 0, 0);
    c.rotation.set(0, 0, 0);
    c.scale.set(1, 1, 1);
    const src = Array.isArray(m.material) ? m.material[0]! : m.material;
    c.material = o.mat(src.clone());
    c.castShadow = true;
    c.receiveShadow = true;
    return c;
  };
  const g = new THREE.Group();
  const saucer = own(saucerSrc);
  g.add(saucer);
  const cupHolder = new THREE.Group();
  cupHolder.position.y = 0.0045;
  g.add(cupHolder);
  const cup = own(cupSrc);
  cup.rotation.y = -Math.PI / 2;
  cupHolder.add(cup);
  // The cup's outer profile on the side away from the handle, to wrap the painted star on it.
  const pos = cupSrc.geometry.getAttribute('position') as THREE.BufferAttribute;
  const prof = new Map<number, number>();
  const bin = 0.004;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    if (Math.abs(x) > 0.006 || z <= 0) continue;
    const k = Math.round(pos.getY(i) / bin);
    prof.set(k, Math.max(prof.get(k) ?? 0, z));
  }
  const radiusAt = (y: number): number => {
    const k = Math.floor(y / bin);
    const f = y / bin - k;
    const a = prof.get(k) ?? prof.get(k + 1) ?? 0.045;
    const b = prof.get(k + 1) ?? a;
    return a + (b - a) * f;
  };
  const y0 = 0.026;
  const y1 = 0.064;
  const starTex = ownedCanvas(o, 256, 256, (ctx, w) => {
    ctx.clearRect(0, 0, w, w);
    starPath(ctx, w / 2, w * 0.53, w * 0.44);
    ctx.fillStyle = '#f0c040';
    ctx.fill();
    ctx.strokeStyle = '#9a6414';
    ctx.lineWidth = 7;
    ctx.stroke();
    starPath(ctx, w / 2, w * 0.53, w * 0.22);
    ctx.fillStyle = '#fde58a';
    ctx.fill();
  });
  const starMat = o.mat(new THREE.MeshStandardMaterial({ map: starTex, transparent: true, alphaTest: 0.3, metalness: 0.35, roughness: 0.35, polygonOffset: true, polygonOffsetFactor: -4 }));
  const half = 0.5;
  const decoGeo = new THREE.CylinderGeometry(1, 1, y1 - y0, 12, 8, true, -half, half * 2);
  const dp = decoGeo.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < dp.count; i++) {
    const y = dp.getY(i) + (y0 + y1) / 2;
    const rr = radiusAt(y) + 0.0007;
    dp.setXYZ(i, dp.getX(i) * rr, y, dp.getZ(i) * rr);
  }
  decoGeo.computeVertexNormals();
  const deco = o.mesh(decoGeo, starMat);
  deco.castShadow = false;
  cupHolder.add(deco);
  return o.item(fit(g, size));
};
