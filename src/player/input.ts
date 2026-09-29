// One input layer for touch, mouse and keyboard. It emits intents; it never decides game outcomes.
export interface InputHandlers {
  /** Drag in pixels. The world follows the finger: drag right to look left, drag down to look up. */
  look(dxPx: number, dyPx: number): void;
  /** Turn in degrees (arrow keys). +yaw turns left, +pitch looks up. */
  turn(dYawDeg: number, dPitchDeg: number): void;
  zoomBy(factor: number): void;
  lens(held: boolean): void;
  /** A tap or click at a screen position (CSS px). */
  act(x: number, y: number): void;
  /** The mouse moved without a button (for brightening a spot under the pointer). */
  hover(x: number, y: number): void;
  /** W, A, S or D: move toward the nearest spot in that direction relative to the view. */
  move(dir: 'forward' | 'back' | 'left' | 'right'): void;
  enter(): void;
  back(): void;
  book(): void;
  hints(): void;
  describe(): void;
  menu(): void;
  anyInput(): void;
}

export class Input {
  private keys = new Set<string>();
  private pointers = new Map<number, { x: number; y: number; startX: number; startY: number; moved: boolean; button: number }>();
  private pinchDist: number | null = null;
  private lensButtonHeld = false;
  private rightHeld = false;
  private keyLens = false;

  constructor(private target: HTMLElement, private h: InputHandlers) {
    target.addEventListener('pointerdown', this.onPointerDown);
    target.addEventListener('pointermove', this.onPointerMove);
    target.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'mouse' && e.buttons === 0) this.h.hover(e.clientX, e.clientY);
    });
    target.addEventListener('pointerup', this.onPointerUp);
    target.addEventListener('pointercancel', this.onPointerUp);
    target.addEventListener('wheel', this.onWheel, { passive: false });
    target.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.keyLens = false;
      this.syncLens();
    });
  }

  /** The on-screen lens button calls this while pressed. */
  setLensButton(held: boolean): void {
    this.lensButtonHeld = held;
    this.syncLens();
  }

  get lensHeld(): boolean {
    return this.lensButtonHeld || this.rightHeld || this.keyLens;
  }

  private syncLens(): void {
    this.h.lens(this.lensHeld);
  }

  private onPointerDown = (e: PointerEvent): void => {
    if ((e.target as HTMLElement).closest('[data-ui]')) return;
    this.h.anyInput();
    this.target.setPointerCapture?.(e.pointerId);
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, moved: false, button: e.button });
    if (e.button === 2) {
      this.rightHeld = true;
      this.syncLens();
    }
    if (this.pointers.size === 2) this.pinchDist = this.currentPinch();
  };

  private currentPinch(): number {
    const [a, b] = [...this.pointers.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  }

  private onPointerMove = (e: PointerEvent): void => {
    const p = this.pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    if (Math.hypot(e.clientX - p.startX, e.clientY - p.startY) > 6) p.moved = true;
    if (this.pointers.size === 2) {
      const d = this.currentPinch();
      if (this.pinchDist && d > 0) this.h.zoomBy(d / this.pinchDist);
      this.pinchDist = d;
      return;
    }
    if (p.button === 0 || e.pointerType === 'touch') this.h.look(dx, dy);
  };

  private onPointerUp = (e: PointerEvent): void => {
    const p = this.pointers.get(e.pointerId);
    this.pointers.delete(e.pointerId);
    if (this.pointers.size < 2) this.pinchDist = null;
    if (!p) return;
    if (p.button === 2) {
      this.rightHeld = false;
      this.syncLens();
      return;
    }
    // A tap or click without a drag is "act", at the pointer's position.
    if (!p.moved && (p.button === 0 || e.pointerType === 'touch')) this.h.act(e.clientX, e.clientY);
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    this.h.anyInput();
    const factor = Math.exp(-e.deltaY * 0.0015);
    this.h.zoomBy(factor);
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Tab') return; // Tab is never a game key.
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    this.h.anyInput();
    if (e.repeat && !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    switch (e.key) {
      case 'ArrowUp': case 'ArrowDown': case 'ArrowLeft': case 'ArrowRight':
        this.keys.add(e.key);
        e.preventDefault();
        break;
      case 'z': case 'Z':
        this.keyLens = true;
        this.syncLens();
        break;
      case 'e': case 'E':
        this.h.act(window.innerWidth / 2, window.innerHeight / 2);
        break;
      case 'w': case 'W':
        this.h.move('forward');
        break;
      case 's': case 'S':
        this.h.move('back');
        break;
      case 'a': case 'A':
        this.h.move('left');
        break;
      case 'd': case 'D':
        this.h.move('right');
        break;
      case 'Enter':
        this.h.enter();
        break;
      case 'x': case 'X': case 'Backspace':
        e.preventDefault();
        this.h.back();
        break;
      case 'b': case 'B':
        this.h.book();
        break;
      case 'h': case 'H':
        this.h.hints();
        break;
      case 'v': case 'V':
        this.h.describe();
        break;
      case 'Escape':
        this.h.menu();
        break;
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.key);
    if (e.key === 'z' || e.key === 'Z') {
      this.keyLens = false;
      this.syncLens();
    }
  };

  /** Called every frame: arrow keys turn the view at a steady rate (degrees per second). */
  update(dt: number, degPerSec = 70): void {
    let dx = 0;
    let dy = 0;
    if (this.keys.has('ArrowLeft')) dx += 1;
    if (this.keys.has('ArrowRight')) dx -= 1;
    if (this.keys.has('ArrowUp')) dy += 1;
    if (this.keys.has('ArrowDown')) dy -= 1;
    if (dx || dy) this.h.turn(dx * degPerSec * dt, dy * degPerSec * dt);
  }
}
