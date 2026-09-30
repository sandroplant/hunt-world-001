import { describe, expect, it } from 'vitest';
import { loadWorld } from '../../src/game/world';
import { judge } from '../../src/game/judge';

const world = loadWorld();

describe('the walkable floor', () => {
  for (const id of world.order) {
    const place = world.places[id]!;
    const map = world.walkMap(id);
    it(`${id}: every named spot is free to stand on and its eye height matches the floor`, () => {
      for (const [v, vp] of Object.entries(place.viewpoints)) {
        expect(map.free(vp.pos[0], vp.pos[2]), `${id}/${v}`).toBe(true);
        expect(Math.abs(map.floorY(vp.pos[0], vp.pos[2]) + place.eye - vp.pos[1]), `${id}/${v} floor`).toBeLessThan(place.eye * 0.15);
      }
    });
    it(`${id}: there is a walk from the arrival spot to every other spot and back`, () => {
      const a = place.viewpoints[place.arrive]!;
      for (const [v, vp] of Object.entries(place.viewpoints)) {
        if (v === place.arrive) continue;
        const there = map.path(a.pos[0], a.pos[2], vp.pos[0], vp.pos[2]);
        expect(there.length, `${id} A→${v}`).toBeGreaterThan(0);
        const end = there[there.length - 1]!;
        expect(Math.hypot(end[0] - vp.pos[0], end[1] - vp.pos[2]), `${id} A→${v} end`).toBeLessThan(map.radius * 1.5);
        expect(map.path(vp.pos[0], vp.pos[2], a.pos[0], a.pos[2]).length, `${id} ${v}→A`).toBeGreaterThan(0);
      }
    });
    it(`${id}: the dive target and every required-step object can be reached within reach`, () => {
      const objs = world.objectsIn(id).filter((o) => o.kind === 'dive' || o.transitions.some((t) => (t.effects ?? []).some((e) => e.type === 'step')));
      const a = place.viewpoints[place.arrive]!;
      for (const o of objs) {
        const near = map.nearestFree(o.pos[0], o.pos[2]);
        expect(near, o.id).not.toBeNull();
        expect(Math.hypot(near![0] - o.pos[0], near![1] - o.pos[2]), o.id).toBeLessThanOrEqual(place.reach);
        expect(map.path(a.pos[0], a.pos[2], near![0], near![1]).length, `${o.id}: no way there from A`).toBeGreaterThan(0);
      }
    });
    it(`${id}: walls, furniture and edges block`, () => {
      expect(map.blockers.length, id).toBeGreaterThan(3);
      // A point outside every zone is never free.
      expect(map.free(1e6, 1e6)).toBe(false);
      // Sliding toward the middle of any blocker never ends inside it.
      let tried = 0;
      for (const b of map.blockers) {
        if (b.kind !== 'rect' || tried >= 5) continue;
        const cx = (b.r[0] + b.r[2]) / 2, cz = (b.r[1] + b.r[3]) / 2;
        const start = map.nearestFree(cx, b.r[3] + map.radius * 4, 20);
        if (!start) continue;
        tried++;
        const [x, z] = map.slide(start[0], start[1], cx - start[0], cz - start[1]);
        expect(map.free(x, z), `${id}: slid into a blocker`).toBe(true);
      }
      expect(tried).toBeGreaterThan(0);
    });
  }

  it('the street door opening is a wall: you cannot walk into the shop, you dive', () => {
    const map = world.walkMap('street');
    const target = world.objects['street.doorway']!;
    expect(map.free(target.pos[0] - 0.4, target.pos[2])).toBe(false);
    const d = judge.diveTarget('street')!;
    expect(d.activeAfter).toBeNull();
  });

  it('the letter hill and the moon rise raise the floor instead of blocking', () => {
    const drawer = world.walkMap('drawer');
    expect(drawer.floorY(-6, -18)).toBeGreaterThan(drawer.base + 1);
    expect(drawer.floorY(15, -5)).toBeCloseTo(drawer.base, 5);
    const moon = world.walkMap('moon');
    expect(moon.floorY(0, -18)).toBeCloseTo(1.8, 1);
    expect(moon.floorY(0, 0)).toBeCloseTo(0, 5);
  });

  it('a hidden object is fair from anywhere it can be seen: the zoom it needs from the nearest walkable point is at most 4x', () => {
    for (const id of judge.hiddenIds()) {
      const a = judge.hiddenPose(id)!;
      const map = world.walkMap(a.place);
      const eye = world.places[a.place]!.eye;
      const near = map.nearestFree(a.pos[0], a.pos[2])!;
      expect(judge.hiddenNeedZoom(id, [near[0], map.floorY(near[0], near[1]) + eye, near[1]]), id).toBeLessThanOrEqual(4);
    }
  });
});
