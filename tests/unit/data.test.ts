import { describe, expect, it } from 'vitest';
import { loadWorld } from '../../src/game/world';
import { anglesFromDir, length, sub } from '../../src/game/geom';
import { judge } from '../../src/game/judge';

const world = loadWorld();

describe('world data', () => {
  it('every place in the order exists and has an arrival viewpoint', () => {
    for (const id of world.order) {
      const p = world.places[id]!;
      expect(p, id).toBeDefined();
      expect(p.viewpoints[p.arrive], id).toBeDefined();
    }
    expect(world.order).toEqual(judge.order());
  });

  it('each place has 3 to 5 stand spots, all with a full turn, and a stand mark for each', () => {
    for (const id of world.order) {
      const p = world.places[id]!;
      const vps = Object.keys(p.viewpoints);
      expect(vps.length, id).toBeGreaterThanOrEqual(3);
      expect(vps.length, id).toBeLessThanOrEqual(5);
      for (const v of vps) {
        const vp = p.viewpoints[v]!;
        expect(vp.yaw[1] - vp.yaw[0], `${id}/${v}`).toBeGreaterThanOrEqual(360);
        expect(vp.heading, `${id}/${v}`).toBe(0);
        const mark = world.objects[`${id}.stand_${v}`]!;
        expect(mark.kind).toBe('stand');
        expect(mark.target).toBe(v);
        expect(Math.abs(mark.pos[1] - (vp.pos[1] - p.eye))).toBeLessThan(p.reach * 0.02);
      }
      expect(p.moveSpeed).toBeGreaterThan(0);
      expect(p.approach.back).toBeGreaterThan(0);
    }
  });

  it('every place with a dive target has a portal opening for the next place', () => {
    for (const id of world.order) {
      const d = judge.diveTarget(id);
      if (!d) continue;
      const portals = world.propsIn(id).filter((p) => p.portal === d.to);
      expect(portals.length, id).toBeGreaterThanOrEqual(1);
      const divePortal = portals.find((p) => p.when?.object === d.object);
      expect(divePortal, `${id}: a portal that appears when ${d.object} is ready`).toBeDefined();
      expect(divePortal!.face).toBe(world.objects[d.object]!.home);
    }
  });

  it('usable objects are within reach of the viewpoint they were placed from', () => {
    for (const o of Object.values(world.objects)) {
      if (o.kind !== 'usable' && o.kind !== 'dive') continue;
      const p = world.places[o.place]!;
      const home = o.home ?? p.arrive;
      const d = length(sub(o.pos, p.viewpoints[home]!.pos));
      expect(d, o.id).toBeLessThanOrEqual(p.reach + 1e-6);
    }
  });

  it('every place has at least 4 ordinary usable things for every important one (spec §5)', () => {
    for (const id of world.order) {
      if (id === 'street_night') continue;
      const objs = world.objectsIn(id);
      const important = objs.filter((o) => o.kind === 'hidden' || o.kind === 'dive' || o.transitions.some((t) => (t.effects ?? []).some((e) => e.type === 'step'))).length;
      const ordinary = objs.filter((o) => o.kind === 'usable' && !o.transitions.some((t) => (t.effects ?? []).some((e) => e.type === 'step'))).length;
      expect(ordinary, `${id}: ${ordinary} ordinary vs ${important} important`).toBeGreaterThanOrEqual(4 * important);
    }
  });

  it('no two usable things from the same viewpoint sit closer than 3° apart', () => {
    for (const id of world.order) {
      const p = world.places[id]!;
      for (const vpId of Object.keys(p.viewpoints)) {
        const vp = p.viewpoints[vpId]!;
        const dirs = world.objectsIn(id)
          .filter((o) => o.kind !== 'stand' && o.kind !== 'dive' && (o.home ?? p.arrive) === vpId)
          .map((o) => ({ id: o.id, ...anglesFromDir(sub(o.pos, vp.pos), vp.heading) }));
        for (let i = 0; i < dirs.length; i++) {
          for (let j = i + 1; j < dirs.length; j++) {
            const a = dirs[i]!, b = dirs[j]!;
            const sep = Math.hypot(a.yaw - b.yaw, a.pitch - b.pitch);
            expect(sep, `${a.id} vs ${b.id}`).toBeGreaterThanOrEqual(3);
          }
        }
      }
    }
  });

  it('every hidden object has an outline alt text and every sketch lists two hidden objects of its place', () => {
    for (const s of world.sketches) {
      expect(s.hidden).toHaveLength(2);
      for (const h of s.hidden) {
        expect(world.objects[h]?.kind, h).toBe('hidden');
        expect(world.objects[h]?.place, h).toBe(s.place);
        expect((world.strings.outlines as Record<string, string>)[h], h).toBeTruthy();
      }
      expect(s.alt.length).toBeGreaterThan(10);
    }
  });

  it('props give every place at least 150 distinct pieces of dressing (spec §5 guideline)', () => {
    for (const id of world.ribbon) {
      const n = world.propsIn(id).reduce((sum, p) => sum + (p.count ?? 1), 0) + world.objectsIn(id).length;
      expect(n, id).toBeGreaterThanOrEqual(150);
    }
  });
});
