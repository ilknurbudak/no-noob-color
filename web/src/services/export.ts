// Palette export generators: Procreate .swatches, Adobe .ase, Tailwind config,
// CSS variables, JSON, SVG poster, plain text. All client-side.

import type { Swatch } from "@/types";
import { rgbToHex, rgbToHsv, rgbToCmyk, textColorFor } from "./color";
import { nameForRGB } from "./colorNames";

interface NamedSwatch {
  rgb: [number, number, number];
  name: string;
}

export function namedSwatches(palette: Swatch[]): NamedSwatch[] {
  return palette.map((sw) => ({
    rgb: [sw.rgb[0], sw.rgb[1], sw.rgb[2]],
    name: nameForRGB(sw.rgb),
  }));
}

// ---------- ZIP (store-only, single file) ----------

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
})();

function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function makeZip(filename: string, content: Uint8Array): Uint8Array {
  const nameBytes = new TextEncoder().encode(filename);
  const crc = crc32(content);
  const size = content.length;

  const localHeader = new Uint8Array(30 + nameBytes.length);
  const lh = new DataView(localHeader.buffer);
  lh.setUint32(0, 0x04034b50, true);
  lh.setUint16(4, 20, true); lh.setUint16(6, 0, true);
  lh.setUint16(8, 0, true); lh.setUint16(10, 0, true); lh.setUint16(12, 0, true);
  lh.setUint32(14, crc, true);
  lh.setUint32(18, size, true); lh.setUint32(22, size, true);
  lh.setUint16(26, nameBytes.length, true); lh.setUint16(28, 0, true);
  localHeader.set(nameBytes, 30);

  const central = new Uint8Array(46 + nameBytes.length);
  const cv = new DataView(central.buffer);
  cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true);
  cv.setUint16(8, 0, true); cv.setUint16(10, 0, true);
  cv.setUint16(12, 0, true); cv.setUint16(14, 0, true);
  cv.setUint32(16, crc, true);
  cv.setUint32(20, size, true); cv.setUint32(24, size, true);
  cv.setUint16(28, nameBytes.length, true); cv.setUint16(30, 0, true);
  cv.setUint16(32, 0, true); cv.setUint16(34, 0, true); cv.setUint16(36, 0, true);
  cv.setUint32(38, 0, true); cv.setUint32(42, 0, true);
  central.set(nameBytes, 46);

  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true); ev.setUint16(6, 0, true);
  ev.setUint16(8, 1, true); ev.setUint16(10, 1, true);
  ev.setUint32(12, central.length, true);
  ev.setUint32(16, 30 + nameBytes.length + size, true);
  ev.setUint16(20, 0, true);

  const total = new Uint8Array(localHeader.length + size + central.length + eocd.length);
  let off = 0;
  total.set(localHeader, off); off += localHeader.length;
  total.set(content, off); off += size;
  total.set(central, off); off += central.length;
  total.set(eocd, off);
  return total;
}

// ---------- Procreate .swatches ----------

export function buildSwatches(palette: NamedSwatch[], paletteName: string): Uint8Array {
  const swatches = palette.map((sw) => {
    const [r, g, b] = sw.rgb;
    const [hDeg, s, v] = rgbToHsv(r, g, b);
    return { hue: hDeg / 360, saturation: s, brightness: v, alpha: 1.0, colorSpace: 0 };
  });
  while (swatches.length < 30) (swatches as any).push(null);
  const json = JSON.stringify([{ name: paletteName, swatches }], null, 2);
  return makeZip("Swatches.json", new TextEncoder().encode(json));
}

// ---------- Adobe .ase ----------

function utf16BE(str: string): Uint8Array {
  const arr = new Uint8Array(str.length * 2);
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    arr[i * 2] = (c >> 8) & 0xff;
    arr[i * 2 + 1] = c & 0xff;
  }
  return arr;
}

export function buildASE(palette: NamedSwatch[], paletteName: string): Uint8Array {
  const groupName = paletteName + "\0";
  const groupBytes = utf16BE(groupName);
  const groupBlockLen = 2 + groupBytes.length;

  const colorBlocks = palette.map((sw) => {
    const name = sw.name + "\0";
    const nameBytes = utf16BE(name);
    const blockLen = 2 + nameBytes.length + 4 + 12 + 2;
    return { name, nameBytes, blockLen, rgb: sw.rgb };
  });

  let totalSize = 12 + (6 + groupBlockLen);
  for (const cb of colorBlocks) totalSize += 6 + cb.blockLen;
  totalSize += 6;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  let off = 0;

  view.setUint8(0, 0x41); view.setUint8(1, 0x53); view.setUint8(2, 0x45); view.setUint8(3, 0x46);
  view.setUint16(4, 1, false);
  view.setUint16(6, 0, false);
  view.setUint32(8, colorBlocks.length + 2, false);
  off = 12;

  view.setUint16(off, 0xC001, false); off += 2;
  view.setUint32(off, groupBlockLen, false); off += 4;
  view.setUint16(off, groupName.length, false); off += 2;
  new Uint8Array(buffer, off, groupBytes.length).set(groupBytes);
  off += groupBytes.length;

  for (const cb of colorBlocks) {
    view.setUint16(off, 0x0001, false); off += 2;
    view.setUint32(off, cb.blockLen, false); off += 4;
    view.setUint16(off, cb.name.length, false); off += 2;
    new Uint8Array(buffer, off, cb.nameBytes.length).set(cb.nameBytes);
    off += cb.nameBytes.length;
    view.setUint8(off, 0x52); view.setUint8(off + 1, 0x47); view.setUint8(off + 2, 0x42); view.setUint8(off + 3, 0x20);
    off += 4;
    view.setFloat32(off, cb.rgb[0] / 255, false); off += 4;
    view.setFloat32(off, cb.rgb[1] / 255, false); off += 4;
    view.setFloat32(off, cb.rgb[2] / 255, false); off += 4;
    view.setUint16(off, 0, false); off += 2;
  }

  view.setUint16(off, 0xC002, false); off += 2;
  view.setUint32(off, 0, false); off += 4;

  return new Uint8Array(buffer);
}

// ---------- Text formats ----------

function slug(name: string, fallback: string): string {
  return (name || fallback).toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function buildTailwind(palette: NamedSwatch[], paletteName: string): string {
  const colors: Record<string, string> = {};
  const seen: Record<string, number> = {};
  palette.forEach((sw, i) => {
    let key = slug(sw.name, `color-${i + 1}`);
    seen[key] = (seen[key] || 0) + 1;
    if (seen[key] > 1) key = `${key}-${seen[key]}`;
    colors[key] = rgbToHex(...sw.rgb).toLowerCase();
  });
  const lines = Object.entries(colors).map(([k, v]) => `        "${k}": "${v}"`).join(",\n");
  return `// ${paletteName}\n// tailwind.config.js — extend.colors\n\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${lines}\n      }\n    }\n  }\n};\n`;
}

export function buildCSSVars(palette: NamedSwatch[], paletteName: string): string {
  const seen: Record<string, number> = {};
  const out = [`/* ${paletteName} */`, `:root {`];
  palette.forEach((sw, i) => {
    let key = slug(sw.name, `color-${i + 1}`);
    seen[key] = (seen[key] || 0) + 1;
    if (seen[key] > 1) key = `${key}-${seen[key]}`;
    out.push(`  --${key}: ${rgbToHex(...sw.rgb).toLowerCase()};`);
  });
  out.push(`}`);
  return out.join("\n");
}

export function buildJSON(palette: NamedSwatch[], paletteName: string): string {
  return JSON.stringify({
    name: paletteName,
    generatedAt: new Date().toISOString(),
    palette: palette.map((sw, i) => {
      const [r, g, b] = sw.rgb;
      const cmyk = rgbToCmyk(r, g, b);
      return {
        name: sw.name || `color-${i + 1}`,
        hex: rgbToHex(r, g, b).toUpperCase(),
        rgb: { r, g, b },
        cmyk: { c: cmyk[0], m: cmyk[1], y: cmyk[2], k: cmyk[3] },
      };
    }),
  }, null, 2);
}

export function buildSVGPoster(palette: NamedSwatch[], paletteName: string): string {
  const w = 1000, h = 600;
  const stripW = w / palette.length;
  const parts = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">`];
  palette.forEach((sw, i) => {
    const [r, g, b] = sw.rgb;
    const hex = rgbToHex(r, g, b).toUpperCase();
    const fg = textColorFor(r, g, b);
    const x = i * stripW;
    parts.push(`<rect x="${x}" y="0" width="${stripW}" height="${h}" fill="${hex.toLowerCase()}"/>`);
    const safeName = (sw.name || "color").replace(/&/g, "&amp;").replace(/</g, "&lt;");
    parts.push(`<text x="${x + 24}" y="40" fill="${fg}" font-family="ui-sans-serif,Helvetica" font-size="18" font-weight="700">${safeName}</text>`);
    parts.push(`<text x="${x + 24}" y="64" fill="${fg}" font-family="ui-monospace,Menlo" font-size="12" opacity="0.7">${hex}</text>`);
    parts.push(`<text x="${x + 24}" y="${h - 24}" fill="${fg}" font-family="ui-monospace,Menlo" font-size="42" font-weight="700">${hex}</text>`);
  });
  parts.push(`<text x="24" y="${h - 24}" font-family="ui-sans-serif,Helvetica" font-size="14" font-weight="700" fill="#000" opacity="0.85">${paletteName}</text>`);
  parts.push(`</svg>`);
  return parts.join("");
}

export function buildText(palette: NamedSwatch[], paletteName: string): string {
  const lines = palette.map((sw) => {
    const [r, g, b] = sw.rgb;
    const hex = rgbToHex(r, g, b).toUpperCase();
    const cmyk = rgbToCmyk(r, g, b);
    return `${sw.name}\t${hex}\trgb(${r}, ${g}, ${b})\tcmyk(${cmyk.join(", ")})`;
  });
  return `${paletteName}\n\n${lines.join("\n")}`;
}

// ---------- Browser download ----------

export function downloadBlob(bytes: Uint8Array | string, filename: string, mime = "application/octet-stream") {
  const data = typeof bytes === "string" ? new TextEncoder().encode(bytes) : bytes;
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}
