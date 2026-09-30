import type { Vec3 } from './types';

export const DEG = Math.PI / 180;

export function wrapDeg(a: number): number {
  while (a > 180) a -= 360;
  while (a <= -180) a += 360;
  return a;
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Direction for a heading (base yaw) plus a relative yaw and pitch, all in degrees. +yaw turns left, +pitch looks up. */
export function dirFromAngles(heading: number, yaw: number, pitch: number): Vec3 {
  const t = (heading + yaw) * DEG;
  const p = pitch * DEG;
  const c = Math.cos(p);
  return [-Math.sin(t) * c, Math.sin(p), -Math.cos(t) * c];
}

/** Relative yaw and pitch (degrees) of a direction, given the base heading. yaw is wrapped to -180..180. */
export function anglesFromDir(dir: Vec3, heading: number): { yaw: number; pitch: number } {
  const [x, y, z] = dir;
  const len = Math.hypot(x, y, z) || 1;
  const pitch = Math.asin(clamp(y / len, -1, 1)) / DEG;
  const total = Math.atan2(-x, -z) / DEG;
  let yaw = total - heading;
  while (yaw > 180) yaw -= 360;
  while (yaw < -180) yaw += 360;
  return { yaw, pitch };
}

export function angleBetween(a: Vec3, b: Vec3): number {
  const la = Math.hypot(a[0], a[1], a[2]) || 1;
  const lb = Math.hypot(b[0], b[1], b[2]) || 1;
  const d = (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / (la * lb);
  return Math.acos(clamp(d, -1, 1)) / DEG;
}

/** Angular distance between two (yaw, pitch) pairs measured from the same viewpoint, in degrees. */
export function angleBetweenAngles(yaw1: number, pitch1: number, yaw2: number, pitch2: number): number {
  return angleBetween(dirFromAngles(0, yaw1, pitch1), dirFromAngles(0, yaw2, pitch2));
}

export function posFromAt(origin: Vec3, heading: number, yaw: number, pitch: number, dist: number): Vec3 {
  const d = dirFromAngles(heading, yaw, pitch);
  return [origin[0] + d[0] * dist, origin[1] + d[1] * dist, origin[2] + d[2] * dist];
}

export function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function length(a: Vec3): number {
  return Math.hypot(a[0], a[1], a[2]);
}

/** Small deterministic random generator (mulberry32). */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
