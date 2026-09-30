// Shared types for world data and game state. Data lives in src/world/*.json.

export type Vec3 = [number, number, number];
export type Shape = 'box' | 'sphere' | 'cylinder' | 'cone';
export type ObjectKind = 'usable' | 'hidden' | 'dive';

/** A named spot: an authoring anchor (objects are placed relative to it), the dive arrival point, and a "describe" name. */
export interface ViewpointData {
  pos: Vec3;
  heading: number; // base yaw in degrees; 0 faces -Z, +90 faces -X
  yaw: [number, number];
  pitch: [number, number];
  describe: string;
}

/** A walkable zone on the ground: a rectangle [x0, z0, x1, z1] or a disc. */
export type WalkZone = [number, number, number, number] | { circle: [number, number, number] };

export interface WalkData {
  /** The player's body radius in the place's units. Walls and furniture are kept this far away. */
  radius: number;
  zones: WalkZone[];
}

export interface LandmarkData {
  text: string;
  at: [string, number, number]; // viewpoint, yaw, pitch
}

export interface Approach {
  back: number; // distance behind the arrival spot, along its view
  up: number;
  pitch: number; // the portal camera's pitch (degrees, +up)
}

/** A realistic look for a prop (style frame): a PBR texture set, a glTF model, a built house, water or glass. */
export interface Look {
  /** Texture set folder under assets/polyhaven/textures. */
  tex?: string;
  /** Metres per texture tile (default 2). */
  tile?: number;
  color?: string;
  rough?: number;
  /** glTF model folder under assets/polyhaven/models. */
  model?: string;
  /** How the model is scaled into the prop's box: to its height (default), to its largest side, or per axis. */
  fit?: 'height' | 'max' | 'box';
  /** Extra turn of the model about Y, degrees. */
  yaw?: number;
  /** A house built from the prop's box: plaster set, floors, windows per floor, which side faces the street. */
  house?: { plaster: string; floors: number; windows: number; door?: boolean; face: 'x+' | 'x-'; lit?: number[]; roof?: string };
  water?: boolean;
  glass?: boolean;
  /** Emissive colour (a lit pane). */
  emissive?: string;
}

export interface PlaceData {
  id: string;
  label: string;
  /** 'realistic' places load the asset pack: HDRI light and sky, PBR textures, models, shadows, mist. */
  style?: 'graybox' | 'realistic';
  hdri?: string;
  /** Turn of the HDRI about Y, degrees, so its sun sits where the place wants it. */
  envRotation?: number;
  sun?: { dir: Vec3; color: string; intensity: number };
  envIntensity?: number;
  skyIntensity?: number;
  mist?: [string, number, number];
  exposure?: number;
  unit: string;
  reach: number;
  eye: number;
  moveSpeed: number; // walking speed in place units per second
  approach: Approach;
  walk: WalkData;
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
  /** Shown only while an object is in a state. */
  when?: { object: string; is: string };
  /** A portal: a flat opening that shows this place live. size = [width, height]; face = the spot it faces. */
  portal?: string;
  face?: string;
  /** For a portal on a wall: the direction the opening faces. Otherwise it faces the `face` spot. */
  normal?: Vec3;
  /** A dive opening glows softly so it reads as "you can go in". */
  glow?: boolean;
  /** The player can walk onto this (a hill, a rise). Its top sets the floor height instead of blocking. */
  platform?: boolean;
  /** false: never blocks walking (thin hairs, whiskers). */
  solid?: boolean;
  look?: Look;
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
  version: 2;
  place: string;
  /** The player's eye position in the place's units. */
  pos: Vec3;
  stack: Array<{ place: string; pos: Vec3 }>;
  /** Places the player has dived out of (counted as finds: spec §3 says 24 in total). */
  dived: Record<string, true>;
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
  onboarded: { drag: boolean; lens: boolean; walk: boolean };
}

export type GameEvent =
  | { kind: 'sfx'; id: string }
  | { kind: 'anim'; object: string; id: string }
  | { kind: 'step'; id: string }
  | { kind: 'found'; id: string; what: 'hidden' | 'sketch' }
  | { kind: 'state'; object: string; to: string }
  | { kind: 'item'; item: string; taken: boolean }
  | { kind: 'refused' };
