// Shared types for world data and game state. Data lives in src/world/*.json.

export type Vec3 = [number, number, number];
export type Shape = 'box' | 'sphere' | 'cylinder' | 'cone';
export type ObjectKind = 'usable' | 'hidden' | 'dive' | 'stand';

export interface ViewpointData {
  pos: Vec3;
  heading: number; // base yaw in degrees; 0 faces -Z, +90 faces -X
  yaw: [number, number];
  pitch: [number, number];
  describe: string;
}

export interface LandmarkData {
  text: string;
  at: [string, number, number]; // viewpoint, yaw, pitch
}

export interface PlaceData {
  id: string;
  label: string;
  unit: string;
  reach: number;
  near: number;
  far: number;
  sky: string;
  ground: string;
  fog: [string, number, number];
  light: [string, number, string, number]; // key colour, key intensity, ambient colour, ambient intensity
  arrive: string;
  variantOf?: string;
  night?: boolean;
  viewpoints: Record<string, ViewpointData>;
  landmarks: LandmarkData[];
}

export type Condition =
  | { has_item: string }
  | { not_has_item: string }
  | { step_done: string }
  | { step_not_done: string }
  | { state: { object: string; is: string } };

export type Effect =
  | { type: 'take_item'; item: string }
  | { type: 'consume_item'; item: string }
  | { type: 'step'; id: string }
  | { type: 'play_sfx'; id: string }
  | { type: 'anim'; id: string }
  | { type: 'change_state'; object: string; to: string };

export interface Transition {
  from: string;
  to: string;
  verb: string;
  conditions?: Condition[];
  effects?: Effect[];
}

export interface VisualState {
  hidden?: boolean;
  offset?: Vec3;
  rot?: Vec3;
  scale?: Vec3;
  color?: string;
}

export interface WorldObject {
  id: string;
  place: string;
  kind: ObjectKind;
  label: string;
  pos: Vec3; // resolved absolute position in the place's units
  at?: [string, number, number, number];
  home?: string; // the viewpoint it was placed from, if any
  size: Vec3;
  shape: Shape;
  color: string;
  rot?: Vec3;
  states: string[];
  initial: string;
  transitions: Transition[];
  visual?: Record<string, VisualState>;
  verb?: string; // hidden objects
  to?: string; // dive targets
  target?: string; // stand marks
  night?: boolean; // false = absent at night
}

export interface PropData {
  place: string;
  id: string;
  shape: Shape;
  pos: Vec3;
  size: Vec3;
  color: string;
  rot?: Vec3;
  count?: number;
  spread?: Vec3;
  seed?: number;
  palette?: string[];
  emissive?: boolean;
  ring?: number;
  ambient?: 'drift' | 'sway' | 'twinkle' | 'blink';
  night?: { color?: string; emissive?: boolean };
}

export interface SketchData {
  id: string;
  place: string;
  alt: string;
  hidden: string[];
}

export type HintLevel = string | { point: string } | { pose: string };

export interface Settings {
  reducedMotion: boolean;
  largeText: boolean;
  quality: 'auto' | 'high' | 'low';
}

export interface GameState {
  version: 1;
  place: string;
  viewpoint: string;
  stack: Array<{ place: string; viewpoint: string }>;
  yaw: number;
  pitch: number;
  zoom: number;
  steps: Record<string, true>;
  items: string[];
  found: Record<string, true>;
  objectStates: Record<string, string>;
  hintsUsed: Record<string, number>;
  hintCount: number;
  startedAt: number | null;
  playMs: number;
  ended: boolean;
  endedAt: number | null;
  settings: Settings;
  onboarded: { drag: boolean; lens: boolean };
}

export type GameEvent =
  | { kind: 'sfx'; id: string }
  | { kind: 'anim'; object: string; id: string }
  | { kind: 'step'; id: string }
  | { kind: 'found'; id: string; what: 'hidden' | 'sketch' }
  | { kind: 'state'; object: string; to: string }
  | { kind: 'item'; item: string; taken: boolean }
  | { kind: 'refused' };
