// The realistic dressing of a place (style frame, founder direction A). It reads each prop's `look` and swaps the
// graybox shape for a textured one, a glTF model, a built house, water or glass. Positions and sizes stay the ones
// in props.json, so the walk map, the openings and the seam are untouched. Everything here is visual only.
import * as THREE from 'three';
import type { PlaceData, PropData, Vec3 } from '../game/types';
import { propInstances } from '../game/props';
import { Assets, boxMaterials, texturedMaterial, type TextureSet } from './assets';

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
    if (this.place.mist) scene.fog = new THREE.Fog(this.place.mist[0], this.place.mist[1], this.place.mist[2]);
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
    if (look.house) return this.house(p, gray);
    if (look.water) return this.water(p, gray);
    if (look.model) return this.model(p, gray);
    if (look.glass) {
      const m = new THREE.MeshPhysicalMaterial({ color: look.color ?? '#0b1420', roughness: 0.05, metalness: 0, transparent: true, opacity: 0.9, emissive: look.emissive ? new THREE.Color(look.emissive) : new THREE.Color('#000000'), emissiveIntensity: look.emissive ? 2.5 : 0 });
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

  private async model(p: PropData, gray: THREE.Object3D | undefined): Promise<void> {
    const look = p.look!;
    const src = await this.assets.model(look.model!);
    const box = new THREE.Box3().setFromObject(src);
    const dims = box.getSize(new THREE.Vector3());
    const fit = look.fit ?? 'height';
    for (const inst of propInstances(p, this.target.quality)) {
      const g = src.clone();
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
    if (gray) gray.visible = false;
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
    if (gray) gray.visible = false;
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
