// Loads the data files in src/world/ and normalizes them. No game decisions live here.
import placesJson from '../world/places.json';
import objectsJson from '../world/objects.json';
import propsJson from '../world/props.json';
import sketchesJson from '../world/sketches.json';
import hintsJson from '../world/hints.json';
import stringsJson from '../world/strings.json';
import type { HintLevel, PlaceData, PropData, SketchData, Transition, Vec3, WorldObject } from './types';
import { posFromAt } from './geom';
import { WalkMap } from './walk';

type RawObject = Record<string, unknown> & { id: string; place: string; kind: string };

export interface World {
  order: string[];
  ribbon: string[];
  places: Record<string, PlaceData>;
  objects: Record<string, WorldObject>;
  props: PropData[];
  sketches: SketchData[];
  lastPage: { altStart: string; altEnd: string };
  hints: Record<string, HintLevel[]>;
  strings: typeof stringsJson;
  /** Base place id for a variant (street_night -> street). */
  baseOf(placeId: string): string;
  objectsIn(placeId: string): WorldObject[];
  propsIn(placeId: string): PropData[];
  sketchFor(placeId: string): SketchData | undefined;
  /** The walkable floor of a place (built once, on first use). */
  walkMap(placeId: string): WalkMap;
  /** The named spot nearest to a position (for "describe" and for hints). */
  nearestSpot(placeId: string, pos: Vec3): string;
}

function expandAct(raw: RawObject): { states: string[]; initial: string; transitions: Transition[] } {
  const act = raw.act as { simple?: string; toggle?: [string, string] } | undefined;
  if (act?.simple) {
    return {
      states: ['idle'],
      initial: 'idle',
      transitions: [{ from: 'idle', to: 'idle', verb: act.simple, effects: [{ type: 'play_sfx', id: 'tick' }, { type: 'anim', id: 'wiggle' }] }],
    };
  }
  if (act?.toggle) {
    const [a, b] = act.toggle;
    return {
      states: ['first', 'second'],
      initial: 'first',
      transitions: [
        { from: 'first', to: 'second', verb: a, effects: [{ type: 'play_sfx', id: 'tick' }] },
        { from: 'second', to: 'first', verb: b, effects: [{ type: 'play_sfx', id: 'tick' }] },
      ],
    };
  }
  if (raw.kind === 'hidden') {
    return { states: ['unfound', 'found'], initial: 'unfound', transitions: [] };
  }
  return {
    states: (raw.states as string[]) ?? ['idle'],
    initial: (raw.initial as string) ?? ((raw.states as string[])?.[0] ?? 'idle'),
    transitions: (raw.transitions as Transition[]) ?? [],
  };
}

function normalizeObject(raw: RawObject, places: Record<string, PlaceData>): WorldObject {
  const place = places[raw.place];
  if (!place) throw new Error(`object ${raw.id}: unknown place ${raw.place}`);
  let pos: Vec3;
  let home: string | undefined;
  const at = raw.at as [string, number, number, number] | undefined;
  if (at) {
    const vp = place.viewpoints[at[0]];
    if (!vp) throw new Error(`object ${raw.id}: unknown viewpoint ${at[0]}`);
    pos = posFromAt(vp.pos, vp.heading, at[1], at[2], at[3]);
    home = at[0];
  } else if (raw.pos) {
    pos = raw.pos as Vec3;
  } else {
    throw new Error(`object ${raw.id}: needs at or pos`);
  }
  const act = expandAct(raw);
  const obj: WorldObject = {
    id: raw.id,
    place: raw.place,
    kind: raw.kind as WorldObject['kind'],
    label: raw.label as string,
    pos,
    size: raw.size as Vec3,
    shape: (raw.shape as WorldObject['shape']) ?? 'box',
    color: (raw.color as string) ?? '#8C8A85',
    states: act.states,
    initial: act.initial,
    transitions: act.transitions,
  };
  if (at) obj.at = at;
  if (home) obj.home = home;
  if (typeof raw.home === 'string') obj.home = raw.home;
  if (raw.rot) obj.rot = raw.rot as Vec3;
  if (raw.visual) obj.visual = raw.visual as WorldObject['visual'];
  if (raw.verb) obj.verb = raw.verb as string;
  if (raw.to) obj.to = raw.to as string;
  if (raw.night === false) obj.night = false;
  return obj;
}

function resolveProp(p: PropData & { at?: [string, number, number, number] }, places: Record<string, PlaceData>): PropData {
  if (p.at) {
    const vp = places[p.place]?.viewpoints[p.at[0]];
    if (!vp) throw new Error(`prop ${p.id}: unknown viewpoint ${p.at[0]}`);
    const { at, ...rest } = p;
    return { ...rest, pos: posFromAt(vp.pos, vp.heading, at[1], at[2], at[3]) };
  }
  return p;
}

export function loadWorld(): World {
  const rawPlaces = placesJson.places as unknown as Record<string, Omit<PlaceData, "id">>;
  const places: Record<string, PlaceData> = {};
  for (const [id, p] of Object.entries(rawPlaces)) places[id] = { ...(p as PlaceData), id };

  const objects: Record<string, WorldObject> = {};
  for (const raw of objectsJson.objects as unknown as RawObject[]) {
    if (objects[raw.id]) throw new Error(`duplicate object id ${raw.id}`);
    objects[raw.id] = normalizeObject(raw, places);
  }
  const props = (propsJson.props as unknown as Array<PropData & { at?: [string, number, number, number] }>).map((p) => resolveProp(p, places));

  const baseOf = (placeId: string): string => places[placeId]?.variantOf ?? placeId;
  const byPlace = new Map<string, WorldObject[]>();
  for (const id of Object.keys(places)) {
    const base = baseOf(id);
    const isVariant = base !== id;
    const list = Object.values(objects).filter((o) => o.place === id || (isVariant && o.place === base && o.night !== false));
    byPlace.set(id, list);
  }
  const propsByPlace = new Map<string, PropData[]>();
  for (const id of Object.keys(places)) {
    const base = baseOf(id);
    propsByPlace.set(id, props.filter((p) => p.place === id || p.place === base));
  }
  const sketches = sketchesJson.sketches as SketchData[];
  const walkMaps = new Map<string, WalkMap>();

  return {
    order: placesJson.order,
    ribbon: placesJson.ribbon,
    places,
    objects,
    props,
    sketches,
    lastPage: sketchesJson.lastPage,
    hints: hintsJson.hints as Record<string, HintLevel[]>,
    strings: stringsJson,
    baseOf,
    objectsIn: (placeId) => byPlace.get(placeId) ?? [],
    propsIn: (placeId) => propsByPlace.get(placeId) ?? [],
    sketchFor: (placeId) => sketches.find((s) => s.place === baseOf(placeId)),
    walkMap: (placeId) => {
      let m = walkMaps.get(placeId);
      if (!m) {
        m = new WalkMap(places[placeId]!, propsByPlace.get(placeId) ?? [], byPlace.get(placeId) ?? []);
        walkMaps.set(placeId, m);
      }
      return m;
    },
    nearestSpot: (placeId, pos) => {
      const place = places[placeId]!;
      let best = place.arrive;
      let bestD = Infinity;
      for (const [id, vp] of Object.entries(place.viewpoints)) {
        const d = Math.hypot(vp.pos[0] - pos[0], vp.pos[2] - pos[2]);
        if (d < bestD) {
          bestD = d;
          best = id;
        }
      }
      return best;
    },
  };
}
