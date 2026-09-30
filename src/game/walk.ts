// Free walking inside a place (founder change, third round). Pure: no renderer, no DOM.
// The floor is a set of zones. Walls, furniture and edges block: every solid prop or object whose height
// overlaps the player's body becomes a blocker, kept one body radius away. Hills and rises are platforms
// that raise the floor instead. Taps walk along a found path; keys slide along whatever is in the way.
import type { PlaceData, PropData, Vec3, WalkZone, WorldObject } from './types';
import { propInstances } from './props';
import { DEG, clamp } from './geom';

type Rect = [number, number, number, number]; // x0, z0, x1, z1

interface RectBlocker { kind: 'rect'; r: Rect }
interface EllipseBlocker { kind: 'ellipse'; cx: number; cz: number; rx: number; rz: number }
/** A box turned about the vertical axis: half sizes hx, hz and the turn in radians. */
interface ObbBlocker { kind: 'obb'; cx: number; cz: number; hx: number; hz: number; angle: number }
export type Blocker = RectBlocker | EllipseBlocker | ObbBlocker;

interface Ellipsoid { kind: 'ellipsoid'; cx: number; cy: number; cz: number; rx: number; ry: number; rz: number }
interface Disc { kind: 'disc'; cx: number; cz: number; r: number; top: number }
interface Slab { kind: 'slab'; r: Rect; top: number }
export type Platform = Ellipsoid | Disc | Slab;

export interface Solid {
  pos: Vec3;
  size: Vec3;
  rot: Vec3; // degrees
  shape: 'box' | 'sphere' | 'cylinder' | 'cone';
}

/** The ground-plane footprint of a rotated box: its axis-aligned extent in X and Z, plus its vertical extent. */
function extents(s: Solid): { x0: number; x1: number; z0: number; z1: number; y0: number; y1: number } {
  const [ax, ay, az] = [s.rot[0] * DEG, s.rot[1] * DEG, s.rot[2] * DEG];
  const cx = Math.cos(ax), sx = Math.sin(ax), cy = Math.cos(ay), sy = Math.sin(ay), cz = Math.cos(az), sz = Math.sin(az);
  // Three.js Euler XYZ: R = Rx * Ry * Rz. Extent along a world axis = sum of |row| * half size.
  const r00 = cy * cz, r01 = -cy * sz, r02 = sy;
  const r10 = cx * sz + sx * sy * cz, r11 = cx * cz - sx * sy * sz, r12 = -sx * cy;
  const r20 = sx * sz - cx * sy * cz, r21 = sx * cz + cx * sy * sz, r22 = cx * cy;
  const hx = s.size[0] / 2, hy = s.size[1] / 2, hz = s.size[2] / 2;
  const ex = Math.abs(r00) * hx + Math.abs(r01) * hy + Math.abs(r02) * hz;
  const ey = Math.abs(r10) * hx + Math.abs(r11) * hy + Math.abs(r12) * hz;
  const ez = Math.abs(r20) * hx + Math.abs(r21) * hy + Math.abs(r22) * hz;
  return { x0: s.pos[0] - ex, x1: s.pos[0] + ex, z0: s.pos[2] - ez, z1: s.pos[2] + ez, y0: s.pos[1] - ey, y1: s.pos[1] + ey };
}

function smooth(t: number): number {
  const k = clamp(t, 0, 1);
  return k * k * (3 - 2 * k);
}

class Heap {
  private a: Array<[number, number]> = [];
  get size(): number {
    return this.a.length;
  }
  push(key: number, v: number): void {
    const a = this.a;
    a.push([key, v]);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p]![0] <= a[i]![0]) break;
      [a[p], a[i]] = [a[i]!, a[p]!];
      i = p;
    }
  }
  pop(): number {
    const a = this.a;
    const top = a[0]!;
    const last = a.pop()!;
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < a.length && a[l]![0] < a[m]![0]) m = l;
        if (r < a.length && a[r]![0] < a[m]![0]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i]!, a[m]!];
        i = m;
      }
    }
    return top[1];
  }
}

export class WalkMap {
  readonly radius: number;
  readonly base: number; // the floor height where nothing raises it
  readonly blockers: Blocker[] = [];
  readonly platforms: Platform[] = [];
  private readonly zones: WalkZone[];
  private readonly cell: number;
  private readonly x0: number;
  private readonly z0: number;
  private readonly nx: number;
  private readonly nz: number;
  private readonly grid: Uint8Array; // 1 = free

  constructor(readonly place: PlaceData, props: PropData[], objects: WorldObject[]) {
    this.radius = place.walk.radius;
    this.zones = place.walk.zones;
    const arrive = place.viewpoints[place.arrive]!;
    this.base = arrive.pos[1] - place.eye;
    // Platforms first: blockers are judged against the floor under them.
    for (const p of props) {
      if (!p.platform) continue;
      const [sx, sy, sz] = p.size;
      if (p.shape === 'sphere') this.platforms.push({ kind: 'ellipsoid', cx: p.pos[0], cy: p.pos[1], cz: p.pos[2], rx: sx / 2, ry: sy / 2, rz: sz / 2 });
      else if (p.shape === 'box') this.platforms.push({ kind: 'slab', r: [p.pos[0] - sx / 2, p.pos[2] - sz / 2, p.pos[0] + sx / 2, p.pos[2] + sz / 2], top: p.pos[1] + sy / 2 });
      else this.platforms.push({ kind: 'disc', cx: p.pos[0], cz: p.pos[2], r: Math.max(sx, sz) / 2, top: p.pos[1] + sy / 2 });
    }
    const stepH = place.eye * 0.25; // things lower than the knee are walked over
    const headH = place.eye * 0.9; // things above the head do not block
    const minFoot = this.radius * 0.3;
    const add = (s: Solid): void => {
      const e = extents(s);
      const floor = this.floorY(s.pos[0], s.pos[2]);
      if (e.y1 < floor + stepH || e.y0 > floor + headH) return;
      const w = e.x1 - e.x0, d = e.z1 - e.z0;
      if (Math.max(w, d) < minFoot) return;
      const tilted = Math.abs(s.rot[0]) > 0.01 || Math.abs(s.rot[2]) > 0.01;
      const turned = Math.abs(s.rot[1]) > 0.01;
      if (tilted) this.blockers.push({ kind: 'rect', r: [e.x0, e.z0, e.x1, e.z1] });
      else if (s.shape !== 'box') this.blockers.push({ kind: 'ellipse', cx: s.pos[0], cz: s.pos[2], rx: s.size[0] / 2, rz: s.size[2] / 2 });
      else if (turned) this.blockers.push({ kind: 'obb', cx: s.pos[0], cz: s.pos[2], hx: s.size[0] / 2, hz: s.size[2] / 2, angle: s.rot[1] * DEG });
      else this.blockers.push({ kind: 'rect', r: [e.x0, e.z0, e.x1, e.z1] });
    };
    for (const p of props) {
      if (p.platform) continue;
      if (p.portal) {
        // An opening is a thin wall: the player never walks through it, they dive.
        const [w, h] = [p.size[0], p.size[1]];
        const n = p.normal ?? this.faceNormal(p);
        const right: [number, number] = [Math.abs(n[2]), Math.abs(n[0])]; // the quad's width runs across its normal on the ground
        const ex = (right[0] * w) / 2 + Math.abs(n[0]) * 0.05, ez = (right[1] * w) / 2 + Math.abs(n[2]) * 0.05;
        add({ pos: p.pos, size: [ex * 2, h, ez * 2], rot: [0, 0, 0], shape: 'box' });
        continue;
      }
      if (p.solid === false) continue;
      if ((p.count ?? 1) > 40) continue; // scattered dressing (cobbles, stars, fur) never blocks
      for (const inst of propInstances(p, 'high')) add({ pos: inst.pos, size: inst.size, rot: inst.rot, shape: p.shape });
    }
    for (const o of objects) {
      if (o.kind === 'hidden') continue;
      add({ pos: o.pos, size: o.size, rot: o.rot ?? [0, 0, 0], shape: o.shape });
    }
    // The grid for path finding: one cell per body radius over the zones' bounding box.
    let bx0 = Infinity, bz0 = Infinity, bx1 = -Infinity, bz1 = -Infinity;
    for (const z of this.zones) {
      const r = zoneRect(z);
      bx0 = Math.min(bx0, r[0]); bz0 = Math.min(bz0, r[1]); bx1 = Math.max(bx1, r[2]); bz1 = Math.max(bz1, r[3]);
    }
    this.cell = this.radius;
    this.x0 = bx0;
    this.z0 = bz0;
    this.nx = Math.max(1, Math.ceil((bx1 - bx0) / this.cell));
    this.nz = Math.max(1, Math.ceil((bz1 - bz0) / this.cell));
    this.grid = new Uint8Array(this.nx * this.nz);
    for (const z of this.zones) this.paint(zoneRect(z), (x, zz) => inZone(z, x, zz, this.radius), 1);
    for (const b of this.blockers) this.paint(blockerRect(b, this.radius), (x, zz) => inBlocker(b, x, zz, this.radius), 0);
  }

  private faceNormal(p: PropData): Vec3 {
    const face = this.place.viewpoints[p.face ?? this.place.arrive] ?? this.place.viewpoints[this.place.arrive]!;
    const d: Vec3 = [face.pos[0] - p.pos[0], 0, face.pos[2] - p.pos[2]];
    const l = Math.hypot(d[0], d[2]) || 1;
    return [d[0] / l, 0, d[2] / l];
  }

  private paint(r: Rect, test: (x: number, z: number) => boolean, value: 0 | 1): void {
    const i0 = clamp(Math.floor((r[0] - this.x0) / this.cell) - 1, 0, this.nx - 1);
    const i1 = clamp(Math.ceil((r[2] - this.x0) / this.cell) + 1, 0, this.nx - 1);
    const j0 = clamp(Math.floor((r[1] - this.z0) / this.cell) - 1, 0, this.nz - 1);
    const j1 = clamp(Math.ceil((r[3] - this.z0) / this.cell) + 1, 0, this.nz - 1);
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const x = this.x0 + (i + 0.5) * this.cell, z = this.z0 + (j + 0.5) * this.cell;
        if (test(x, z)) this.grid[j * this.nx + i] = value;
      }
    }
  }

  /** The floor height under a point: the base floor, raised by any platform there. */
  floorY(x: number, z: number): number {
    let y = this.base;
    const ramp = this.radius * 3;
    for (const p of this.platforms) {
      if (p.kind === 'ellipsoid') {
        const q = ((x - p.cx) / p.rx) ** 2 + ((z - p.cz) / p.rz) ** 2;
        if (q < 1) y = Math.max(y, p.cy + p.ry * Math.sqrt(1 - q));
      } else if (p.kind === 'disc') {
        const d = Math.hypot(x - p.cx, z - p.cz);
        if (d < p.r) y = Math.max(y, this.base + (p.top - this.base) * smooth((p.r - d) / Math.min(ramp, p.r * 0.5)));
      } else {
        const inset = Math.min(x - p.r[0], p.r[2] - x, z - p.r[1], p.r[3] - z);
        if (inset > 0) y = Math.max(y, this.base + (p.top - this.base) * smooth(inset / Math.min(ramp, (p.r[2] - p.r[0]) * 0.25)));
      }
    }
    return y;
  }

  /** True when the player's body fits at a point: inside a zone and clear of every blocker. */
  free(x: number, z: number): boolean {
    if (!this.zones.some((zone) => inZone(zone, x, z, this.radius))) return false;
    for (const b of this.blockers) if (inBlocker(b, x, z, this.radius)) return false;
    return true;
  }

  private cellOf(x: number, z: number): [number, number] {
    return [clamp(Math.floor((x - this.x0) / this.cell), 0, this.nx - 1), clamp(Math.floor((z - this.z0) / this.cell), 0, this.nz - 1)];
  }

  private center(i: number, j: number): [number, number] {
    return [this.x0 + (i + 0.5) * this.cell, this.z0 + (j + 0.5) * this.cell];
  }

  /** The nearest grid cell marked free, searching outward in rings. */
  private nearestFreeCell(ci: number, cj: number, maxRing: number, x: number, z: number): [number, number] | null {
    let best: [number, number] | null = null;
    let bestD = Infinity;
    for (let ring = 0; ring <= maxRing; ring++) {
      for (let j = cj - ring; j <= cj + ring; j++) {
        for (let i = ci - ring; i <= ci + ring; i++) {
          if (Math.max(Math.abs(i - ci), Math.abs(j - cj)) !== ring) continue;
          if (i < 0 || j < 0 || i >= this.nx || j >= this.nz || !this.grid[j * this.nx + i]) continue;
          const c = this.center(i, j);
          const d = Math.hypot(c[0] - x, c[1] - z);
          if (d < bestD) {
            bestD = d;
            best = [i, j];
          }
        }
      }
      if (best && ring >= 1) return best;
    }
    return best;
  }

  /** The nearest free point to a target (the target itself when it is free). Null when nothing is free nearby. */
  nearestFree(x: number, z: number, maxCells = 60): [number, number] | null {
    if (this.free(x, z)) return [x, z];
    const [ci, cj] = this.cellOf(x, z);
    const cell = this.nearestFreeCell(ci, cj, maxCells, x, z);
    return cell ? this.center(cell[0], cell[1]) : null;
  }

  /** Move with sliding: the full step, else along one axis, else stay. */
  slide(x: number, z: number, dx: number, dz: number): [number, number] {
    const len = Math.hypot(dx, dz);
    const steps = Math.max(1, Math.ceil(len / (this.radius * 0.5)));
    let cx = x, cz = z;
    for (let s = 0; s < steps; s++) {
      const sx = dx / steps, sz = dz / steps;
      if (this.free(cx + sx, cz + sz)) { cx += sx; cz += sz; continue; }
      if (this.free(cx + sx, cz)) { cx += sx; continue; }
      if (this.free(cx, cz + sz)) { cz += sz; continue; }
      break;
    }
    return [cx, cz];
  }

  private segmentFree(ax: number, az: number, bx: number, bz: number): boolean {
    const len = Math.hypot(bx - ax, bz - az);
    const n = Math.max(1, Math.ceil(len / (this.cell * 0.5)));
    for (let k = 1; k <= n; k++) {
      const t = k / n;
      if (!this.free(ax + (bx - ax) * t, az + (bz - az) * t)) return false;
    }
    return true;
  }

  /** A path of waypoints from one point to another (the end included). Empty when no way exists. */
  path(fromX: number, fromZ: number, toX: number, toZ: number): Array<[number, number]> {
    const target = this.nearestFree(toX, toZ);
    if (!target) return [];
    if (this.segmentFree(fromX, fromZ, target[0], target[1])) return [target];
    // Search between the nearest free cells; the exact points are joined on at the ends.
    const s0 = this.cellOf(fromX, fromZ);
    const t0 = this.cellOf(target[0], target[1]);
    const sc = this.nearestFreeCell(s0[0], s0[1], 6, fromX, fromZ);
    const tc = this.nearestFreeCell(t0[0], t0[1], 6, target[0], target[1]);
    if (!sc || !tc) return [];
    const [si, sj] = sc;
    const [ti, tj] = tc;
    const n = this.nx * this.nz;
    const g = new Float32Array(n).fill(Infinity);
    const came = new Int32Array(n).fill(-1);
    const closed = new Uint8Array(n);
    const heap = new Heap();
    const sIdx = sj * this.nx + si, tIdx = tj * this.nx + ti;
    const h = (i: number, j: number): number => {
      const dx = Math.abs(i - ti), dz = Math.abs(j - tj);
      return Math.max(dx, dz) + (Math.SQRT2 - 1) * Math.min(dx, dz);
    };
    g[sIdx] = 0;
    heap.push(h(si, sj), sIdx);
    let found = false;
    while (heap.size) {
      const cur = heap.pop();
      if (cur === tIdx) { found = true; break; }
      if (closed[cur]) continue;
      closed[cur] = 1;
      const ci = cur % this.nx, cj = (cur - ci) / this.nx;
      for (let dj = -1; dj <= 1; dj++) {
        for (let di = -1; di <= 1; di++) {
          if (!di && !dj) continue;
          const ni = ci + di, nj = cj + dj;
          if (ni < 0 || nj < 0 || ni >= this.nx || nj >= this.nz) continue;
          const nIdx = nj * this.nx + ni;
          if (!this.grid[nIdx] || closed[nIdx]) continue;
          // No cutting corners past a blocked orthogonal neighbour.
          if (di && dj && (!this.grid[cj * this.nx + ni] || !this.grid[nj * this.nx + ci])) continue;
          const cost = g[cur]! + (di && dj ? Math.SQRT2 : 1);
          if (cost < g[nIdx]!) {
            g[nIdx] = cost;
            came[nIdx] = cur;
            heap.push(cost + h(ni, nj), nIdx);
          }
        }
      }
    }
    if (!found) return [];
    const cells: Array<[number, number]> = [];
    for (let c = tIdx; c !== -1; c = came[c]!) {
      const i = c % this.nx;
      cells.push(this.center(i, (c - i) / this.nx));
    }
    cells.reverse();
    const lastCell = cells[cells.length - 1]!;
    if (this.segmentFree(lastCell[0], lastCell[1], target[0], target[1])) cells.push(target);
    // String pulling: skip to the farthest waypoint that can be reached in a straight line.
    const out: Array<[number, number]> = [];
    let ax = fromX, az = fromZ, i = 0;
    while (i < cells.length - 1) {
      let j = cells.length - 1;
      while (j > i + 1 && !this.segmentFree(ax, az, cells[j]![0], cells[j]![1])) j--;
      out.push(cells[j]!);
      [ax, az] = cells[j]!;
      i = j;
    }
    if (!out.length) out.push(target);
    return out;
  }
}

function zoneRect(z: WalkZone): Rect {
  if (Array.isArray(z)) return z;
  const [cx, cz, r] = z.circle;
  return [cx - r, cz - r, cx + r, cz + r];
}

function inZone(z: WalkZone, x: number, zz: number, inset: number): boolean {
  if (Array.isArray(z)) return x >= z[0] + inset && x <= z[2] - inset && zz >= z[1] + inset && zz <= z[3] - inset;
  const [cx, cz, r] = z.circle;
  return Math.hypot(x - cx, zz - cz) <= r - inset;
}

function blockerRect(b: Blocker, pad: number): Rect {
  if (b.kind === 'rect') return [b.r[0] - pad, b.r[1] - pad, b.r[2] + pad, b.r[3] + pad];
  if (b.kind === 'obb') {
    const e = Math.abs(Math.cos(b.angle)) * b.hx + Math.abs(Math.sin(b.angle)) * b.hz;
    const f = Math.abs(Math.sin(b.angle)) * b.hx + Math.abs(Math.cos(b.angle)) * b.hz;
    return [b.cx - e - pad, b.cz - f - pad, b.cx + e + pad, b.cz + f + pad];
  }
  return [b.cx - b.rx - pad, b.cz - b.rz - pad, b.cx + b.rx + pad, b.cz + b.rz + pad];
}

function inBlocker(b: Blocker, x: number, z: number, pad: number): boolean {
  if (b.kind === 'rect') return x > b.r[0] - pad && x < b.r[2] + pad && z > b.r[1] - pad && z < b.r[3] + pad;
  if (b.kind === 'obb') {
    // Into the box's own frame (a turn about Y by `angle` maps local (x, z) to world (x cos + z sin, -x sin + z cos)).
    const dx = x - b.cx, dz = z - b.cz;
    const lx = dx * Math.cos(b.angle) - dz * Math.sin(b.angle);
    const lz = dx * Math.sin(b.angle) + dz * Math.cos(b.angle);
    return Math.abs(lx) < b.hx + pad && Math.abs(lz) < b.hz + pad;
  }
  const rx = b.rx + pad, rz = b.rz + pad;
  return ((x - b.cx) / rx) ** 2 + ((z - b.cz) / rz) ** 2 < 1;
}
