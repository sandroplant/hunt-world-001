// The object kit: code-made objects for things the asset pack has no model for (round 5: no flat placeholder
// shape may stay visible in the street or the shop). Visual only; it never decides game outcomes.
import type * as THREE from 'three';
import type { Assets } from '../assets';

/** A built kit object. */
export interface KitItem {
  /**
   * The object in metres: centred on the centre of its box, front facing +Z, up +Y, fitting inside `size`.
   * The caller places and turns it (from the world data).
   */
  object: THREE.Object3D;
  /** The materials this item owns (fresh per build, never shared with another item), for glints and disposal. */
  materials: THREE.Material[];
  /** Show a state of the thing (for example 'first'/'second' for a toggle, 'open', 'locked'). Optional. */
  setState?(state: string): void;
  /** Free geometries and materials made for this item (shared cached textures are kept). */
  dispose(): void;
}

export interface KitOptions {
  quality: 'high' | 'low';
  /** A per-object seed so two copies can differ a little. */
  seed: number;
  /** The shared loader for the CC0 pack's textures and models (`assets.textureSet('old_planks_02')`). */
  assets: Assets;
}

export type KitBuilder = (size: [number, number, number], opts: KitOptions) => Promise<KitItem>;
