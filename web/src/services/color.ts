// Local fallback color science. Mirrors the /api/services/color_science.py
// transforms so the app works offline. When the API is reachable, prefer it.

import type { RGB } from "@/types";

export function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

export function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0"))
      .join("")
  );
}

export function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, max === 0 ? 0 : d / max, max];
}

export function hsvToRgb(h: number, s: number, v: number): RGB {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

function lin(c: number) {
  return c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92;
}

export function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  const rL = lin(r / 255), gL = lin(g / 255), bL = lin(b / 255);
  const x = (rL * 0.4124 + gL * 0.3576 + bL * 0.1805) * 100;
  const y = (rL * 0.2126 + gL * 0.7152 + bL * 0.0722) * 100;
  const z = (rL * 0.0193 + gL * 0.1192 + bL * 0.9505) * 100;
  const refX = 95.047, refY = 100.0, refZ = 108.883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x / refX), fy = f(y / refY), fz = f(z / refZ);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

export function rgbToCmyk(r: number, g: number, b: number): [number, number, number, number] {
  const rN = r / 255, gN = g / 255, bN = b / 255;
  const k = 1 - Math.max(rN, gN, bN);
  if (k >= 1) return [0, 0, 0, 100];
  return [
    Math.round(((1 - rN - k) / (1 - k)) * 100),
    Math.round(((1 - gN - k) / (1 - k)) * 100),
    Math.round(((1 - bN - k) / (1 - k)) * 100),
    Math.round(k * 100),
  ];
}

export function relativeLuminance(r: number, g: number, b: number): number {
  return (0.2126 * lin(r / 255) + 0.7152 * lin(g / 255) + 0.0722 * lin(b / 255));
}

export function wcagContrast(c1: RGB, c2: RGB): number {
  const l1 = relativeLuminance(...c1);
  const l2 = relativeLuminance(...c2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function wcagGrade(ratio: number): string {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA·LG";
  return "FAIL";
}

export function textColorFor(r: number, g: number, b: number): "#000000" | "#ffffff" {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 145 ? "#000000" : "#ffffff";
}
