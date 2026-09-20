import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const publicDir = new URL('../public/', import.meta.url);
const svg = await readFile(new URL('favicon.svg', publicDir));
const sizes = [16, 32, 48];
const images = await Promise.all(
  sizes.map((size) => sharp(svg).resize(size, size).png().toBuffer()),
);

const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);

let offset = header.length;
sizes.forEach((size, index) => {
  const entry = 6 + index * 16;
  header.writeUInt8(size, entry);
  header.writeUInt8(size, entry + 1);
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(images[index].length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += images[index].length;
});

await Promise.all([
  writeFile(
    new URL('favicon.ico', publicDir),
    Buffer.concat([header, ...images]),
  ),
  sharp(svg)
    .resize(180, 180)
    .png()
    .toFile(fileURLToPath(new URL('apple-touch-icon.png', publicDir))),
]);
