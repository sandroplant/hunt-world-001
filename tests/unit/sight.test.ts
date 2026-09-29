import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { loadWorld } from '../../src/game/world';
import { PlaceScene } from '../../src/render/scene';
import { judge } from '../../src/game/judge';

const world = loadWorld();

// A hidden thing must be in view from the spot its hints describe; otherwise it can only be "found" by pointing at a wall.
describe('hidden objects can be seen', () => {
  const scenes = new Map<string, PlaceScene>();
  const sceneOf = (place: string): PlaceScene => {
    let s = scenes.get(place);
    if (!s) {
      s = new PlaceScene(world, place, 'high');
      s.scene.updateMatrixWorld(true);
      scenes.set(place, s);
    }
    return s;
  };
  for (const id of judge.hiddenIds()) {
    it(`${id} is in view from the spot it was placed from`, () => {
      const o = world.objects[id]!;
      const spot = world.places[o.place]!.viewpoints[o.home!]!;
      expect(sceneOf(o.place).visibleFrom(id, new THREE.Vector3(...spot.pos))).toBe(true);
    });
  }
  it('a thing behind a wall is not in view', () => {
    const scene = sceneOf('shop');
    // The teacup is on the right-hand wall; from outside that wall it cannot be seen.
    expect(scene.visibleFrom('shop.teacup_star', new THREE.Vector3(6, 1.6, -2))).toBe(false);
  });
});
