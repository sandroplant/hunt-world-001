// Loads the CC0 Poly Haven pack from the site's own files (public/assets/polyhaven). Nothing is fetched from the
// network at runtime beyond the static site itself. Only what a place asks for is loaded, and each file once.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

const BASE = './assets/polyhaven/';

export interface TextureSet {
  map: THREE.Texture;
  normalMap: THREE.Texture;
  /** Ambient occlusion (R), roughness (G) and metalness (B) in one file, as Poly Haven packs them. */
  arm: THREE.Texture;
}

export class Assets {
  private textureSets = new Map<string, Promise<TextureSet>>();
  private models = new Map<string, Promise<THREE.Group>>();
  private hdris = new Map<string, Promise<THREE.DataTexture>>();
  private textureLoader = new THREE.TextureLoader();
  private gltfLoader = new GLTFLoader();
  private rgbeLoader = new RGBELoader();
  /** Every file requested, for the size report. */
  readonly requested = new Set<string>();

  private texture(url: string, srgb: boolean): Promise<THREE.Texture> {
    this.requested.add(url);
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        (t) => {
          t.wrapS = t.wrapT = THREE.RepeatWrapping;
          t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
          t.anisotropy = 4;
          resolve(t);
        },
        undefined,
        reject,
      );
    });
  }

  textureSet(name: string): Promise<TextureSet> {
    let p = this.textureSets.get(name);
    if (!p) {
      const dir = `${BASE}textures/${name}/${name}`;
      p = Promise.all([this.texture(`${dir}_diff_1k.jpg`, true), this.texture(`${dir}_nor_gl_1k.jpg`, false), this.texture(`${dir}_arm_1k.jpg`, false)]).then(([map, normalMap, arm]) => ({ map, normalMap, arm }));
      this.textureSets.set(name, p);
    }
    return p;
  }

  /** The model's scene, loaded once. Callers clone it. */
  model(name: string): Promise<THREE.Group> {
    let p = this.models.get(name);
    if (!p) {
      const url = `${BASE}models/${name}/${name}_1k.gltf`;
      this.requested.add(url);
      p = new Promise((resolve, reject) => {
        this.gltfLoader.load(
          url,
          (gltf) => {
            gltf.scene.traverse((o) => {
              if ((o as THREE.Mesh).isMesh) {
                o.castShadow = true;
                o.receiveShadow = true;
              }
            });
            resolve(gltf.scene);
          },
          undefined,
          reject,
        );
      });
      this.models.set(name, p);
    }
    return p;
  }

  hdri(name: string): Promise<THREE.DataTexture> {
    let p = this.hdris.get(name);
    if (!p) {
      const url = `${BASE}hdri/${name}.hdr`;
      this.requested.add(url);
      p = new Promise((resolve, reject) => {
        this.rgbeLoader.load(
          url,
          (t) => {
            t.mapping = THREE.EquirectangularReflectionMapping;
            resolve(t);
          },
          undefined,
          reject,
        );
      });
      this.hdris.set(name, p);
    }
    return p;
  }
}

/** A textured standard material with its maps repeated `rx` by `ry` times. Textures are cloned cheaply (the image is shared). */
export function texturedMaterial(set: TextureSet, rx: number, ry: number, opts: { color?: string; rough?: number; emissive?: string } = {}): THREE.MeshStandardMaterial {
  const rep = (t: THREE.Texture): THREE.Texture => {
    const c = t.clone();
    c.repeat.set(rx, ry);
    c.needsUpdate = true;
    return c;
  };
  const m = new THREE.MeshStandardMaterial({
    map: rep(set.map),
    normalMap: rep(set.normalMap),
    aoMap: rep(set.arm),
    roughnessMap: rep(set.arm),
    metalnessMap: rep(set.arm),
    roughness: opts.rough ?? 1,
    metalness: 1,
    color: opts.color ?? '#ffffff',
  });
  if (opts.emissive) {
    m.emissive = new THREE.Color(opts.emissive);
    m.emissiveIntensity = 1;
  }
  return m;
}

/** Six materials for a box so each face repeats the texture by its own metres, not stretched. */
export function boxMaterials(set: TextureSet, size: [number, number, number], tile: number, opts: { color?: string; rough?: number } = {}): THREE.MeshStandardMaterial[] {
  const [x, y, z] = size;
  const f = (a: number, b: number) => texturedMaterial(set, Math.max(0.05, a / tile), Math.max(0.05, b / tile), opts);
  return [f(z, y), f(z, y), f(x, z), f(x, z), f(x, y), f(x, y)];
}
