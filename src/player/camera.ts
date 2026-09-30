// The player's camera: a full turn, limited tilt, a lens for zoom, and walking over the floor at a fixed speed.
import * as THREE from 'three';
import type { PlaceData, Vec3 } from '../game/types';
import { clamp, DEG, wrapDeg } from '../game/geom';
import type { WalkMap } from '../game/walk';

export const BASE_FOV = 60; // degrees on the narrow axis of the screen
export const ZOOM_MIN = 1;
export const ZOOM_MAX = 4;

export class ViewCamera {
  readonly camera = new THREE.PerspectiveCamera(BASE_FOV, 1, 0.05, 400);
  yaw = 0;
  pitch = 0;
  zoom = 1;
  private place: PlaceData | null = null;
  private walkMap: WalkMap | null = null;
  private pitchLimits: [number, number] = [-80, 80];
  /** Waypoints still to walk through (ground x, z). Empty when standing. */
  private route: Array<[number, number]> = [];

  constructor() {
    this.camera.rotation.order = 'YXZ';
  }

  /** Enter a place at an eye position. The pitch limits are the widest of the place's spots. */
  setPlace(place: PlaceData, walkMap: WalkMap, pos: Vec3, yaw = 0, pitch = 0, zoom = 1): void {
    this.place = place;
    this.walkMap = walkMap;
    const vps = Object.values(place.viewpoints);
    this.pitchLimits = [Math.min(...vps.map((v) => v.pitch[0])), Math.max(...vps.map((v) => v.pitch[1]))];
    this.camera.near = place.near;
    this.camera.far = place.far;
    this.camera.updateProjectionMatrix();
    this.route = [];
    this.setPosition(pos);
    this.yaw = wrapDeg(yaw);
    this.pitch = clamp(pitch, this.pitchLimits[0], this.pitchLimits[1]);
    this.zoom = clamp(zoom, ZOOM_MIN, ZOOM_MAX);
    this.apply();
  }

  /** Stand at a ground position (x, z); the eye height follows the floor. */
  setPosition(pos: Vec3): void {
    const y = this.place && this.walkMap ? this.walkMap.floorY(pos[0], pos[2]) + this.place.eye : pos[1];
    this.camera.position.set(pos[0], y, pos[2]);
  }

  get eye(): Vec3 {
    const p = this.camera.position;
    return [p.x, p.y, p.z];
  }

  /** Walk to a ground point along a found path. Returns false when there is no way there. */
  walkTo(x: number, z: number): boolean {
    if (!this.walkMap) return false;
    const p = this.camera.position;
    const route = this.walkMap.path(p.x, p.z, x, z);
    if (!route.length) return false;
    this.route = route;
    return true;
  }

  /** Stop walking where the player is. */
  stop(): void {
    this.route = [];
  }

  get walking(): boolean {
    return this.route.length > 0;
  }

  /** Where the current walk ends (or the player's own position when standing). */
  get destination(): [number, number] {
    const last = this.route[this.route.length - 1];
    return last ?? [this.camera.position.x, this.camera.position.z];
  }

  /** Slide by a ground vector (keys). Walls and edges stop or deflect the move. */
  slide(dx: number, dz: number): void {
    if (!this.walkMap || !this.place) return;
    this.route = [];
    const p = this.camera.position;
    const [x, z] = this.walkMap.slide(p.x, p.z, dx, dz);
    p.set(x, this.walkMap.floorY(x, z) + this.place.eye, z);
  }

  look(dYawDeg: number, dPitchDeg: number): void {
    this.yaw = wrapDeg(this.yaw + dYawDeg);
    this.pitch = clamp(this.pitch + dPitchDeg, this.pitchLimits[0], this.pitchLimits[1]);
  }

  /** Set the view directly (degrees). Used by the dive hand-over and the debug hooks. */
  setView(yaw: number, pitch: number): void {
    this.yaw = wrapDeg(yaw);
    this.pitch = clamp(pitch, this.pitchLimits[0], this.pitchLimits[1]);
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
    this.camera.rotation.set(this.pitch * DEG, this.yaw * DEG, 0);
  }

  /** Advance the walk at the place's fixed speed. */
  private advance(dt: number): void {
    if (!this.route.length || !this.place || !this.walkMap) return;
    let budget = this.place.moveSpeed * dt;
    const p = this.camera.position;
    while (budget > 0 && this.route.length) {
      const [tx, tz] = this.route[0]!;
      const dx = tx - p.x, dz = tz - p.z;
      const d = Math.hypot(dx, dz);
      if (d <= budget) {
        p.x = tx;
        p.z = tz;
        budget -= d;
        this.route.shift();
      } else {
        p.x += (dx / d) * budget;
        p.z += (dz / d) * budget;
        budget = 0;
      }
    }
    p.y = this.walkMap.floorY(p.x, p.z) + this.place.eye;
  }

  update(now: number, dt: number, aspect: number): void {
    void now;
    this.advance(dt);
    this.camera.aspect = aspect;
    this.camera.fov = this.verticalFov(aspect);
    this.camera.updateProjectionMatrix();
    this.apply();
  }
}
