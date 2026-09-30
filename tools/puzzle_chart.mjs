// Draws the puzzle dependency chart (Ron Gilbert style: puzzles as boxes, arrows for "needs", left to right)
// for all six places, from the chain in SOLUTIONS.md. Marks every point where a player can be stuck with no
// visible next step. Output: REVIEW/puzzle_chart.svg and .png.
import { writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

// Nodes: id, label, column (place), row, kind: step | dive | item | sketch | hidden | start | end
const places = ['Street', 'Shop', 'Drawer', 'Cat', 'Eye', 'Moon', 'Night street'];
const N = [
  ['start', 'Begin: street at dusk', 0, 1, 'start'],
  ['d1', 'Dive: open shop door', 0, 2, 'dive'],
  ['s1', 'Sketch S1 lighthouse', 0, 0, 'sketch'],
  ['h1', 'Umbrella · Ship in bottle', 0, 3, 'hidden'],
  ['key', 'Take key (counter)', 1, 1, 'step'],
  ['drawer', 'Unlock blue drawer', 1, 2, 'step'],
  ['d2', 'Dive: open drawer', 1, 3, 'dive'],
  ['s2', 'Sketch S2 counter+clock', 1, 0, 'sketch'],
  ['h2', 'Teacup star · Marble', 1, 4, 'hidden'],
  ['env', 'Open envelope (letter hill)', 2, 1, 'step'],
  ['feather', 'Take feather', 2, 2, 'step'],
  ['nose', 'Feather on cat nose', 2, 3, 'step'],
  ['d3', 'Dive: cat neck fur', 2, 4, 'dive'],
  ['s3', 'Sketch S3 key bridge', 2, 0, 'sketch'],
  ['h3', 'Paper boat · Moon stamp', 2, 5, 'hidden'],
  ['ear', 'Feather on ear (look up)', 3, 2, 'step'],
  ['d4', 'Dive: open eye', 3, 3, 'dive'],
  ['s4', 'Sketch S4 bell charm', 3, 0, 'sketch'],
  ['h4', 'Flea · Fish bone', 3, 4, 'hidden'],
  ['lamp', 'Cover reflected lamp', 4, 2, 'step'],
  ['d5', 'Dive: pupil', 4, 3, 'dive'],
  ['s5', 'Sketch S5 star line', 4, 0, 'sketch'],
  ['h5', 'Comet · Tiny lighthouse', 4, 4, 'hidden'],
  ['light', 'Take light (crater)', 5, 1, 'step'],
  ['moonlamp', 'Light in old lamp (rise)', 5, 2, 'step'],
  ['d6', 'Dive: moon edge', 5, 3, 'dive'],
  ['s6', 'Sketch S6 harbor below', 5, 0, 'sketch'],
  ['h6', 'Footprint · Glove', 5, 4, 'hidden'],
  ['end', 'Ending: street at night', 6, 2, 'end'],
];
const E = [
  ['start', 'd1'], ['d1', 'key'], ['key', 'drawer'], ['drawer', 'd2'], ['d2', 'env'], ['env', 'feather'], ['feather', 'nose'], ['nose', 'd3'],
  ['feather', 'ear', 'feather kept'], ['d3', 'ear'], ['ear', 'd4'], ['d4', 'lamp'], ['lamp', 'd5'], ['d5', 'light'], ['light', 'moonlamp'], ['moonlamp', 'd6'], ['d6', 'end'],
  ['start', 's1', 'optional'], ['start', 'h1', 'optional'], ['d1', 's2', 'optional'], ['d1', 'h2', 'optional'], ['d2', 's3', 'optional'], ['d2', 'h3', 'optional'],
  ['d3', 's4', 'optional'], ['d3', 'h4', 'optional'], ['d4', 's5', 'optional'], ['d4', 'h5', 'optional'], ['d5', 's6', 'optional'], ['d5', 'h6', 'optional'],
];
// Stuck points: where nothing in view says what to do next. Severity: red = nothing visible at all; amber = visible but easy to miss.
const STUCK = {
  d1: ['amber', 'Only the glow says the door is enterable'],
  key: ['red', 'Key is a tiny thing on the counter; nothing points to it (fixed this round: sketchbook page + glint on rattle)'],
  drawer: ['amber', 'Locked drawer rattles and shows a keyhole; which drawer is the only colour cue'],
  env: ['red', 'Envelope with its flap up is on the letter hill, not visible from arrival; must walk up'],
  nose: ['red', '"Use feather on nose" is not signposted; the cat is a shape across the drawer'],
  ear: ['red', 'The ear is 45° up; players rarely look up'],
  lamp: ['red', '"Cover the reflected lamp" is abstract; nothing shows that the pupil widens in the dark'],
  light: ['red', 'The light is a spark in a small crater; needs zoom to see'],
  moonlamp: ['amber', 'Empty socket + rattle say "put something in"; the rise must be climbed'],
  d6: ['amber', 'The edge opening is below the rise; must look down'],
};
const W = 190, H = 46, GX = 230, GY = 74, X0 = 40, Y0 = 70;
const pos = Object.fromEntries(N.map(([id, , c, r]) => [id, [X0 + c * GX, Y0 + r * GY]]));
const fill = { step: '#f2b75b', dive: '#9fb0ff', item: '#fff', sketch: '#f1e6cf', hidden: '#e8e8e8', start: '#bfe3c0', end: '#bfe3c0' };
let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${X0 * 2 + 7 * GX}" height="${Y0 + 6 * GY + 120}" font-family="Georgia, serif" font-size="12">
<rect width="100%" height="100%" fill="#fbf7ee"/>
<defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#333"/></marker>
<marker id="ao" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#999"/></marker></defs>
<text x="${X0}" y="30" font-size="18">Into the Cat's Eye — puzzle dependency chart (from SOLUTIONS.md). Arrow = "needs". Red dot = player can be stuck with nothing visible; amber = visible but easy to miss.</text>`;
places.forEach((p, i) => { svg += `<text x="${X0 + i * GX + W / 2}" y="${Y0 - 22}" text-anchor="middle" font-size="14" font-weight="bold">${p}</text>`; });
for (const [a, b, note] of E) {
  const [ax, ay] = pos[a], [bx, by] = pos[b];
  const opt = note === 'optional';
  const x1 = ax + W, y1 = ay + H / 2, x2 = bx, y2 = by + H / 2;
  const sameCol = ax === bx;
  const d = sameCol ? `M${ax + W / 2} ${ay + H} L${bx + W / 2} ${by}` : `M${x1} ${y1} C ${x1 + 40} ${y1}, ${x2 - 40} ${y2}, ${x2} ${y2}`;
  svg += `<path d="${d}" fill="none" stroke="${opt ? '#999' : '#333'}" stroke-width="${opt ? 1 : 2}" ${opt ? 'stroke-dasharray="5 4"' : ''} marker-end="url(#${opt ? 'ao' : 'a'})"/>`;
  if (note && !opt) svg += `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 6}" text-anchor="middle" font-size="10" fill="#555">${note}</text>`;
}
for (const [id, label, , , kind] of N) {
  const [x, y] = pos[id];
  svg += `<rect x="${x}" y="${y}" width="${W}" height="${H}" rx="6" fill="${fill[kind]}" stroke="#333"/>`;
  svg += `<text x="${x + W / 2}" y="${y + H / 2 + 4}" text-anchor="middle">${label}</text>`;
  const st = STUCK[id];
  if (st) svg += `<circle cx="${x + W - 8}" cy="${y + 8}" r="7" fill="${st[0] === 'red' ? '#d23b2f' : '#e8a23b'}" stroke="#333"/>`;
}
let ly = Y0 + 6 * GY + 20;
svg += `<text x="${X0}" y="${ly}" font-size="13" font-weight="bold">Stuck points</text>`;
for (const [id, [sev, why]] of Object.entries(STUCK)) {
  ly += 16;
  const label = N.find((n) => n[0] === id)[1];
  svg += `<circle cx="${X0 + 6}" cy="${ly - 4}" r="5" fill="${sev === 'red' ? '#d23b2f' : '#e8a23b'}" stroke="#333"/><text x="${X0 + 18}" y="${ly}">${label}: ${why}</text>`;
}
svg += `<text x="${X0}" y="${ly + 24}" font-size="11" fill="#555">Optional finds (dashed) never block. Sketches lock from the spot they were drawn from; hidden things need zoom. The feather is carried from the drawer into the cat. Back out is always available.</text></svg>`;
writeFileSync('REVIEW/puzzle_chart.svg', svg);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: X0 * 2 + 7 * GX, height: Y0 + 6 * GY + 120 } });
await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
await page.screenshot({ path: 'REVIEW/puzzle_chart.png' });
await browser.close();
console.log('wrote REVIEW/puzzle_chart.svg and .png');
