import * as THREE from 'three';
import type { Quality } from './scene';

export function detectQuality(): Quality {
  const touch = typeof window !== 'undefined' && (navigator.maxTouchPoints > 0 || 'ontouchstart' in window);
  const small = typeof window !== 'undefined' && Math.min(window.innerWidth, window.innerHeight) < 700;
  const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
  return (touch && small) || cores <= 4 ? 'low' : 'high';
}

export class Renderer {
  readonly gl: THREE.WebGLRenderer;
  quality: Quality;

  constructor(canvas: HTMLCanvasElement, quality: Quality) {
    this.quality = quality;
    this.gl = new THREE.WebGLRenderer({ canvas, antialias: quality === 'high', powerPreference: 'high-performance', preserveDrawingBuffer: false });
    this.gl.setPixelRatio(this.pixelRatio(quality));
    this.gl.outputColorSpace = THREE.SRGBColorSpace;
    // Filmic tone mapping for the HDRI-lit places; the graybox places are lit to look right under it too.
    this.gl.toneMapping = THREE.NoToneMapping;
    this.gl.toneMappingExposure = 1;
    this.gl.shadowMap.enabled = quality === 'high';
    this.gl.shadowMap.type = THREE.PCFSoftShadowMap;
    this.resize();
  }

  /** Exposure for the place being shown (only matters under filmic tone mapping). */
  setExposure(v: number): void {
    this.gl.toneMappingExposure = v;
  }

  /**
   * Realistic places get the filmic curve; graybox places none, so that a graybox place seen through an opening
   * (its live picture is never tone mapped) looks the same before and after the dive's hand-over.
   */
  setToneMapping(realistic: boolean): void {
    this.gl.toneMapping = realistic ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
  }

  /** Build the shaders a scene needs under a tone-mapping setting, ahead of time, so the switch has no hitch. */
  warm(scene: THREE.Scene, camera: THREE.Camera, realistic: boolean): void {
    const prev = this.gl.toneMapping;
    this.setToneMapping(realistic);
    this.gl.compile(scene, camera);
    this.gl.toneMapping = prev;
  }

  /** The low tier draws at three quarters of the screen's pixels (stretched by the browser) and never above 1:1. */
  private pixelRatio(q: Quality): number {
    const dpr = window.devicePixelRatio || 1;
    return q === 'high' ? Math.min(dpr, 2) : Math.min(dpr, 1) * 0.75;
  }

  setQuality(q: Quality): void {
    this.quality = q;
    this.gl.setPixelRatio(this.pixelRatio(q));
    this.gl.shadowMap.enabled = q === 'high';
    this.resize();
  }

  resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.gl.setSize(w, h, false);
  }

  get width(): number {
    return window.innerWidth;
  }

  get height(): number {
    return window.innerHeight;
  }

  render(scene: THREE.Scene, camera: THREE.Camera): void {
    this.gl.render(scene, camera);
  }

  stats(): { calls: number; triangles: number; geometries: number; textures: number } {
    const i = this.gl.info;
    return { calls: i.render.calls, triangles: i.render.triangles, geometries: i.memory.geometries, textures: i.memory.textures };
  }
}
