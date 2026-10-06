// Kit preview: lays the named kit items out in a row, each beside a wire box of its size, under the street's light
// (HDRI, filmic tone mapping, exposure 0.5) or the shop's (dim sky, warm lamp). Dev tool only; never shipped.
// /tools/kit/preview.html?items=a:0.3x0.4x0.2,b:1x1x1&mode=shop&state=open&yaw=30&pitch=15
import * as THREE from 'three';
import { Assets } from '../../src/render/assets';
import { kit } from '../../src/render/kit';

declare global {
  interface Window {
    __kitReady?: boolean;
    __kitError?: string;
  }
}

const q = new URLSearchParams(location.search);
const mode = q.get('mode') ?? 'street';
const state = q.get('state');
const yaw = Number(q.get('yaw') ?? 25) * (Math.PI / 180);
const pitch = Number(q.get('pitch') ?? 12) * (Math.PI / 180);
const items = (q.get('items') ?? '').split(',').filter(Boolean).map((s) => {
  const [name, dims] = s.split(':');
  const size = (dims ?? '0.3x0.3x0.3').split('x').map(Number) as [number, number, number];
  return { name: name!, size };
});

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.5;
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const assets = new Assets();
const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.01, 200);

async function main(): Promise<void> {
  const env = await assets.hdri('belfast_sunset_puresky_2k');
  scene.environment = env;
  scene.environmentRotation.set(0, -100 * (Math.PI / 180), 0);
  if (mode === 'shop') {
    scene.background = new THREE.Color('#1a120a');
    scene.environmentIntensity = 0.12;
    const lamp = new THREE.PointLight('#ffb35c', 6, 8, 2);
    lamp.position.set(-0.6, 1.2, 1.2);
    lamp.castShadow = true;
    scene.add(lamp);
  } else {
    scene.background = env;
    scene.backgroundRotation.set(0, -100 * (Math.PI / 180), 0);
    scene.environmentIntensity = 0.55;
    scene.backgroundIntensity = 0.7;
    const sun = new THREE.DirectionalLight('#ffd2a0', 2.2);
    sun.position.set(-30, 18, -40);
    sun.castShadow = true;
    scene.add(sun);
  }
  const floor = await assets.textureSet(mode === 'shop' ? 'dark_wooden_planks' : 'cobblestone_floor_08');
  const fm = new THREE.MeshStandardMaterial({ map: floor.map, normalMap: floor.normalMap, roughness: 1 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), fm);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const gap = 0.25;
  const widths = items.map((i) => Math.max(i.size[0], i.size[2]));
  const total = widths.reduce((a, b) => a + b, 0) + gap * Math.max(0, items.length - 1);
  let x = -total / 2;
  let maxH = 0.2;
  const labels = document.getElementById('labels')!;
  for (const [n, it] of items.entries()) {
    const w = widths[n]!;
    const cx = x + w / 2;
    x += w + gap;
    maxH = Math.max(maxH, it.size[1]);
    const builder = kit[it.name];
    const tag = document.createElement('span');
    tag.textContent = builder ? it.name : `${it.name} (missing)`;
    labels.appendChild(tag);
    const wire = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(...it.size)), new THREE.LineBasicMaterial({ color: '#40ff80' }));
    wire.position.set(cx, it.size[1] / 2, 0);
    scene.add(wire);
    if (!builder) continue;
    const built = await builder(it.size, { quality: 'high', seed: n + 1, assets });
    if (state && built.setState) built.setState(state);
    built.object.position.set(cx, it.size[1] / 2, 0);
    built.object.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    scene.add(built.object);
  }
  // Frame the row.
  const span = Math.max(total, maxH * 1.6, 0.3);
  const dist = (span * 0.62) / Math.tan((camera.fov * Math.PI) / 360) + 0.2;
  const target = new THREE.Vector3(0, maxH * 0.45, 0);
  camera.position.set(target.x + Math.sin(yaw) * Math.cos(pitch) * dist, target.y + Math.sin(pitch) * dist, target.z + Math.cos(yaw) * Math.cos(pitch) * dist);
  camera.lookAt(target);
  renderer.render(scene, camera);
  await new Promise((r) => requestAnimationFrame(r));
  renderer.render(scene, camera);
  window.__kitReady = true;
}

main().catch((e: unknown) => {
  window.__kitError = String(e instanceof Error ? e.stack ?? e.message : e);
  window.__kitReady = true;
});
