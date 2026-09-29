// THE JUDGE. Every "is this found?" decision goes through here (spec §6.1).
// It reads only src/world/answers.json and is written so it could move to a server:
// pure functions over plain data, no renderer, no DOM, no Three.js.
import answers from '../world/answers.json';
import { angleBetween, angleBetweenAngles, clamp, dirFromAngles, length, sub } from './geom';

export interface View {
  place: string;
  viewpoint: string;
  /** The player's eye position in the place's units (needed to judge hidden objects from any spot). */
  pos?: [number, number, number];
  yaw: number;
  pitch: number;
  zoom: number;
  /** Screen pixels per degree at the view center; lets the hit area respect the 44 CSS px rule. */
  pxPerDeg?: number;
}

export interface SketchVerdict {
  /** 0..1. Nonzero only from the right viewpoint within warmDeg. Responds to zoom too (founder decision D-006). */
  warm: number;
  /** True when the view is inside the lock band (angle and zoom). The caller times the 0.8 s hold. */
  aligned: boolean;
  holdMs: number;
}

interface SketchAnswer { place: string; viewpoint: string; yaw: number; pitch: number; zoom: number; lockDeg?: number; warmDeg?: number; zoomTol?: number; holdMs?: number }
interface HiddenAnswer { place: string; pos: [number, number, number]; refDist: number; minZoom: number; hitDeg?: number }

const sketches = answers.sketches as Record<string, SketchAnswer>;
const hidden = answers.hidden as unknown as Record<string, HiddenAnswer>;
const required = answers.requiredSteps as Record<string, string[]>;
const dives = answers.diveTargets as Record<string, { object: string; activeAfter: string; to: string }>;

export const judge = {
  order(): string[] {
    return answers.order;
  },

  requiredSteps(place: string): string[] {
    return required[place] ?? [];
  },

  allRequiredSteps(): string[] {
    return answers.order.flatMap((p) => required[p] ?? []);
  },

  /** A step may be taken only when the earlier steps of its place are done. Repeating a done step is refused. */
  stepAllowed(stepId: string, steps: Record<string, true>): boolean {
    for (const place of answers.order) {
      const list = required[place] ?? [];
      const i = list.indexOf(stepId);
      if (i < 0) continue;
      if (steps[stepId]) return false;
      return list.slice(0, i).every((s) => steps[s]);
    }
    return false;
  },

  placeComplete(place: string, steps: Record<string, true>): boolean {
    return (required[place] ?? []).every((s) => steps[s]);
  },

  canDive(place: string, steps: Record<string, true>): { object: string; to: string } | null {
    const d = dives[place];
    if (!d) return null;
    return steps[d.activeAfter] ? { object: d.object, to: d.to } : null;
  },

  diveTarget(place: string): { object: string; activeAfter: string; to: string } | null {
    return dives[place] ?? null;
  },

  isEnding(place: string): boolean {
    return place === answers.ending.place;
  },

  sketchIds(): string[] {
    return Object.keys(sketches);
  },

  hiddenIds(): string[] {
    return Object.keys(hidden);
  },

  sketchPose(id: string): SketchAnswer | null {
    return sketches[id] ?? null;
  },

  hiddenPose(id: string): HiddenAnswer | null {
    return hidden[id] ?? null;
  },

  judgeSketch(id: string, view: View): SketchVerdict {
    const a = sketches[id];
    const d = answers.sketchDefaults;
    if (!a) return { warm: 0, aligned: false, holdMs: d.holdMs };
    const holdMs = a.holdMs ?? d.holdMs;
    if (a.place !== view.place || a.viewpoint !== view.viewpoint) return { warm: 0, aligned: false, holdMs };
    const lockDeg = a.lockDeg ?? d.lockDeg;
    const warmDeg = a.warmDeg ?? d.warmDeg;
    const zoomTol = a.zoomTol ?? d.zoomTol;
    const angle = angleBetweenAngles(view.yaw, view.pitch, a.yaw, a.pitch);
    const angleTerm = clamp(1 - angle / warmDeg, 0, 1);
    // Zoom term: 1 at the stored zoom, 0 when the zoom is off by a factor of 2 or more.
    const zoomTerm = clamp(1 - Math.abs(Math.log(view.zoom / a.zoom)) / Math.LN2, 0, 1);
    const warm = angleTerm * (0.6 + 0.4 * zoomTerm);
    const zoomOk = Math.abs(view.zoom - a.zoom) / a.zoom <= zoomTol;
    return { warm, aligned: angle <= lockDeg && zoomOk, holdMs };
  },

  judgeHidden(id: string, view: View): boolean {
    const a = hidden[id];
    if (!a) return false;
    if (a.place !== view.place || !view.pos) return false;
    const toObj = sub(a.pos, view.pos);
    const dist = length(toObj);
    if (dist < 1e-6) return false;
    // The zoom needed scales with distance, so the object must look the same size on screen wherever you stand.
    const needZoom = Math.max(1, a.minZoom * (dist / a.refDist));
    if (view.zoom < needZoom * (1 - 1e-3)) return false;
    const angle = angleBetween(dirFromAngles(0, view.yaw, view.pitch), toObj);
    // The hit area is never smaller than 44 CSS px across (22 px radius), however small the object looks.
    const minDeg = view.pxPerDeg ? 22 / view.pxPerDeg : 0;
    const hitDeg = Math.max((a.hitDeg ?? answers.hiddenDefaults.hitDeg) * (a.refDist / dist), minDeg);
    return angle <= hitDeg;
  },

  /** The zoom a hidden object needs from a given eye position (for the affordance, not for finding). */
  hiddenNeedZoom(id: string, pos: [number, number, number]): number {
    const a = hidden[id];
    if (!a) return Infinity;
    const dist = length(sub(a.pos, pos));
    return Math.max(1, a.minZoom * (dist / a.refDist));
  },
};

export type Judge = typeof judge;
