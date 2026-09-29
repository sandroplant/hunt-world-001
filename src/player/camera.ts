// The viewpoint camera: fixed position, limited turn and tilt, a lens for zoom, and a short glide between viewpoints.
import * as THREE from 'three';
import type { PlaceData } from '../game/types';
import { clamp, DEG } from '../game/geom';

export const BASE_FOV = 60; // degrees on the narrow axis of the screen
export const ZOOM_MIN = 1;
export const ZOOM_MAX = 4;

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export class ViewCamera {
  readonly camera = new THREE.PerspectiveCamera(BASE_FOV, 1, 0.05, 400);
  yaw = 0;
  pitch = 0;
  zoom = 1;
  private place: PlaceData | null = null;
  private viewpointId = 'A';
  private heading = 0;
  private yawLimits: [number, number] = [-180, 180];
  private pitchLimits: [number, number] = [-80, 80];
  private glide: { from: THREE.Vector3; to: THREE.Vector3; start: number; ms: number } | null = null;

  constructor() {
    this.camera.rotation.order = 'YXZ';
  }

  get viewpoint(): string {
    return this.viewpointId;
  }

  setPlace(place: PlaceData, viewpointId: string, yaw = 0, pitch = 0, zoom = 1): void {
    this.place = place;
    this.viewpointId = viewpointId;
    const vp = place.viewpoints[viewpointId]!;
    this.heading = vp.heading;
    this.yawLimits = vp.yaw;
    this.pitchLimits = vp.pitch;
    this.camera.near = place.near;
    this.camera.far = place.far;
    this.camera.updateProjectionMatrix();
    this.camera.position.set(...vp.pos);
    this.glide = null;
    this.yaw = clamp(yaw, vp.yaw[0], vp.yaw[1]);
    this.pitch = clamp(pitch, vp.pitch[0], vp.pitch[1]);
    this.zoom = clamp(zoom, ZOOM_MIN, ZOOM_MAX);
    this.apply();
  }

  /** Glide to another viewpoint of the same place over about a second. */
  glideTo(viewpointId: string, now: number, ms = 900): void {
    if (!this.place) return;
    const vp = this.place.viewpoints[viewpointId];
    if (!vp) return;
    this.viewpointId = viewpointId;
    this.heading = vp.heading;
    this.yawLimits = vp.yaw;
    this.pitchLimits = vp.pitch;
    this.yaw = 0;
    this.pitch = 0;
    this.zoom = 1;
    this.glide = { from: this.camera.position.clone(), to: new THREE.Vector3(...vp.pos), start: now, ms };
  }

  get gliding(): boolean {
    return this.glide !== null;
  }

  look(dYawDeg: number, dPitchDeg: number): void {
    this.yaw = clamp(this.yaw + dYawDeg, this.yawLimits[0], this.yawLimits[1]);
    this.pitch = clamp(this.pitch + dPitchDeg, this.pitchLimits[0], this.pitchLimits[1]);
  }

  setZoom(z: number): void {
    this.zoom = clamp(z, ZOOM_MIN, ZOOM_MAX);
  }

  /** Vertical field of view for the current zoom and aspect: the narrow screen axis gets BASE_FOV / zoom. */
  verticalFov(aspect: number): number {
    const narrowHalf = Math.tan((BASE_FOV / 2) * DEG) / this.zoom;
    if (aspect >= 1) return (2 * Math.atan(narrowHalf)) / DEG;
    return (2 * Math.atan(narrowHalf / aspect)) / DEG;
  }

  pxPerDeg(heightPx: number, aspect: number): number {
    return heightPx / this.verticalFov(aspect);
  }

  apply(): void {
    this.camera.rotation.set(this.pitch * DEG, (this.heading + this.yaw) * DEG, 0);
  }

  update(now: number, aspect: number): void {
    if (this.glide) {
      const t = clamp((now - this.glide.start) / this.glide.ms, 0, 1);
      this.camera.position.lerpVectors(this.glide.from, this.glide.to, easeInOut(t));
      if (t >= 1) this.glide = null;
    }
    this.camera.aspect = aspect;
    this.camera.fov = this.verticalFov(aspect);
    this.camera.updateProjectionMatrix();
    this.apply();
  }
}
