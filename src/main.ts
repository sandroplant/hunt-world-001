// The application: wires data, rules, judge, renderer, camera, input, UI, audio and recorders together.
import * as THREE from 'three';
import { loadWorld, type World } from './game/world';
import { judge, type View } from './game/judge';
import {
  act as rulesAct, backOut as rulesBackOut, clearSave, createInitialState, defaultSettings, dive as rulesDive, hintTargets, load, memoryStore, progress,
  recordHiddenFound, recordSketchLocked, save, standAt as rulesStandAt, useHint, verbFor, type Store,
} from './game/rules';
import type { GameEvent, GameState, WorldObject } from './game/types';
import { angleBetween, anglesFromDir, dirFromAngles, length, sub, wrapDeg } from './game/geom';
import { PlaceScene, type Quality } from './render/scene';
import { Renderer, detectQuality } from './render/renderer';
import { DiveAnimator, type CamPose, type PortalGeometry } from './render/dive';
import { PortalRenderer, approachPose } from './render/portal';
import { ViewCamera, ZOOM_MAX, ZOOM_MIN } from './player/camera';
import { Input } from './player/input';
import { Hud } from './ui/hud';
import { Panels, drawLastPage } from './ui/panels';
import { Audio } from './audio/audio';
import { SketchRenderer } from './gen/sketch';
import { FrameRecorder, SessionLog } from './game/log';

export const LOOK_DEG_PER_PX = 0.18;
const RING_MS = 1000;
const LENS_ZOOM_FOR_DIVE = 1.5;
const IDLE_GLINT_MS = 45_000;

function localStore(): { store: Store; blocked: boolean } {
  try {
    const k = '__hunt_probe';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return { store: { get: (x) => localStorage.getItem(x), set: (x, v) => localStorage.setItem(x, v), remove: (x) => localStorage.removeItem(x) }, blocked: false };
  } catch {
    return { store: memoryStore(), blocked: true };
  }
}

export class App {
  readonly world: World;
  state: GameState;
  readonly renderer: Renderer;
  readonly camera = new ViewCamera();
  readonly input: Input;
  readonly hud: Hud;
  readonly panels: Panels;
  readonly audio = new Audio();
  readonly sketcher: SketchRenderer;
  readonly portalRenderer: PortalRenderer;
  readonly diveAnim = new DiveAnimator();
  readonly log = new SessionLog();
  readonly frames = new FrameRecorder();
  readonly ui: HTMLElement;
  readonly onFrame: Array<(now: number) => void> = [];
  readonly testMode: boolean;
  readonly perfMode: boolean;
  readonly debugMode: boolean;
  private readonly store: Store;
  private readonly storageBlocked: boolean;
  private scenes = new Map<string, PlaceScene>();
  private sketchImages = new Map<string, HTMLCanvasElement>();
  private heldSketch: string | null = null;
  private lensHeld = false;
  private baseZoom = 1;
  private ringStart: number | null = null;
  private alignedSince: number | null = null;
  private best: WorldObject | null = null;
  private lastLive = 0;
  private pointTarget: { kind: 'object' | 'pose'; id: string; until: number } | null = null;
  private started = false;
  private pendingEnd = false;
  private lastNow = 0;
  private lastInputAt = 0;
  private glinted = false;
  private hoverMark: string | null = null;
  private frameCount = 0;
  private afterDive: (() => void) | null = null;
  diving = false;

  constructor(canvas: HTMLCanvasElement, ui: HTMLElement) {
    const q = new URLSearchParams(location.search);
    this.testMode = q.get('test') === '1';
    this.perfMode = q.get('perf') === '1';
    this.debugMode = !__PLAYTEST__ && q.get('debug') === '1';
    this.ui = ui;
    this.world = loadWorld();
    const ls = localStore();
    this.store = ls.store;
    this.storageBlocked = ls.blocked;
    this.state = load(this.store, this.world) ?? createInitialState(this.world, defaultSettings());
    this.applyTextSize();
    this.renderer = new Renderer(canvas, this.quality());
    this.sketcher = new SketchRenderer(this.renderer.gl);
    this.portalRenderer = new PortalRenderer(this.renderer.gl, this.renderer.quality === 'high' ? 1024 : 640);
    this.hud = new Hud(ui, this.world);
    this.panels = new Panels(ui, this.world, {
      begin: () => this.begin(),
      restart: () => this.restart(),
      keepLooking: () => this.closePanel(),
      close: () => this.closePanel(),
      holdUp: (id) => this.holdUp(id),
      hint: (t, l) => this.hint(t, l),
      setSetting: (k, v) => this.setSetting(k, v),
      setSessionLog: (on) => (on ? this.log.start() : this.log.stop()),
      copySessionLog: async () => this.log.text(),
      copyPerf: async () => this.frames.text({ quality: this.renderer.quality, place: this.state.place, stats: this.renderer.stats() }),
      describe: () => this.describe(),
    });
    this.input = new Input(canvas, {
      look: (dx, dy) => this.look(dx, dy),
      turn: (y, p) => this.turn(y, p),
      zoomBy: (f) => this.zoomBy(f),
      lens: (held) => this.setLens(held),
      act: (x, y) => this.actAt(x, y),
      hover: (x, y) => this.hover(x, y),
      move: (dir) => this.moveToward(dir),
      enter: () => this.enter(),
      back: () => this.backOut(),
      book: () => this.toggle('book'),
      hints: () => this.toggle('hints'),
      describe: () => this.describe(),
      menu: () => this.toggle('menu'),
      anyInput: () => this.noteInput(),
    });
    const lensBtn = this.hud.buttons.lens;
    const down = (e: Event) => {
      e.preventDefault();
      this.noteInput();
      this.input.setLensButton(true);
    };
    const up = () => this.input.setLensButton(false);
    lensBtn.addEventListener('pointerdown', down);
    lensBtn.addEventListener('pointerup', up);
    lensBtn.addEventListener('pointercancel', up);
    lensBtn.addEventListener('pointerleave', up);
    lensBtn.addEventListener('keydown', (e) => { if (e.key === ' ') { e.preventDefault(); this.input.setLensButton(true); } });
    lensBtn.addEventListener('keyup', (e) => { if (e.key === ' ') this.input.setLensButton(false); });
    this.hud.buttons.back.addEventListener('click', () => this.backOut());
    this.hud.buttons.book.addEventListener('click', () => this.toggle('book'));
    this.hud.buttons.hints.addEventListener('click', () => this.toggle('hints'));
    this.hud.buttons.menu.addEventListener('click', () => this.toggle('menu'));
    window.addEventListener('resize', () => this.renderer.resize());
    window.addEventListener('beforeunload', () => this.log.record('quit', { place: this.state.place }));

    this.enterPlace(this.state.place, this.state.viewpoint, this.state.yaw, this.state.pitch, this.state.zoom);
    this.refreshHud();
    this.panels.renderTitle(!!load(this.store, this.world) && this.state.startedAt !== null, this.storageBlocked);
    this.panels.show('title');
    requestAnimationFrame((t) => this.loop(t));
  }

  // ---- setup helpers -----------------------------------------------------------------

  private quality(): Quality {
    return this.state.settings.quality === 'auto' ? detectQuality() : this.state.settings.quality;
  }

  private applyTextSize(): void {
    document.documentElement.classList.toggle('large-text', this.state.settings.largeText);
  }

  get sceneCount(): number {
    return this.scenes.size;
  }

  private scene(placeId: string): PlaceScene {
    let s = this.scenes.get(placeId);
    if (!s) {
      s = new PlaceScene(this.world, placeId, this.renderer.quality);
      this.scenes.set(placeId, s);
      s.applyState(this.state);
      const sk = this.world.sketchFor(placeId);
      if (sk && !this.sketchImages.has(sk.id)) {
        const pose = judge.sketchPose(sk.id);
        if (pose && placeId === pose.place) this.sketchImages.set(sk.id, this.sketcher.draw(s, pose));
      }
    }
    return s;
  }

  private get current(): PlaceScene {
    return this.scene(this.state.place);
  }

  /** The place a dive from `placeId` leads to, with its scene built so its portal can show it. */
  private nextOf(placeId: string): PlaceScene | null {
    const d = judge.diveTarget(placeId);
    return d ? this.scene(d.to) : null;
  }

  private enterPlace(placeId: string, viewpoint: string, yaw = 0, pitch = 0, zoom = 1): void {
    const place = this.world.places[placeId]!;
    this.scene(placeId);
    this.nextOf(placeId);
    this.camera.setPlace(place, viewpoint, yaw, pitch, zoom);
    this.baseZoom = this.camera.zoom;
    this.ringStart = null;
    this.alignedSince = null;
    this.heldSketch = null;
    this.hud.showCard(null);
    this.hud.setRing(0);
    this.frames.mark(`place:${placeId}`);
    this.glinted = false;
    this.lastInputAt = this.lastNow;
  }

  private eyePos(): [number, number, number] {
    const p = this.camera.camera.position;
    return [p.x, p.y, p.z];
  }

  private view(): View {
    return {
      place: this.state.place,
      viewpoint: this.state.viewpoint,
      pos: this.eyePos(),
      yaw: this.camera.yaw,
      pitch: this.camera.pitch,
      zoom: this.camera.zoom,
      pxPerDeg: this.camera.pxPerDeg(this.renderer.height, this.renderer.width / this.renderer.height),
    };
  }

  private commit(next: GameState, events: GameEvent[] = []): void {
    this.state = next;
    for (const s of this.scenes.values()) s.applyState(next);
    save(this.store, next);
    this.refreshHud();
    const captions = this.world.strings.captions as Record<string, string>;
    for (const e of events) {
      if (e.kind === 'sfx') {
        this.audio.play(e.id);
        if (captions[e.id]) this.hud.showCaption(captions[e.id]!);
      }
      if (e.kind === 'anim') this.current.wiggle(e.object, this.lastNow);
      if (e.kind === 'step') this.log.record('step', { id: e.id, place: this.state.place });
      if (e.kind === 'item') this.log.record(e.taken ? 'item_taken' : 'item_used', { item: e.item });
    }
  }

  private refreshHud(): void {
    this.hud.setRibbon(this.world, this.state);
    const items = this.world.strings.items as Record<string, string>;
    this.hud.setPocket(this.state.items.length ? this.state.items.map((i) => items[i] ?? i).join(', ') : null);
    this.hud.setOnboard(this.state.onboarded.drag, this.state.onboarded.lens);
    const canBack = this.state.stack.length > 0;
    this.hud.buttons.back.disabled = !canBack;
    this.hud.buttons.back.style.visibility = canBack ? 'visible' : 'hidden';
  }

  private noteInput(): void {
    this.audio.unlock();
    this.lastInputAt = this.lastNow;
    this.glinted = false;
  }

  // ---- flow ------------------------------------------------------------------------------

  begin(): void {
    this.started = true;
    if (this.state.startedAt === null) this.commit({ ...this.state, startedAt: Date.now() });
    this.panels.hide();
    this.log.record('start', { place: this.state.place });
    this.noteInput();
  }

  restart(): void {
    clearSave(this.store);
    const settings = this.state.settings;
    this.state = createInitialState(this.world, settings);
    for (const s of this.scenes.values()) s.dispose();
    this.scenes.clear();
    this.sketchImages.clear();
    this.enterPlace(this.state.place, this.state.viewpoint);
    this.commit(this.state);
    this.started = false;
    this.log.record('restart');
    this.panels.renderTitle(false, this.storageBlocked);
    this.panels.show('title');
  }

  private toggle(name: 'book' | 'hints' | 'menu'): void {
    if (!this.started || this.diving) return;
    if (this.panels.open === name || (name === 'menu' && this.panels.open && this.panels.open !== 'title' && this.panels.open !== 'end')) {
      this.closePanel();
      return;
    }
    if (this.panels.open === 'title' || this.panels.open === 'end') return;
    if (name === 'book') {
      this.panels.renderBook(this.state, this.sketchImages, this.heldSketch, drawLastPage(this.state.ended));
      this.log.record('sketchbook_open');
    } else if (name === 'hints') this.panels.renderHints(this.state, hintTargets(this.world, this.state));
    else this.panels.renderMenu(this.state, this.log.on, this.perfMode, this.storageBlocked);
    this.panels.show(name);
  }

  closePanel(): void {
    this.panels.hide();
  }

  private setSetting(key: 'reducedMotion' | 'largeText' | 'quality', value: boolean | 'auto' | 'high' | 'low'): void {
    const next = { ...this.state, settings: { ...this.state.settings, [key]: value } };
    const oldQ = this.renderer.quality;
    this.state = next;
    this.applyTextSize();
    const newQ = this.quality();
    if (newQ !== oldQ) {
      this.renderer.setQuality(newQ);
      for (const s of this.scenes.values()) s.dispose();
      this.scenes.clear();
      this.sketchImages.clear();
      this.enterPlace(this.state.place, this.state.viewpoint, this.camera.yaw, this.camera.pitch, this.camera.zoom);
    }
    this.commit(next);
  }

  describe(): void {
    if (!this.started) return;
    const place = this.world.places[this.state.place]!;
    const vp = place.viewpoints[this.state.viewpoint]!;
    const forward = dirFromAngles(0, this.camera.yaw, this.camera.pitch);
    const eye = this.eyePos();
    const landmarks = place.landmarks.filter((l) => angleBetween(forward, dirFromAngles(0, l.at[1], l.at[2])) < 70).map((l) => l.text);
    const nearby: string[] = [];
    for (const o of this.world.objectsIn(this.state.place)) {
      if (o.kind === 'hidden' && !this.state.found[o.id]) continue; // never reveal hidden things
      const v = verbFor(this.world, o, this.state, this.world.strings.verbs.lookCloser, this.world.strings.verbs.standHere);
      if (!v) continue;
      const d = sub(o.pos, eye);
      if (o.kind !== 'stand' && o.kind !== 'hidden' && length(d) > place.reach) continue;
      if (angleBetween(forward, d) > 70) continue;
      nearby.push(`${o.label} (${v})`);
    }
    const items = this.world.strings.items as Record<string, string>;
    this.panels.renderDescribe(vp.describe, landmarks, nearby, this.state.items.map((i) => items[i] ?? i));
    this.panels.show('describe');
    this.log.record('describe');
  }

  holdUp(id: string | null): void {
    this.heldSketch = id;
    this.hud.showCard(id ? (this.sketchImages.get(id) ?? null) : null);
    this.alignedSince = null;
    if (id) this.log.record('hold_up', { sketch: id });
    this.closePanel();
  }

  private hint(target: string, level: number): void {
    this.commit(useHint(this.state, target, level));
    this.log.record('hint', { target, level, place: this.state.place });
    const lv = this.world.hints[target]?.[level - 1];
    if (lv && typeof lv === 'object') {
      this.pointTarget = 'point' in lv ? { kind: 'object', id: lv.point, until: this.lastNow + 12_000 } : { kind: 'pose', id: lv.pose, until: this.lastNow + 12_000 };
      this.closePanel();
    } else {
      this.panels.renderHints(this.state, hintTargets(this.world, this.state));
    }
  }

  // ---- input handlers ---------------------------------------------------------------------

  private get busy(): boolean {
    return !this.started || this.diving || this.panels.open !== null || this.camera.gliding;
  }

  private look(dxPx: number, dyPx: number): void {
    if (this.busy) return;
    const k = LOOK_DEG_PER_PX / this.camera.zoom;
    this.camera.look(dxPx * k, dyPx * k);
    if (!this.state.onboarded.drag && (Math.abs(dxPx) + Math.abs(dyPx)) > 2) this.commit({ ...this.state, onboarded: { ...this.state.onboarded, drag: true } });
  }

  private turn(dYawDeg: number, dPitchDeg: number): void {
    if (this.busy) return;
    this.camera.look(dYawDeg / this.camera.zoom, dPitchDeg / this.camera.zoom);
    if (!this.state.onboarded.drag) this.commit({ ...this.state, onboarded: { ...this.state.onboarded, drag: true } });
  }

  private zoomBy(factor: number): void {
    if (this.busy) return;
    this.camera.setZoom(this.camera.zoom * factor);
    this.baseZoom = this.camera.zoom;
    if (!this.state.onboarded.lens && this.camera.zoom > 1.2) this.commit({ ...this.state, onboarded: { ...this.state.onboarded, lens: true } });
  }

  private updateLensZoom(dt: number): void {
    if (this.busy) return;
    if (this.lensHeld) {
      if (this.camera.zoom < ZOOM_MAX) this.camera.setZoom(Math.min(ZOOM_MAX, this.camera.zoom * Math.exp(2.0 * dt)));
    } else if (this.camera.zoom > this.baseZoom + 0.001) {
      this.camera.setZoom(Math.max(this.baseZoom, this.camera.zoom * Math.exp(-4.0 * dt)));
    }
  }

  setLens(held: boolean): void {
    this.lensHeld = held;
    this.hud.setLensHeld(held);
    if (held && !this.state.onboarded.lens) this.commit({ ...this.state, onboarded: { ...this.state.onboarded, lens: true } });
  }

  /** Move to a stand spot. The view direction is kept; the glide runs at the place's fixed speed. */
  standAt(viewpoint: string): void {
    if (this.diving || !this.started) return;
    const next = rulesStandAt(this.world, this.state, viewpoint);
    if (next === this.state) return;
    next.yaw = this.camera.yaw;
    next.pitch = this.camera.pitch;
    this.commit(next);
    this.camera.glideTo(viewpoint, this.lastNow);
    this.baseZoom = 1;
    this.audio.play('stand');
    this.heldSketch = null;
    this.hud.showCard(null);
    this.current.setMarkHighlight(null);
    this.log.record('stand', { place: this.state.place, viewpoint });
  }

  /** The stand mark under a screen position, if any. */
  private markAt(x: number, y: number): WorldObject | null {
    const ndc = new THREE.Vector2((x / this.renderer.width) * 2 - 1, -(y / this.renderer.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, this.camera.camera);
    const marks = [...this.current.objects.entries()].filter(([, m]) => m.userData.stand && m.visible).map(([, m]) => m);
    const hits = ray.intersectObjects(marks, false);
    const hit = hits[0];
    if (!hit) return null;
    return this.world.objects[hit.object.name] ?? null;
  }

  private hover(x: number, y: number): void {
    if (this.busy) {
      this.hoverMark = null;
      return;
    }
    this.hoverMark = this.markAt(x, y)?.id ?? null;
  }

  /** W, A, S, D: the nearest spot in that direction relative to the view. */
  moveToward(dir: 'forward' | 'back' | 'left' | 'right'): void {
    if (this.busy) return;
    const yawOffset = { forward: 0, back: 180, left: 90, right: -90 }[dir];
    const want = dirFromAngles(0, this.camera.yaw + yawOffset, 0);
    const eye = this.eyePos();
    let best: { id: string; score: number } | null = null;
    for (const o of this.world.objectsIn(this.state.place)) {
      if (o.kind !== 'stand' || !o.target || o.target === this.state.viewpoint) continue;
      const d: [number, number, number] = [o.pos[0] - eye[0], 0, o.pos[2] - eye[2]];
      const dist = length(d);
      if (dist < 1e-6) continue;
      const angle = angleBetween(want, d);
      if (angle > 65) continue;
      const score = angle / 65 + dist / (this.world.places[this.state.place]!.reach * 6);
      if (!best || score < best.score) best = { id: o.target, score };
    }
    if (best) this.standAt(best.id);
  }

  /** A tap or click: a stand mark under the pointer moves there; otherwise act on what the crosshair picked. */
  actAt(x: number, y: number): void {
    if (this.busy) return;
    const mark = this.markAt(x, y);
    if (mark?.target) {
      this.standAt(mark.target);
      return;
    }
    this.act();
  }

  act(): void {
    if (this.busy || !this.best) return;
    const obj = this.best;
    switch (obj.kind) {
      case 'stand':
        if (obj.target) this.standAt(obj.target);
        return;
      case 'dive':
        this.startDive();
        return;
      case 'hidden': {
        if (!judge.judgeHidden(obj.id, this.view())) return;
        this.commit(recordHiddenFound(this.state, obj.id), [{ kind: 'sfx', id: 'found' }]);
        const outlines = this.world.strings.outlines as Record<string, string>;
        this.hud.showToast(`Found: ${outlines[obj.id] ?? obj.label}`);
        this.log.record('find_hidden', { id: obj.id, place: this.state.place });
        return;
      }
      default: {
        const r = rulesAct(this.world, this.state, obj.id);
        if (r.events.some((e) => e.kind === 'refused')) return;
        this.commit(r.state, r.events);
        if (r.events.some((e) => e.kind === 'step')) this.hud.showToast('Something changed.');
      }
    }
  }

  enter(): void {
    if (this.busy) return;
    if (this.best?.kind === 'dive') this.startDive();
    else this.act();
  }

  // ---- dives -----------------------------------------------------------------------------------

  private currentPose(): CamPose {
    return { pos: this.camera.camera.position.clone(), yaw: this.camera.yaw, pitch: this.camera.pitch, fov: this.camera.camera.fov };
  }

  private portalGeometry(scene: PlaceScene, to: string, targetObject: string | null): PortalGeometry | null {
    const p = scene.divePortal(to, targetObject);
    if (!p) return null;
    p.mesh.updateMatrixWorld(true);
    const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(p.mesh.getWorldQuaternion(new THREE.Quaternion())).normalize();
    return { center: p.mesh.getWorldPosition(new THREE.Vector3()), normal, width: p.width, height: p.height };
  }

  private normalFov(): number {
    return new ViewCamera().verticalFov(this.renderer.width / this.renderer.height);
  }

  private startDive(): void {
    if (this.diving) return;
    const d = rulesDive(this.world, this.state);
    if (!d) return;
    const from = this.current;
    const target = judge.diveTarget(this.state.place);
    const to = this.scene(d.to);
    const portal = this.portalGeometry(from, d.to, target?.object ?? null);
    if (!portal) return;
    const firstEnding = judge.isEnding(d.to) && !this.state.ended;
    const arrival = this.world.places[d.to]!.viewpoints[d.state.viewpoint]!;
    const approach = approachPose(to, portal.width / portal.height);
    // Make sure the opening shows the exact picture the hand-over will use.
    this.portalRenderer.render(to, approach);
    from.setPortalTexture(d.to, this.portalRenderer.texture);
    this.commit(d.state);
    this.diving = true;
    this.hud.setVerb(null);
    this.hud.setRing(0);
    this.ringStart = null;
    this.heldSketch = null;
    this.hud.showCard(null);
    this.audio.play('dive');
    this.hud.showCaption(this.world.strings.captions.dive);
    this.log.record('dive', { from: from.placeId, to: d.to });
    this.frames.mark('dive:start');
    this.diveAnim.begin({
      direction: 'in',
      from,
      to,
      portal,
      approach,
      start: this.currentPose(),
      end: { pos: new THREE.Vector3(...arrival.pos), yaw: 0, pitch: 0, fov: this.normalFov() },
      screenAspect: this.renderer.width / this.renderer.height,
      reducedMotion: this.state.settings.reducedMotion,
      startedAt: this.lastNow,
    });
    this.pendingEnd = firstEnding;
    this.afterDive = () => this.enterPlace(d.to, d.state.viewpoint, 0, 0, 1);
  }

  backOut(): void {
    if (this.busy) return;
    const b = rulesBackOut(this.state);
    if (!b) return;
    const from = this.current;
    const parent = this.scene(b.to);
    const diveObj = judge.diveTarget(b.to);
    const portal = this.portalGeometry(parent, this.state.place, diveObj?.object ?? null);
    if (!portal) return;
    const place = this.world.places[b.to]!;
    const vp = place.viewpoints[b.state.viewpoint]!;
    const look = anglesFromDir(sub([portal.center.x, portal.center.y, portal.center.z], vp.pos), 0);
    const approach = approachPose(from, portal.width / portal.height);
    this.commit(b.state);
    this.diving = true;
    this.hud.setVerb(null);
    this.hud.setRing(0);
    this.heldSketch = null;
    this.hud.showCard(null);
    this.audio.play('back');
    this.hud.showCaption(this.world.strings.captions.back);
    this.log.record('back_out', { from: from.placeId, to: b.to });
    this.frames.mark('back:start');
    this.diveAnim.begin({
      direction: 'out',
      from,
      to: parent,
      portal,
      approach,
      start: this.currentPose(),
      end: { pos: new THREE.Vector3(...vp.pos), yaw: look.yaw, pitch: look.pitch, fov: this.normalFov() },
      screenAspect: this.renderer.width / this.renderer.height,
      reducedMotion: this.state.settings.reducedMotion,
      startedAt: this.lastNow,
    });
    this.afterDive = () => this.enterPlace(b.to, b.state.viewpoint, look.yaw, look.pitch, 1);
  }

  private finishDive(): void {
    this.diving = false;
    this.afterDive?.();
    this.afterDive = null;
    this.frames.mark('dive:end');
    this.hud.setFade(false, true);
    this.current.applyState(this.state);
    if (this.pendingEnd) {
      this.pendingEnd = false;
      this.showEnding();
    }
  }

  private showEnding(): void {
    const ms = (this.state.endedAt ?? Date.now()) - (this.state.startedAt ?? Date.now());
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    const p = progress(this.world, this.state);
    this.log.record('finish', { ms, finds: p.finds, hints: this.state.hintCount });
    this.panels.renderEnd({ time: `${min} min ${sec} s`, finds: `${p.finds} of ${p.total}`, hints: String(this.state.hintCount) }, drawLastPage(true));
    this.panels.show('end');
  }

  // ---- per-frame ------------------------------------------------------------------------------

  /** Keep the openings showing the next place live. Cheap: one small render, skipped on alternate frames on Low. */
  private updatePortals(): void {
    const scene = this.current;
    if (!scene.portals.some((p) => p.mesh.visible)) return;
    if (this.renderer.quality === 'low' && this.frameCount % 2 === 1) return;
    const groups = new Set(scene.portals.filter((p) => p.mesh.visible).map((p) => p.to));
    for (const to of groups) {
      const next = this.scene(to);
      const first = scene.portals.find((p) => p.to === to)!;
      this.portalRenderer.render(next, approachPose(next, first.width / first.height));
      scene.setPortalTexture(to, this.portalRenderer.texture);
    }
  }

  private pick(): void {
    const place = this.world.places[this.state.place]!;
    const forward = dirFromAngles(0, this.camera.yaw, this.camera.pitch);
    const camPos = this.camera.camera.position;
    const pxPerDeg = this.camera.pxPerDeg(this.renderer.height, this.renderer.width / this.renderer.height);
    const minTol = 22 / pxPerDeg;
    const view = this.view();
    let best: WorldObject | null = null;
    let bestVerb: string | null = null;
    let bestScore = Infinity;
    const scene = this.current;
    for (const o of this.world.objectsIn(this.state.place)) {
      const mesh = scene.objects.get(o.id);
      if (!mesh || !mesh.visible) continue;
      const verb = verbFor(this.world, o, this.state, this.world.strings.verbs.lookCloser, this.world.strings.verbs.standHere);
      if (!verb) continue;
      const d: [number, number, number] = [mesh.position.x - camPos.x, mesh.position.y - camPos.y, mesh.position.z - camPos.z];
      const dist = length(d);
      if ((o.kind === 'usable' || o.kind === 'dive') && dist > place.reach) continue;
      const angle = angleBetween(forward, d);
      const radiusDeg = (Math.atan((Math.max(o.size[0], o.size[1], o.size[2]) / 2) / Math.max(dist, 1e-6)) * 180) / Math.PI;
      const tol = Math.max(Math.min(radiusDeg, 12), minTol);
      if (angle > tol) continue;
      const score = angle / tol;
      if (score >= bestScore) continue;
      if (o.kind === 'hidden' && !judge.judgeHidden(o.id, view)) continue;
      best = o;
      bestVerb = verb;
      bestScore = score;
    }
    this.best = best;
    this.hud.setVerb(bestVerb, best?.kind === 'dive');
    scene.setMarkHighlight(best?.kind === 'stand' ? best.id : this.hoverMark);
  }

  private updateRing(now: number): void {
    const wantsDive = this.best?.kind === 'dive' && (this.lensHeld || this.camera.zoom >= LENS_ZOOM_FOR_DIVE);
    if (!wantsDive) {
      this.ringStart = null;
      this.hud.setRing(0);
      return;
    }
    if (this.ringStart === null) this.ringStart = now;
    const fill = Math.min(1, (now - this.ringStart) / RING_MS);
    this.hud.setRing(fill);
    if (fill >= 1) this.startDive();
  }

  private updateSketch(now: number): void {
    if (!this.heldSketch) return;
    if (this.ringStart !== null) {
      this.alignedSince = null;
      return; // the dive ring has priority over a sketch lock
    }
    const id = this.heldSketch;
    const v = judge.judgeSketch(id, this.view());
    this.hud.setLive(v.warm);
    if (v.warm > 0 && now - this.lastLive > 150) {
      this.lastLive = now;
      this.sketcher.draw(this.current, { viewpoint: this.state.viewpoint, yaw: this.camera.yaw, pitch: this.camera.pitch, zoom: this.camera.zoom }, 160, 120, this.hud.cardLive, v.warm);
    }
    if (v.aligned) {
      this.alignedSince ??= now;
      if (now - this.alignedSince >= v.holdMs) this.lockSketch(id);
    } else {
      this.alignedSince = null;
    }
  }

  private lockSketch(id: string): void {
    const img = this.sketchImages.get(id);
    this.commit(recordSketchLocked(this.state, id), [{ kind: 'sfx', id: 'lock' }]);
    if (img) this.hud.lockEffect(img);
    this.hud.showToast('Sketch found.');
    this.heldSketch = null;
    this.hud.showCard(null);
    this.alignedSince = null;
    this.log.record('find_sketch', { id, place: this.state.place });
  }

  /** After 45 s without input, the most useful next thing glints once (founder change 4). No text. */
  private updateIdleGlint(now: number): void {
    if (this.glinted || now - this.lastInputAt < IDLE_GLINT_MS) return;
    this.glinted = true;
    const target = hintTargets(this.world, this.state)[0];
    if (!target) return;
    let objectId: string | null = null;
    let viewpoint: string | null = null;
    if (target.startsWith('dive:')) {
      const d = judge.diveTarget(this.state.place);
      objectId = d?.object ?? null;
    } else if (/^S\d$/.test(target)) {
      viewpoint = judge.sketchPose(target)?.viewpoint ?? null;
    } else if (this.world.objects[target]) {
      objectId = target;
    } else {
      const obj = Object.values(this.world.objects).find((o) => o.transitions.some((t) => (t.effects ?? []).some((e) => e.type === 'step' && e.id === target)));
      objectId = obj?.id ?? null;
    }
    if (objectId) {
      const obj = this.world.objects[objectId]!;
      const reach = this.world.places[this.state.place]!.reach;
      const inReach = length(sub(obj.pos, this.eyePos())) <= reach || obj.kind === 'hidden';
      if (!inReach && obj.home && obj.home !== this.state.viewpoint) viewpoint = obj.home;
      else {
        this.current.glint(objectId, now);
        this.log.record('glint', { target: objectId });
        return;
      }
    }
    if (viewpoint && viewpoint !== this.state.viewpoint) {
      this.current.glint(`${this.state.place}.stand_${viewpoint}`, now);
      this.log.record('glint', { target: `stand_${viewpoint}` });
    }
  }

  private updatePointer(now: number): void {
    if (!this.pointTarget || now > this.pointTarget.until) {
      if (this.pointTarget) this.pointTarget = null;
      this.hud.pointAt(null, 0, 0);
      return;
    }
    const t = this.pointTarget;
    let pos: THREE.Vector3 | null = null;
    if (t.kind === 'object') {
      pos = this.current.worldPosition(t.id);
      const obj = this.world.objects[t.id];
      if (obj && obj.place !== this.world.baseOf(this.state.place) && obj.place !== this.state.place) pos = null;
    } else {
      const pose = judge.sketchPose(t.id);
      if (pose && pose.place === this.world.baseOf(this.state.place)) {
        const place = this.world.places[this.state.place]!;
        if (pose.viewpoint === this.state.viewpoint) {
          const vp = place.viewpoints[pose.viewpoint]!;
          const d = dirFromAngles(0, pose.yaw, pose.pitch);
          pos = new THREE.Vector3(vp.pos[0] + d[0] * 10, vp.pos[1] + d[1] * 10, vp.pos[2] + d[2] * 10);
        } else {
          pos = this.current.worldPosition(`${this.state.place}.stand_${pose.viewpoint}`);
        }
      }
    }
    if (!pos) {
      this.hud.pointAt(null, 0, 0);
      return;
    }
    const ndc = pos.clone().project(this.camera.camera);
    const camDir = new THREE.Vector3();
    this.camera.camera.getWorldDirection(camDir);
    const behind = pos.clone().sub(this.camera.camera.position).dot(camDir) < 0;
    this.hud.pointAt({ x: ndc.x, y: ndc.y, behind }, this.renderer.width, this.renderer.height);
  }

  private loop(now: number): void {
    const dt = this.lastNow ? Math.min(0.1, (now - this.lastNow) / 1000) : 0;
    this.lastNow = now;
    this.frameCount++;
    if (this.perfMode) this.frames.tick(now);
    const aspect = this.renderer.width / this.renderer.height;
    if (this.diving) {
      const p = this.diveAnim.plan;
      // Keep the opening's picture fresh until the hand-over, so the two frames match.
      if (p && !this.diveAnim.handedOver) {
        const nested = p.direction === 'in' ? p.to : p.from;
        const outer = p.direction === 'in' ? p.from : p.to;
        this.portalRenderer.render(nested, p.approach);
        outer.setPortalTexture(nested.placeId, this.portalRenderer.texture);
      }
      const r = this.diveAnim.step(now);
      if (r) {
        this.hud.setFade(r.fade > 0.5, true);
        this.renderer.render(r.scene, r.camera);
        if (r.done) this.finishDive();
      } else {
        this.finishDive();
      }
    } else {
      if (!this.busy) this.input.update(dt);
      this.updateLensZoom(dt);
      this.camera.update(now, aspect);
      this.current.update(now, dt, this.testMode);
      if (this.started && !this.busy) {
        this.pick();
        this.updateRing(now);
        this.updateSketch(now);
        this.updateIdleGlint(now);
      } else {
        this.best = null;
        this.hud.setVerb(null);
        this.hud.setRing(0);
        this.ringStart = null;
      }
      this.updatePointer(now);
      this.updatePortals();
      this.renderer.render(this.current.scene, this.camera.camera);
    }
    for (const f of this.onFrame) f(now);
    requestAnimationFrame((t) => this.loop(t));
  }

  // ---- debug (dev builds only; the playtest build never reaches these) --------------------

  debugSetView(yaw: number, pitch: number, zoom: number): void {
    if (__PLAYTEST__) return;
    this.camera.setView(yaw, pitch);
    this.camera.setZoom(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom)));
    this.baseZoom = this.camera.zoom;
  }

  /** Jump to a place by replaying the required steps through the rules engine (no hard-coded route). */
  debugJump(placeId: string): void {
    if (__PLAYTEST__) return;
    if (this.diving) return;
    const idx = this.world.order.indexOf(placeId);
    if (idx < 0) return;
    let s = createInitialState(this.world, this.state.settings);
    s.startedAt = this.state.startedAt ?? Date.now();
    for (let i = 0; i < idx; i++) {
      s = this.replayPlace(s);
      const d = rulesDive(this.world, s);
      if (!d) throw new Error(`debug jump: cannot dive from ${s.place}`);
      s = d.state;
    }
    this.commit(s);
    this.enterPlace(s.place, s.viewpoint);
    this.started = true;
    this.panels.hide();
    if (judge.isEnding(placeId)) this.showEnding();
  }

  private replayPlace(s: GameState): GameState {
    if (__PLAYTEST__) return s;
    for (const step of judge.requiredSteps(s.place)) {
      if (!s.steps[step]) s = this.replayOneStep(s, step);
    }
    return s;
  }

  private replayOneStep(s: GameState, step: string): GameState {
    if (__PLAYTEST__) return s;
    const obj = Object.values(this.world.objects).find((o) => o.transitions.some((t) => (t.effects ?? []).some((e) => e.type === 'step' && e.id === step)));
    if (!obj) throw new Error(`no object emits ${step}`);
    s = rulesStandAt(this.world, s, obj.home ?? this.world.places[s.place]!.arrive);
    const r = rulesAct(this.world, s, obj.id);
    if (r.events.some((e) => e.kind === 'refused')) throw new Error(`step ${step} refused`);
    return r.state;
  }

  /** Do exactly one required step of the current place, or dive when the place is complete. */
  debugNextStep(): void {
    if (__PLAYTEST__) return;
    if (this.diving) return;
    const next = judge.requiredSteps(this.state.place).find((st) => !this.state.steps[st]);
    if (next) {
      const s = this.replayOneStep(this.state, next);
      this.commit(s);
      if (s.viewpoint !== this.camera.viewpoint) this.camera.setPlace(this.world.places[s.place]!, s.viewpoint, this.camera.yaw, this.camera.pitch);
    } else {
      this.startDive();
    }
  }

  debugHit(ndcX: number, ndcY: number): string[] {
    if (__PLAYTEST__) return [];
    const ray = new THREE.Raycaster();
    const plan = this.diveAnim.plan;
    const cam = plan ? (this.diveAnim.handedOver ? this.diveAnim.camB : this.diveAnim.camA) : this.camera.camera;
    const scene = plan ? (this.diveAnim.handedOver ? plan.to : plan.from) : this.current;
    ray.setFromCamera(new THREE.Vector2(ndcX, ndcY), cam);
    const pos = `cam(${cam.position.x.toFixed(2)},${cam.position.y.toFixed(2)},${cam.position.z.toFixed(2)}) fov ${cam.fov.toFixed(1)}`;
    return [pos, ...ray.intersectObjects(scene.scene.children, true).slice(0, 4).map((h) => `${h.object.name || h.object.type}@${h.distance.toFixed(2)}`)];
  }

  debugSketch(yaw: number, pitch: number, zoom: number): string {
    if (__PLAYTEST__) return '';
    return this.sketcher.draw(this.current, { viewpoint: this.state.viewpoint, yaw, pitch, zoom }).toDataURL();
  }

  debugSketchImage(id: string): string | null {
    if (__PLAYTEST__) return null;
    return this.sketchImages.get(id)?.toDataURL() ?? null;
  }

  debugDisposeScenes(): void {
    if (__PLAYTEST__) return;
    for (const [id, s] of this.scenes) if (id !== this.state.place) { s.dispose(); this.scenes.delete(id); }
  }

  /** Freeze the running dive at a fraction of its length, or null to let it run (seam check). */
  debugFreezeDive(t: number | null): void {
    if (__PLAYTEST__) return;
    this.diveAnim.freezeAt = t;
  }

  /** Force the idle glint now (for tests). */
  debugGlint(): void {
    if (__PLAYTEST__) return;
    this.lastInputAt = this.lastNow - IDLE_GLINT_MS - 1;
    this.glinted = false;
  }
}

const canvas = document.getElementById('view') as HTMLCanvasElement;
const ui = document.getElementById('ui') as HTMLElement;
const app = new App(canvas, ui);
if (!__PLAYTEST__ && app.debugMode) {
  void import('./debug/debug').then((m) => m.installDebug(app));
}
void wrapDeg;
