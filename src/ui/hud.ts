// The heads-up layer: ribbon, crosshair, verb, ring, buttons, pocket, held-up sketch card, captions, onboarding, level-3 arrow.
import type { GameState } from '../game/types';
import type { World } from '../game/world';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (text !== undefined) e.textContent = text;
  return e;
}

export interface HudButtons {
  back: HTMLButtonElement;
  book: HTMLButtonElement;
  hints: HTMLButtonElement;
  menu: HTMLButtonElement;
  lens: HTMLButtonElement;
}

export class Hud {
  readonly root: HTMLElement;
  readonly ribbon = el('nav', { id: 'ribbon', 'data-ui': '', 'aria-label': 'Where you are' });
  readonly crosshair = el('div', { id: 'crosshair', 'aria-hidden': 'true' });
  readonly ring = el('div', { id: 'ring', 'aria-hidden': 'true' });
  readonly verb = el('div', { id: 'verb', role: 'status', 'aria-live': 'polite' });
  readonly caption = el('div', { id: 'caption', role: 'status', 'aria-live': 'polite' });
  readonly toast = el('div', { id: 'toast', role: 'status', 'aria-live': 'polite' });
  readonly pocket = el('div', { id: 'pocket', 'aria-label': 'Your pocket' });
  readonly card = el('div', { id: 'card', 'aria-hidden': 'true' });
  readonly cardStored = el('canvas');
  readonly cardLive = el('canvas', { class: 'live' });
  readonly lockfx = el('div', { id: 'lockfx', 'aria-hidden': 'true' });
  readonly fade = el('div', { id: 'fade', 'aria-hidden': 'true' });
  readonly onboard = el('div', { id: 'onboard', 'aria-hidden': 'true' });
  readonly arrow = el('div', { id: 'arrow', 'aria-hidden': 'true' });
  readonly arrowTip = el('div', { class: 'tip' }, '➜');
  readonly buttons: HudButtons;
  private captionTimer = 0;
  private toastTimer = 0;
  private onboardDrag = el('div', { class: 'hint' });
  private onboardLens = el('div', { class: 'hint' });

  constructor(root: HTMLElement, world: World) {
    this.root = root;
    const s = world.strings;
    const left = el('div', { id: 'bar-left', 'data-ui': '' });
    const right = el('div', { id: 'bar-right', 'data-ui': '' });
    const bottom = el('div', { id: 'bar-bottom', 'data-ui': '' });
    const back = el('button', { class: 'btn', 'aria-label': s.verbs.back, title: `${s.verbs.back} (X)` }, '◀ ' + s.verbs.back);
    const book = el('button', { class: 'btn', 'aria-label': s.verbs.book, title: `${s.verbs.book} (B)` }, '📖');
    const hints = el('button', { class: 'btn', 'aria-label': s.verbs.hints, title: `${s.verbs.hints} (H)` }, '?');
    const menu = el('button', { class: 'btn', 'aria-label': s.verbs.menu, title: `${s.verbs.menu} (Esc)` }, '☰');
    const lens = el('button', { id: 'lens', class: 'btn holdable', 'aria-label': s.verbs.lens, title: `${s.verbs.lens} (hold Z)` }, '🔍');
    left.append(back);
    right.append(book, hints, menu);
    bottom.append(lens);
    this.buttons = { back, book, hints, menu, lens };
    this.card.append(this.cardStored, this.cardLive, el('div', { class: 'tag' }, 'held up'));
    this.onboardDrag.append(el('div', { class: 'icon' }, '✋'), el('div', {}, s.onboarding.drag));
    this.onboardLens.append(el('div', { class: 'icon' }, '🔍'), el('div', {}, s.onboarding.lens));
    this.onboard.append(this.onboardDrag, this.onboardLens);
    this.arrow.append(this.arrowTip);
    root.append(this.fade, this.lockfx, this.ribbon, left, right, bottom, this.pocket, this.card, this.crosshair, this.ring, this.verb, this.caption, this.toast, this.onboard, this.arrow);
  }

  setRibbon(world: World, state: GameState): void {
    this.ribbon.replaceChildren();
    const visited = new Set(state.stack.map((s) => s.place));
    const atNight = state.place === 'street_night';
    world.ribbon.forEach((id, i) => {
      if (i > 0) this.ribbon.append(el('span', { class: 'sep' }, '›'));
      const chip = el('span', { class: 'chip' }, world.places[id]!.label);
      if (id === state.place || (atNight && i === 0)) chip.classList.add('here');
      else if (visited.has(id)) chip.classList.add('visited');
      if (atNight && i === 0) {
        chip.classList.add('night');
        chip.textContent = '☾ ' + chip.textContent;
      }
      this.ribbon.append(chip);
    });
    this.ribbon.setAttribute('aria-label', `Where you are: ${world.places[state.place]!.label}, depth ${state.stack.length + 1}`);
  }

  setVerb(text: string | null, dive = false): void {
    this.verb.textContent = text ?? '';
    this.verb.classList.toggle('show', !!text);
    this.crosshair.classList.toggle('active', !!text);
    this.crosshair.classList.toggle('dive', dive);
  }

  setRing(fill: number): void {
    this.ring.style.setProperty('--fill', `${Math.round(fill * 100)}%`);
    this.ring.classList.toggle('show', fill > 0);
  }

  showCaption(text: string, ms = 1800): void {
    this.caption.textContent = text;
    this.caption.classList.add('show');
    clearTimeout(this.captionTimer);
    this.captionTimer = window.setTimeout(() => this.caption.classList.remove('show'), ms);
  }

  showToast(text: string, ms = 2200): void {
    this.toast.textContent = text;
    this.toast.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toast.classList.remove('show'), ms);
  }

  setPocket(text: string | null): void {
    this.pocket.textContent = text ?? '';
  }

  showCard(stored: HTMLCanvasElement | null): void {
    if (!stored) {
      this.card.classList.remove('show');
      return;
    }
    this.cardStored.width = stored.width;
    this.cardStored.height = stored.height;
    this.cardStored.getContext('2d')!.drawImage(stored, 0, 0);
    this.cardLive.width = 160;
    this.cardLive.height = 120;
    this.cardLive.style.opacity = '0';
    this.card.classList.add('show');
  }

  setLive(warm: number): void {
    this.cardLive.style.opacity = String(Math.min(1, warm));
  }

  lockEffect(stored: HTMLCanvasElement): void {
    this.lockfx.style.backgroundImage = `url(${stored.toDataURL()})`;
    this.lockfx.classList.remove('show');
    void this.lockfx.offsetWidth;
    this.lockfx.classList.add('show');
  }

  setFade(on: boolean, instant = false): void {
    this.fade.classList.toggle('instant', instant);
    this.fade.classList.toggle('on', on);
  }

  setOnboard(drag: boolean, lens: boolean): void {
    this.onboardDrag.classList.toggle('done', drag);
    this.onboardLens.classList.toggle('done', lens);
    this.onboard.style.display = drag && lens ? 'none' : '';
  }

  setLensHeld(held: boolean): void {
    this.buttons.lens.classList.toggle('held', held);
  }

  /** Level-3 hint: point at a screen position, or at the screen edge toward an off-screen target. */
  pointAt(ndc: { x: number; y: number; behind: boolean } | null, width: number, height: number): void {
    if (!ndc) {
      this.arrow.classList.remove('show');
      return;
    }
    this.arrow.classList.add('show');
    let x = ndc.x;
    let y = -ndc.y;
    if (ndc.behind) {
      x = -x;
      y = -y;
    }
    const onScreen = !ndc.behind && Math.abs(x) < 0.92 && Math.abs(y) < 0.85;
    if (onScreen) {
      const sx = ((x + 1) / 2) * width;
      const sy = ((y + 1) / 2) * height;
      this.arrow.style.transform = `translate(${sx - width / 2}px, ${sy - height / 2 - 40}px)`;
      this.arrowTip.style.transform = 'rotate(90deg) translate(-50%, -100%)';
    } else {
      const ang = Math.atan2(y, x);
      const r = 0.42;
      const sx = width / 2 + Math.cos(ang) * r * width;
      const sy = height / 2 + Math.sin(ang) * r * height;
      this.arrow.style.transform = `translate(${sx - width / 2}px, ${sy - height / 2}px)`;
      this.arrowTip.style.transform = `rotate(${(ang * 180) / Math.PI}deg) translate(-50%, -50%)`;
    }
  }
}
