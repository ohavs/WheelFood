/**
 * Generates the PWA icon set with no image dependencies.
 *
 * Renders the WheelFood mark (a segmented wheel on a warm ground) into an RGBA
 * buffer with 4x supersampling, then writes a minimal PNG (IHDR/IDAT/IEND)
 * using node's built-in zlib.
 *
 *   node scripts/generate-icons.mjs
 */

import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");

const SLICE_COLORS = [
  [240, 78, 35],
  [255, 138, 61],
  [255, 176, 32],
  [246, 201, 69],
  [22, 160, 106],
  [58, 168, 193],
  [109, 107, 216],
  [227, 74, 140],
];

const BG_TOP = [255, 236, 214];
const BG_BOTTOM = [255, 195, 150];
const RIM = [255, 255, 255];
const HUB = [255, 255, 255];
const POINTER = [35, 20, 13];

const SS = 4; // supersampling factor

function mix(a, b, ratio) {
  return [a[0] + (b[0] - a[0]) * ratio, a[1] + (b[1] - a[1]) * ratio, a[2] + (b[2] - a[2]) * ratio];
}

/** Renders one icon into an RGBA Buffer of `size * size * 4`. */
function render(size, { maskable }) {
  const dim = size * SS;
  const acc = new Float64Array(size * size * 4);

  const cx = dim / 2;
  const cy = dim / 2;
  // Maskable icons must survive a circular crop: keep the mark inside 80%.
  const wheelR = dim * (maskable ? 0.31 : 0.4);
  const rimR = wheelR * 1.07;
  const hubR = wheelR * 0.2;
  const cornerR = maskable ? 0 : dim * 0.22;

  for (let y = 0; y < dim; y += 1) {
    for (let x = 0; x < dim; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      // Background: rounded square (or full bleed for maskable).
      const inRounded =
        maskable ||
        (() => {
          const qx = Math.max(cornerR - x, x - (dim - cornerR), 0);
          const qy = Math.max(cornerR - y, y - (dim - cornerR), 0);
          return qx * qx + qy * qy <= cornerR * cornerR;
        })();

      if (inRounded) {
        const bg = mix(BG_TOP, BG_BOTTOM, y / dim);
        [r, g, b] = bg;
        a = 255;
      }

      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.hypot(dx, dy);

      if (dist <= rimR) {
        [r, g, b] = RIM;
        a = 255;
      }

      if (dist <= wheelR) {
        // atan2 with y-down, shifted so slice 0 starts at 12 o'clock.
        let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
        if (angle < 0) angle += 360;
        const index = Math.floor((angle / 360) * SLICE_COLORS.length) % SLICE_COLORS.length;
        [r, g, b] = SLICE_COLORS[index];
        a = 255;
      }

      if (dist <= hubR * 1.35) {
        [r, g, b] = HUB;
        a = 255;
      }

      // Pointer: a small triangle biting into the top of the wheel.
      const py = y - (cy - rimR - dim * 0.035);
      const half = dim * 0.055;
      if (!maskable || true) {
        const spread = dim * 0.075;
        if (py >= 0 && py <= spread * 1.6) {
          const width = half * (1 - py / (spread * 1.6));
          if (Math.abs(dx) <= width) {
            [r, g, b] = POINTER;
            a = 255;
          }
        }
      }

      const ox = Math.floor(x / SS);
      const oy = Math.floor(y / SS);
      const o = (oy * size + ox) * 4;
      acc[o] += r;
      acc[o + 1] += g;
      acc[o + 2] += b;
      acc[o + 3] += a;
    }
  }

  const samples = SS * SS;
  const out = Buffer.alloc(size * size * 4);
  for (let i = 0; i < out.length; i += 1) out[i] = Math.round(acc[i] / samples);
  return out;
}

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

function encodePng(rgba, size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // truecolour + alpha
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // Each scanline is prefixed with filter type 0 (None).
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y += 1) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const TARGETS = [
  { file: "icon-192.png", size: 192, maskable: false },
  { file: "icon-512.png", size: 512, maskable: false },
  { file: "maskable-192.png", size: 192, maskable: true },
  { file: "maskable-512.png", size: 512, maskable: true },
  { file: "apple-touch-icon.png", size: 180, maskable: true },
  { file: "icon-32.png", size: 32, maskable: false },
];

mkdirSync(OUT_DIR, { recursive: true });
for (const target of TARGETS) {
  const png = encodePng(render(target.size, { maskable: target.maskable }), target.size);
  writeFileSync(join(OUT_DIR, target.file), png);
  console.log(`wrote ${target.file} (${target.size}px, ${png.length} bytes)`);
}
