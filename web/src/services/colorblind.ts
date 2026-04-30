// Brettel et al. (1997) color-blindness simulation in sRGB.
// Linearize → 3x3 matrix multiply → gamma-encode.
// Coefficients: standard "Machado 2009" / Brettel approximations widely used in
// industry tools. Good enough for preview; rigorous backend is a separate
// /colorblind/simulate endpoint via colour-science.

import type { RGB } from "@/types";

export type CBMode = "normal" | "protanopia" | "deuteranopia" | "tritanopia";

const M: Record<Exclude<CBMode, "normal">, [number, number, number, number, number, number, number, number, number]> = {
  // protanopia (no L cones)
  protanopia: [
    0.152286, 1.052583, -0.204868,
    0.114503, 0.786281, 0.099216,
    -0.003882, -0.048116, 1.051998,
  ],
  // deuteranopia (no M cones)
  deuteranopia: [
    0.367322, 0.860646, -0.227968,
    0.280085, 0.672501, 0.047413,
    -0.011820, 0.042940, 0.968881,
  ],
  // tritanopia (no S cones)
  tritanopia: [
    1.255528, -0.076749, -0.178779,
    -0.078411, 0.930809, 0.147602,
    0.004733, 0.691367, 0.303900,
  ],
};

function lin(c: number) {
  c = c / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function gamma(c: number) {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(v * 255)));
}

export function simulate(rgb: RGB, mode: CBMode): RGB {
  if (mode === "normal") return rgb;
  const m = M[mode];
  const r = lin(rgb[0]), g = lin(rgb[1]), b = lin(rgb[2]);
  return [
    gamma(m[0] * r + m[1] * g + m[2] * b),
    gamma(m[3] * r + m[4] * g + m[5] * b),
    gamma(m[6] * r + m[7] * g + m[8] * b),
  ];
}
