// Builds one place as a Three.js scene from world data. Graybox: simple shapes, flat colours.
// The renderer never decides game outcomes; it only shows state.
import * as THREE from 'three';
import type { GameState, PropData, Shape, WorldObject } from '../game/types';
import type { World } from '../game/world';
import { rng } from '../game/geom';

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
  readonly portals: Array<{ mesh: THREE.Mesh; to: string; width: number; height: number; when?: { object: string; is: string } }> = [];
  private highlighted: string | null = null;
  private glints: Array<{ mesh: THREE.Mesh; start: number; baseScale: THREE.Vector3 }> = [];
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
    this.portals.push({ mesh, to: p.portal!, width: w, height: h, when: p.when });
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

  /** The opening used for the dive to `to`: the one tied to the dive target's state, else the first. */
  divePortal(to: string, targetObject: string | null): { mesh: THREE.Mesh; width: number; height: number } | null {
    const list = this.portals.filter((p) => p.to === to);
    return list.find((p) => p.when?.object === targetObject) ?? list[0] ?? null;
  }

  private addProp(p: PropData): void {
    if (p.portal) {
      this.addPortal(p);
      return;
    }
    const nightOverride = this.night ? p.night : undefined;
    const color = nightOverride?.color ?? p.color;
    const emissive = nightOverride?.emissive ?? p.emissive ?? false;
    const count = Math.max(1, p.count ?? 1);
    const dropForLow = this.quality === 'low' && count > 40 ? 0.5 : 1;
    const n = Math.max(1, Math.round(count * dropForLow));
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
      if (p.ambient) this.ambient.push({ mesh, kind: p.ambient, base: mesh.position.clone(), phase: 0, scale: p.size[1] });
      if (p.when) this.conditional.push({ mesh, when: p.when });
      return;
    }
    const inst = new THREE.InstancedMesh(geometry, material, n);
    inst.name = p.id;
    const rand = rng(p.seed ?? 1);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const pos = new THREE.Vector3();
    const spread = p.spread ?? [0, 0, 0];
    const baseRot = new THREE.Euler(
      (p.rot?.[0] ?? 0) * THREE.MathUtils.DEG2RAD,
      (p.rot?.[1] ?? 0) * THREE.MathUtils.DEG2RAD,
      (p.rot?.[2] ?? 0) * THREE.MathUtils.DEG2RAD,
    );
    const colorAttr = p.palette ? new THREE.Color() : null;
    for (let i = 0; i < n; i++) {
      pos.set(p.pos[0] + (rand() * 2 - 1) * spread[0], p.pos[1] + (rand() * 2 - 1) * spread[1], p.pos[2] + (rand() * 2 - 1) * spread[2]);
      const jitter = 0.7 + rand() * 0.6;
      s.set(p.size[0] * jitter, p.size[1] * (0.8 + rand() * 0.4), p.size[2] * jitter);
      q.setFromEuler(new THREE.Euler(baseRot.x, baseRot.y + rand() * 0.6 - 0.3, baseRot.z));
      m.compose(pos, q, s);
      inst.setMatrixAt(i, m);
      if (colorAttr && p.palette) inst.setColorAt(i, colorAttr.set(p.palette[Math.floor(rand() * p.palette.length)]!));
    }
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    this.root.add(inst);
    if (p.ambient) this.ambient.push({ mesh: inst, kind: p.ambient, base: inst.position.clone(), phase: rand() * 6, scale: p.size[1] });
  }

  private addObject(o: WorldObject): void {
    if (o.kind === 'stand') {
      // A faint ring on the ground. It brightens under the crosshair or the pointer (founder change 2).
      const r = o.size[0] / 2;
      const geometry = new THREE.RingGeometry(r * 0.72, r, 40);
      this.geometries.push(geometry);
      const material = new THREE.MeshBasicMaterial({ color: '#F1E6CF', transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false });
      this.materials.push(material);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = o.id;
      mesh.position.set(...o.pos);
      mesh.rotation.x = -Math.PI / 2;
      mesh.userData = { base: mesh.position.clone(), baseRot: mesh.rotation.clone(), baseScale: mesh.scale.clone(), baseColor: o.color, stand: true };
      this.root.add(mesh);
      this.objects.set(o.id, mesh);
      return;
    }
    const mesh = new THREE.Mesh(this.geometry(o.shape), this.material(o.color, false));
    mesh.name = o.id;
    mesh.position.set(...o.pos);
    mesh.scale.set(...o.size);
    if (o.rot) mesh.rotation.set(o.rot[0] * THREE.MathUtils.DEG2RAD, o.rot[1] * THREE.MathUtils.DEG2RAD, o.rot[2] * THREE.MathUtils.DEG2RAD);
    mesh.userData = { base: mesh.position.clone(), baseRot: mesh.rotation.clone(), baseScale: mesh.scale.clone(), baseColor: o.color };
    this.root.add(mesh);
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
      if (o.kind === 'stand') {
        mesh.visible = o.target !== state.viewpoint;
        continue;
      }
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

  /** Brighten one stand mark (under the crosshair or the pointer). */
  setMarkHighlight(objectId: string | null): void {
    if (this.highlighted === objectId) return;
    for (const id of [this.highlighted, objectId]) {
      if (!id) continue;
      const mesh = this.objects.get(id);
      if (!mesh || !mesh.userData.stand) continue;
      const on = id === objectId;
      (mesh.material as THREE.MeshBasicMaterial).opacity = on ? 0.95 : 0.3;
      mesh.scale.setScalar(on ? 1.18 : 1);
    }
    this.highlighted = objectId;
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
      const mat = g.mesh.material as THREE.MeshLambertMaterial & { emissive?: THREE.Color; opacity?: number };
      if (k >= 1) {
        g.mesh.scale.copy(g.baseScale);
        if (mat.emissive) mat.emissive.set('#000000');
        if (g.mesh.userData.stand) mat.opacity = this.highlighted === g.mesh.name ? 0.95 : 0.3;
        this.glints.splice(i, 1);
        continue;
      }
      const pulse = Math.sin(k * Math.PI);
      g.mesh.scale.copy(g.baseScale).multiplyScalar(1 + 0.35 * pulse);
      if (mat.emissive) mat.emissive.set('#FFE39A').multiplyScalar(0.7 * pulse);
      if (g.mesh.userData.stand) mat.opacity = 0.3 + 0.7 * pulse;
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
