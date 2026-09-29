// The rules engine. It reads world data and applies object transitions.
// It never decides whether something is found: it asks the judge.
import type { Condition, GameEvent, GameState, Settings, Transition, WorldObject } from './types';
import type { World } from './world';
import { judge } from './judge';

export const SAVE_VERSION = 1 as const;

export function defaultSettings(): Settings {
  return { reducedMotion: false, largeText: false, quality: 'auto' };
}

export function createInitialState(world: World, settings: Settings = defaultSettings()): GameState {
  const place = world.order[0]!;
  const objectStates: Record<string, string> = {};
  for (const o of Object.values(world.objects)) objectStates[o.id] = o.initial;
  return {
    version: SAVE_VERSION,
    place,
    viewpoint: world.places[place]!.arrive,
    stack: [],
    yaw: 0,
    pitch: 0,
    zoom: 1,
    steps: {},
    items: [],
    found: {},
    objectStates,
    hintsUsed: {},
    hintCount: 0,
    startedAt: null,
    playMs: 0,
    ended: false,
    endedAt: null,
    settings,
    onboarded: { drag: false, lens: false },
  };
}

export function cloneState(s: GameState): GameState {
  return JSON.parse(JSON.stringify(s)) as GameState;
}

function conditionHolds(c: Condition, state: GameState): boolean {
  if ('has_item' in c) return state.items.includes(c.has_item);
  if ('not_has_item' in c) return !state.items.includes(c.not_has_item);
  if ('step_done' in c) return !!state.steps[c.step_done];
  if ('step_not_done' in c) return !state.steps[c.step_not_done];
  if ('state' in c) return state.objectStates[c.state.object] === c.state.is;
  return false;
}

/** The transition an object offers right now, or null. Hidden objects and stand marks are handled by verbFor. */
export function availableTransition(obj: WorldObject, state: GameState): Transition | null {
  const cur = state.objectStates[obj.id] ?? obj.initial;
  for (const t of obj.transitions) {
    if (t.from !== cur) continue;
    if ((t.conditions ?? []).every((c) => conditionHolds(c, state))) return t;
  }
  return null;
}

/** The verb the UI may show for an object, given the state. Null means nothing to do. */
export function verbFor(world: World, obj: WorldObject, state: GameState, lookCloser: string, standHere: string): string | null {
  switch (obj.kind) {
    case 'hidden':
      return state.found[obj.id] ? null : (obj.verb ?? 'Look');
    case 'stand':
      return obj.target && obj.target !== state.viewpoint ? standHere : null;
    case 'dive': {
      const d = judge.canDive(state.place, state.steps);
      return d && d.object === obj.id ? lookCloser : null;
    }
    default: {
      const t = availableTransition(obj, state);
      if (!t) return null;
      // A transition that emits a required step is offered only when the judge allows that step.
      const step = (t.effects ?? []).find((e) => e.type === 'step');
      if (step && step.type === 'step' && !judge.stepAllowed(step.id, state.steps)) return null;
      return t.verb;
    }
  }
}

/** Apply an ordinary object's transition. Returns the new state and the events it produced. */
export function act(world: World, state: GameState, objectId: string): { state: GameState; events: GameEvent[] } {
  const obj = world.objects[objectId];
  const events: GameEvent[] = [];
  if (!obj || obj.kind !== 'usable') return { state, events: [{ kind: 'refused' }] };
  const t = availableTransition(obj, state);
  if (!t) return { state, events: [{ kind: 'refused' }] };
  const stepEffect = (t.effects ?? []).find((e) => e.type === 'step');
  if (stepEffect && stepEffect.type === 'step' && !judge.stepAllowed(stepEffect.id, state.steps)) {
    return { state, events: [{ kind: 'refused' }] };
  }
  const next = cloneState(state);
  next.objectStates[obj.id] = t.to;
  if (t.to !== t.from) events.push({ kind: 'state', object: obj.id, to: t.to });
  for (const e of t.effects ?? []) {
    switch (e.type) {
      case 'take_item':
        if (!next.items.includes(e.item)) next.items.push(e.item);
        events.push({ kind: 'item', item: e.item, taken: true });
        break;
      case 'consume_item':
        next.items = next.items.filter((i) => i !== e.item);
        events.push({ kind: 'item', item: e.item, taken: false });
        break;
      case 'step':
        next.steps[e.id] = true;
        events.push({ kind: 'step', id: e.id });
        break;
      case 'play_sfx':
        events.push({ kind: 'sfx', id: e.id });
        break;
      case 'anim':
        events.push({ kind: 'anim', object: obj.id, id: e.id });
        break;
      case 'change_state':
        next.objectStates[e.object] = e.to;
        events.push({ kind: 'state', object: e.object, to: e.to });
        break;
    }
  }
  return { state: next, events };
}

/** Record a hidden-object find. The caller must have asked the judge first. */
export function recordHiddenFound(state: GameState, objectId: string): GameState {
  if (state.found[objectId]) return state;
  const next = cloneState(state);
  next.found[objectId] = true;
  next.objectStates[objectId] = 'found';
  return next;
}

/** Record a sketch lock. The caller must have asked the judge first. */
export function recordSketchLocked(state: GameState, sketchId: string): GameState {
  if (state.found[sketchId]) return state;
  const next = cloneState(state);
  next.found[sketchId] = true;
  return next;
}

export function standAt(world: World, state: GameState, viewpoint: string): GameState {
  const place = world.places[state.place];
  if (!place || !place.viewpoints[viewpoint] || state.viewpoint === viewpoint) return state;
  const next = cloneState(state);
  next.viewpoint = viewpoint;
  next.yaw = 0;
  next.pitch = 0;
  return next;
}

/** Dive into the place's active target. Refused unless the judge says the target is active. */
export function dive(world: World, state: GameState): { state: GameState; to: string } | null {
  const d = judge.canDive(state.place, state.steps);
  if (!d || !world.places[d.to]) return null;
  const next = cloneState(state);
  next.stack.push({ place: state.place, viewpoint: state.viewpoint });
  next.place = d.to;
  next.viewpoint = world.places[d.to]!.arrive;
  next.yaw = 0;
  next.pitch = 0;
  next.zoom = 1;
  if (judge.isEnding(d.to) && !next.ended) {
    next.ended = true;
    next.endedAt = Date.now();
  }
  return { state: next, to: d.to };
}

export function backOut(state: GameState): { state: GameState; to: string } | null {
  const top = state.stack[state.stack.length - 1];
  if (!top) return null;
  const next = cloneState(state);
  next.stack.pop();
  next.place = top.place;
  next.viewpoint = top.viewpoint;
  next.yaw = 0;
  next.pitch = 0;
  next.zoom = 1;
  return { state: next, to: top.place };
}

export function useHint(state: GameState, target: string, level: number): GameState {
  const next = cloneState(state);
  const prev = next.hintsUsed[target] ?? 0;
  if (level > prev) {
    next.hintsUsed[target] = level;
    next.hintCount += level - prev;
  }
  return next;
}

/** Hint targets that make sense right now, in the order they should be offered. */
export function hintTargets(world: World, state: GameState): string[] {
  const out: string[] = [];
  const place = state.place;
  const next = judge.requiredSteps(place).find((s) => !state.steps[s]);
  if (next) out.push(next);
  else if (judge.canDive(place, state.steps)) out.push(`dive:${place}`);
  const sketch = world.sketchFor(place);
  if (sketch && !state.found[sketch.id]) out.push(sketch.id);
  for (const h of sketch?.hidden ?? []) if (!state.found[h]) out.push(h);
  return out.filter((t) => world.hints[t]);
}

/** Finds = sketches locked + hidden objects found + places whose required step is complete (spec §3: 24 in total). */
export function progress(world: World, state: GameState): { finds: number; total: number; steps: number; stepsTotal: number } {
  const sketches = world.sketches.length;
  const hidden = world.sketches.reduce((n, s) => n + s.hidden.length, 0);
  const placesWithSteps = judge.order().filter((p) => judge.requiredSteps(p).length > 0);
  const placesDone = placesWithSteps.filter((p) => judge.placeComplete(p, state.steps)).length;
  const stepsTotal = judge.allRequiredSteps().length;
  const steps = Object.keys(state.steps).length;
  const found = Object.keys(state.found).length;
  return { finds: found + placesDone, total: sketches + hidden + placesWithSteps.length, steps, stepsTotal };
}

// ---- Save and load -------------------------------------------------------------

export interface Store {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

export const SAVE_KEY = 'hunt-world-001.save';

export function memoryStore(): Store {
  const m = new Map<string, string>();
  return { get: (k) => m.get(k) ?? null, set: (k, v) => void m.set(k, v), remove: (k) => void m.delete(k) };
}

export function save(store: Store, state: GameState): boolean {
  try {
    store.set(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function load(store: Store, world: World): GameState | null {
  try {
    const raw = store.get(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GameState>;
    if (parsed.version !== SAVE_VERSION || !parsed.place || !world.places[parsed.place]) return null;
    const base = createInitialState(world, { ...defaultSettings(), ...(parsed.settings ?? {}) });
    return { ...base, ...parsed, objectStates: { ...base.objectStates, ...(parsed.objectStates ?? {}) } } as GameState;
  } catch {
    return null;
  }
}

export function clearSave(store: Store): void {
  try {
    store.remove(SAVE_KEY);
  } catch {
    /* storage blocked: nothing to clear */
  }
}
