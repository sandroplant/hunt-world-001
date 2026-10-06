// The look of an object (not a prop) in a realistic place (round 5): a kit object, a pack model or one node of it,
// or a textured shape. The object's plain box stays in the scene, unseen, for picking, sight and state; the look
// follows it. Visual only; it never decides game outcomes.
import * as THREE from 'three';
import type { Look, Vec3 } from '../game/types';
import { Assets, boxMaterials } from './assets';
import { kit } from './kit';

const DEG = Math.PI / 180;

export interface Visual {
  /** Centred on the object's box centre, in the object's own frame (before its rotation). */
  object: THREE.Object3D;
  materials: THREE.Material[];
  setState?(state: string): void;
  light?: THREE.PointLight;
  dispose(): void;
}

/** A quarter turn swaps the box's x and z for whatever is built inside it. */
function turnedSize(size: Vec3, yaw: number | undefined): [number, number, number] {
  const quarter = Math.abs(((((yaw ?? 0) % 180) + 180) % 180) - 90) < 1;
  return quarter ? [size[2], size[1], size[0]] : [size[0], size[1], size[2]];
}

/** Fit a model (or one node of it) into a box centred on the origin, bottom on the box's bottom. */
export function fitModel(src: THREE.Object3D, size: [number, number, number], fit: Look['fit'] = 'height'): THREE.Group {
  const box = new THREE.Box3().setFromObject(src);
  const dims = box.getSize(new THREE.Vector3());
  let sx: number, sy: number, sz: number;
  if (fit === 'box') {
    sx = size[0] / dims.x;
    sy = size[1] / dims.y;
    sz = size[2] / dims.z;
  } else {
    const s = fit === 'height' ? size[1] / dims.y : Math.min(size[0] / dims.x, size[1] / dims.y, size[2] / dims.z);
    sx = sy = sz = s;
  }
  const holder = new THREE.Group();
  src.position.set(-(box.min.x + dims.x / 2) * sx, -box.min.y * sy - size[1] / 2, -(box.min.z + dims.z / 2) * sz);
  src.scale.set(sx, sy, sz);
  holder.add(src);
  return holder;
}

/** Clone a model's materials (so paint and glints never touch the shared ones), optionally painted one colour. */
function ownMaterials(root: THREE.Object3D, tint: string | undefined, owned: THREE.Material[]): void {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const one = (m: THREE.Material): THREE.Material => {
      const c = m.clone();
      const sc = c as THREE.MeshStandardMaterial;
      if (tint && sc.color) {
        // Painted: the wood's grain stays in the normal and roughness maps, its colour becomes the paint.
        sc.map = null;
        sc.color.set(tint);
        sc.needsUpdate = true;
      }
      owned.push(c);
      return c;
    };
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(one) : one(mesh.material);
  });
}

export async function buildVisual(assets: Assets, look: Look, size: Vec3, quality: 'high' | 'low', seed: number): Promise<Visual | null> {
  if (look.none) return null;
  const inner = turnedSize(size, look.yaw);
  let object: THREE.Object3D;
  let materials: THREE.Material[] = [];
  let setState: ((s: string) => void) | undefined;
  let disposeItem: (() => void) | null = null;
  const geometries: THREE.BufferGeometry[] = [];
  if (look.kit) {
    const builder = kit[look.kit];
    if (!builder) throw new Error(`no kit builder "${look.kit}"`);
    const item = await builder(inner, { quality, seed, assets });
    object = item.object;
    materials = item.materials;
    setState = item.setState?.bind(item);
    disposeItem = () => item.dispose();
  } else if (look.model) {
    const src = await assets.model(look.model);
    let part: THREE.Object3D;
    if (look.node) {
      const found = src.getObjectByName(look.node);
      if (!found) throw new Error(`model ${look.model} has no node ${look.node}`);
      part = found.clone();
      part.position.set(0, 0, 0);
    } else {
      part = src.clone();
      if (look.only) {
        const keep = new Set(look.only);
        part.traverse((o) => {
          if ((o as THREE.Mesh).isMesh && !keep.has(o.name)) o.visible = false;
        });
      }
    }
    ownMaterials(part, look.tint, materials);
    object = fitModel(part, inner, look.fit);
  } else {
    // A textured or plain-material box: the object's own shape, properly surfaced.
    const g = new THREE.BoxGeometry(inner[0], inner[1], inner[2]);
    geometries.push(g);
    let m: THREE.Material | THREE.Material[];
    if (look.tex) {
      const set = await assets.textureSet(look.tex);
      m = boxMaterials(set, inner, look.tile ?? 1, { color: look.color, rough: look.rough });
    } else if (look.glass) {
      m = new THREE.MeshPhysicalMaterial({ color: look.color ?? '#cfe3ea', roughness: 0.05, metalness: 0, transparent: true, opacity: 0.4, depthWrite: false });
    } else {
      m = new THREE.MeshStandardMaterial({ color: look.color ?? '#888888', roughness: look.rough ?? 0.6 });
    }
    materials = Array.isArray(m) ? m : [m];
    const mesh = new THREE.Mesh(g, m);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    object = mesh;
  }
  const outer = new THREE.Group();
  object.rotation.y += (look.yaw ?? 0) * DEG;
  outer.add(object);
  let light: THREE.PointLight | undefined;
  if (look.light) {
    const l = look.light;
    light = new THREE.PointLight(l.color, l.intensity, l.distance, 2);
    light.position.set(0, l.y ?? 0, 0);
    if (l.shadow && quality === 'high') {
      light.castShadow = true;
      light.shadow.mapSize.set(1024, 1024);
      light.shadow.bias = -0.002;
      light.shadow.radius = 3;
    }
    outer.add(light);
  }
  return {
    object: outer,
    materials,
    setState,
    light,
    dispose: () => {
      disposeItem?.();
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      light?.dispose();
    },
  };
}
