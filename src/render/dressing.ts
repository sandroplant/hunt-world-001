// The realistic dressing of a place (style frame, founder direction A). It reads each prop's `look` and swaps the
// graybox shape for a textured one, a glTF model, a built house, water or glass. Positions and sizes stay the ones
// in props.json, so the walk map, the openings and the seam are untouched. Everything here is visual only.
import * as THREE from 'three';
import type { PlaceData, PropData, Vec3 } from '../game/types';
import { propInstances } from '../game/props';
import { Assets, boxMaterials, texturedMaterial, type TextureSet } from './assets';
import { kit } from './kit';

const DEG = Math.PI / 180;

export interface DressedScene {
  root: THREE.Group;
  scene: THREE.Scene;
  quality: 'high' | 'low';
  /** The graybox mesh of each prop, by id, so it can be hidden once its dressed version is in. */
  propMesh(id: string): THREE.Object3D | undefined;
}

export class Dressing {
  private waters: THREE.MeshStandardMaterial[] = [];
  private disposables: Array<{ dispose(): void }> = [];
  readonly done: Promise<void>;
  private sun: THREE.DirectionalLight | null = null;

  constructor(private assets: Assets, private place: PlaceData, props: PropData[], private target: DressedScene) {
    this.done = this.build(props);
  }

  private async build(props: PropData[]): Promise<void> {
    const jobs: Promise<void>[] = [];
    jobs.push(this.lightAndSky());
    for (const p of props) {
      if (!p.look || p.portal) continue;
      jobs.push(this.dress(p).catch((e: unknown) => console.warn(`dressing ${p.id} failed`, e)));
    }
    await Promise.all(jobs);
  }

  private async lightAndSky(): Promise<void> {
    const scene = this.target.scene;
    if (this.place.hdri) {
      const env = await this.assets.hdri(this.place.hdri);
      scene.environment = env;
      scene.background = env;
      const rot = (this.place.envRotation ?? 0) * DEG;
      scene.environmentRotation.set(0, rot, 0);
      scene.backgroundRotation.set(0, rot, 0);
      scene.environmentIntensity = this.place.envIntensity ?? 1;
      scene.backgroundIntensity = this.place.skyIntensity ?? 1;
    }
    // A realistic place without mist has no fog at all: fog is mixed after tone mapping on screen but before it
    // in an opening's picture, so an indoor place with fog could not match at the hand-over (round 5).
    scene.fog = this.place.mist ? new THREE.Fog(this.place.mist[0], this.place.mist[1], this.place.mist[2]) : null;
    if (this.place.dusk) {
      // Indoors at dusk: a cool light falling in through the front, the sky only faintly in reflections.
      const d = this.place.dusk;
      const light = new THREE.DirectionalLight(d.color, d.intensity);
      light.position.set(d.dir[0] * 20, d.dir[1] * 20, d.dir[2] * 20);
      light.target.position.set(0, 0, -4);
      scene.add(light, light.target);
      if (d.background) scene.background = new THREE.Color(d.background);
    }
    if (this.place.sun) {
      const s = this.place.sun;
      const light = new THREE.DirectionalLight(s.color, s.intensity);
      light.position.set(s.dir[0] * 60, s.dir[1] * 60, s.dir[2] * 60);
      light.target.position.set(0, 0, -8);
      if (this.target.quality === 'high') {
        light.castShadow = true;
        light.shadow.mapSize.set(2048, 2048);
        light.shadow.camera.near = 1;
        light.shadow.camera.far = 160;
        light.shadow.camera.left = -22;
        light.shadow.camera.right = 22;
        light.shadow.camera.top = 22;
        light.shadow.camera.bottom = -30;
        light.shadow.bias = -0.0008;
        light.shadow.normalBias = 0.03;
      }
      scene.add(light, light.target);
      this.sun = light;
    }
  }

  private async dress(p: PropData): Promise<void> {
    const look = p.look!;
    const gray = this.target.propMesh(p.id);
    if (look.light) this.light(p);
    if (look.kit) return this.kitProp(p, gray);
    if (look.house) return this.house(p, gray);
    if (look.water) return this.water(p, gray);
    if (look.model) return this.model(p, gray);
    if (look.glass) {
      const m = new THREE.MeshPhysicalMaterial({ color: look.color ?? '#0b1420', roughness: 0.05, metalness: 0, transparent: true, opacity: 0.9, emissive: look.emissive ? new THREE.Color(look.emissive) : new THREE.Color('#000000'), emissiveIntensity: look.emissive ? 2.5 : 0 });
      // A lit pane shows its glazing bars and curtains, so it reads as a window and not a flat card (round 5).
      if (look.emissive) m.emissiveMap = this.litPane();
      // A puddle: thin, see-through, a mirror for the sky with a little ripple (round 5).
      if (p.size[1] < 0.03) {
        m.opacity = 0.62;
        m.roughness = 0.02;
        m.envMapIntensity = 1.6;
        const set = await this.assets.textureSet('cobblestone_floor_08');
        const n = set.normalMap.clone();
        n.repeat.set(3, 3);
        n.needsUpdate = true;
        m.normalMap = n;
        m.normalScale.set(0.06, 0.06);
      }
      this.disposables.push(m);
      this.swapMaterial(gray, m);
      return;
    }
    if (look.tex) {
      const set = await this.assets.textureSet(look.tex);
      if (!gray) return;
      const tile = look.tile ?? 2;
      if (p.shape === 'box') this.swapMaterial(gray, boxMaterials(set, p.size, tile, { color: look.color, rough: look.rough }));
      else this.swapMaterial(gray, texturedMaterial(set, Math.max(0.1, (Math.PI * Math.max(p.size[0], p.size[2])) / tile), Math.max(0.1, p.size[1] / tile), { color: look.color, rough: look.rough }));
      return;
    }
    if (look.color || look.emissive) {
      const m = new THREE.MeshStandardMaterial({ color: look.color ?? '#888888', roughness: look.rough ?? 0.85, emissive: look.emissive ? new THREE.Color(look.emissive) : new THREE.Color('#000000'), emissiveIntensity: look.emissive ? 1.5 : 0 });
      this.disposables.push(m);
      this.swapMaterial(gray, m);
    }
  }

  private pane: THREE.CanvasTexture | null = null;

  private litPane(): THREE.CanvasTexture {
    if (this.pane) return this.pane;
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const g = c.getContext('2d')!;
    const glow = g.createRadialGradient(64, 70, 6, 64, 70, 90);
    glow.addColorStop(0, '#ffffff');
    glow.addColorStop(1, '#6a5a48');
    g.fillStyle = glow;
    g.fillRect(0, 0, 128, 128);
    // Curtains drawn to the sides, with soft folds.
    for (const side of [0, 1]) {
      for (let i = 0; i < 6; i++) {
        g.fillStyle = i % 2 ? 'rgba(70,40,30,0.75)' : 'rgba(110,60,40,0.7)';
        const x = side ? 128 - 30 + i * 5 : i * 5;
        g.fillRect(x, 0, 5, 128);
      }
    }
    // Glazing bars and the frame.
    g.fillStyle = '#120d0a';
    g.fillRect(0, 0, 128, 7);
    g.fillRect(0, 121, 128, 7);
    g.fillRect(0, 0, 7, 128);
    g.fillRect(121, 0, 7, 128);
    g.fillRect(61, 0, 6, 128);
    g.fillRect(0, 58, 128, 6);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    this.pane = t;
    this.disposables.push(t);
    return t;
  }

  private swapMaterial(obj: THREE.Object3D | undefined, m: THREE.Material | THREE.Material[]): void {
    if (!obj) return;
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    if (Array.isArray(m)) this.disposables.push(...m);
    else this.disposables.push(m);
    mesh.material = m;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  }

  /** A warm point light at a prop (shop lamps). */
  private light(p: PropData): void {
    const l = p.look!.light!;
    const light = new THREE.PointLight(l.color, l.intensity, l.distance, 2);
    light.position.set(p.pos[0], p.pos[1] + (l.y ?? 0), p.pos[2]);
    if (l.shadow && this.target.quality === 'high') {
      light.castShadow = true;
      light.shadow.mapSize.set(1024, 1024);
      light.shadow.bias = -0.002;
    }
    this.target.root.add(light);
    this.disposables.push(light);
  }

  /** A kit object per instance; a single-mesh kit object is drawn as one instanced mesh (books, jars). */
  private async kitProp(p: PropData, gray: THREE.Object3D | undefined): Promise<void> {
    const look = p.look!;
    const builder = kit[look.kit!];
    if (!builder) throw new Error(`no kit builder "${look.kit}"`);
    const quarter = Math.abs(((((look.yaw ?? 0) % 180) + 180) % 180) - 90) < 1;
    const size: [number, number, number] = quarter ? [p.size[2], p.size[1], p.size[0]] : [p.size[0], p.size[1], p.size[2]];
    const instances = propInstances(p, this.target.quality);
    const first = await builder(size, { quality: this.target.quality, seed: p.seed ?? 1, assets: this.assets });
    this.disposables.push({ dispose: () => first.dispose() });
    const yaw = (look.yaw ?? 0) * DEG;
    const single = (first.object as THREE.Mesh).isMesh ? (first.object as THREE.Mesh) : null;
    if (instances.length > 1 && single) {
      const inst = new THREE.InstancedMesh(single.geometry, single.material, instances.length);
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const c = new THREE.Color();
      for (const [i, it] of instances.entries()) {
        q.setFromEuler(new THREE.Euler(it.rot[0] * DEG, it.rot[1] * DEG + yaw, it.rot[2] * DEG));
        // The scale is per world axis; inside the turned mesh a quarter turn swaps x and z.
        const sx = it.size[0] / p.size[0], sy = it.size[1] / p.size[1], sz = it.size[2] / p.size[2];
        m.compose(new THREE.Vector3(...it.pos), q, quarter ? new THREE.Vector3(sz, sy, sx) : new THREE.Vector3(sx, sy, sz));
        inst.setMatrixAt(i, m);
        if (p.palette) inst.setColorAt(i, c.set(p.palette[it.paletteIndex]!));
      }
      inst.castShadow = true;
      inst.receiveShadow = true;
      this.target.root.add(inst);
    } else {
      for (const [i, it] of instances.entries()) {
        const item = i === 0 ? first : await builder(size, { quality: this.target.quality, seed: (p.seed ?? 1) * 31 + i, assets: this.assets });
        if (i > 0) this.disposables.push({ dispose: () => item.dispose() });
        const holder = new THREE.Group();
        item.object.rotation.y += yaw;
        holder.add(item.object);
        holder.position.set(...it.pos);
        holder.rotation.set(it.rot[0] * DEG, it.rot[1] * DEG, it.rot[2] * DEG);
        holder.scale.set(it.size[0] / p.size[0], it.size[1] / p.size[1], it.size[2] / p.size[2]);
        holder.traverse((o) => {
          if ((o as THREE.Mesh).isMesh) {
            o.castShadow = true;
            o.receiveShadow = true;
          }
        });
        this.target.root.add(holder);
      }
    }
    hideGray(gray);
  }

  private async model(p: PropData, gray: THREE.Object3D | undefined): Promise<void> {
    const look = p.look!;
    const src = await this.assets.model(look.model!);
    const box = new THREE.Box3().setFromObject(src);
    const dims = box.getSize(new THREE.Vector3());
    const fit = look.fit ?? 'height';
    for (const inst of propInstances(p, this.target.quality)) {
      const g = src.clone();
      if (look.only) {
        const keep = new Set(look.only);
        g.traverse((o) => {
          if ((o as THREE.Mesh).isMesh && !keep.has(o.name)) o.visible = false;
        });
      }
      let sx: number, sy: number, sz: number;
      if (fit === 'box') {
        // A model turned a quarter swaps its x and z against the box.
        const quarter = Math.abs(((look.yaw ?? 0) % 180) - 90) < 1;
        sx = inst.size[quarter ? 2 : 0] / dims.x;
        sy = inst.size[1] / dims.y;
        sz = inst.size[quarter ? 0 : 2] / dims.z;
      } else {
        const s = fit === 'height' ? inst.size[1] / dims.y : Math.max(...inst.size) / Math.max(dims.x, dims.y, dims.z);
        sx = sy = sz = s;
      }
      // Sit the model's bottom on the bottom of the prop's box, centred in x and z.
      const holder = new THREE.Group();
      g.position.set(-(box.min.x + dims.x / 2) * sx, -box.min.y * sy, -(box.min.z + dims.z / 2) * sz);
      g.scale.set(sx, sy, sz);
      holder.add(g);
      holder.position.set(inst.pos[0], inst.pos[1] - inst.size[1] / 2, inst.pos[2]);
      holder.rotation.y = (inst.rot[1] + (look.yaw ?? 0)) * DEG;
      this.target.root.add(holder);
    }
    hideGray(gray);
  }

  private async water(p: PropData, gray: THREE.Object3D | undefined): Promise<void> {
    const set = await this.assets.textureSet('cobblestone_floor_08'); // its normal map at a large repeat reads as ripples
    const m = new THREE.MeshPhysicalMaterial({ color: p.look!.color ?? '#0d1a26', roughness: 0.14, metalness: 0, envMapIntensity: 1.4 });
    const n = set.normalMap.clone();
    n.repeat.set(p.size[0] / 6, p.size[2] / 6);
    n.needsUpdate = true;
    m.normalMap = n;
    m.normalScale.set(0.18, 0.18);
    this.disposables.push(m);
    const geo = new THREE.PlaneGeometry(p.size[0], p.size[2]);
    this.disposables.push(geo);
    const mesh = new THREE.Mesh(geo, m);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(p.pos[0], p.pos[1] + p.size[1] / 2, p.pos[2]);
    mesh.receiveShadow = true;
    this.target.root.add(mesh);
    this.waters.push(m);
    hideGray(gray);
  }

  /** A house with depth: plaster walls, a tiled pitched roof with gable ends, chimney, gutter and downpipe,
   *  recessed windows with frames and sills (some lit), and a door with a doorstep, all facing the street. */
  private async house(p: PropData, gray: THREE.Object3D | undefined): Promise<void> {
    const h = p.look!.house!;
    const [plaster, tiles, planks, stone] = await Promise.all([
      this.assets.textureSet(h.plaster),
      this.assets.textureSet(h.roof ?? 'clay_roof_tiles_02'),
      this.assets.textureSet('old_planks_02'),
      this.assets.textureSet('old_stone_wall'),
    ]);
    const [w, hgt, d] = p.size;
    const [cx, cy, cz] = p.pos;
    const group = new THREE.Group();
    const dir = h.face === 'x+' ? 1 : -1; // the street side
    const faceX = cx + (dir * w) / 2;
    // Walls: the graybox box itself, plastered.
    this.swapMaterial(gray, boxMaterials(plaster, p.size, 2.2));
    // Roof: a prism along z, tiles on the slopes, plaster on the gable ends.
    const roofH = Math.min(2.4, w * 0.75);
    const over = 0.35;
    const roof = new THREE.Mesh(prism(w + over * 2, roofH, d + 0.2), [texturedMaterial(tiles, (d + 0.2) / 1.6, Math.hypot(w / 2 + over, roofH) / 1.6), texturedMaterial(plaster, (w + over * 2) / 2.2, roofH / 2.2)]);
    roof.position.set(cx, cy + hgt / 2, cz);
    roof.castShadow = true;
    roof.receiveShadow = true;
    group.add(roof);
    // Chimney.
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.4, 0.6), texturedMaterial(stone, 0.5, 0.8));
    chimney.position.set(cx - dir * w * 0.2, cy + hgt / 2 + roofH * 0.55 + 0.4, cz + d * 0.3);
    chimney.castShadow = true;
    group.add(chimney);
    // Gutter along the street eave and a downpipe at one corner.
    const dark = new THREE.MeshStandardMaterial({ color: '#2a2c30', roughness: 0.6, metalness: 0.6 });
    const gutter = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, d + 0.2, 10), dark);
    gutter.rotation.x = Math.PI / 2;
    gutter.position.set(faceX + dir * (over - 0.05), cy + hgt / 2 - 0.02, cz);
    group.add(gutter);
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, hgt - 0.1, 8), dark);
    pipe.position.set(faceX + dir * 0.08, cy, cz - d / 2 + 0.25);
    group.add(pipe);
    // Windows.
    const frameMat = new THREE.MeshStandardMaterial({ color: '#e9e4d6', roughness: 0.7 });
    const recessMat = new THREE.MeshStandardMaterial({ color: '#1a1712', roughness: 0.9 });
    const sillMat = texturedMaterial(stone, 0.6, 0.15);
    const lit = new Set(h.lit ?? []);
    const floorH = hgt / h.floors;
    let k = 0;
    for (let f = 0; f < h.floors; f++) {
      const wy = cy - hgt / 2 + floorH * f + floorH * 0.55;
      for (let i = 0; i < h.windows; i++) {
        const t = (i + 0.5) / h.windows;
        const wz = cz - d / 2 + d * t;
        const isDoor = h.door && f === 0 && i === Math.floor(h.windows / 2);
        const ww = isDoor ? 1.0 : 0.9;
        const wh = isDoor ? 2.1 : 1.15;
        const y = isDoor ? cy - hgt / 2 + wh / 2 : wy;
        // Recess sunk into the wall.
        const recess = new THREE.Mesh(new THREE.BoxGeometry(0.3, wh, ww), isDoor ? texturedMaterial(planks, 0.5, 1) : recessMat);
        recess.position.set(faceX - dir * 0.14, y, wz);
        group.add(recess);
        if (!isDoor) {
          const pane = new THREE.Mesh(new THREE.PlaneGeometry(ww - 0.16, wh - 0.16), new THREE.MeshPhysicalMaterial({ color: '#0a1220', roughness: 0.08, metalness: 0, emissive: new THREE.Color(lit.has(k) ? '#ffb85a' : '#000000'), emissiveIntensity: lit.has(k) ? 3.0 : 0 }));
          pane.position.set(faceX - dir * 0.1, y, wz);
          pane.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
          group.add(pane);
          // Sill.
          const sill = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, ww + 0.2), sillMat);
          sill.position.set(faceX + dir * 0.06, y - wh / 2 - 0.04, wz);
          sill.castShadow = true;
          group.add(sill);
        } else {
          // Doorstep.
          const step = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, ww + 0.3), sillMat);
          step.position.set(faceX + dir * 0.25, cy - hgt / 2 + 0.07, wz);
          step.castShadow = true;
          group.add(step);
        }
        // Frame: four thin strips standing proud of the wall.
        const fx = faceX + dir * 0.02;
        const th = 0.07;
        for (const [sy, sz, oy, oz] of [[th, ww + th * 2, wh / 2, 0], [th, ww + th * 2, -wh / 2, 0], [wh, th, 0, ww / 2 + th / 2], [wh, th, 0, -ww / 2 - th / 2]] as const) {
          const bar = new THREE.Mesh(new THREE.BoxGeometry(0.06, sy, sz), frameMat);
          bar.position.set(fx, y + oy, wz + oz);
          bar.castShadow = true;
          group.add(bar);
        }
        k++;
      }
    }
    group.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.receiveShadow = true;
    });
    this.target.root.add(group);
  }

  /** Ambient motion of the water. */
  update(now: number): void {
    for (const m of this.waters) {
      if (m.normalMap) m.normalMap.offset.set((now / 60000) % 1, (now / 90000) % 1);
    }
  }

  dispose(): void {
    for (const d of this.disposables) d.dispose();
    this.disposables = [];
    this.sun?.dispose();
  }
}

/**
 * Stop drawing a prop's plain box once its dressed version is in, but keep it in the scene: sight lines for hidden
 * things still meet it, so nothing is "seen" through a shelf or a chest that is drawn as a model (round 5).
 */
function hideGray(gray: THREE.Object3D | undefined): void {
  const m = (gray as THREE.Mesh | undefined)?.material;
  if (!m) return;
  for (const x of Array.isArray(m) ? m : [m]) x.visible = false;
  if (gray) {
    gray.castShadow = false;
    gray.userData.sightOnly = true;
  }
}

/** A triangular prism along z: group 0 = the two slopes, group 1 = the two gable triangles. */
function prism(w: number, h: number, len: number): THREE.BufferGeometry {
  const hw = w / 2, hl = len / 2;
  const v: number[] = [];
  const uv: number[] = [];
  const nrm: number[] = [];
  const push = (a: Vec3, b: Vec3, c: Vec3, n: Vec3, ua: [number, number], ub: [number, number], uc: [number, number]) => {
    v.push(...a, ...b, ...c);
    nrm.push(...n, ...n, ...n);
    uv.push(...ua, ...ub, ...uc);
  };
  const slopeLen = Math.hypot(hw, h);
  const nx = h / slopeLen, ny = hw / slopeLen;
  // +x slope
  push([hw, 0, -hl], [hw, 0, hl], [0, h, hl], [nx, ny, 0], [0, 0], [1, 0], [1, 1]);
  push([hw, 0, -hl], [0, h, hl], [0, h, -hl], [nx, ny, 0], [0, 0], [1, 1], [0, 1]);
  // -x slope
  push([-hw, 0, hl], [-hw, 0, -hl], [0, h, -hl], [-nx, ny, 0], [0, 0], [1, 0], [1, 1]);
  push([-hw, 0, hl], [0, h, -hl], [0, h, hl], [-nx, ny, 0], [0, 0], [1, 1], [0, 1]);
  const slopes = v.length / 3;
  // gables
  push([-hw, 0, hl], [hw, 0, hl], [0, h, hl], [0, 0, 1], [0, 0], [1, 0], [0.5, 1]);
  push([hw, 0, -hl], [-hw, 0, -hl], [0, h, -hl], [0, 0, -1], [0, 0], [1, 0], [0.5, 1]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.addGroup(0, slopes, 0);
  g.addGroup(slopes, v.length / 3 - slopes, 1);
  return g;
}

export type { TextureSet };
