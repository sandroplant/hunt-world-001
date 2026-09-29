import { describe, expect, it } from 'vitest';
import { judge } from '../../src/game/judge';
import { loadWorld } from '../../src/game/world';
import { anglesFromDir, sub } from '../../src/game/geom';

const world = loadWorld();

describe('sketch judging', () => {
  for (const id of judge.sketchIds()) {
    const pose = judge.sketchPose(id)!;
    it(`${id} locks from its pose`, () => {
      const v = judge.judgeSketch(id, { place: pose.place, viewpoint: pose.viewpoint, yaw: pose.yaw, pitch: pose.pitch, zoom: pose.zoom });
      expect(v.aligned).toBe(true);
      expect(v.warm).toBeCloseTo(1, 5);
      expect(v.holdMs).toBe(800);
    });
    it(`${id} does not lock 30° off`, () => {
      const v = judge.judgeSketch(id, { place: pose.place, viewpoint: pose.viewpoint, yaw: pose.yaw + 30 / Math.cos((pose.pitch * Math.PI) / 180), pitch: pose.pitch, zoom: pose.zoom });
      expect(v.aligned).toBe(false);
      expect(v.warm).toBe(0);
    });
    it(`${id} does not lock from the other viewpoint`, () => {
      const other = pose.viewpoint === 'A' ? 'B' : 'A';
      const v = judge.judgeSketch(id, { place: pose.place, viewpoint: other, yaw: pose.yaw, pitch: pose.pitch, zoom: pose.zoom });
      expect(v.aligned).toBe(false);
      expect(v.warm).toBe(0);
    });
    it(`${id} is warm but not locked at the wrong zoom (founder decision D-006)`, () => {
      const v = judge.judgeSketch(id, { place: pose.place, viewpoint: pose.viewpoint, yaw: pose.yaw, pitch: pose.pitch, zoom: pose.zoom * 2.2 });
      expect(v.aligned).toBe(false);
      expect(v.warm).toBeGreaterThan(0.5);
    });
    it(`${id} gets warmer as the direction improves`, () => {
      const far = judge.judgeSketch(id, { place: pose.place, viewpoint: pose.viewpoint, yaw: pose.yaw + 20, pitch: pose.pitch, zoom: pose.zoom });
      const near = judge.judgeSketch(id, { place: pose.place, viewpoint: pose.viewpoint, yaw: pose.yaw + 5, pitch: pose.pitch, zoom: pose.zoom });
      expect(near.warm).toBeGreaterThan(far.warm);
      expect(far.warm).toBeGreaterThan(0);
    });
  }
});

describe('hidden-object judging', () => {
  for (const id of judge.hiddenIds()) {
    const a = judge.hiddenPose(id)!;
    it(`${id} is found only when centered and zoomed`, () => {
      const base = { place: a.place, viewpoint: a.viewpoint, yaw: a.yaw, pitch: a.pitch, pxPerDeg: 40 };
      expect(judge.judgeHidden(id, { ...base, zoom: a.minZoom })).toBe(true);
      expect(judge.judgeHidden(id, { ...base, zoom: 1 })).toBe(false);
      expect(judge.judgeHidden(id, { ...base, zoom: a.minZoom, yaw: a.yaw + 15 })).toBe(false);
      const other = a.viewpoint === 'A' ? 'B' : 'A';
      expect(judge.judgeHidden(id, { ...base, zoom: a.minZoom, viewpoint: other })).toBe(false);
    });
    it(`${id} hit area is at least 44 CSS px across`, () => {
      // With 10 px per degree, a 22 px radius is 2.2°. A tap 2.0° off must still count.
      const v = { place: a.place, viewpoint: a.viewpoint, yaw: a.yaw + 2.0, pitch: a.pitch, zoom: a.minZoom, pxPerDeg: 10 };
      expect(judge.judgeHidden(id, v)).toBe(true);
    });
  }
});

describe('answer data agrees with object data', () => {
  for (const id of judge.hiddenIds()) {
    it(`${id}: answers.json direction points at the object in objects.json`, () => {
      const a = judge.hiddenPose(id)!;
      const obj = world.objects[id]!;
      const vp = world.places[a.place]!.viewpoints[a.viewpoint]!;
      const rel = anglesFromDir(sub(obj.pos, vp.pos), vp.heading);
      expect(Math.abs(rel.yaw - a.yaw)).toBeLessThan(0.5);
      expect(Math.abs(rel.pitch - a.pitch)).toBeLessThan(0.5);
      expect(obj.kind).toBe('hidden');
    });
  }
  for (const id of judge.sketchIds()) {
    it(`${id}: pose is inside the viewpoint's turn limits`, () => {
      const a = judge.sketchPose(id)!;
      const vp = world.places[a.place]!.viewpoints[a.viewpoint]!;
      expect(a.yaw).toBeGreaterThanOrEqual(vp.yaw[0]);
      expect(a.yaw).toBeLessThanOrEqual(vp.yaw[1]);
      expect(a.pitch).toBeGreaterThanOrEqual(vp.pitch[0]);
      expect(a.pitch).toBeLessThanOrEqual(vp.pitch[1]);
      expect(a.zoom).toBeGreaterThanOrEqual(1);
      expect(a.zoom).toBeLessThanOrEqual(4);
    });
  }
  it('every dive target in answers.json is a dive object whose "to" matches', () => {
    for (const place of judge.order()) {
      const d = judge.diveTarget(place);
      if (!d) continue;
      const obj = world.objects[d.object]!;
      expect(obj.kind).toBe('dive');
      expect(obj.to).toBe(d.to);
      expect(world.places[d.to]).toBeDefined();
    }
  });
});
