// Draws a sketch from the world itself: renders a stored camera pose, then turns the pixels into ink lines on paper.
// Because it comes from the scene, a sketch can never go stale (spec §5).
import * as THREE from 'three';
import type { PlaceScene } from '../render/scene';
import { BASE_FOV } from '../player/camera';
import { DEG } from '../game/geom';

export interface Pose {
  /** The eye position the sketch is drawn from. */
  pos: [number, number, number];
  yaw: number;
  pitch: number;
  zoom: number;
}

const PAPER = [241, 230, 207];

export class SketchRenderer {
  private target: THREE.WebGLRenderTarget | null = null;
  private pixels: Uint8Array | null = null;
  private w = 0;
  private h = 0;

  constructor(private gl: THREE.WebGLRenderer) {}

  private ensure(w: number, h: number): void {
    if (this.target && this.w === w && this.h === h) return;
    this.target?.dispose();
    this.target = new THREE.WebGLRenderTarget(w, h, { depthBuffer: true });
    this.pixels = new Uint8Array(w * h * 4);
    this.w = w;
    this.h = h;
  }

  /** Render the pose and return the luminance buffer (w*h, 0..255). */
  private luminance(place: PlaceScene, pose: Pose, w: number, h: number): Uint8Array {
    this.ensure(w, h);
    const cam = new THREE.PerspectiveCamera(BASE_FOV, w / h, place.world.places[place.placeId]!.near, place.world.places[place.placeId]!.far);
    cam.rotation.order = 'YXZ';
    cam.position.set(...pose.pos);
    cam.rotation.set(pose.pitch * DEG, pose.yaw * DEG, 0);
    const narrowHalf = Math.tan((BASE_FOV / 2) * DEG) / pose.zoom;
    cam.fov = (w / h >= 1 ? 2 * Math.atan(narrowHalf) : 2 * Math.atan(narrowHalf / (w / h))) / DEG;
    cam.updateProjectionMatrix();
    const prevTarget = this.gl.getRenderTarget();
    this.gl.setRenderTarget(this.target);
    this.gl.render(place.scene, cam);
    this.gl.readRenderTargetPixels(this.target!, 0, 0, w, h, this.pixels!);
    this.gl.setRenderTarget(prevTarget);
    // The render target holds linear light. Convert to a perceptual scale so a dusk scene still has contrast.
    const lum = new Uint8Array(w * h);
    const px = this.pixels!;
    const gamma = new Uint8Array(256);
    for (let v = 0; v < 256; v++) gamma[v] = Math.round(255 * Math.pow(v / 255, 1 / 2.2));
    for (let i = 0, j = 0; i < lum.length; i++, j += 4) lum[i] = gamma[(px[j]! * 77 + px[j + 1]! * 150 + px[j + 2]! * 29) >> 8]!;
    return lum;
  }

  /** Ink-on-paper sketch of a pose. `strength` 0..1 fades the lines (used for "getting warm"). */
  draw(place: PlaceScene, pose: Pose, w = 320, h = 240, canvas?: HTMLCanvasElement, strength = 1): HTMLCanvasElement {
    const lum = this.luminance(place, pose, w, h);
    const out = canvas ?? document.createElement('canvas');
    out.width = w;
    out.height = h;
    const ctx = out.getContext('2d')!;
    const img = ctx.createImageData(w, h);
    const d = img.data;
    // Sobel edges on luminance, then a one-pixel dilation so the lines read like pencil, not hairlines.
    const edges = new Float32Array(w * h);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const gx = -lum[i - w - 1]! + lum[i - w + 1]! - 2 * lum[i - 1]! + 2 * lum[i + 1]! - lum[i + w - 1]! + lum[i + w + 1]!;
        const gy = -lum[i - w - 1]! - 2 * lum[i - w]! - lum[i - w + 1]! + lum[i + w - 1]! + 2 * lum[i + w]! + lum[i + w + 1]!;
        const e = Math.hypot(gx, gy) * 1.4;
        edges[i] = e > 34 ? Math.min(255, e) : 0;
      }
    }
    const thick = new Float32Array(w * h);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        thick[i] = Math.max(edges[i]!, edges[i - 1]! * 0.7, edges[i + 1]! * 0.7, edges[i - w]! * 0.7, edges[i + w]! * 0.7);
      }
    }
    // The render target is bottom-up, so flip rows while writing.
    for (let y = 0; y < h; y++) {
      const sy = h - 1 - y;
      for (let x = 0; x < w; x++) {
        const edge = thick[sy * w + x]!;
        const shade = (255 - lum[sy * w + x]!) * 0.22; // a light wash so shapes read, not colour alone
        const ink = Math.min(255, edge + shade) * strength;
        const o = (y * w + x) * 4;
        d[o] = PAPER[0]! - ink * 0.75;
        d[o + 1] = PAPER[1]! - ink * 0.78;
        d[o + 2] = PAPER[2]! - ink * 0.8;
        d[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return out;
  }

  dispose(): void {
    this.target?.dispose();
    this.target = null;
  }
}
