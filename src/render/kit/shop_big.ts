// Larger shop objects: the big book, cash box, the instanced shelf book and jar, the sea chart, the mouse hole and
// the shop counter.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { KitBuilder } from './types';
import { Owned, rng, surfaces } from './util';
import { blotches, brass, fit, hi, lathe, leather, ownedCanvas, paper, rod, scaleUV, specks, textLines, untinted, woodBox, woodMat } from './shop_util';

const LEATHER = ['#5b1f17', '#22392a', '#4a2c18', '#2a2a40'];

/** Stacked page edges: cream with fine lines along u, a little grime. */
function pageEdges(ctx: CanvasRenderingContext2D, w: number, h: number, r: () => number, vertical: boolean): void {
  ctx.fillStyle = '#eadcb8';
  ctx.fillRect(0, 0, w, h);
  const n = vertical ? w : h;
  for (let i = 0; i < n; i += 2) {
    ctx.fillStyle = `rgba(110,80,40,${0.08 + r() * 0.18})`;
    if (vertical) ctx.fillRect(i, 0, 1, h);
    else ctx.fillRect(0, i, w, 1);
  }
  blotches(ctx, w, h, r, 12, ['rgba(120,80,30,0.12)'], 10, 60);
}

export const big_book: KitBuilder = async (size, opts) => {
  const o = new Owned();
  const r = rng(opts.seed * 19 + 4);
  const base = LEATHER[Math.floor(r() * LEATHER.length)]!;
  const cover = (mask: boolean) => (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    if (mask) {
      ctx.fillStyle = 'rgb(255,160,0)';
      ctx.fillRect(0, 0, w, h);
    } else leather(ctx, w, h, rng(opts.seed * 23 + 1), base);
    const gilt = mask ? 'rgb(255,70,255)' : '#d6b25a';
    ctx.strokeStyle = gilt;
    ctx.fillStyle = gilt;
    ctx.lineWidth = 6;
    ctx.strokeRect(w * 0.06, h * 0.05, w * 0.88, h * 0.9);
    ctx.lineWidth = 3;
    ctx.strokeRect(w * 0.09, h * 0.075, w * 0.82, h * 0.85);
    // Corner fleurons and a central lozenge with a title plate.
    for (const [cx, cy] of [
      [0.09, 0.075],
      [0.91, 0.075],
      [0.09, 0.925],
      [0.91, 0.925],
    ] as const) {
      ctx.beginPath();
      ctx.arc(cx * w, cy * h, w * 0.035, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(w / 2, h * 0.25);
    ctx.lineTo(w * 0.8, h / 2);
    ctx.lineTo(w / 2, h * 0.75);
    ctx.lineTo(w * 0.2, h / 2);
    ctx.closePath();
    ctx.stroke();
    ctx.fillRect(w * 0.32, h * 0.465, w * 0.36, h * 0.07);
    if (!mask) {
      ctx.fillStyle = base;
      ctx.font = `bold ${Math.floor(h * 0.04)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CATALOGUE', w / 2, h / 2 + 2);
    }
  };
  const coverTex = ownedCanvas(o, 512, 720, cover(false));
  const coverMask = ownedCanvas(o, 512, 720, cover(true), true);
  const plainTex = ownedCanvas(o, 256, 256, (ctx, w, h) => leather(ctx, w, h, rng(opts.seed * 29 + 2), base));
  const topM = o.mat(new THREE.MeshStandardMaterial({ map: coverTex, roughnessMap: coverMask, metalnessMap: coverMask, roughness: 1, metalness: 1 }));
  const plainM = o.mat(new THREE.MeshStandardMaterial({ map: plainTex, roughness: 0.6 }));
  const edgeTex = ownedCanvas(o, 256, 256, (ctx, w, h) => pageEdges(ctx, w, h, r, false));
  edgeTex.wrapS = edgeTex.wrapT = THREE.RepeatWrapping;
  const edgeM = o.mat(new THREE.MeshStandardMaterial({ map: edgeTex, roughness: 0.9 }));
  const edgeTexR = o.tex(edgeTex.clone());
  edgeTexR.center.set(0.5, 0.5);
  edgeTexR.rotation = Math.PI / 2;
  const edgeMR = o.mat(new THREE.MeshStandardMaterial({ map: edgeTexR, roughness: 0.9 }));
  const paperM = o.mat(new THREE.MeshStandardMaterial({ color: '#e9dcb9', roughness: 0.9 }));
  const segs = hi(opts, 16, 8);

  // Closed: covers, page block and a rounded spine with raised bands, spine to -X.
  const closed = new THREE.Group();
  const W = 0.2;
  const D = 0.29;
  const T = 0.08;
  const ct = 0.006;
  for (const [y, top] of [
    [ct / 2, false],
    [T - ct / 2, true],
  ] as const) {
    const c = o.mesh(new THREE.BoxGeometry(W, ct, D), [plainM, plainM, top ? topM : plainM, plainM, plainM, plainM]);
    c.position.y = y;
    closed.add(c);
  }
  const block = o.mesh(new THREE.BoxGeometry(W - 0.01, T - 2 * ct, D - 0.012), [edgeM, edgeM, paperM, paperM, edgeM, edgeM]);
  block.position.set(-0.005, T / 2, 0);
  closed.add(block);
  const spineGeo = new THREE.CylinderGeometry(T / 2, T / 2, D, segs, 1, false, Math.PI, Math.PI);
  const spine = o.mesh(spineGeo, plainM);
  spine.rotation.x = Math.PI / 2;
  spine.scale.set(0.32, 1, 1);
  spine.position.set(-W / 2, T / 2, 0);
  closed.add(spine);
  const giltM = brass(o, 0.35);
  for (let i = 0; i < 4; i++) {
    const band = o.mesh(new THREE.CylinderGeometry(T / 2 + 0.002, T / 2 + 0.002, 0.008, segs, 1, false, Math.PI, Math.PI), plainM);
    band.rotation.x = Math.PI / 2;
    band.scale.set(0.34, 1, 1);
    band.position.set(-W / 2, T / 2, -D / 2 + 0.05 + i * 0.063);
    closed.add(band);
  }
  // Brass corner pieces on the fore-edge corners.
  for (const z of [-1, 1]) {
    for (const y of [ct / 2, T - ct / 2]) {
      const cp = o.mesh(new THREE.BoxGeometry(0.022, ct + 0.002, 0.022), giltM);
      cp.position.set(W / 2 - 0.01, y, z * (D / 2 - 0.01));
      closed.add(cp);
    }
  }

  // Open: covers flat, two page blocks with a gutter curve and printed pages.
  const open = new THREE.Group();
  const page = (side: number): THREE.CanvasTexture =>
    ownedCanvas(o, 512, 720, (ctx, w, h) => {
      const pr = rng(opts.seed * 31 + side + 5);
      paper(ctx, w, h, pr, '#efe2c2');
      const g = ctx.createLinearGradient(side > 0 ? 0 : w, 0, side > 0 ? w * 0.18 : w * 0.82, 0);
      g.addColorStop(0, 'rgba(90,60,20,0.35)');
      g.addColorStop(1, 'rgba(90,60,20,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      const mx = w * 0.12;
      if (side > 0) {
        ctx.strokeStyle = 'rgba(40,28,16,0.8)';
        ctx.lineWidth = 3;
        ctx.strokeRect(mx, h * 0.08, w - 2 * mx, h * 0.38);
        // A simple engraved picture: hills, a tower and hatching.
        ctx.beginPath();
        ctx.moveTo(mx, h * 0.36);
        ctx.quadraticCurveTo(w * 0.35, h * 0.24, w * 0.55, h * 0.33);
        ctx.quadraticCurveTo(w * 0.75, h * 0.4, w - mx, h * 0.3);
        ctx.stroke();
        ctx.strokeRect(w * 0.6, h * 0.17, w * 0.06, h * 0.15);
        for (let i = 0; i < 30; i++) {
          ctx.beginPath();
          ctx.moveTo(mx + i * ((w - 2 * mx) / 30), h * 0.46);
          ctx.lineTo(mx + i * ((w - 2 * mx) / 30) + 10, h * 0.38);
          ctx.stroke();
        }
        textLines(ctx, mx, h * 0.52, w - 2 * mx, h * 0.4, 12, pr, 'rgba(40,30,20,0.55)');
      } else {
        ctx.fillStyle = 'rgba(40,28,16,0.85)';
        ctx.fillRect(w * 0.3, h * 0.08, w * 0.4, 14);
        ctx.fillStyle = '#8e2a1c';
        ctx.fillRect(mx, h * 0.14, 46, 52);
        textLines(ctx, mx + 54, h * 0.14, w - 2 * mx - 54, 60, 12, pr, 'rgba(40,30,20,0.55)');
        textLines(ctx, mx, h * 0.14 + 66, w - 2 * mx, h * 0.72, 12, pr, 'rgba(40,30,20,0.55)');
      }
    });
  const OW = 0.196;
  const gut = 0.003;
  const topY = (x: number): number => {
    const t = (x - gut) / (OW - gut);
    return 0.007 + 0.031 * (1 - Math.exp(-(x - gut) / 0.018)) - 0.006 * t ** 4;
  };
  for (const side of [-1, 1]) {
    const cov = o.mesh(new THREE.BoxGeometry(OW + 0.004, ct, D), plainM);
    cov.position.set(side * (OW / 2 + 0.002), ct / 2, 0);
    open.add(cov);
    const shape = new THREE.Shape();
    const n = 24;
    shape.moveTo(side * gut, ct);
    for (let i = 0; i <= n; i++) {
      const x = gut + ((OW - 0.006 - gut) * i) / n;
      shape.lineTo(side * x, topY(x));
    }
    shape.lineTo(side * (OW - 0.006), ct);
    shape.closePath();
    const blockGeo = new THREE.ExtrudeGeometry(shape, { depth: D - 0.012, bevelEnabled: false, curveSegments: 4 });
    blockGeo.translate(0, 0, -(D - 0.012) / 2);
    scaleUV(blockGeo, 30, 30);
    const bm = o.mesh(blockGeo, [edgeM, edgeMR]);
    open.add(bm);
    // The printed page surface following the top curve.
    const pg = new THREE.PlaneGeometry(1, D - 0.016, n, 1);
    const pp = pg.getAttribute('position') as THREE.BufferAttribute;
    const puv = pg.getAttribute('uv') as THREE.BufferAttribute;
    for (let i = 0; i < pp.count; i++) {
      const u = pp.getX(i) + 0.5;
      const x = gut + (OW - 0.008 - gut) * (side > 0 ? u : 1 - u);
      pp.setXYZ(i, side * x, topY(x) + 0.0006, -pp.getY(i));
      puv.setX(i, u);
    }
    pg.computeVertexNormals();
    const pm = o.mat(new THREE.MeshStandardMaterial({ map: page(side), roughness: 0.85 }));
    open.add(o.mesh(pg, pm));
  }
  const spineOpen = o.mesh(new THREE.BoxGeometry(0.03, ct * 0.8, D), plainM);
  spineOpen.position.y = ct * 0.4;
  open.add(spineOpen);
  open.visible = false;

  const g = new THREE.Group();
  g.add(closed, open);
  const box = new THREE.Box3(new THREE.Vector3(-OW - 0.004, 0, -D / 2), new THREE.Vector3(OW + 0.004, T, D / 2));
  return o.item(fit(g, size, {}, box), (s) => {
    open.visible = s === 'open';
    closed.visible = s !== 'open';
  });
};

export const cash_box: KitBuilder = async (size, opts) => {
  const o = new Owned();
  const r = rng(opts.seed * 37 + 3);
  const set = await opts.assets.textureSet('dark_wooden_planks');
  const tile = 1.5;
  const wood = woodMat(o, set, { color: '#eab890', rough: 0.5 });
  const woodR = woodMat(o, set, { color: '#eab890', rough: 0.5, rot: true });
  const b = brass(o, 0.3);
  const g = new THREE.Group();
  const W = 0.38;
  const D = 0.28;
  const plinth = o.mesh(woodBox(W + 0.012, 0.012, D + 0.012, tile, 'x', [r(), r()]), wood);
  plinth.position.y = 0.006;
  g.add(plinth);
  // Body: side profile (front low, back high, sloping top) extruded across X.
  const sh = new THREE.Shape();
  const y0 = 0.012;
  sh.moveTo(-D / 2, y0);
  sh.lineTo(D / 2, y0);
  sh.lineTo(D / 2, 0.118);
  sh.lineTo(-D / 2 + 0.07, 0.118);
  sh.lineTo(-D / 2, 0.078);
  sh.closePath();
  const bodyGeo = new THREE.ExtrudeGeometry(sh, { depth: W, bevelEnabled: false });
  scaleUV(bodyGeo, 1 / tile, 1 / tile, false, [r(), r()]);
  bodyGeo.rotateY(Math.PI / 2);
  bodyGeo.translate(-W / 2, 0, 0);
  g.add(o.mesh(bodyGeo, [wood, woodR]));
  const front = D / 2;
  // Drawer opening shadow on the front, and the drawer.
  const dh = 0.044;
  const dw = W - 0.05;
  const dyc = y0 + 0.006 + dh / 2;
  const hole = o.mesh(new THREE.PlaneGeometry(dw, dh), o.mat(new THREE.MeshStandardMaterial({ color: '#0b0705', roughness: 1 })));
  hole.position.set(0, dyc, front + 0.0005);
  g.add(hole);
  const drawer = new THREE.Group();
  g.add(drawer);
  const dFront = o.mesh(woodBox(dw - 0.002, dh - 0.002, 0.012, tile, 'x', [r(), r()]), wood);
  dFront.position.set(0, dyc, front - 0.004);
  drawer.add(dFront);
  const trayD = 0.22;
  const tz = front - 0.01 - trayD / 2;
  for (const s of [-1, 1]) {
    const side = o.mesh(woodBox(0.006, dh - 0.008, trayD, tile, 'z'), wood);
    side.position.set(s * (dw / 2 - 0.006), dyc - 0.003, tz);
    drawer.add(side);
  }
  const bottom = o.mesh(woodBox(dw - 0.01, 0.004, trayD, tile, 'z'), wood);
  bottom.position.set(0, dyc - dh / 2 + 0.004, tz);
  drawer.add(bottom);
  for (let i = 1; i < 5; i++) {
    const div = o.mesh(woodBox(0.004, dh - 0.016, trayD - 0.01, tile, 'z'), wood);
    div.position.set(-dw / 2 + (i * dw) / 5, dyc - 0.006, tz);
    drawer.add(div);
  }
  // Coins and a few banknotes in the tray.
  const copper = o.mat(new THREE.MeshStandardMaterial({ color: '#b87344', metalness: 1, roughness: 0.4 }));
  const silver = o.mat(new THREE.MeshStandardMaterial({ color: '#c8c8c4', metalness: 1, roughness: 0.35 }));
  const coinGeo = o.geo(new THREE.CylinderGeometry(0.011, 0.011, 0.002, 16));
  for (let i = 0; i < 12; i++) {
    const c = new THREE.Mesh(coinGeo, i % 3 === 0 ? silver : i % 3 === 1 ? copper : b);
    const col = 1 + (i % 3);
    c.position.set(-dw / 2 + (col + 0.5) * (dw / 5) + (r() - 0.5) * 0.02, dyc - dh / 2 + 0.007 + Math.floor(i / 3) * 0.002, front - 0.04 - r() * 0.06);
    c.rotation.set((r() - 0.5) * 0.2, 0, (r() - 0.5) * 0.2);
    drawer.add(c);
  }
  const note = ownedCanvas(o, 256, 128, (ctx, w, h) => {
    paper(ctx, w, h, r, '#d9d0aa');
    ctx.strokeStyle = '#3d5a3a';
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = '#3d5a3a';
    ctx.font = 'bold 40px serif';
    ctx.textAlign = 'center';
    ctx.fillText('5', w * 0.18, h * 0.65);
    ctx.fillText('5', w * 0.82, h * 0.65);
    ctx.beginPath();
    ctx.ellipse(w / 2, h / 2, 30, 36, 0, 0, Math.PI * 2);
    ctx.stroke();
  });
  const noteM = o.mat(new THREE.MeshStandardMaterial({ map: note, roughness: 0.9, side: THREE.DoubleSide }));
  for (let i = 0; i < 3; i++) {
    const nm = o.mesh(new THREE.PlaneGeometry(dw / 5 - 0.012, 0.1), noteM);
    nm.rotation.set(-Math.PI / 2, 0, (r() - 0.5) * 0.1);
    nm.position.set(-dw / 2 + dw / 10, dyc - dh / 2 + 0.0065 + i * 0.001, front - 0.07);
    drawer.add(nm);
  }
  // Drawer pull and label holder.
  const pull = o.mesh(new THREE.TorusGeometry(0.009, 0.0022, 6, 16, Math.PI), b);
  pull.rotation.set(Math.PI / 2, Math.PI, 0);
  pull.position.set(0, dyc - 0.006, front + 0.003);
  drawer.add(pull);
  const holder = o.mesh(new THREE.BoxGeometry(0.04, 0.014, 0.002), b);
  holder.position.set(0, dyc + 0.01, front + 0.003);
  drawer.add(holder);
  // Brass trim: front corners, top edge, and a plate with a coin slot on the sloped top.
  for (const s of [-1, 1]) {
    for (const z of [-1, 1]) {
      const hgt = z > 0 ? 0.078 - y0 : 0.118 - y0;
      const strip = o.mesh(new THREE.BoxGeometry(0.012, hgt, 0.012), b);
      strip.position.set(s * (W / 2 - 0.004), y0 + hgt / 2, z > 0 ? front - 0.004 : -front + 0.004);
      g.add(strip);
    }
  }
  g.add(rod(o, new THREE.Vector3(-W / 2 - 0.001, 0.078, front), new THREE.Vector3(W / 2 + 0.001, 0.078, front), 0.0035, b, 10));
  g.add(rod(o, new THREE.Vector3(-W / 2 - 0.001, 0.118, front - 0.07), new THREE.Vector3(W / 2 + 0.001, 0.118, front - 0.07), 0.0035, b, 10));
  const slope = Math.atan2(0.118 - 0.078, 0.07);
  const plateTex = ownedCanvas(o, 256, 96, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#5a4020';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, w - 12, h - 12);
    ctx.fillStyle = '#4a3418';
    ctx.font = 'bold 44px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CASH', w / 2, h / 2 + 2);
  });
  const plateM = o.mat(new THREE.MeshStandardMaterial({ map: plateTex, color: '#dcae58', metalness: 1, roughness: 0.3 }));
  const plate = o.mesh(new THREE.BoxGeometry(0.12, 0.0025, 0.045), [b, b, plateM, b, b, b]);
  plate.position.set(0.06, 0.098 + 0.001, front - 0.035);
  plate.rotation.x = slope;
  g.add(plate);
  const slotM = surfaces.iron(o, '#0a0806');
  const slot = o.mesh(new THREE.BoxGeometry(0.05, 0.003, 0.006), slotM);
  slot.position.set(-0.08, 0.098 + 0.001, front - 0.035);
  slot.rotation.x = slope;
  g.add(slot);
  const box = new THREE.Box3(new THREE.Vector3(-W / 2 - 0.006, 0, -D / 2 - 0.006), new THREE.Vector3(W / 2 + 0.006, 0.12, D / 2 + 0.006));
  return o.item(fit(g, size, {}, box), (s) => {
    drawer.position.z = s === 'open' ? 0.1 : 0;
  });
};

export const book: KitBuilder = async (size, opts) => {
  const o = new Owned();
  const r = rng(opts.seed * 41 + 8);
  const [w, h, d] = size;
  const spineTex = ownedCanvas(o, 128, 512, (ctx, cw, ch) => {
    leather(ctx, cw, ch, r, '#f1ede6');
    const band = (y: number): void => {
      ctx.fillStyle = 'rgba(60,40,20,0.55)';
      ctx.fillRect(0, y - 9, cw, 4);
      ctx.fillRect(0, y + 5, cw, 4);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillRect(0, y - 4, cw, 8);
    };
    for (const y of [0.06, 0.2, 0.62, 0.76, 0.92]) band(y * ch);
    ctx.fillStyle = 'rgba(35,25,15,0.78)';
    ctx.fillRect(cw * 0.1, ch * 0.27, cw * 0.8, ch * 0.28);
    ctx.strokeStyle = 'rgba(255,245,215,0.85)';
    ctx.lineWidth = 3;
    ctx.strokeRect(cw * 0.15, ch * 0.285, cw * 0.7, ch * 0.25);
    ctx.fillStyle = 'rgba(255,240,200,0.9)';
    for (let i = 0; i < 4; i++) ctx.fillRect(cw * 0.25, ch * (0.32 + i * 0.05), cw * (0.3 + ((i * 37) % 20) / 100), 7);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, cw - 4, ch - 4);
  });
  const sideTex = ownedCanvas(o, 256, 256, (ctx, cw, ch) => {
    leather(ctx, cw, ch, r, '#ece7df');
    ctx.fillStyle = 'rgba(80,60,40,0.25)';
    ctx.fillRect(0, 0, cw, 3);
    ctx.fillRect(0, ch - 3, cw, 3);
  });
  const pagesTop = ownedCanvas(o, 64, 256, (ctx, cw, ch) => {
    pageEdges(ctx, cw, ch, r, true);
    ctx.fillStyle = '#3a2e24';
    ctx.fillRect(0, 0, 4, ch);
    ctx.fillRect(cw - 4, 0, 4, ch);
  });
  const spineM = o.mat(new THREE.MeshStandardMaterial({ map: spineTex, roughness: 0.6 }));
  const sideM = o.mat(new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.65 }));
  const pageM = o.mat(untinted(new THREE.MeshStandardMaterial({ map: pagesTop, roughness: 0.9 })));
  const geo = new THREE.BoxGeometry(w, h, d);
  return o.item(o.mesh(geo, [sideM, sideM, pageM, pageM, spineM, pageM]));
};

export const jar: KitBuilder = async (size, opts) => {
  const o = new Owned();
  const r = rng(opts.seed * 43 + 6);
  const segs = hi(opts, 32, 16);
  const s = Math.min(size[0] / 0.14, size[1] / 0.22, size[2] / 0.14);
  // Glass jar body with shoulder, neck and lip; stopper with knob. All the glass in one group.
  const body = lathe(
    [
      [0, 0.002],
      [0.056, 0.002],
      [0.062, 0.008],
      [0.063, 0.14],
      [0.058, 0.156],
      [0.045, 0.166],
      [0.036, 0.17],
      [0.036, 0.178],
      [0.042, 0.181],
      [0.042, 0.186],
    ],
    segs,
  );
  const stopper = lathe(
    [
      [0, 0.17],
      [0.034, 0.17],
      [0.034, 0.186],
      [0.045, 0.187],
      [0.046, 0.192],
      [0.03, 0.196],
      [0.012, 0.198],
      [0.012, 0.202],
      [0.017, 0.208],
      [0.016, 0.215],
      [0.008, 0.219],
      [0, 0.22],
    ],
    segs,
  );
  const fill = 0.08 + r() * 0.05;
  const contents = lathe(
    [
      [0, 0.004],
      [0.055, 0.004],
      [0.0605, 0.01],
      [0.0605, fill],
      [0.045, fill + 0.004],
      [0, fill + 0.006],
    ],
    segs,
  );
  scaleUV(contents, 3, 2);
  const label = new THREE.CylinderGeometry(0.0636, 0.0636, 0.055, 12, 1, true, -0.62, 1.24);
  label.translate(0, 0.095, 0);
  const strip = (g: THREE.BufferGeometry): THREE.BufferGeometry => {
    const n = g.index ? g.toNonIndexed() : g;
    for (const k of Object.keys(n.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') n.deleteAttribute(k);
    return n;
  };
  const glassGeo = mergeGeometries([strip(body), strip(stopper)]);
  const merged = mergeGeometries([glassGeo, strip(contents), strip(label)], true);
  merged.scale(s, s, s);
  merged.translate(0, -size[1] / 2, 0);
  for (const gg of [body, stopper, contents, label, glassGeo]) gg.dispose();
  const glass = untinted(
    o.mat(new THREE.MeshPhysicalMaterial({ color: '#dfeee6', roughness: 0.06, transparent: true, opacity: 0.3, depthWrite: false, clearcoat: 1, side: THREE.DoubleSide, specularIntensity: 1 })),
  );
  const grain = ownedCanvas(o, 128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#e8e4dc';
    ctx.fillRect(0, 0, w, h);
    specks(ctx, w, h, r, 900, (x) => (x < 0.5 ? `rgba(60,50,40,${0.2 + x * 0.4})` : `rgba(255,255,255,${x * 0.5})`), 3);
  });
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
  const contentsM = o.mat(new THREE.MeshStandardMaterial({ map: grain, roughness: 0.85 }));
  const labelTex = ownedCanvas(o, 256, 160, (ctx, w, h) => {
    paper(ctx, w, h, r, '#eee2c0');
    ctx.strokeStyle = '#2b1e12';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(17, 17, w - 34, h - 34);
    ctx.fillStyle = '#2b1e12';
    ctx.textAlign = 'center';
    ctx.font = 'italic bold 30px serif';
    ctx.fillText(`No. ${1 + Math.floor(r() * 48)}`, w / 2, h * 0.42);
    ctx.fillRect(w * 0.25, h * 0.6, w * 0.5, 5);
    ctx.fillRect(w * 0.32, h * 0.72, w * 0.36, 4);
  });
  const labelM = o.mat(untinted(new THREE.MeshStandardMaterial({ map: labelTex, roughness: 0.85, side: THREE.DoubleSide })));
  const mesh = o.mesh(merged, [glass, contentsM, labelM]);
  return o.item(mesh);
};

function drawChart(ctx: CanvasRenderingContext2D, w: number, h: number, r: () => number): void {
  paper(ctx, w, h, r, '#e8d6a8');
  const ink = '#3b2814';
  const m = w * 0.05;
  // Land: a coast entering from one side, with shading lines along the shore.
  const fromLeft = r() < 0.5;
  const pts: [number, number][] = [];
  const n = 60;
  const base = w * (0.22 + r() * 0.12);
  const ph = [r() * 6, r() * 6, r() * 6];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const y = m + t * (h - 2 * m);
    const x = base + w * (0.06 * Math.sin(t * 7 + ph[0]!) + 0.035 * Math.sin(t * 17 + ph[1]!) + 0.12 * Math.exp(-(((t - 0.5 - ph[2]! * 0.03) / 0.12) ** 2)));
    pts.push([fromLeft ? x : w - x, y]);
  }
  const edgeX = fromLeft ? m : w - m;
  for (let k = 6; k >= 0; k--) {
    ctx.beginPath();
    ctx.moveTo(edgeX, m);
    for (const [x, y] of pts) ctx.lineTo(x + (fromLeft ? k * 7 : -k * 7), y);
    ctx.lineTo(edgeX, h - m);
    ctx.closePath();
    if (k === 0) {
      ctx.fillStyle = '#d9bf85';
      ctx.fill();
      ctx.strokeStyle = ink;
      ctx.lineWidth = 3;
      ctx.stroke();
    } else {
      ctx.strokeStyle = `rgba(59,40,20,${0.12 + (6 - k) * 0.04})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
  // Hills on the land.
  for (let i = 0; i < 9; i++) {
    const y = m + 30 + r() * (h - 2 * m - 60);
    const x = fromLeft ? m + 20 + r() * (base - m - 70) : w - m - 20 - r() * (base - m - 70);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 14, y);
    ctx.quadraticCurveTo(x, y - 18, x + 14, y);
    ctx.stroke();
  }
  // Compass rose with rhumb lines across the sea.
  const cx = fromLeft ? w * (0.6 + r() * 0.15) : w * (0.25 + r() * 0.15);
  const cy = h * (0.35 + r() * 0.3);
  ctx.save();
  ctx.beginPath();
  ctx.rect(m, m, w - 2 * m, h - 2 * m);
  ctx.clip();
  ctx.lineWidth = 1;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    ctx.strokeStyle = i % 4 === 0 ? 'rgba(59,40,20,0.55)' : i % 2 === 0 ? 'rgba(40,90,60,0.45)' : 'rgba(150,40,30,0.4)';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * w * 1.5, cy + Math.sin(a) * w * 1.5);
    ctx.stroke();
  }
  ctx.restore();
  const rr = Math.min(w, h) * 0.13;
  ctx.fillStyle = '#efe2bd';
  ctx.beginPath();
  ctx.arc(cx, cy, rr * 0.75, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const len = i % 2 === 0 ? rr : rr * 0.6;
    for (const sd of [1, -1]) {
      ctx.fillStyle = sd > 0 ? ink : '#c9a463';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
      ctx.lineTo(cx + Math.cos(a + sd * 0.5) * rr * 0.18, cy + Math.sin(a + sd * 0.5) * rr * 0.18);
      ctx.fill();
    }
  }
  ctx.fillStyle = '#8e2a1c';
  ctx.font = `bold ${Math.floor(rr * 0.35)}px serif`;
  ctx.textAlign = 'center';
  ctx.fillText('N', cx, cy - rr - 6);
  // Soundings.
  ctx.fillStyle = 'rgba(59,40,20,0.75)';
  ctx.font = '15px serif';
  for (let i = 0; i < 40; i++) {
    const x = m + r() * (w - 2 * m);
    const y = m + r() * (h - 2 * m);
    if (fromLeft ? x < base + 60 : x > w - base - 60) continue;
    ctx.fillText(String(3 + Math.floor(r() * 40)), x, y);
  }
  // A ship under sail.
  const sx = fromLeft ? w * (0.55 + r() * 0.3) : w * (0.15 + r() * 0.3);
  const sy = h * (r() < 0.5 ? 0.25 : 0.75);
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sx - 40, sy);
  ctx.lineTo(sx + 44, sy);
  ctx.lineTo(sx + 32, sy + 14);
  ctx.lineTo(sx - 30, sy + 14);
  ctx.closePath();
  ctx.fill();
  for (const [mx, mh] of [
    [-22, 52],
    [4, 64],
    [28, 46],
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(sx + mx, sy);
    ctx.lineTo(sx + mx, sy - mh);
    ctx.stroke();
    ctx.fillStyle = '#f1e6c8';
    ctx.beginPath();
    ctx.moveTo(sx + mx - 13, sy - mh + 6);
    ctx.quadraticCurveTo(sx + mx + 4, sy - mh / 2, sx + mx - 13, sy - 8);
    ctx.lineTo(sx + mx + 13, sy - 8);
    ctx.quadraticCurveTo(sx + mx + 22, sy - mh / 2, sx + mx + 13, sy - mh + 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // Title cartouche.
  const tw = w * 0.34;
  const tx = fromLeft ? w - m - tw - 20 : m + 20;
  const ty = h - m - 90;
  ctx.fillStyle = '#efe2bd';
  ctx.fillRect(tx, ty, tw, 70);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3;
  ctx.strokeRect(tx, ty, tw, 70);
  ctx.lineWidth = 1;
  ctx.strokeRect(tx + 6, ty + 6, tw - 12, 58);
  ctx.fillStyle = ink;
  ctx.font = `italic bold ${Math.floor(w * 0.028)}px serif`;
  ctx.textAlign = 'center';
  ctx.fillText('A Chart of the Coast', tx + tw / 2, ty + 32);
  ctx.font = `${Math.floor(w * 0.018)}px serif`;
  ctx.fillText('with the Soundings', tx + tw / 2, ty + 54);
  // Neat line with a degree scale.
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3;
  ctx.strokeRect(m, m, w - 2 * m, h - 2 * m);
  ctx.lineWidth = 1;
  ctx.strokeRect(m - 12, m - 12, w - 2 * m + 24, h - 2 * m + 24);
  for (let x = m, i = 0; x < w - m; x += 28, i++) {
    if (i % 2) continue;
    ctx.fillStyle = ink;
    ctx.fillRect(x, m - 12, 28, 12);
    ctx.fillRect(x, h - m, 28, 12);
  }
  for (let y = m, i = 0; y < h - m; y += 28, i++) {
    if (i % 2) continue;
    ctx.fillRect(m - 12, y, 12, 28);
    ctx.fillRect(w - m, y, 12, 28);
  }
}

export const sea_chart: KitBuilder = async (size, opts) => {
  const o = new Owned();
  const r = rng(opts.seed * 47 + 2);
  const [W, H, D] = size;
  const set = await opts.assets.textureSet('dark_wooden_planks');
  const tile = 1.4;
  const woodH = woodMat(o, set, { color: '#e2b088', rough: 0.5 });
  const gilt = brass(o, 0.35);
  const g = new THREE.Group();
  const f = Math.min(W, H) * 0.085;
  const slip = f * 0.18;
  // Mitred frame bars (trapezoids), outer moulding full depth, a gilt slip inside.
  const bar = (len: number, width: number, depth: number, mat: THREE.Material | THREE.Material[], z0: number): THREE.Mesh => {
    const s = new THREE.Shape();
    s.moveTo(-len / 2, 0);
    s.lineTo(len / 2, 0);
    s.lineTo(len / 2 - width, width);
    s.lineTo(-len / 2 + width, width);
    s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
    scaleUV(geo, 1 / tile, 1 / tile, false, [r(), r()]);
    geo.translate(0, 0, z0);
    return o.mesh(geo, mat);
  };
  const place = (m: THREE.Mesh, side: number): void => {
    // side 0 bottom, 1 right, 2 top, 3 left: rotate the bar so its outer edge lies on that side.
    m.rotation.z = (side * Math.PI) / 2;
    const off = side % 2 === 0 ? H / 2 : W / 2;
    const a = -Math.PI / 2 + (side * Math.PI) / 2;
    m.position.x = Math.cos(a) * off;
    m.position.y = Math.sin(a) * off;
  };
  for (let side = 0; side < 4; side++) {
    const len = side % 2 === 0 ? W : H;
    const m = bar(len, f, D, woodH, -D / 2);
    place(m, side);
    g.add(m);
    const s2 = bar(len - 2 * f, slip, D * 0.75, gilt, -D / 2);
    s2.rotation.z = (side * Math.PI) / 2;
    const a = -Math.PI / 2 + (side * Math.PI) / 2;
    const off = (side % 2 === 0 ? H / 2 : W / 2) - f;
    s2.position.set(Math.cos(a) * off, Math.sin(a) * off, 0);
    g.add(s2);
  }
  const pw = W - 2 * f;
  const ph = H - 2 * f;
  const cw = 1024;
  const chh = Math.round((cw * ph) / pw);
  const chart = ownedCanvas(o, cw, chh, (ctx, w, h) => drawChart(ctx, w, h, r));
  const paperM = o.mat(new THREE.MeshStandardMaterial({ map: chart, roughness: 0.85 }));
  const pm = o.mesh(new THREE.PlaneGeometry(pw, ph), paperM);
  pm.position.z = -D / 2 + D * 0.3;
  g.add(pm);
  const back = o.mesh(woodBox(W - 0.01, H - 0.01, 0.004, tile, 'x'), woodH);
  back.position.z = -D / 2 + 0.002;
  g.add(back);
  return o.item(g);
};

export const mouse_hole: KitBuilder = async (size, opts) => {
  const o = new Owned();
  const r = rng(opts.seed * 53 + 1);
  const [W, H, D] = size;
  const set = await opts.assets.textureSet('dark_wooden_planks');
  const tile = 1.4;
  const wood = woodMat(o, set, { color: '#d8a882', rough: 0.6 });
  const g = new THREE.Group();
  const t = Math.min(D * 0.45, 0.022);
  const hw = W * 0.24;
  const hh = H * 0.5;
  const arch = (s: THREE.Path): void => {
    s.moveTo(-hw, -H / 2);
    s.lineTo(-hw, -H / 2 + hh - hw);
    s.absarc(0, -H / 2 + hh - hw, hw, Math.PI, 0, true);
    s.lineTo(hw, -H / 2);
  };
  const board = new THREE.Shape();
  board.moveTo(-W / 2, -H / 2);
  board.lineTo(-hw, -H / 2);
  board.lineTo(-hw, -H / 2 + hh - hw);
  board.absarc(0, -H / 2 + hh - hw, hw, Math.PI, 0, true);
  board.lineTo(hw, -H / 2);
  board.lineTo(W / 2, -H / 2);
  board.lineTo(W / 2, H / 2);
  board.lineTo(-W / 2, H / 2);
  board.closePath();
  const bg = new THREE.ExtrudeGeometry(board, { depth: t, bevelEnabled: false, curveSegments: hi(opts, 16, 8) });
  scaleUV(bg, 1 / tile, 1 / tile, false, [r(), r()]);
  bg.translate(0, 0, D / 2 - t);
  g.add(o.mesh(bg, wood));
  // A rounded top moulding along the board.
  const mould = o.mesh(scaleUV(new THREE.CylinderGeometry(t * 0.45, t * 0.45, W, 12, 1, false, 0, Math.PI), W / tile, 0.05 / tile, true), wood);
  mould.rotation.z = Math.PI / 2;
  mould.position.set(0, H / 2 - t * 0.45, D / 2 - t * 0.55);
  g.add(mould);
  // The tunnel behind the opening: dark walls and a black back.
  const tunnel = new THREE.Shape();
  arch(tunnel);
  tunnel.closePath();
  const tg = new THREE.ExtrudeGeometry(tunnel, { depth: D - t, bevelEnabled: false, curveSegments: hi(opts, 16, 8) });
  tg.translate(0, 0, -D / 2);
  scaleUV(tg, 1 / tile, 1 / tile);
  const dark = woodMat(o, set, { color: '#3a2a20', rough: 1 });
  dark.side = THREE.BackSide;
  g.add(o.mesh(tg, [dark, dark]));
  const backTex = ownedCanvas(o, 64, 64, (ctx, w, h) => {
    const gr = ctx.createRadialGradient(w / 2, h, 0, w / 2, h, h);
    gr.addColorStop(0, '#120b06');
    gr.addColorStop(1, '#020101');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
  });
  const backG = new THREE.ShapeGeometry(tunnel, 12);
  const backM = o.mesh(backG, o.mat(new THREE.MeshStandardMaterial({ map: backTex, roughness: 1 })));
  backM.position.z = -D / 2 + 0.002;
  g.add(backM);
  // Wear around the opening: grime, scratches and gnawed lighter wood on a decal.
  const wear = ownedCanvas(o, 256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const sx = w / W;
    const cx = w / 2;
    const ay = h - hh * sx + hw * sx;
    const gr = ctx.createRadialGradient(cx, h - hh * sx * 0.45, hw * sx * 0.7, cx, h - hh * sx * 0.45, hw * sx * 2.2);
    gr.addColorStop(0, 'rgba(30,18,8,0.75)');
    gr.addColorStop(1, 'rgba(30,18,8,0)');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
    ctx.lineWidth = 2;
    for (let i = 0; i < 60; i++) {
      const a = Math.PI + r() * Math.PI;
      const rr = hw * sx * (1 + r() * 0.18);
      const x = cx + Math.cos(a) * rr;
      const y = ay + Math.sin(a) * rr;
      ctx.strokeStyle = r() < 0.5 ? 'rgba(210,170,120,0.6)' : 'rgba(20,10,5,0.6)';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * 6 * r(), y + Math.sin(a) * 6 * r());
      ctx.stroke();
    }
    for (const s of [-1, 1]) {
      for (let i = 0; i < 20; i++) {
        const x = cx + s * hw * sx * (1 + r() * 0.15);
        const y = h - r() * (hh - hw) * sx;
        ctx.strokeStyle = r() < 0.5 ? 'rgba(210,170,120,0.55)' : 'rgba(20,10,5,0.55)';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + s * 6 * r(), y - 3 * r());
        ctx.stroke();
      }
    }
  });
  const wearM = o.mat(new THREE.MeshStandardMaterial({ map: wear, transparent: true, depthWrite: false, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2 }));
  const wearP = o.mesh(new THREE.PlaneGeometry(W, H), wearM);
  wearP.position.z = D / 2 + 0.0004;
  g.add(wearP);
  return o.item(g);
};

export const shop_counter: KitBuilder = async (size, opts) => {
  const o = new Owned();
  const r = rng(opts.seed * 59 + 7);
  const [W, H, D] = size;
  const set = await opts.assets.textureSet('dark_wooden_planks');
  const tile = 3.2;
  const woodX = woodMat(o, set, { color: '#f0c49c', rough: 0.6 });
  const woodY = woodX;
  const panelM = woodMat(o, set, { color: '#e2ae84', rough: 0.65 });
  const topM = woodMat(o, set, { color: '#f6cea6', rough: 0.42 });
  const plinthM = woodMat(o, set, { color: '#9a7a62', rough: 0.8 });
  const g = new THREE.Group();
  const off = (): [number, number] => [r(), r()];
  const box = (w: number, h: number, d: number, grain: 'x' | 'y' | 'z', mat: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = g): THREE.Mesh => {
    const m = o.mesh(woodBox(w, h, d, tile, grain, off()), mat);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };
  const tt = Math.min(0.06, H * 0.06);
  const ov = Math.min(0.045, D * 0.06);
  const pl = Math.min(0.1, H * 0.1);
  const bw = W - 2 * ov;
  const bd = D - ov;
  const bodyZ = -D / 2 + bd / 2;
  const frontZ = -D / 2 + bd;
  // Top slab with a small overhang, and a cove strip under its front edge.
  box(W, tt, D, 'x', topM, 0, H - tt / 2, 0);
  box(bw, 0.025, 0.02, 'x', woodX, 0, H - tt - 0.0125, frontZ + 0.01);
  // Carcass.
  box(bw, H - tt - pl, bd, 'x', woodY, 0, pl + (H - tt - pl) / 2, bodyZ);
  // Plinth, a little proud, darker.
  box(bw + 0.02, pl, bd + 0.012, 'x', plinthM, 0, pl / 2, bodyZ + 0.006);
  box(bw + 0.03, 0.015, bd + 0.02, 'x', woodX, 0, pl - 0.0075, bodyZ + 0.01);
  // Panelled faces: rails, stiles and raised fields, built in a face frame (x along the face, z out of it).
  const rail = 0.075;
  const stile = 0.075;
  const depth = 0.018;
  const panelFace = (faceW: number, bays: number): THREE.Group => {
    const f = new THREE.Group();
    const y0 = pl;
    const y1 = H - tt - 0.025;
    const fh = y1 - y0;
    box(faceW, rail, depth, 'x', woodX, 0, y1 - rail / 2, depth / 2, f);
    box(faceW, rail, depth, 'x', woodX, 0, y0 + 0.015 + rail / 2, depth / 2, f);
    const bayW = (faceW - stile) / bays;
    for (let i = 0; i <= bays; i++) box(stile, fh - 2 * rail, depth, 'y', woodY, -faceW / 2 + stile / 2 + i * bayW, y0 + 0.015 + fh / 2, depth / 2, f);
    const fieldW = bayW - stile - 0.05;
    const fieldH = fh - 2 * rail - 0.065;
    for (let i = 0; i < bays; i++) {
      const cx = -faceW / 2 + stile + i * bayW + (bayW - stile) / 2;
      const cy = y0 + 0.015 + fh / 2;
      box(fieldW, fieldH, 0.008, 'y', panelM, cx, cy, 0.004, f);
      box(fieldW - 0.04, fieldH - 0.04, 0.012, 'y', panelM, cx, cy, 0.006, f);
    }
    return f;
  };
  const front = panelFace(bw, Math.max(1, Math.round(bw / 0.62)));
  front.position.z = frontZ;
  g.add(front);
  for (const s of [-1, 1]) {
    const side = panelFace(bd, Math.max(1, Math.round(bd / 0.62)));
    side.rotation.y = (s * Math.PI) / 2;
    side.position.set((s * bw) / 2, 0, bodyZ);
    g.add(side);
  }
  g.position.y = -H / 2;
  return o.item(new THREE.Group().add(g));
};
