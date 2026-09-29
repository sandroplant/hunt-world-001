import { describe, expect, it } from 'vitest';
import { judge } from '../../src/game/judge';
import { loadWorld } from '../../src/game/world';
import { act, backOut, clearSave, createInitialState, dive, hintTargets, load, memoryStore, moveTo, progress, recordHiddenFound, recordSketchLocked, save, standAt, useHint, verbFor } from '../../src/game/rules';
import type { GameState } from '../../src/game/types';

const world = loadWorld();

/** Every object action available in the current place (the player can walk anywhere), plus dive and back-out. */
function moves(state: GameState): Array<{ name: string; apply: () => GameState }> {
  const out: Array<{ name: string; apply: () => GameState }> = [];
  for (const obj of world.objectsIn(state.place)) {
    if (obj.kind !== 'usable') continue;
    if (verbFor(world, obj, state, 'Look closer') === null) continue;
    out.push({ name: obj.id, apply: () => act(world, state, obj.id).state });
  }
  const d = dive(world, state);
  if (d) out.push({ name: `dive:${d.to}`, apply: () => d.state });
  const b = backOut(state);
  if (b) out.push({ name: `back:${b.to}`, apply: () => b.state });
  return out;
}

/** Progress-relevant signature: place, dive stack, required steps, items, and the states of objects that carry transitions with effects that matter. */
function key(state: GameState): string {
  const relevant = Object.entries(state.objectStates)
    .filter(([id]) => {
      const o = world.objects[id]!;
      return o.kind === 'dive' || o.transitions.some((t) => (t.effects ?? []).some((e) => e.type === 'step' || e.type === 'take_item' || e.type === 'change_state'));
    })
    .sort()
    .map(([id, s]) => `${id}=${s}`)
    .join(',');
  return [state.place, state.stack.map((s) => s.place).join('>'), Object.keys(state.steps).sort().join('+'), [...state.items].sort().join('+'), relevant].join('|');
}

describe('the chain', () => {
  it('the scripted route reaches the ending', () => {
    let s = createInitialState(world);
    const route: Array<['stand', string] | ['act', string] | ['dive']> = [
      ['stand', 'B'], ['dive'],
      ['act', 'shop.key'], ['stand', 'B'], ['act', 'shop.blue_drawer'], ['dive'],
      ['stand', 'B'], ['act', 'drawer.envelope'], ['act', 'drawer.feather'], ['act', 'drawer.cat_nose'], ['dive'],
      ['act', 'cat.ear'], ['dive'],
      ['act', 'eye.reflected_lamp'], ['stand', 'B'], ['dive'],
      ['act', 'moon.light'], ['stand', 'B'], ['act', 'moon.lamp'], ['dive'],
    ];
    for (const step of route) {
      if (step[0] === 'stand') s = standAt(world, s, step[1]);
      else if (step[0] === 'act') {
        const r = act(world, s, step[1]);
        expect(r.events.some((e) => e.kind === 'refused'), `${step[1]} refused`).toBe(false);
        s = r.state;
      } else {
        const d = dive(world, s);
        expect(d, `dive from ${s.place}`).not.toBeNull();
        s = d!.state;
      }
    }
    expect(s.place).toBe('street_night');
    expect(s.ended).toBe(true);
    expect(judge.isEnding(s.place)).toBe(true);
    expect(Object.keys(s.steps).length).toBe(judge.allRequiredSteps().length);
    expect(s.items).toEqual([]);
  });

  it('no dead ends: from every reachable state the ending can still be reached', () => {
    const start = createInitialState(world);
    const seen = new Map<string, GameState>();
    const queue: GameState[] = [start];
    seen.set(key(start), start);
    while (queue.length) {
      const s = queue.shift()!;
      for (const m of moves(s)) {
        const n = m.apply();
        const k = key(n);
        if (!seen.has(k)) {
          seen.set(k, n);
          queue.push(n);
        }
      }
    }
    expect(seen.size).toBeGreaterThan(20);
    expect(seen.size).toBeLessThan(20000);
    // Every state can reach an ended state.
    const endingKeys = new Set([...seen.entries()].filter(([, s]) => s.ended).map(([k]) => k));
    expect(endingKeys.size).toBeGreaterThan(0);
    // Reverse reachability: BFS backwards over the forward graph.
    const succ = new Map<string, Set<string>>();
    for (const [k, s] of seen) succ.set(k, new Set(moves(s).map((m) => key(m.apply()))));
    const canEnd = new Set(endingKeys);
    let grew = true;
    while (grew) {
      grew = false;
      for (const [k, next] of succ) {
        if (canEnd.has(k)) continue;
        for (const n of next) if (canEnd.has(n)) { canEnd.add(k); grew = true; break; }
      }
    }
    const stuck = [...seen.keys()].filter((k) => !canEnd.has(k));
    expect(stuck, `dead ends: ${stuck.slice(0, 3).join(' ; ')}`).toEqual([]);
  });

  it('the street is a teaching place: its dive is open from the start (founder, third round)', () => {
    const s = createInitialState(world);
    expect(judge.requiredSteps('street')).toEqual([]);
    expect(dive(world, s)?.to).toBe('shop');
    expect(verbFor(world, world.objects['street.doorway']!, s, 'Look closer')).toBe('Look closer');
  });

  it('required steps are refused out of order and cannot repeat (the key and the locked drawer, now in the shop)', () => {
    let s = dive(world, createInitialState(world))!.state;
    expect(s.place).toBe('shop');
    expect(verbFor(world, world.objects['shop.blue_drawer']!, s, 'Look closer')).toBe('Use');
    const rattled = act(world, s, 'shop.blue_drawer');
    expect(rattled.state.steps['unlock_blue_drawer']).toBeUndefined();
    expect(rattled.events.some((e) => e.kind === 'sfx' && e.id === 'rattle')).toBe(true);
    s = act(world, s, 'shop.key').state;
    expect(s.items).toEqual(['key']);
    expect(act(world, s, 'shop.key').events[0]).toEqual({ kind: 'refused' });
    expect(dive(world, s)).toBeNull();
    expect(verbFor(world, world.objects['shop.blue_drawer']!, s, 'Look closer')).toBe('Unlock');
    s = act(world, s, 'shop.blue_drawer').state;
    expect(s.steps['unlock_blue_drawer']).toBe(true);
    expect(s.items).toEqual([]);
    expect(dive(world, s)?.to).toBe('drawer');
  });

  it('back out returns to the position the player dived from, and found things stay found', () => {
    let s = createInitialState(world);
    s = moveTo(s, [-3.1, 1.6, -6.2]);
    s = recordHiddenFound(s, 'street.umbrella');
    s = recordSketchLocked(s, 'S1');
    const d = dive(world, s)!;
    expect(d.state.place).toBe('shop');
    expect(d.state.pos).toEqual(world.places['shop']!.viewpoints['A']!.pos);
    expect(d.state.dived['street']).toBe(true);
    const b = backOut(d.state)!;
    expect(b.state.place).toBe('street');
    expect(b.state.pos).toEqual([-3.1, 1.6, -6.2]);
    expect(b.state.found['street.umbrella']).toBe(true);
    expect(b.state.found['S1']).toBe(true);
    expect(b.state.dived['street']).toBe(true);
    expect(backOut(b.state)).toBeNull();
  });

  it('hidden objects and sketches never block progress', () => {
    // The scripted route above never records a hidden find or a sketch, and still ends. Also: no transition condition mentions them.
    for (const o of Object.values(world.objects)) {
      for (const t of o.transitions) {
        for (const c of t.conditions ?? []) {
          expect('state' in c && world.objects[c.state.object]?.kind === 'hidden').toBe(false);
        }
      }
    }
  });
});

describe('save, load and restart', () => {
  it('save then load keeps all state', () => {
    const store = memoryStore();
    let s = createInitialState(world);
    s = standAt(world, s, 'B');
    s = recordSketchLocked(s, 'S1');
    s = useHint(s, 'S1', 2);
    s.yaw = 12;
    s.zoom = 2.5;
    expect(save(store, s)).toBe(true);
    const back = load(store, world)!;
    expect(back).toEqual(s);
  });
  it('restart clears the save', () => {
    const store = memoryStore();
    save(store, createInitialState(world));
    clearSave(store);
    expect(load(store, world)).toBeNull();
  });
  it('a broken or foreign save is ignored', () => {
    const store = memoryStore();
    store.set('hunt-world-001.save', '{not json');
    expect(load(store, world)).toBeNull();
    store.set('hunt-world-001.save', JSON.stringify({ version: 99, place: 'street' }));
    expect(load(store, world)).toBeNull();
    store.set('hunt-world-001.save', JSON.stringify({ version: 1, place: 'street', viewpoint: 'B' })); // a save from before free walking
    expect(load(store, world)).toBeNull();
  });
  it('a blocked store is survived', () => {
    const blocked = { get: () => { throw new Error('blocked'); }, set: () => { throw new Error('blocked'); }, remove: () => { throw new Error('blocked'); } };
    expect(save(blocked, createInitialState(world))).toBe(false);
    expect(load(blocked, world)).toBeNull();
    expect(() => clearSave(blocked)).not.toThrow();
  });
});

describe('hints and progress', () => {
  it('offers the next required step, then the dive, plus the place sketch and its hidden objects', () => {
    let s = createInitialState(world);
    expect(hintTargets(world, s)).toEqual(['dive:street', 'S1', 'street.umbrella', 'street.ship_bottle']);
    s = dive(world, s)!.state;
    expect(hintTargets(world, s)[0]).toBe('take_key');
    s = act(world, s, 'shop.key').state;
    expect(hintTargets(world, s)[0]).toBe('unlock_blue_drawer');
    s = act(world, s, 'shop.blue_drawer').state;
    expect(hintTargets(world, s)[0]).toBe('dive:shop');
  });
  it('every required step, dive, sketch and hidden object has three hint levels', () => {
    for (const step of judge.allRequiredSteps()) expect(world.hints[step], step).toHaveLength(3);
    for (const p of judge.order()) if (judge.diveTarget(p)) expect(world.hints[`dive:${p}`], p).toHaveLength(3);
    for (const id of judge.sketchIds()) expect(world.hints[id], id).toHaveLength(3);
    for (const id of judge.hiddenIds()) expect(world.hints[id], id).toHaveLength(3);
    for (const [k, levels] of Object.entries(world.hints)) {
      expect(typeof levels[0], k).toBe('string');
      expect(typeof levels[1], k).toBe('string');
      expect(typeof levels[2], k).toBe('object');
    }
  });
  it('counts 24 finds in total: 6 sketches, 12 hidden things, 6 dives', () => {
    const s = createInitialState(world);
    const p = progress(world, s);
    expect(p.total).toBe(24);
    expect(p.finds).toBe(0);
    expect(judge.allRequiredSteps().length).toBe(9);
    expect(progress(world, dive(world, s)!.state).finds).toBe(1);
  });
});
