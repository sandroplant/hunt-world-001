// Small shared helpers for kit builders: owned materials and geometries, canvas textures and common surfaces.
import * as THREE from 'three';
import type { Assets, TextureSet } from '../assets';
import { texturedMaterial } from '../assets';
import type { KitItem } from './types';

/** Collects what a builder makes so the item can be disposed in one call. */
export class Owned {
  readonly materials: THREE.Material[] = [];
  private geometries: THREE.BufferGeometry[] = [];
  private textures: THREE.Texture[] = [];

  mat<T extends THREE.Material>(m: T): T {
    this.materials.push(m);
    return m;
  }

  geo<T extends THREE.BufferGeometry>(g: T): T {
    this.geometries.push(g);
    return g;
  }

  tex<T extends THREE.Texture>(t: T): T {
    this.textures.push(t);
    return t;
  }

  /** A mesh from an owned geometry and material, casting and receiving shadows. */
  mesh(g: THREE.BufferGeometry, m: THREE.Material | THREE.Material[]): THREE.Mesh {
    this.geo(g);
    for (const x of Array.isArray(m) ? m : [m]) if (!this.materials.includes(x)) this.materials.push(x);
    const mesh = new THREE.Mesh(g, m);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  item(object: THREE.Object3D, setState?: (s: string) => void): KitItem {
    return {
      object,
      materials: this.materials,
      setState,
      dispose: () => {
        for (const g of this.geometries) g.dispose();
        for (const m of this.materials) m.dispose();
        for (const t of this.textures) t.dispose();
      },
    };
  }
}

/** A texture drawn on a canvas (labels, painted signs, book spines, chalk). sRGB colour. */
export function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** A small seeded random number generator (mulberry32), so a seed always builds the same thing. */
export function rng(seed: number): () => number {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const surfaces = {
  brass: (o: Owned, rough = 0.32) => o.mat(new THREE.MeshStandardMaterial({ color: '#c9a050', metalness: 1, roughness: rough })),
  iron: (o: Owned, color = '#2b2d30') => o.mat(new THREE.MeshStandardMaterial({ color, metalness: 0.7, roughness: 0.55 })),
  paint: (o: Owned, color: string, rough = 0.7) => o.mat(new THREE.MeshStandardMaterial({ color, metalness: 0, roughness: rough })),
  glass: (o: Owned, color = '#cfe3ea', opacity = 0.35) => o.mat(new THREE.MeshPhysicalMaterial({ color, metalness: 0, roughness: 0.05, transparent: true, opacity, depthWrite: false, clearcoat: 1, side: THREE.DoubleSide })),
  /** A pack wood or plaster texture tiled by metres: `repeat` = size / tile. */
  textured: (o: Owned, set: TextureSet, rx: number, ry: number, color?: string, rough?: number) => o.mat(texturedMaterial(set, rx, ry, { color, rough })),
};

/** The pack's texture set by name, through the shared loader (cached; never disposed by an item). */
export function packTexture(assets: Assets, name: string): Promise<TextureSet> {
  return assets.textureSet(name);
}
