// The dive: one continuous forward move through the portal opening into the next place, with no cut.
// Phase 1 flies the player's camera to the opening until the opening exactly fills the screen.
// At that instant the next place is rendered with the same camera pose the portal picture was made from,
// so the two frames are the same picture. Phase 2 continues forward into the place.
// Backing out runs the same path in reverse. Reduced motion uses a 0.6 s cross-fade inside the same time.
import * as THREE from 'three';
import type { PlaceScene } from './scene';
import type { PortalPose } from './portal';
import { clamp, DEG, wrapDeg } from '../game/geom';

export const DIVE_MS = 2000;

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export interface CamPose {
  pos: THREE.Vector3;
  yaw: number;
  pitch: number;
  fov: number; // vertical, degrees, at the screen aspect
}

export interface PortalGeometry {
  center: THREE.Vector3;
  normal: THREE.Vector3; // unit, pointing toward the viewer
  width: number;
  height: number;
}

export interface DivePlan {
  direction: 'in' | 'out';
  /** The scene the player is leaving and the one they arrive in. */
  from: PlaceScene;
  to: PlaceScene;
  /** The opening, in whichever scene holds it: `from` when diving in, `to` when backing out. */
  portal: PortalGeometry;
  /** The approach camera pose of the nested place (in `to` when diving in, in `from` when backing out). */
  approach: PortalPose;
  /** Where the camera starts (the player's current pose). */
  start: CamPose;
  /** Where the camera ends (the arrival spot when diving in; the spot dived from, facing the opening, when out). */
  end: CamPose;
  screenAspect: number;
  reducedMotion: boolean;
  startedAt: number;
}

/** The camera pose that sees exactly the visible crop of the opening: perpendicular, centred, fov matched. */
export function portalViewPose(portal: PortalGeometry, approach: PortalPose, screenAspect: number): CamPose {
  const { width: w, height: h } = portal;
  const quadAspect = w / h;
  // The largest screen-shaped crop that fits inside the opening.
  const hVis = quadAspect > screenAspect ? h : w / screenAspect;
  const fovCrop = (2 * Math.atan(Math.tan((approach.fov / 2) * DEG) * (hVis / h))) / DEG;
  const zEnd = h / (2 * Math.tan((approach.fov / 2) * DEG));
  const pos = portal.center.clone().addScaledVector(portal.normal, zEnd);
  const d = portal.normal.clone().negate();
  const yaw = Math.atan2(-d.x, -d.z) / DEG;
  const pitch = Math.asin(clamp(d.y, -1, 1)) / DEG;
  return { pos, yaw, pitch, fov: fovCrop };
}

/** The same crop seen from inside the nested place: the approach camera with the crop's fov at the screen aspect. */
export function handoverPose(approach: PortalPose, viewPose: CamPose): CamPose {
  return { pos: approach.pos.clone(), yaw: approach.yaw, pitch: approach.pitch, fov: viewPose.fov };
}

function lerpPose(a: CamPose, b: CamPose, k: number, out: THREE.PerspectiveCamera, aspect: number): void {
  out.position.lerpVectors(a.pos, b.pos, k);
  const yaw = a.yaw + wrapDeg(b.yaw - a.yaw) * k;
  const pitch = a.pitch + (b.pitch - a.pitch) * k;
  out.rotation.set(pitch * DEG, yaw * DEG, 0);
  // Interpolate the field of view on its tangent so the zoom feels even.
  const ta = Math.tan((a.fov / 2) * DEG);
  const tb = Math.tan((b.fov / 2) * DEG);
  out.fov = (2 * Math.atan(ta * Math.pow(tb / ta, k))) / DEG;
  out.aspect = aspect;
  out.updateProjectionMatrix();
}

export class DiveAnimator {
  plan: DivePlan | null = null;
  readonly camA = new THREE.PerspectiveCamera(60, 1, 0.05, 4000);
  readonly camB = new THREE.PerspectiveCamera(60, 1, 0.05, 4000);
  private viewPose: CamPose | null = null;
  private handover: CamPose | null = null;

  constructor() {
    this.camA.rotation.order = 'YXZ';
    this.camB.rotation.order = 'YXZ';
  }

  begin(plan: DivePlan): void {
    this.plan = plan;
    this.handedOver = false;
    this.freezeAt = null;
    this.viewPose = portalViewPose(plan.portal, plan.approach, plan.screenAspect);
    this.handover = handoverPose(plan.approach, this.viewPose);
    const pf = plan.from.world.places[plan.from.placeId]!;
    const pt = plan.to.world.places[plan.to.placeId]!;
    this.camA.near = pf.near;
    this.camA.far = pf.far;
    this.camB.near = pt.near;
    this.camB.far = pt.far;
  }

  get active(): boolean {
    return this.plan !== null;
  }

  /** True once the hand-over to the destination scene has happened. */
  handedOver = false;
  /** Where the move is, 0..1. */
  progress = 0;

  /** For the seam check: freeze the move at a fraction 0..1 of its length (null = run normally). */
  freezeAt: number | null = null;

  /** Advance. Returns what to render, the fade level for reduced motion, and whether the move is done. */
  step(now: number): { scene: THREE.Scene; camera: THREE.PerspectiveCamera; fade: number; done: boolean; second: boolean } | null {
    const p = this.plan;
    if (!p || !this.viewPose || !this.handover) return null;
    const t = this.freezeAt ?? clamp((now - p.startedAt) / DIVE_MS, 0, 1);
    this.progress = t;
    const done = this.freezeAt === null && t >= 1;
    this.handedOver = t >= 0.5;
    if (p.reducedMotion) {
      const fade = t < 0.35 ? 0 : t < 0.5 ? (t - 0.35) / 0.15 : t < 0.65 ? 1 - (t - 0.5) / 0.15 : 0;
      const second = t >= 0.5;
      lerpPose(p.start, p.start, 0, this.camA, p.screenAspect);
      lerpPose(p.end, p.end, 0, this.camB, p.screenAspect);
      if (done) this.plan = null;
      return { scene: second ? p.to.scene : p.from.scene, camera: second ? this.camB : this.camA, fade, done, second };
    }
    if (p.direction === 'in') {
      if (t < 0.5) {
        lerpPose(p.start, this.viewPose, easeInOut(t * 2), this.camA, p.screenAspect);
        return { scene: p.from.scene, camera: this.camA, fade: 0, done: false, second: false };
      }
      lerpPose(this.handover, p.end, easeInOut((t - 0.5) * 2), this.camB, p.screenAspect);
      if (done) this.plan = null;
      return { scene: p.to.scene, camera: this.camB, fade: 0, done, second: true };
    }
    // Backing out: retreat to the approach pose inside the nested place, hand over to the opening seen from
    // outside, then fly back to the spot the player dived from.
    if (t < 0.5) {
      lerpPose(p.start, this.handover, easeInOut(t * 2), this.camA, p.screenAspect);
      return { scene: p.from.scene, camera: this.camA, fade: 0, done: false, second: false };
    }
    lerpPose(this.viewPose, p.end, easeInOut((t - 0.5) * 2), this.camB, p.screenAspect);
    if (done) this.plan = null;
    return { scene: p.to.scene, camera: this.camB, fade: 0, done, second: true };
  }
}
