// Builds one place as a Three.js scene from world data. Graybox: simple shapes, flat colours.
// The renderer never decides game outcomes; it only shows state.
import * as THREE from 'three';
import type { GameState, PropData, Shape, WorldObject } from '../game/types';
import type { World } from '../game/world';
import { propCount, propInstances } from '../game/props';

export type Quality = 'high' | 'low';

const unitGeometry: Record<Shape, () => THREE.BufferGeometry> = {
  box: () => new THREE.BoxGeometry(1, 1, 1),
  sphere: () => new THREE.SphereGeometry(0.5, 12, 8),
  cylinder: () => new THREE.CylinderGeometry(0.5, 0.5, 1, 12),
  cone: () => new THREE.ConeGeometry(0.5, 1, 10),
};

interface AmbientEntry {
  mesh: THREE.Object3D;
  kind: NonNullable<PropData['ambient']>;
  base: THREE.Vector3;
  phase: number;
  scale: number;
}

interface WiggleEntry {
  mesh: THREE.Object3D;
  until: number;
  base: THREE.Vector3;
}

export class PlaceScene {
  readonly scene = new THREE.Scene();
  readonly root = new THREE.Group();
  readonly objects = new Map<string, THREE.Mesh>();
  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.Material[] = [];
  private ambient: AmbientEntry[] = [];
  private wiggles: WiggleEntry[] = [];
  private lastStates = new Map<string, string>();
  private conditional: Array<{ mesh: THREE.Object3D; when: { object: string; is: string } }> = [];
  readonly portals: Array<{ mesh: THREE.Mesh; to: string; width: number; height: number; when?: { object: string; is: string }; glow?: THREE.Mesh }> = [];
  private glints: Array<{ mesh: THREE.Mesh; start: number; baseScale: THREE.Vector3 }> = [];
  /** Solid meshes for line-of-sight checks (everything except portals and glow rims). */
  readonly solids: THREE.Object3D[] = [];
  readonly night: boolean;

  constructor(readonly world: World, readonly placeId: string, readonly quality: Quality) {
    const place = world.places[placeId]!;
    this.night = !!place.night;
    this.scene.add(this.root);
    this.scene.background = new THREE.Color(place.sky);
    this.scene.fog = new THREE.Fog(place.fog[0], place.fog[1], place.fog[2]);
    const [keyColor, keyIntensity, ambColor, ambIntensity] = place.light;
    // Graybox lighting: one key, one fill, one back light and a hemisphere, all from the place's two colours.
    const key = new THREE.DirectionalLight(keyColor, keyIntensity * 1.8);
    key.position.set(1, 2, 1.2);
    this.scene.add(key);
    this.scene.add(new THREE.HemisphereLight(ambColor, place.ground, (ambIntensity + 0.35) * 1.6));
    const fill = new THREE.DirectionalLight(ambColor, keyIntensity * 0.9);
    fill.position.set(-1.2, 1.2, -0.8);
    this.scene.add(fill);
    const back = new THREE.DirectionalLight(ambColor, keyIntensity * 0.6);
    back.position.set(0.3, 0.6, 1.5);
    this.scene.add(back);
    for (const p of world.propsIn(placeId)) this.addProp(p);
    for (const o of world.objectsIn(placeId)) this.addObject(o);
  }

  private geometry(shape: Shape): THREE.BufferGeometry {
    const g = unitGeometry[shape]();
    this.geometries.push(g);
    return g;
  }

  private material(color: string, emissive = false): THREE.Material {
    // Emissive things (lamps, the moon, stars) ignore fog so they read from far away.
    const m = emissive ? new THREE.MeshBasicMaterial({ color, fog: false }) : new THREE.MeshLambertMaterial({ color });
    this.materials.push(m);
    return m;
  }

  private addPortal(p: PropData): void {
    const [w, h] = [p.size[0], p.size[1]];
    const geometry = new THREE.PlaneGeometry(w, h);
    this.geometries.push(geometry);
    const material = new THREE.MeshBasicMaterial({ color: '#0A0C14', fog: false });
    this.materials.push(material);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = p.id;
    mesh.position.set(...p.pos);
    if (p.normal) {
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...p.normal).normalize());
    } else {
      const face = this.world.places[this.placeId]!.viewpoints[p.face ?? 'A'];
      if (face) mesh.lookAt(new THREE.Vector3(...face.pos));
    }
    this.root.add(mesh);
    let glow: THREE.Mesh | undefined;
    if (p.glow) {
      // A soft amber rim just behind the opening: "you can go in" without words (founder, third round).
      const rimGeometry = new THREE.PlaneGeometry(w * 1.16, h * 1.16);
      this.geometries.push(rimGeometry);
      const rimMaterial = new THREE.MeshBasicMaterial({ color: '#F2B75B', fog: false, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending });
      this.materials.push(rimMaterial);
      glow = new THREE.Mesh(rimGeometry, rimMaterial);
      glow.name = `${p.id}_glow`;
      glow.position.copy(mesh.position).addScaledVector(new THREE.Vector3(0, 0, 1).applyQuaternion(mesh.quaternion), -Math.max(w, h) * 0.006);
      glow.quaternion.copy(mesh.quaternion);
      this.root.add(glow);
      if (p.when) this.conditional.push({ mesh: glow, when: p.when });
    }
    this.portals.push({ mesh, to: p.portal!, width: w, height: h, when: p.when, glow });
    if (p.when) this.conditional.push({ mesh, when: p.when });
  }

  /** Give a portal opening its live picture. */
  setPortalTexture(to: string, texture: THREE.Texture | null): void {
    for (const pt of this.portals) {
      if (pt.to !== to) continue;
      const m = pt.mesh.material as THREE.MeshBasicMaterial;
      if (m.map !== texture) {
        m.map = texture;
        m.color.set(texture ? '#FFFFFF' : '#0A0C14');
        m.needsUpdate = true;
      }
    }
  }

  /** The opening used for the dive to `to`: the one tied to the dive target's state, else the glowing one, else the first. */
  divePortal(to: string, targetObject: string | null): { mesh: THREE.Mesh; width: number; height: number } | null {
    const list = this.portals.filter((p) => p.to === to);
    return list.find((p) => p.when?.object === targetObject) ?? list.find((p) => p.glow) ?? list[0] ?? null;
  }

  private addProp(p: PropData): void {
    if (p.portal) {
      this.addPortal(p);
      return;
    }
    const nightOverride = this.night ? p.night : undefined;
    const color = nightOverride?.color ?? p.color;
    const emissive = nightOverride?.emissive ?? p.emissive ?? false;
    const n = propCount(p, this.quality);
    let geometry: THREE.BufferGeometry;
    if (p.ring) {
      geometry = new THREE.TorusGeometry(p.size[0] / 2, p.size[1], 6, 48);
      this.geometries.push(geometry);
    } else {
      geometry = this.geometry(p.shape);
    }
    const material = this.material(color, emissive);
    if (n === 1) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...p.pos);
      if (p.ring) mesh.rotation.x = Math.PI / 2;
      else mesh.scale.set(...p.size);
      if (p.rot) mesh.rotation.set(p.rot[0] * THREE.MathUtils.DEG2RAD, p.rot[1] * THREE.MathUtils.DEG2RAD, p.rot[2] * THREE.MathUtils.DEG2RAD);
      mesh.name = p.id;
      this.root.add(mesh);
      this.solids.push(mesh);
      if (p.ambient) this.ambient.push({ mesh, kind: p.ambient, base: mesh.position.clone(), phase: 0, scale: p.size[1] });
      if (p.when) this.conditional.push({ mesh, when: p.when });
      return;
    }
    const inst = new THREE.InstancedMesh(geometry, material, n);
    inst.name = p.id;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const pos = new THREE.Vector3();
    const colorAttr = p.palette ? new THREE.Color() : null;
    const instances = propInstances(p, this.quality);
    for (let i = 0; i < n; i++) {
      const it = instances[i]!;
      pos.set(...it.pos);
      s.set(...it.size);
      q.setFromEuler(new THREE.Euler(it.rot[0] * THREE.MathUtils.DEG2RAD, it.rot[1] * THREE.MathUtils.DEG2RAD, it.rot[2] * THREE.MathUtils.DEG2RAD));
      m.compose(pos, q, s);
      inst.setMatrixAt(i, m);
      if (colorAttr && p.palette) inst.setColorAt(i, colorAttr.set(p.palette[it.paletteIndex]!));
    }
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    this.root.add(inst);
    this.solids.push(inst);
    if (p.ambient) this.ambient.push({ mesh: inst, kind: p.ambient, base: inst.position.clone(), phase: (p.seed ?? 1) % 6, scale: p.size[1] });
  }

  private addObject(o: WorldObject): void {
    const mesh = new THREE.Mesh(this.geometry(o.shape), this.material(o.color, false));
    mesh.name = o.id;
    mesh.position.set(...o.pos);
    mesh.scale.set(...o.size);
    if (o.rot) mesh.rotation.set(o.rot[0] * THREE.MathUtils.DEG2RAD, o.rot[1] * THREE.MathUtils.DEG2RAD, o.rot[2] * THREE.MathUtils.DEG2RAD);
    mesh.userData = { base: mesh.position.clone(), baseRot: mesh.rotation.clone(), baseScale: mesh.scale.clone(), baseColor: o.color };
    this.root.add(mesh);
    this.solids.push(mesh);
    this.objects.set(o.id, mesh);
  }

  /** Show the state of every object in this place. Cheap; call after any state change. */
  applyState(state: GameState): void {
    for (const c of this.conditional) {
      const cur = state.objectStates[c.when.object] ?? this.world.objects[c.when.object]?.initial;
      c.mesh.visible = cur === c.when.is;
    }
    for (const [id, mesh] of this.objects) {
      const o = this.world.objects[id]!;
      const s = o.kind === 'hidden' ? (state.found[id] ? 'found' : 'unfound') : (state.objectStates[id] ?? o.initial);
      if (this.lastStates.get(id) === s) continue;
      this.lastStates.set(id, s);
      const v = o.visual?.[s];
      const base = mesh.userData.base as THREE.Vector3;
      const baseRot = mesh.userData.baseRot as THREE.Euler;
      const baseScale = mesh.userData.baseScale as THREE.Vector3;
      mesh.visible = !v?.hidden;
      mesh.position.copy(base);
      if (v?.offset) mesh.position.add(new THREE.Vector3(...v.offset));
      mesh.rotation.copy(baseRot);
      if (v?.rot) mesh.rotation.set(baseRot.x + v.rot[0] * THREE.MathUtils.DEG2RAD, baseRot.y + v.rot[1] * THREE.MathUtils.DEG2RAD, baseRot.z + v.rot[2] * THREE.MathUtils.DEG2RAD);
      mesh.scale.copy(baseScale);
      if (v?.scale) mesh.scale.multiply(new THREE.Vector3(...v.scale));
      (mesh.material as THREE.MeshLambertMaterial).color.set(v?.color ?? (mesh.userData.baseColor as string));
      // Toggled ordinary things show their second state as a small turn and a lighter colour.
      if (!v && o.states.length === 2 && s === o.states[1] && o.kind === 'usable') {
        mesh.rotation.y = baseRot.y + 0.5;
        (mesh.material as THREE.MeshLambertMaterial).color.set(o.color).offsetHSL(0, 0, 0.12);
      }
      // A found hidden object brightens so the player sees the reward.
      if (o.kind === 'hidden' && s === 'found') (mesh.material as THREE.MeshLambertMaterial).color.set('#FFF4C2');
      mesh.userData.stateBase = mesh.position.clone();
    }
  }

  /** One short glint on a thing (founder change 4). No text. */
  glint(objectId: string, now: number): void {
    const mesh = this.objects.get(objectId);
    if (!mesh) return;
    this.glints.push({ mesh, start: now, baseScale: mesh.scale.clone() });
  }

  wiggle(objectId: string, now: number): void {
    const mesh = this.objects.get(objectId);
    if (!mesh) return;
    this.wiggles.push({ mesh, until: now + 350, base: (mesh.userData.stateBase as THREE.Vector3 | undefined)?.clone() ?? mesh.position.clone() });
  }

  /**
   * True when some part of an object can be seen from an eye position: rays to its centre and to the corners of its
   * box, and at least one reaches it without meeting another solid first. So a hidden thing is never "found" through
   * a wall, while a marble half sunk in the floor still counts.
   */
  visibleFrom(objectId: string, eye: THREE.Vector3): boolean {
    const mesh = this.objects.get(objectId);
    if (!mesh) return false;
    mesh.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(mesh);
    const samples = [box.getCenter(new THREE.Vector3())];
    for (const sx of [0.1, 0.9]) for (const sy of [0.1, 0.9]) for (const sz of [0.1, 0.9]) {
      samples.push(new THREE.Vector3(box.min.x + (box.max.x - box.min.x) * sx, box.min.y + (box.max.y - box.min.y) * sy, box.min.z + (box.max.z - box.min.z) * sz));
    }
    const ray = new THREE.Raycaster();
    for (const target of samples) {
      const dir = target.clone().sub(eye);
      const dist = dir.length();
      if (dist < 1e-6) return true;
      ray.set(eye, dir.normalize());
      ray.far = dist;
      const first = ray.intersectObjects(this.solids, false).find((h) => h.object.visible);
      if (!first || first.object === mesh || first.distance >= dist - 1e-3) return true;
    }
    return false;
  }

  worldPosition(objectId: string): THREE.Vector3 | null {
    const mesh = this.objects.get(objectId);
    return mesh ? mesh.position.clone() : null;
  }

  /** Ambient motion. Paused entirely in test mode so screenshots are stable. */
  update(now: number, dt: number, paused: boolean): void {
    for (let i = this.wiggles.length - 1; i >= 0; i--) {
      const w = this.wiggles[i]!;
      if (now >= w.until) {
        w.mesh.position.copy(w.base);
        this.wiggles.splice(i, 1);
        continue;
      }
      const t = (w.until - now) / 350;
      const amp = 0.06 * Math.max(...(w.mesh.scale.toArray() as number[]));
      w.mesh.position.set(w.base.x + Math.sin(now * 0.05) * amp * t, w.base.y + Math.abs(Math.sin(now * 0.07)) * amp * t, w.base.z);
    }
    for (let i = this.glints.length - 1; i >= 0; i--) {
      const g = this.glints[i]!;
      const k = (now - g.start) / 900;
      const mat = g.mesh.material as THREE.MeshLambertMaterial & { emissive?: THREE.Color };
      if (k >= 1) {
        g.mesh.scale.copy(g.baseScale);
        if (mat.emissive) mat.emissive.set('#000000');
        this.glints.splice(i, 1);
        continue;
      }
      const pulse = Math.sin(k * Math.PI);
      g.mesh.scale.copy(g.baseScale).multiplyScalar(1 + 0.35 * pulse);
      if (mat.emissive) mat.emissive.set('#FFE39A').multiplyScalar(0.7 * pulse);
    }
    // The rims of the openings breathe slowly, even in test mode (a steady value there, so screenshots stay the same).
    for (const p of this.portals) {
      if (!p.glow) continue;
      (p.glow.material as THREE.MeshBasicMaterial).opacity = paused ? 0.4 : 0.28 + 0.2 * (0.5 + 0.5 * Math.sin(now / 700));
    }
    if (paused) return;
    const t = now / 1000;
    for (const a of this.ambient) {
      switch (a.kind) {
        case 'drift':
          a.mesh.position.set(a.base.x + Math.sin(t * 0.3 + a.phase) * 2, a.base.y + Math.sin(t * 0.7 + a.phase) * 0.6, a.base.z + Math.cos(t * 0.25 + a.phase) * 2);
          break;
        case 'sway':
          a.mesh.rotation.z = Math.sin(t * 0.8 + a.phase) * 0.03;
          break;
        case 'twinkle': {
          const s = 1 + Math.sin(t * 2.2 + a.phase) * 0.25;
          a.mesh.scale.setScalar(s);
          break;
        }
        case 'blink':
          a.mesh.visible = Math.sin(t * 1.5 + a.phase) > -0.3;
          break;
      }
    }
    void dt;
  }

  dispose(): void {
    for (const g of this.geometries) g.dispose();
    for (const m of this.materials) m.dispose();
    this.geometries = [];
    this.materials = [];
    this.objects.clear();
    this.scene.clear();
  }
}
