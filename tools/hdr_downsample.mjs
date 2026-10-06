// Halves a Radiance RGBE .hdr with a 2x2 box filter and writes it with new-style RLE scanlines.
// Plain Node, no dependencies for the conversion; the check afterwards decodes both files with three's own
// HDRLoader and compares mean RGB and the brightest pixel's direction (the sun must not move).
// Usage: node tools/hdr_downsample.mjs [in.hdr] [out.hdr]
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const HDRI = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets', 'polyhaven', 'hdri');
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const inPath = args[0] ?? join(HDRI, 'belfast_sunset_puresky_2k.hdr');
const outPath = args[1] ?? join(HDRI, 'belfast_sunset_puresky_1k.hdr');

/** Parses header and pixels into linear float RGB (three's convention: mantissa * 2^(e-136)). */
function decode(buf) {
  let pos = 0;
  const line = () => {
    const end = buf.indexOf(0x0a, pos);
    if (end < 0) throw new Error('truncated header');
    const s = buf.toString('latin1', pos, end);
    pos = end + 1;
    return s;
  };
  const header = [];
  for (let s = line(); s !== ''; s = line()) header.push(s);
  if (!header[0].startsWith('#?')) throw new Error('not a Radiance file');
  if (!header.some((s) => /^FORMAT=32-bit_rle_rgbe\s*$/.test(s))) throw new Error('unsupported FORMAT');
  const dims = /^-Y (\d+) \+X (\d+)$/.exec(line().trim());
  if (!dims) throw new Error('only "-Y h +X w" orientation is supported');
  const h = Number(dims[1]);
  const w = Number(dims[2]);
  const rgb = new Float32Array(w * h * 3);
  const scan = new Uint8Array(w * 4);
  for (let y = 0; y < h; y++) {
    if (w >= 8 && w < 0x8000 && buf[pos] === 2 && buf[pos + 1] === 2 && !(buf[pos + 2] & 0x80)) {
      if (((buf[pos + 2] << 8) | buf[pos + 3]) !== w) throw new Error(`scanline ${y}: width mismatch`);
      pos += 4;
      for (let c = 0; c < 4; c++) {
        let x = 0;
        while (x < w) {
          let n = buf[pos++];
          if (n > 128) {
            n -= 128;
            const v = buf[pos++];
            if (x + n > w) throw new Error(`scanline ${y}: run overflows`);
            for (let k = 0; k < n; k++) scan[(x++) * 4 + c] = v;
          } else {
            if (n === 0 || x + n > w) throw new Error(`scanline ${y}: bad count`);
            for (let k = 0; k < n; k++) scan[(x++) * 4 + c] = buf[pos++];
          }
        }
      }
    } else {
      // Flat scanline (old-style RLE is not used by Poly Haven and is rejected).
      for (let x = 0; x < w; x++) {
        if (buf[pos] === 1 && buf[pos + 1] === 1 && buf[pos + 2] === 1) throw new Error('old-style RLE not supported');
        for (let c = 0; c < 4; c++) scan[x * 4 + c] = buf[pos++];
      }
    }
    for (let x = 0; x < w; x++) {
      const e = scan[x * 4 + 3];
      const f = e === 0 ? 0 : Math.pow(2, e - 136);
      for (let c = 0; c < 3; c++) rgb[(y * w + x) * 3 + c] = scan[x * 4 + c] * f;
    }
  }
  return { w, h, rgb, header };
}

/** Round half to even, so averages of four (often exactly .5) carry no upward bias. */
const roundEven = (x) => {
  const r = Math.round(x);
  return r - x === 0.5 && r % 2 ? r - 1 : r;
};

/** One float RGB to RGBE, rounding the mantissas so the mean is kept under three's decoding. */
function toRGBE(r, g, b, out, o) {
  const v = Math.max(r, g, b);
  if (!(v > 1e-32)) {
    out[o] = out[o + 1] = out[o + 2] = out[o + 3] = 0;
    return;
  }
  let e = Math.ceil(Math.log2(v));
  if (v / Math.pow(2, e) >= 1) e++;
  if (roundEven((v * 256) / Math.pow(2, e)) > 255) e++;
  const s = 256 / Math.pow(2, e);
  out[o] = Math.min(255, roundEven(r * s));
  out[o + 1] = Math.min(255, roundEven(g * s));
  out[o + 2] = Math.min(255, roundEven(b * s));
  out[o + 3] = e + 128;
}

/** Ward's new-style RLE: runs of 4+ equal bytes as (128+n, value), the rest as literal chunks of up to 128. */
function rleChannel(data, parts) {
  const n = data.length;
  let i = 0;
  while (i < n) {
    let run = 1;
    while (i + run < n && run < 127 && data[i + run] === data[i]) run++;
    if (run >= 4) {
      parts.push(128 + run, data[i]);
      i += run;
      continue;
    }
    let j = i;
    while (j < n && j - i < 128) {
      let r = 1;
      while (j + r < n && r < 4 && data[j + r] === data[j]) r++;
      if (r >= 4) break;
      j++;
    }
    parts.push(j - i);
    for (let k = i; k < j; k++) parts.push(data[k]);
    i = j;
  }
}

function encode({ w, h, rgb, header }) {
  const head = [header[0], `# 2x box-filtered to ${w}x${h} from ${basename(inPath)} (CC0, Poly Haven) by tools/hdr_downsample.mjs`, ...header.slice(1)];
  const parts = [];
  const rgbe = new Uint8Array(w * 4);
  const chan = new Uint8Array(w);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) toRGBE(rgb[(y * w + x) * 3], rgb[(y * w + x) * 3 + 1], rgb[(y * w + x) * 3 + 2], rgbe, x * 4);
    parts.push(2, 2, w >> 8, w & 0xff);
    for (let c = 0; c < 4; c++) {
      for (let x = 0; x < w; x++) chan[x] = rgbe[x * 4 + c];
      rleChannel(chan, parts);
    }
  }
  return Buffer.concat([Buffer.from(`${head.join('\n')}\n\n-Y ${h} +X ${w}\n`, 'latin1'), Buffer.from(parts)]);
}

function halve({ w, h, rgb, header }) {
  const W = w >> 1;
  const H = h >> 1;
  const out = new Float32Array(W * H * 3);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      for (let c = 0; c < 3; c++) {
        const a = (yy, xx) => rgb[(yy * w + xx) * 3 + c];
        out[(y * W + x) * 3 + c] = (a(2 * y, 2 * x) + a(2 * y, 2 * x + 1) + a(2 * y + 1, 2 * x) + a(2 * y + 1, 2 * x + 1)) / 4;
      }
  return { w: W, h: H, rgb: out, header };
}

const src = readFileSync(inPath);
const img = decode(src);
if (img.w % 2 || img.h % 2) throw new Error('odd dimensions');
const small = halve(img);
const out = encode(small);
writeFileSync(outPath, out);
console.log(`${basename(inPath)} ${img.w}x${img.h} ${src.length} bytes -> ${basename(outPath)} ${small.w}x${small.h} ${out.length} bytes`);

// Check with three's own parser (independent of the decoder above).
const THREE = await import('three');
const { HDRLoader } = await import('three/examples/jsm/loaders/HDRLoader.js');
const stats = (buf) => {
  const loader = new HDRLoader().setDataType(THREE.FloatType);
  const t = loader.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length));
  const { width: w, height: h, data } = t;
  const sum = [0, 0, 0];
  let best = -1;
  let bi = 0;
  for (let i = 0; i < w * h; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    sum[0] += r;
    sum[1] += g;
    sum[2] += b;
    if (r + g + b > best) {
      best = r + g + b;
      bi = i;
    }
  }
  // Pixel centre in uv; three maps u to atan2(dir.z, dir.x) and v to latitude.
  const u = ((bi % w) + 0.5) / w;
  const v = (Math.floor(bi / w) + 0.5) / h;
  return { w, h, mean: sum.map((s) => s / (w * h)), peak: best, u, v };
};
const a = stats(src);
const b = stats(out);
const fmt = (s) => `${s.w}x${s.h} mean RGB (${s.mean.map((m) => m.toFixed(4)).join(', ')}) brightest at u ${s.u.toFixed(4)} v ${s.v.toFixed(4)} (r+g+b ${s.peak.toFixed(1)})`;
console.log('three HDRLoader, original:', fmt(a));
console.log('three HDRLoader, halved:  ', fmt(b));
const meanDiff = Math.max(...a.mean.map((m, k) => Math.abs(b.mean[k] - m) / m));
const du = Math.abs(a.u - b.u) * 360;
const dv = Math.abs(a.v - b.v) * 180;
console.log(`mean RGB differs by at most ${(meanDiff * 100).toFixed(3)}%; sun moved ${du.toFixed(2)} deg in azimuth, ${dv.toFixed(2)} deg in elevation (one output pixel is ${(360 / b.w).toFixed(2)} deg)`);
if (meanDiff > 0.01 || du > 360 / b.w || dv > 180 / b.h) {
  console.error('check FAILED');
  process.exit(1);
}
console.log('check ok');
