// Recorders. The session log is off by default; the observer turns it on. The frame recorder runs with ?perf=1.
// Nothing is sent anywhere. Both download a JSON file on request.

export interface LogEvent {
  t: number; // ms since the log started
  at: string; // ISO time
  kind: string;
  detail?: Record<string, unknown>;
}

export function downloadJson(name: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export class SessionLog {
  on = false;
  private events: LogEvent[] = [];
  private t0 = 0;

  start(): void {
    this.on = true;
    this.t0 = performance.now();
    this.events = [];
    this.record('log_started');
  }

  stop(): void {
    this.on = false;
  }

  record(kind: string, detail?: Record<string, unknown>): void {
    if (!this.on) return;
    const e: LogEvent = { t: Math.round(performance.now() - this.t0), at: new Date().toISOString(), kind };
    if (detail) e.detail = detail;
    this.events.push(e);
  }

  download(): void {
    downloadJson(`hunt-world-001-session-${Date.now()}.json`, {
      world: 'hunt-world-001 step 1',
      userAgent: navigator.userAgent,
      screen: { w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio },
      events: this.events,
    });
  }
}

export class FrameRecorder {
  frames: number[] = [];
  marks: Array<{ frame: number; label: string }> = [];
  private last = 0;
  readonly limit = 120_000;

  tick(now: number): void {
    if (this.last) {
      if (this.frames.length < this.limit) this.frames.push(Math.round((now - this.last) * 100) / 100);
    }
    this.last = now;
  }

  mark(label: string): void {
    this.marks.push({ frame: this.frames.length, label });
  }

  summary(): { count: number; median: number; p95: number; p99: number } {
    const s = [...this.frames].sort((a, b) => a - b);
    const q = (p: number) => s[Math.min(s.length - 1, Math.floor(p * s.length))] ?? 0;
    return { count: s.length, median: q(0.5), p95: q(0.95), p99: q(0.99) };
  }

  download(extra: Record<string, unknown>): void {
    downloadJson(`hunt-world-001-frames-${Date.now()}.json`, {
      note: 'Frame times in ms from requestAnimationFrame deltas. Not JavaScript-only timing.',
      userAgent: navigator.userAgent,
      screen: { w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio },
      summary: this.summary(),
      marks: this.marks,
      frames: this.frames,
      ...extra,
    });
  }
}
