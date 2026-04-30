// Brettel/Viénot color-vision deficiency simulation.
// Linear-RGB matrices for protanopia / deuteranopia / tritanopia, applied
// after sRGB gamma decode and re-encoded after.
//
// Source: Viénot, Brettel & Mollon (1999) plus the matrix cleanup commonly
// seen in DaltonLens and colorspacious. Single-plane Brettel approximation.

import type { RGB } from "@/types";

export type CBMode = "normal" | "protanopia" | "deuteranopia" | "tritanopia";

const MATRICES: Record<Exclude<CBMode, "normal">, number[]> = {
  protanopia: [
    0.152286, 1.052583, -0.204868,
    0.114503, 0.786281, 0.099216,
    -0.003882, -0.048116, 1.051998,
  ],
  deuteranopia: [
    0.367322, 0.860646, -0.227968,
    0.280085, 0.672501, 0.047413,
    -0.011820, 0.042940, 0.968881,
  ],
  tritanopia: [
    1.255528, -0.076749, -0.178779,
    -0.078411, 0.930809, 0.147602,
    0.004733, 0.691367, 0.303900,
  ],
};

function srgbToLinear(c: number): number {
  const n = c / 255;
  return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
}
function linearToSrgb(c: number): number {
  const n = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.round(Math.max(0, Math.min(1, n)) * 255);
}

export function simulate(rgb: RGB, mode: CBMode): RGB {
  if (mode === "normal") return rgb;
  const m = MATRICES[mode];
  const r = srgbToLinear(rgb[0]);
  const g = srgbToLinear(rgb[1]);
  const b = srgbToLinear(rgb[2]);
  const nr = m[0] * r + m[1] * g + m[2] * b;
  const ng = m[3] * r + m[4] * g + m[5] * b;
  const nb = m[6] * r + m[7] * g + m[8] * b;
  return [linearToSrgb(nr), linearToSrgb(ng), linearToSrgb(nb)];
}

export const CB_MODES: { id: CBMode; label: string; desc: string }[] = [
  { id: "normal",       label: "normal",       desc: "no simulation" },
  { id: "protanopia",   label: "protan",       desc: "no red cones (~1% males)" },
  { id: "deuteranopia", label: "deuteran",     desc: "no green cones (~6% males)" },
  { id: "tritanopia",   label: "tritan",       desc: "no blue cones (rare)" },
];
