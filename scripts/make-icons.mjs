// Makes the PNG and ICO icons from public/favicon.svg. Run it again after changing the SVG:
//   node scripts/make-icons.mjs
// It writes public/favicon.ico (32 px), public/apple-touch-icon.png (180 px, square corners,
// since iOS rounds them itself) and public/icon-192.png and public/icon-512.png for the web manifest.

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const pub = path.resolve(new URL("../public", import.meta.url).pathname);
const svg = fs.readFileSync(path.join(pub, "favicon.svg"), "utf8");
const square = svg.replace(/(<rect[^>]*?) rx="[^"]*"/, "$1");

const png = (src, size) => sharp(Buffer.from(src), { density: 72 * (size / 64) * 2 }).resize(size, size).png().toBuffer();

// An ICO file can hold a PNG image directly: a 6-byte header, one 16-byte entry, then the PNG.
function ico(pngBuf, size) {
  const head = Buffer.alloc(22);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(1, 4);
  head.writeUInt8(size, 6); head.writeUInt8(size, 7); head.writeUInt8(0, 8); head.writeUInt8(0, 9);
  head.writeUInt16LE(1, 10); head.writeUInt16LE(32, 12);
  head.writeUInt32LE(pngBuf.length, 14); head.writeUInt32LE(22, 18);
  return Buffer.concat([head, pngBuf]);
}

fs.writeFileSync(path.join(pub, "favicon.ico"), ico(await png(svg, 32), 32));
fs.writeFileSync(path.join(pub, "apple-touch-icon.png"), await png(square, 180));
fs.writeFileSync(path.join(pub, "icon-192.png"), await png(svg, 192));
fs.writeFileSync(path.join(pub, "icon-512.png"), await png(svg, 512));
console.log("wrote favicon.ico, apple-touch-icon.png, icon-192.png and icon-512.png");
