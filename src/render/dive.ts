// The dive: one continuous camera move with a change of scale, the same length on every device.
// Two scenes are alive; the swap happens at the midpoint. Reduced motion uses a 0.6 s cross-fade inside the same total time.
import * as THREE from 'three';
import type { PlaceScene } from './scene';
import { clamp } from '../game/geom';

export const DIVE_MS = 2000;

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export interface DivePlan {
  direction: 'in' | 'out';
  from: PlaceScene;
  to: PlaceScene;
  fromCamera: THREE.PerspectiveCamera; // a copy of the player's camera at the start
  toCamera: THREE.PerspectiveCamera; // the camera at the destination viewpoint
  /** The physical target in the "from" scene (going in) or in the "to" scene (coming out). */
  target: THREE.Vector3;
  reducedMotion: boolean;
  start: number;
}

export class DiveAnimator {
  plan: DivePlan | null = null;
  private fromPos = new THREE.Vector3();
  private fromFov = 60;
  private toFov = 60;
  private toPos = new THREE.Vector3();

  begin(plan: DivePlan): void {
    this.plan = plan;
    this.fromPos.copy(plan.fromCamera.position);
    this.fromFov = plan.fromCamera.fov;
    this.toFov = plan.toCamera.fov;
    this.toPos.copy(plan.toCamera.position);
    plan.to.root.scale.setScalar(1);
    plan.to.root.position.set(0, 0, 0);
  }

  get active(): boolean {
    return this.plan !== null;
  }

  /** Advance. Returns what to render and the fade level (0..1) for reduced motion, or null when finished. */
  step(now: number): { scene: THREE.Scene; camera: THREE.Camera; fade: number; done: boolean } | null {
    const p = this.plan;
    if (!p) return null;
    const t = clamp((now - p.start) / DIVE_MS, 0, 1);
    const done = t >= 1;
    if (p.reducedMotion) {
      // Hold, fade to black over 0.3 s, swap, fade in over 0.3 s. Total time unchanged.
      const fade = t < 0.35 ? 0 : t < 0.5 ? (t - 0.35) / 0.15 : t < 0.65 ? 1 - (t - 0.5) / 0.15 : 0;
      const showTo = t >= 0.5;
      if (done) this.finish();
      return { scene: showTo ? p.to.scene : p.from.scene, camera: showTo ? p.toCamera : p.fromCamera, fade, done };
    }
    const setFov = (cam: THREE.PerspectiveCamera, fov: number) => {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    };
    if (p.direction === 'in') {
      if (t < 0.5) {
        const k = easeInOut(t * 2);
        p.fromCamera.position.lerpVectors(this.fromPos, p.target, k * 0.9);
        setFov(p.fromCamera, this.fromFov * (1 - 0.7 * k));
        return { scene: p.from.scene, camera: p.fromCamera, fade: 0, done: false };
      }
      const k = easeInOut((t - 0.5) * 2);
      const s = 0.12 + 0.88 * k;
      p.to.root.scale.setScalar(s);
      p.to.root.position.copy(this.toPos).multiplyScalar(1 - s);
      setFov(p.toCamera, this.toFov * (0.3 + 0.7 * k));
      if (done) this.finish();
      return { scene: p.to.scene, camera: p.toCamera, fade: 0, done };
    }
    // Backing out: the current place shrinks around the camera, then the parent camera pulls back from the target.
    if (t < 0.5) {
      const k = easeInOut(t * 2);
      const s = 1 - 0.88 * k;
      p.from.root.scale.setScalar(s);
      p.from.root.position.copy(this.fromPos).multiplyScalar(1 - s);
      setFov(p.fromCamera, this.fromFov * (1 - 0.7 * k));
      return { scene: p.from.scene, camera: p.fromCamera, fade: 0, done: false };
    }
    const k = easeInOut((t - 0.5) * 2);
    p.toCamera.position.lerpVectors(p.target, this.toPos, k);
    setFov(p.toCamera, this.toFov * (0.3 + 0.7 * k));
    if (done) this.finish();
    return { scene: p.to.scene, camera: p.toCamera, fade: 0, done };
  }

  private finish(): void {
    const p = this.plan;
    if (!p) return;
    p.from.root.scale.setScalar(1);
    p.from.root.position.set(0, 0, 0);
    p.to.root.scale.setScalar(1);
    p.to.root.position.set(0, 0, 0);
    p.fromCamera.position.copy(this.fromPos);
    p.fromCamera.fov = this.fromFov;
    p.fromCamera.updateProjectionMatrix();
    p.toCamera.position.copy(this.toPos);
    p.toCamera.fov = this.toFov;
    p.toCamera.updateProjectionMatrix();
    this.plan = null;
  }
}
