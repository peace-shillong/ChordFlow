import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function createPng(width, height, drawFn) {
  const bytesPerPixel = 4;
  const scanlineLength = width * bytesPerPixel + 1;
  const rawData = Buffer.alloc(scanlineLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * bytesPerPixel;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression method
  ihdr[11] = 0; // filter method
  ihdr[12] = 0; // interlace method

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crcTarget = chunk.subarray(4, 8 + len);
  const crc = crc32(crcTarget);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

// CRC32 implementation
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

// Drawing function for ChordFlow icon
function drawChordFlowIcon(x, y, w, h, isMaskable = false) {
  const nx = x / w;
  const ny = y / h;
  const cx = 0.5;
  const cy = 0.5;
  const distCenter = Math.hypot(nx - cx, ny - cy);

  // Background gradient: Indigo/Purple -> Deep Navy
  const bgR = Math.round(15 + (nx * 80) + (1 - ny) * 20);
  const bgG = Math.round(20 + (ny * 30));
  const bgB = Math.round(50 + (nx * 140) + (ny * 30));

  let r = Math.min(255, bgR);
  let g = Math.min(255, bgG);
  let b = Math.min(255, bgB);
  let a = 255;

  // Maskable border radius check or round rect for non-maskable
  if (!isMaskable) {
    const rx = 0.22;
    // Rounded corner distance
    const qx = Math.max(0, Math.abs(nx - 0.5) - (0.5 - rx));
    const qy = Math.max(0, Math.abs(ny - 0.5) - (0.5 - rx));
    const qDist = Math.hypot(qx, qy);
    if (qDist > rx) {
      return [0, 0, 0, 0];
    }
  }

  // Central glowing ring / waveform
  const ringDist = Math.abs(distCenter - 0.28);
  if (ringDist < 0.04) {
    const glow = 1 - (ringDist / 0.04);
    r = Math.round(r * (1 - glow) + 99 * glow * 2.2);
    g = Math.round(g * (1 - glow) + 102 * glow * 2.2);
    b = Math.round(b * (1 - glow) + 241 * glow * 2.5);
  }

  // Vertical strings
  const stringXPositions = [0.28, 0.37, 0.46, 0.55, 0.64, 0.73];
  for (const sx of stringXPositions) {
    if (Math.abs(nx - sx) < 0.006 && ny > 0.22 && ny < 0.78) {
      r = Math.min(255, r + 90);
      g = Math.min(255, g + 90);
      b = Math.min(255, b + 120);
    }
  }

  // Music Note / Strum wave overlay
  // Wave: y = 0.5 + 0.18 * sin(nx * 8 - 1)
  const waveY = 0.52 + 0.15 * Math.sin(nx * 7.5 - 0.5);
  if (Math.abs(ny - waveY) < 0.022 && nx > 0.2 && nx < 0.8) {
    const waveIntensity = 1 - Math.abs(ny - waveY) / 0.022;
    r = Math.round(r * (1 - waveIntensity) + 236 * waveIntensity);
    g = Math.round(g * (1 - waveIntensity) + 72 * waveIntensity);
    b = Math.round(b * (1 - waveIntensity) + 153 * waveIntensity);
  }

  return [Math.min(255, r), Math.min(255, g), Math.min(255, b), a];
}

const iconsDir = path.resolve('./icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate 192x192
const png192 = createPng(192, 192, (x, y, w, h) => drawChordFlowIcon(x, y, w, h, false));
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), png192);

// Generate 512x512
const png512 = createPng(512, 512, (x, y, w, h) => drawChordFlowIcon(x, y, w, h, false));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), png512);

// Generate 512x512 maskable
const png512Maskable = createPng(512, 512, (x, y, w, h) => drawChordFlowIcon(x, y, w, h, true));
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-512.png'), png512Maskable);

// Generate Apple Touch Icon 180x180
const pngApple = createPng(180, 180, (x, y, w, h) => drawChordFlowIcon(x, y, w, h, false));
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), pngApple);

console.log("✓ Successfully generated PNG icons in ./icons/");
