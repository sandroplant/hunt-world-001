// Debug tools: dev builds only (?debug=1). Stripped from the playtest build by the __PLAYTEST__ constant.
import type { App } from '../main';

export function installDebug(app: App): void {
  const panel = document.createElement('div');
  panel.id = 'debug';
  panel.setAttribute('data-ui', '');
  panel.classList.add('show');
  const sel = document.createElement('select');
  for (const id of app.world.order) {
    const o = document.createElement('option');
    o.value = id;
    o.textContent = id;
    sel.append(o);
  }
  const jump = document.createElement('button');
  jump.textContent = 'Jump';
  jump.addEventListener('click', () => app.debugJump(sel.value));
  const step = document.createElement('button');
  step.textContent = 'Do next step';
  step.addEventListener('click', () => app.debugNextStep());
  const dump = document.createElement('pre');
  dump.style.maxHeight = '14rem';
  dump.style.overflow = 'auto';
  const fps = document.createElement('div');
  panel.append(fps, sel, jump, step, dump);
  app.ui.append(panel);
  let frames = 0;
  let last = performance.now();
  app.onFrame.push((now) => {
    frames++;
    if (now - last > 500) {
      const st = app.renderer.stats();
      fps.textContent = `${Math.round((frames * 1000) / (now - last))} fps · calls ${st.calls} · tris ${st.triangles} · ${app.state.place}/${app.state.viewpoint} yaw ${app.camera.yaw.toFixed(1)} pitch ${app.camera.pitch.toFixed(1)} zoom ${app.camera.zoom.toFixed(2)}`;
      dump.textContent = JSON.stringify({ steps: Object.keys(app.state.steps), items: app.state.items, found: Object.keys(app.state.found), stack: app.state.stack.map((s) => s.place) }, null, 1);
      frames = 0;
      last = now;
    }
  });
  (window as unknown as { __hunt: unknown }).__hunt = {
    state: () => app.state,
    view: () => ({ place: app.state.place, viewpoint: app.state.viewpoint, yaw: app.camera.yaw, pitch: app.camera.pitch, zoom: app.camera.zoom }),
    setView: (yaw: number, pitch: number, zoom: number) => app.debugSetView(yaw, pitch, zoom),
    stand: (vp: string) => app.standAt(vp),
    act: () => app.act(),
    lens: (held: boolean) => app.setLens(held),
    jump: (place: string) => app.debugJump(place),
    nextStep: () => app.debugNextStep(),
    holdUp: (id: string | null) => app.holdUp(id),
    back: () => app.backOut(),
    enter: () => app.enter(),
    diving: () => app.diving,
    stats: () => app.renderer.stats(),
    frames: () => app.frames.summary(),
    heap: () => (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? null,
    gc: () => (window as unknown as { gc?: () => void }).gc?.(),
    disposeAll: () => app.debugDisposeScenes(),
    sceneCount: () => app.sceneCount,
    hit: (x: number, y: number) => app.debugHit(x, y),
    sketch: (yaw: number, pitch: number, zoom: number) => app.debugSketch(yaw, pitch, zoom),
    sketchImage: (id: string) => app.debugSketchImage(id),
  };
}
