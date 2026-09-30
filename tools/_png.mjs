// Minimal PNG decoder for the seam check (8-bit RGB/RGBA, non-interlaced), using Node's zlib. No dependency.
import { inflateSync } from 'node:zlib';

export const PNG = {
  decode(buf) {
    let pos = 8;
    let width = 0, height = 0, colorType = 6, bitDepth = 8;
    const idat = [];
    while (pos < buf.length) {
      const len = buf.readUInt32BE(pos);
      const type = buf.toString('ascii', pos + 4, pos + 8);
      const data = buf.subarray(pos + 8, pos + 8 + len);
      if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); bitDepth = data[8]; colorType = data[9]; }
      else if (type === 'IDAT') idat.push(data);
      else if (type === 'IEND') break;
      pos += 12 + len;
    }
    if (bitDepth !== 8) throw new Error('only 8-bit PNG');
    const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 4 ? 2 : 1;
    const raw = inflateSync(Buffer.concat(idat));
    const stride = width * channels;
    const outData = new Uint8Array(width * height * 4);
    const prev = new Uint8Array(stride);
    const cur = new Uint8Array(stride);
    let p = 0;
    for (let y = 0; y < height; y++) {
      const filter = raw[p++];
      for (let i = 0; i < stride; i++) {
        const x = raw[p++];
        const a = i >= channels ? cur[i - channels] : 0;
        const b = prev[i];
        const c = i >= channels ? prev[i - channels] : 0;
        let v;
        switch (filter) {
          case 0: v = x; break;
          case 1: v = x + a; break;
          case 2: v = x + b; break;
          case 3: v = x + ((a + b) >> 1); break;
          case 4: { const pp = a + b - c; const pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); break; }
          default: throw new Error('bad filter');
        }
        cur[i] = v & 255;
      }
      for (let x = 0; x < width; x++) {
        const o = (y * width + x) * 4;
        const s = x * channels;
        if (channels >= 3) { outData[o] = cur[s]; outData[o + 1] = cur[s + 1]; outData[o + 2] = cur[s + 2]; outData[o + 3] = channels === 4 ? cur[s + 3] : 255; }
        else { outData[o] = outData[o + 1] = outData[o + 2] = cur[s]; outData[o + 3] = channels === 2 ? cur[s + 1] : 255; }
      }
      prev.set(cur);
    }
    return { width, height, data: outData };
  },
};
