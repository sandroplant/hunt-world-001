// Full-screen panels: title, menu, sketchbook, hints, describe, ending. All keyboard-reachable. Esc closes.
import type { GameState, HintLevel } from '../game/types';
import type { World } from '../game/world';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (text !== undefined) e.textContent = text;
  return e;
}

// Crude wordless outline pictures for the graybox sketchbook. Phase B replaces them with drawn outlines.
const OUTLINES: Record<string, string> = {
  'street.umbrella': '<path d="M20 40 Q50 10 80 40" fill="none" stroke="currentColor" stroke-width="4"/><path d="M50 40 V85 q0 8 8 8" fill="none" stroke="currentColor" stroke-width="4"/>',
  'street.ship_bottle': '<rect x="15" y="35" width="70" height="35" rx="16" fill="none" stroke="currentColor" stroke-width="4"/><path d="M85 52 h10" stroke="currentColor" stroke-width="6"/><path d="M35 62 h28 l-6 -8 h-16 z M49 44 v10" fill="none" stroke="currentColor" stroke-width="3"/>',
  'shop.teacup_star': '<path d="M20 40 h50 v25 q0 15 -25 15 q-25 0 -25 -15 z M70 45 q15 0 15 10 q0 10 -15 10" fill="none" stroke="currentColor" stroke-width="4"/><path d="M45 48 l3 7 h7 l-6 4 2 7 -6 -4 -6 4 2 -7 -6 -4 h7 z" fill="currentColor"/>',
  'shop.marble': '<circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" stroke-width="4"/><path d="M38 40 q12 -8 24 0" fill="none" stroke="currentColor" stroke-width="3"/>',
  'drawer.paper_boat': '<path d="M15 60 h70 l-12 18 h-46 z M50 60 v-30 l25 30 M50 30 l-25 30" fill="none" stroke="currentColor" stroke-width="4"/>',
  'drawer.stamp_moon': '<rect x="20" y="15" width="60" height="70" fill="none" stroke="currentColor" stroke-width="4" stroke-dasharray="6 4"/><circle cx="50" cy="42" r="10" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="3 3"/><path d="M28 75 l12 -10 l10 6 l12 -12 l10 16" fill="none" stroke="currentColor" stroke-width="3"/>',
  'cat.flea': '<ellipse cx="50" cy="60" rx="18" ry="12" fill="none" stroke="currentColor" stroke-width="4"/><path d="M38 40 h24 v-10 h-14 v-8 h-10 z" fill="currentColor"/><path d="M32 70 l-8 10 M68 70 l8 10 M50 72 v10" stroke="currentColor" stroke-width="3"/>',
  'cat.fishbone': '<path d="M15 50 h70 M30 50 l-8 -14 M45 50 l-8 -14 M60 50 l-8 -14 M30 50 l-8 14 M45 50 l-8 14 M60 50 l-8 14" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="85" cy="50" r="6" fill="none" stroke="currentColor" stroke-width="3"/>',
  'eye.comet': '<circle cx="70" cy="35" r="10" fill="currentColor"/><path d="M62 42 L15 80 M66 46 L30 85 M58 38 L20 65" stroke="currentColor" stroke-width="3"/>',
  'eye.lighthouse_reflection': '<path d="M42 85 l4 -55 h8 l4 55 z" fill="none" stroke="currentColor" stroke-width="4"/><rect x="40" y="18" width="20" height="12" fill="currentColor"/><path d="M60 24 l25 -8 M60 24 l25 8" stroke="currentColor" stroke-width="2"/>',
  'moon.footprint': '<ellipse cx="50" cy="60" rx="14" ry="24" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="38" cy="28" r="5" fill="currentColor"/><circle cx="50" cy="24" r="5" fill="currentColor"/><circle cx="62" cy="28" r="5" fill="currentColor"/>',
  'moon.glove': '<path d="M30 85 v-35 q0 -10 10 -10 v-15 q0 -6 6 -6 q6 0 6 6 v13 q0 -6 6 -6 q6 0 6 6 v15 q6 -4 10 2 v30 q0 10 -10 10 h-18 q-10 0 -10 -10 z" fill="none" stroke="currentColor" stroke-width="4"/>',
};

export function outlineSvg(id: string, alt: string): HTMLElement {
  const wrap = el('div', { class: 'outline', role: 'img', 'aria-label': alt, title: alt });
  wrap.innerHTML = `<svg viewBox="0 0 100 100" aria-hidden="true">${OUTLINES[id] ?? '<circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" stroke-width="4"/>'}</svg>`;
  return wrap;
}

export type PanelName = 'title' | 'menu' | 'book' | 'hints' | 'describe' | 'end';

export interface PanelCallbacks {
  begin(): void;
  restart(): void;
  keepLooking(): void;
  close(): void;
  holdUp(sketchId: string | null): void;
  hint(target: string, level: number): void;
  setSetting(key: 'reducedMotion' | 'largeText' | 'quality', value: boolean | 'auto' | 'high' | 'low'): void;
  setSessionLog(on: boolean): void;
  saveSessionLog(): void;
  savePerf(): void;
  describe(): void;
}

export class Panels {
  private panels = new Map<PanelName, HTMLElement>();
  private boxes = new Map<PanelName, HTMLElement>();
  open: PanelName | null = null;
  private lastFocus: Element | null = null;

  constructor(private root: HTMLElement, private world: World, private cb: PanelCallbacks) {
    for (const name of ['title', 'menu', 'book', 'hints', 'describe', 'end'] as PanelName[]) {
      const p = el('div', { id: name, class: 'panel', 'data-ui': '', role: 'dialog', 'aria-modal': 'true' });
      const box = el('div', { class: 'box' });
      p.append(box);
      root.append(p);
      this.panels.set(name, p);
      this.boxes.set(name, box);
    }
    // Escape is handled by the input layer (it closes any open panel, else opens the menu).
  }

  show(name: PanelName): void {
    this.hide();
    this.open = name;
    this.lastFocus = document.activeElement;
    const p = this.panels.get(name)!;
    p.classList.add('show');
    const first = p.querySelector<HTMLElement>('button, [tabindex]');
    first?.focus();
  }

  hide(): void {
    if (!this.open) return;
    this.panels.get(this.open)!.classList.remove('show');
    this.open = null;
    (this.lastFocus as HTMLElement | null)?.focus?.();
  }

  renderTitle(hasSave: boolean, storageBlocked: boolean): void {
    const s = this.world.strings;
    const box = this.boxes.get('title')!;
    box.replaceChildren(
      el('div', { class: 'label' }, s.label),
      el('h1', {}, s.title),
      el('p', {}, s.opening),
    );
    const row = el('div', { class: 'row' });
    const begin = el('button', { class: 'btn primary' }, hasSave ? s.continue : s.start);
    begin.addEventListener('click', () => this.cb.begin());
    row.append(begin);
    if (hasSave) {
      const restart = el('button', { class: 'btn' }, s.restart);
      restart.addEventListener('click', () => {
        if (confirm(s.restartConfirm)) this.cb.restart();
      });
      row.append(restart);
    }
    box.append(row);
    if (storageBlocked) box.append(el('p', { class: 'small' }, s.menu.storageBlocked));
    box.append(el('p', { class: 'small' }, 'Drag to look. Zoom with the lens. Tap or click when a verb shows. Hold the lens on a place to dive in. Keys: arrows, Z, E, X, B, H, V.'));
  }

  renderMenu(state: GameState, sessionLogOn: boolean, perfMode: boolean, storageBlocked: boolean): void {
    const s = this.world.strings;
    const box = this.boxes.get('menu')!;
    box.replaceChildren(el('div', { class: 'label' }, s.label), el('h2', {}, s.verbs.menu));
    const mk = (label: string, checked: boolean, on: (v: boolean) => void): HTMLElement => {
      const l = el('label');
      const c = el('input', { type: 'checkbox' });
      c.checked = checked;
      c.addEventListener('change', () => on(c.checked));
      l.append(c, el('span', {}, label));
      return l;
    };
    box.append(mk(s.menu.reducedMotion, state.settings.reducedMotion, (v) => this.cb.setSetting('reducedMotion', v)));
    box.append(mk(s.menu.textSize, state.settings.largeText, (v) => this.cb.setSetting('largeText', v)));
    const q = el('label');
    const sel = el('select');
    for (const [v, t] of [['auto', s.menu.auto], ['high', s.menu.high], ['low', s.menu.low]] as const) {
      const o = el('option', { value: v }, t);
      if (state.settings.quality === v) o.selected = true;
      sel.append(o);
    }
    sel.addEventListener('change', () => this.cb.setSetting('quality', sel.value as 'auto' | 'high' | 'low'));
    q.append(el('span', {}, s.menu.quality + ' '), sel);
    box.append(q);
    box.append(mk(s.menu.sessionLog, sessionLogOn, (v) => this.cb.setSessionLog(v)));
    const row = el('div', { class: 'row' });
    const resume = el('button', { class: 'btn primary' }, 'Resume');
    resume.addEventListener('click', () => this.cb.close());
    const describe = el('button', { class: 'btn' }, s.verbs.describe + ' (V)');
    describe.addEventListener('click', () => this.cb.describe());
    const saveLog = el('button', { class: 'btn' }, s.menu.saveLog);
    saveLog.addEventListener('click', () => this.cb.saveSessionLog());
    const restart = el('button', { class: 'btn' }, s.restart);
    restart.addEventListener('click', () => {
      if (confirm(s.restartConfirm)) this.cb.restart();
    });
    row.append(resume, describe, saveLog);
    if (perfMode) {
      const perf = el('button', { class: 'btn' }, 'Download frame times');
      perf.addEventListener('click', () => this.cb.savePerf());
      row.append(perf);
    }
    row.append(restart);
    box.append(row);
    if (storageBlocked) box.append(el('p', { class: 'small' }, s.menu.storageBlocked));
    box.append(el('p', { class: 'small' }, 'Controls: drag or arrow keys to look · pinch, wheel, right button or Z to zoom · tap, click, E or Enter to use · hold the lens on a place to dive · X or Backspace to back out · B sketchbook · H hints · V describe.'));
  }

  renderBook(state: GameState, sketches: Map<string, HTMLCanvasElement>, heldId: string | null, lastPage: HTMLCanvasElement): void {
    const s = this.world.strings;
    const box = this.boxes.get('book')!;
    box.replaceChildren(el('h2', {}, s.verbs.book), el('p', { class: 'small' }, s.opening));
    const pages = el('div', { class: 'pages' });
    const visited = [...state.stack.map((x) => x.place), state.place].map((p) => this.world.baseOf(p));
    const seen = new Set<string>();
    for (const placeId of visited) {
      const sk = this.world.sketchFor(placeId);
      if (!sk || seen.has(sk.id)) continue;
      seen.add(sk.id);
      const found = !!state.found[sk.id];
      const page = el('div', { class: 'page' + (found ? ' found' : '') + (heldId === sk.id ? ' held' : '') });
      const img = sketches.get(sk.id);
      const c = el('canvas', { class: 'sketch', role: 'img', 'aria-label': sk.alt, title: sk.alt });
      if (img) {
        c.width = img.width;
        c.height = img.height;
        c.getContext('2d')!.drawImage(img, 0, 0);
      }
      page.append(c);
      const outlines = el('div', { class: 'outlines' });
      for (const h of sk.hidden) {
        const o = outlineSvg(h, (s.outlines as Record<string, string>)[h] ?? h);
        if (state.found[h]) o.classList.add('found');
        outlines.append(o);
      }
      page.append(outlines);
      const hold = el('button', { class: 'btn hold' }, heldId === sk.id ? 'Put down' : found ? 'Found ✓' : 'Hold up');
      if (!found) hold.addEventListener('click', () => this.cb.holdUp(heldId === sk.id ? null : sk.id));
      else hold.disabled = true;
      page.append(hold);
      pages.append(page);
    }
    const last = el('div', { class: 'page' + (state.ended ? ' found' : '') });
    const lc = el('canvas', { class: 'sketch', role: 'img', 'aria-label': state.ended ? this.world.lastPage.altEnd : this.world.lastPage.altStart });
    lc.width = lastPage.width;
    lc.height = lastPage.height;
    lc.getContext('2d')!.drawImage(lastPage, 0, 0);
    last.append(lc, el('div', { class: 'small' }, 'the last page'));
    pages.append(last);
    box.append(pages);
    const row = el('div', { class: 'row' });
    const close = el('button', { class: 'btn primary' }, 'Close');
    close.addEventListener('click', () => this.cb.close());
    row.append(close);
    box.append(row);
  }

  renderHints(state: GameState, targets: string[]): void {
    const s = this.world.strings;
    const box = this.boxes.get('hints')!;
    box.replaceChildren(el('h2', {}, s.verbs.hints));
    if (!targets.length) box.append(el('p', {}, s.hints.none));
    const label = (t: string, i: number): string => {
      if (t.startsWith('dive:')) return 'The way on';
      if (/^S\d$/.test(t)) return 'The sketch';
      if (this.world.objects[t]?.kind === 'hidden') return `A hidden thing (${i})`;
      return 'The way on';
    };
    let hiddenIndex = 0;
    for (const t of targets) {
      const levels = this.world.hints[t] ?? [];
      const used = state.hintsUsed[t] ?? 0;
      const isHidden = this.world.objects[t]?.kind === 'hidden';
      if (isHidden) hiddenIndex++;
      const block = el('div', { class: 'hint-block' });
      block.append(el('h3', {}, label(t, hiddenIndex)));
      for (let i = 0; i < used && i < levels.length; i++) {
        const lv = levels[i] as HintLevel;
        block.append(el('p', {}, typeof lv === 'string' ? `${i + 1}. ${lv}` : `${i + 1}. (an arrow points the way)`));
      }
      if (used < levels.length) {
        const b = el('button', { class: 'btn' }, used === 0 ? 'Hint' : s.hints.more + ` (${used + 1} of ${levels.length})`);
        b.addEventListener('click', () => this.cb.hint(t, used + 1));
        block.append(b);
      }
      box.append(block);
    }
    const row = el('div', { class: 'row' });
    const close = el('button', { class: 'btn primary' }, s.hints.close);
    close.addEventListener('click', () => this.cb.close());
    row.append(close);
    box.append(row);
  }

  renderDescribe(where: string, landmarks: string[], nearby: string[], pocket: string[]): void {
    const s = this.world.strings;
    const box = this.boxes.get('describe')!;
    box.replaceChildren(el('h2', {}, s.verbs.describe), el('p', {}, `${s.describe.youAre} ${where}.`));
    const mkList = (title: string, items: string[]) => {
      box.append(el('h3', {}, title));
      const ul = el('ul');
      for (const i of items) ul.append(el('li', {}, i));
      if (!items.length) ul.append(el('li', {}, s.describe.nothing));
      box.append(ul);
    };
    mkList(s.describe.landmarks, landmarks);
    mkList(s.describe.nearby, nearby);
    if (pocket.length) mkList(s.describe.pocket, pocket);
    const row = el('div', { class: 'row' });
    const close = el('button', { class: 'btn primary' }, 'Close');
    close.addEventListener('click', () => this.cb.close());
    row.append(close);
    box.append(row);
  }

  renderEnd(stats: { time: string; finds: string; hints: string }, lastPage: HTMLCanvasElement): void {
    const s = this.world.strings;
    const box = this.boxes.get('end')!;
    box.replaceChildren(el('div', { class: 'label' }, s.label), el('h1', {}, s.title), el('p', {}, s.ending));
    const lc = el('canvas', { role: 'img', 'aria-label': this.world.lastPage.altEnd });
    lc.width = lastPage.width;
    lc.height = lastPage.height;
    lc.style.width = '16rem';
    lc.style.maxWidth = '100%';
    lc.getContext('2d')!.drawImage(lastPage, 0, 0);
    box.append(lc);
    const ul = el('ul');
    ul.append(el('li', {}, `${s.endStats.time}: ${stats.time}`), el('li', {}, `${s.endStats.finds}: ${stats.finds}`), el('li', {}, `${s.endStats.hints}: ${stats.hints}`));
    box.append(ul);
    const row = el('div', { class: 'row' });
    const keep = el('button', { class: 'btn primary' }, s.keepLooking);
    keep.addEventListener('click', () => this.cb.keepLooking());
    const restart = el('button', { class: 'btn' }, s.restart);
    restart.addEventListener('click', () => {
      if (confirm(s.restartConfirm)) this.cb.restart();
    });
    row.append(keep, restart);
    box.append(row);
  }
}

/** The last page of the sketchbook, drawn with plain shapes (Phase B replaces it with a rendered sketch). */
export function drawLastPage(ended: boolean, w = 320, h = 240): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#F1E6CF';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#1B1F2A';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(w * 0.62, h * 0.36, h * 0.2, 0, Math.PI * 2);
  ctx.stroke();
  if (ended) {
    ctx.fillStyle = 'rgba(227,179,65,0.35)';
    ctx.fill();
  }
  // craters
  for (const [x, y, r] of [[0.56, 0.3, 0.03], [0.68, 0.42, 0.045], [0.6, 0.45, 0.02]] as const) {
    ctx.beginPath();
    ctx.arc(w * x, h * y, h * r, 0, Math.PI * 2);
    ctx.stroke();
  }
  // lamp on the moon
  ctx.strokeRect(w * 0.66, h * 0.16, w * 0.035, h * 0.07);
  ctx.beginPath();
  ctx.moveTo(w * 0.6775, h * 0.23);
  ctx.lineTo(w * 0.6775, h * 0.3);
  ctx.stroke();
  if (ended) {
    ctx.fillStyle = '#E3B341';
    ctx.fillRect(w * 0.665, h * 0.17, w * 0.025, h * 0.05);
    // the cat on the step, looking up
    ctx.beginPath();
    ctx.ellipse(w * 0.3, h * 0.72, w * 0.09, h * 0.09, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w * 0.36, h * 0.6, h * 0.06, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.33, h * 0.56); ctx.lineTo(w * 0.34, h * 0.5); ctx.lineTo(w * 0.36, h * 0.55);
    ctx.moveTo(w * 0.39, h * 0.55); ctx.lineTo(w * 0.41, h * 0.5); ctx.lineTo(w * 0.42, h * 0.56);
    ctx.stroke();
    ctx.strokeRect(w * 0.15, h * 0.8, w * 0.35, h * 0.06);
  } else {
    // a street with dark lamps, from the start
    ctx.beginPath();
    ctx.moveTo(w * 0.05, h * 0.85); ctx.lineTo(w * 0.95, h * 0.85);
    ctx.moveTo(w * 0.2, h * 0.85); ctx.lineTo(w * 0.2, h * 0.6);
    ctx.moveTo(w * 0.4, h * 0.85); ctx.lineTo(w * 0.4, h * 0.65);
    ctx.stroke();
  }
  return c;
}
