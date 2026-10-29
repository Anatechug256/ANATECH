import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';

function createPng(width, height, drawFn) {
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }

  function crc32(buf) {
    let crc = 0 ^ -1;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
    }
    return (crc ^ -1) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crcVal, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // 8 bits per channel
  ihdr[9] = 6;  // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

// Draw ANATECH shield logo with cyan glow, deep navy background, and gold star
function drawAnatechLogo(x, y, w, h, isMaskable = false) {
  const nx = x / w; // 0 to 1
  const ny = y / h; // 0 to 1

  // Base background: Deep Navy (#0A192F to #020C1B)
  let r = 10;
  let g = 25;
  let b = 47;
  let a = 255;

  // Center distance
  const cx = 0.5;
  const cy = 0.5;
  const dx = nx - cx;
  const dy = ny - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Subtle circular ambient cyan glow behind shield
  if (dist < 0.45) {
    const glow = (1 - dist / 0.45) * 0.4;
    r = Math.min(255, Math.round(r + 34 * glow));
    g = Math.min(255, Math.round(g + 211 * glow));
    b = Math.min(255, Math.round(b + 238 * glow));
  }

  // Rounded outer border for non-maskable icons
  if (!isMaskable) {
    const cornerRadius = 0.22;
    const qx = Math.max(0, Math.abs(dx) - (0.5 - cornerRadius));
    const qy = Math.max(0, Math.abs(dy) - (0.5 - cornerRadius));
    const cornerDist = Math.sqrt(qx * qx + qy * qy);
    if (cornerDist > cornerRadius) {
      return [0, 0, 0, 0]; // Transparent outside rounded corner
    }
    // Border highlight
    if (cornerDist > cornerRadius - 0.015 || Math.abs(dx) > 0.485 || Math.abs(dy) > 0.485) {
      r = 34; g = 211; b = 238; // Cyan border
    }
  }

  // Shield geometry: top flat from x=0.25 to 0.75, y=0.18, curving down to point at (0.5, 0.82)
  const inShieldX = nx >= 0.22 && nx <= 0.78;
  const shieldTop = 0.18;
  const shieldBottom = 0.82;

  if (inShieldX && ny >= shieldTop && ny <= shieldBottom) {
    const relY = (ny - shieldTop) / (shieldBottom - shieldTop);
    const halfWidthAtY = (1 - Math.pow(relY, 1.4)) * 0.28;
    if (Math.abs(nx - 0.5) <= halfWidthAtY) {
      // Inside Shield: Cyan gradient with dark navy core
      const edgeDist = halfWidthAtY - Math.abs(nx - 0.5);
      if (edgeDist < 0.03 || ny < shieldTop + 0.02) {
        // Shield stroke: bright cyan (#22D3EE)
        r = 34; g = 211; b = 238;
      } else {
        // Shield interior: subtle dark cyan tint
        r = Math.round(r * 0.6 + 8 * 0.4);
        g = Math.round(g * 0.6 + 145 * 0.4);
        b = Math.round(b * 0.6 + 178 * 0.4);
      }
    }
  }

  // Letter "A" / Apex node: polygon points (0.5, 0.28), (0.64, 0.62), (0.58, 0.62), (0.5, 0.44), (0.42, 0.62), (0.36, 0.62)
  if (ny >= 0.28 && ny <= 0.62) {
    const t = (ny - 0.28) / (0.62 - 0.28);
    const outerX = t * 0.14;
    const innerX = (ny >= 0.44) ? ((ny - 0.44) / (0.62 - 0.44)) * 0.08 : -1;

    const relX = Math.abs(nx - 0.5);
    if (relX <= outerX && (innerX < 0 || relX >= innerX)) {
      // Bright cyan / teal "A"
      r = 34; g = 211; b = 238;
    }
  }

  // Gold Trust Star Crossbar: y=0.55 to 0.58, x=0.42 to 0.58
  if (ny >= 0.55 && ny <= 0.58 && Math.abs(nx - 0.5) <= 0.09) {
    r = 251; g = 191; b = 36; // Amber gold
  }

  // Bottom Gold Verified Circle Emblem: center (0.5, 0.70), radius 0.06
  const emblemDist = Math.sqrt((nx - 0.5) * (nx - 0.5) + (ny - 0.70) * (ny - 0.70));
  if (emblemDist <= 0.055) {
    r = 245; g = 158; b = 11; // Gold #F59E0B
    // Verified check mark inside emblem
    const checkDx = nx - 0.5;
    const checkDy = ny - 0.70;
    if (
      (checkDx >= -0.025 && checkDx <= -0.005 && Math.abs(checkDy - (checkDx + 0.025) * 0.8) < 0.008) ||
      (checkDx >= -0.005 && checkDx <= 0.025 && Math.abs(checkDy - (0.01 - (checkDx + 0.005) * 0.8)) < 0.008)
    ) {
      r = 10; g = 25; b = 47; // Navy checkmark
    }
  }

  return [r, g, b, a];
}

const publicDir = path.resolve('public');
fs.mkdirSync(publicDir, { recursive: true });

console.log('Generating 192x192 icon...');
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), createPng(192, 192, (x, y, w, h) => drawAnatechLogo(x, y, w, h, false)));

console.log('Generating 512x512 icon...');
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), createPng(512, 512, (x, y, w, h) => drawAnatechLogo(x, y, w, h, false)));

console.log('Generating 192x192 maskable icon...');
fs.writeFileSync(path.join(publicDir, 'icon-maskable-192.png'), createPng(192, 192, (x, y, w, h) => drawAnatechLogo(x, y, w, h, true)));

console.log('Generating 512x512 maskable icon...');
fs.writeFileSync(path.join(publicDir, 'icon-maskable-512.png'), createPng(512, 512, (x, y, w, h) => drawAnatechLogo(x, y, w, h, true)));

console.log('Generating 180x180 apple-touch-icon...');
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, (x, y, w, h) => drawAnatechLogo(x, y, w, h, true)));

console.log('All PWA and Android APK icons generated successfully!');
