// A portal shows the next place live inside its dive target. The same camera pose is used for the
// hand-over in the dive, so the image before and after the switch is the same picture.
import * as THREE from 'three';
import type { PlaceScene } from './scene';
import { DEG } from '../game/geom';

export const PORTAL_FOV = 60; // vertical field of view of the approach camera, degrees

export interface PortalPose {
  pos: THREE.Vector3;
  yaw: number;
  pitch: number;
  fov: number; // vertical, degrees, over the quad's height
  aspect: number; // the quad's width / height
}

/** Where the approach camera stands for a place: behind its arrival spot, along the arrival view. */
export function approachPose(scene: PlaceScene, quadAspect: number): PortalPose {
  const place = scene.world.places[scene.placeId]!;
  const a = place.viewpoints[place.arrive]!;
  const ap = place.approach;
  // The arrival view faces -Z (yaw 0, heading 0). Pull back along +Z and lift.
  const pos = new THREE.Vector3(a.pos[0], a.pos[1] + ap.up, a.pos[2] + ap.back);
  return { pos, yaw: 0, pitch: ap.pitch, fov: PORTAL_FOV, aspect: quadAspect };
}

export class PortalRenderer {
  readonly target: THREE.WebGLRenderTarget;
  readonly camera = new THREE.PerspectiveCamera(PORTAL_FOV, 1, 0.05, 4000);

  constructor(private gl: THREE.WebGLRenderer, size = 768) {
    this.target = new THREE.WebGLRenderTarget(size, size, { depthBuffer: true });
    this.target.texture.colorSpace = THREE.SRGBColorSpace;
    this.camera.rotation.order = 'YXZ';
  }

  get texture(): THREE.Texture {
    return this.target.texture;
  }

  /** Render `scene` from its approach pose into the texture. */
  render(scene: PlaceScene, pose: PortalPose): void {
    const place = scene.world.places[scene.placeId]!;
    this.camera.near = place.near;
    this.camera.far = place.far;
    this.camera.aspect = pose.aspect;
    this.camera.fov = pose.fov;
    this.camera.position.copy(pose.pos);
    this.camera.rotation.set(pose.pitch * DEG, pose.yaw * DEG, 0);
    this.camera.updateProjectionMatrix();
    const prev = this.gl.getRenderTarget();
    this.gl.setRenderTarget(this.target);
    this.gl.render(scene.scene, this.camera);
    this.gl.setRenderTarget(prev);
  }

  dispose(): void {
    this.target.dispose();
  }
}
