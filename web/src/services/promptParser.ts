// Multi-word prompt → palette bias.
// Tokenize → look up each keyword in EN+TR bias dict → merge:
//   - hue ranges union (any of these hues are OK)
//   - saturation/lightness intersect (every constraint must hold)
//   - mood tags accumulate
//
// Result feeds the harmony engine: pick a base hue from the union, then
// clamp saturation/value to the intersection.

export interface Bias {
  hues?: [number, number][];   // valid hue ranges in degrees (0-360)
  satRange?: [number, number]; // 0-1
  litRange?: [number, number]; // 0-1
  tags?: string[];
}

const D: Record<string, Bias> = {
  // --- temperature ---
  warm:    { hues: [[0, 60], [330, 360]], tags: ["warm"] },
  sıcak:   { hues: [[0, 60], [330, 360]], tags: ["warm"] },
  cool:    { hues: [[180, 260]], tags: ["cool"] },
  soğuk:   { hues: [[180, 260]], tags: ["cool"] },

  // --- saturation / energy ---
  vibrant:   { satRange: [0.7, 1.0], litRange: [0.4, 0.85], tags: ["vibrant"] },
  canlı:     { satRange: [0.7, 1.0], litRange: [0.4, 0.85], tags: ["vibrant"] },
  muted:     { satRange: [0.1, 0.4], tags: ["muted"] },
  mat:       { satRange: [0.1, 0.4], tags: ["muted"] },
  pastel:    { satRange: [0.25, 0.55], litRange: [0.7, 0.92], tags: ["pastel"] },
  neon:      { satRange: [0.85, 1.0], litRange: [0.5, 0.85], tags: ["neon"] },
  vivid:     { satRange: [0.7, 1.0], tags: ["vivid"] },
  desaturated: { satRange: [0, 0.3], tags: ["muted"] },

  // --- lightness ---
  dark:      { litRange: [0.05, 0.35], tags: ["dark"] },
  koyu:      { litRange: [0.05, 0.35], tags: ["dark"] },
  light:     { litRange: [0.65, 0.95], tags: ["light"] },
  açık:      { litRange: [0.65, 0.95], tags: ["light"] },
  bright:    { litRange: [0.55, 0.95], satRange: [0.5, 1] },
  parlak:    { litRange: [0.55, 0.95], satRange: [0.5, 1] },
  moody:     { litRange: [0.1, 0.45], satRange: [0.2, 0.55], tags: ["moody"] },
  hüzünlü:   { litRange: [0.1, 0.45], satRange: [0.2, 0.55], tags: ["moody"] },

  // --- nature / scene ---
  ocean:     { hues: [[180, 230]], satRange: [0.4, 0.8], tags: ["ocean"] },
  deniz:     { hues: [[180, 230]], satRange: [0.4, 0.8], tags: ["ocean"] },
  sea:       { hues: [[180, 230]], satRange: [0.4, 0.8], tags: ["ocean"] },
  forest:    { hues: [[80, 150]], satRange: [0.3, 0.7], litRange: [0.2, 0.5] },
  orman:     { hues: [[80, 150]], satRange: [0.3, 0.7], litRange: [0.2, 0.5] },
  desert:    { hues: [[20, 50]], satRange: [0.3, 0.7], litRange: [0.5, 0.8] },
  çöl:       { hues: [[20, 50]], satRange: [0.3, 0.7], litRange: [0.5, 0.8] },
  sunset:    { hues: [[0, 50], [300, 360]], satRange: [0.6, 1] },
  gün_batımı: { hues: [[0, 50], [300, 360]], satRange: [0.6, 1] },
  sunrise:   { hues: [[0, 50]], satRange: [0.4, 0.8], litRange: [0.55, 0.85] },
  şafak:     { hues: [[0, 50]], satRange: [0.4, 0.8], litRange: [0.55, 0.85] },
  storm:     { hues: [[200, 260]], satRange: [0.15, 0.45], litRange: [0.15, 0.45] },
  fırtına:   { hues: [[200, 260]], satRange: [0.15, 0.45], litRange: [0.15, 0.45] },
  fog:       { satRange: [0.05, 0.25], litRange: [0.6, 0.85], tags: ["foggy"] },
  sis:       { satRange: [0.05, 0.25], litRange: [0.6, 0.85], tags: ["foggy"] },
  tropical:  { hues: [[140, 200], [40, 80]], satRange: [0.7, 1] },

  // --- aesthetic / era ---
  vintage:   { satRange: [0.2, 0.5], litRange: [0.4, 0.7], tags: ["vintage"] },
  retro:     { satRange: [0.5, 0.8], litRange: [0.4, 0.7], tags: ["retro"] },
  y2k:       { hues: [[280, 340], [180, 220]], satRange: [0.7, 1], tags: ["y2k"] },
  cyberpunk: { hues: [[280, 340], [160, 200]], satRange: [0.85, 1], litRange: [0.4, 0.7] },
  noir:      { satRange: [0, 0.15], litRange: [0.05, 0.3], tags: ["noir"] },
  gothic:    { satRange: [0.1, 0.4], litRange: [0.05, 0.35], hues: [[280, 360]] },
  minimalist:{ satRange: [0, 0.2], litRange: [0.5, 0.95], tags: ["minimal"] },
  minimal:   { satRange: [0, 0.2], litRange: [0.5, 0.95], tags: ["minimal"] },
  brutalist: { satRange: [0, 0.4], litRange: [0.1, 0.5], tags: ["brutal"] },
  scandinavian:{ satRange: [0.05, 0.3], litRange: [0.5, 0.9], tags: ["scandi"] },
  japanese:  { satRange: [0.1, 0.5], tags: ["wabi"] },
  zen:       { satRange: [0.05, 0.3], litRange: [0.4, 0.85], tags: ["zen"] },

  // --- emotion ---
  romantic:  { hues: [[300, 360]], satRange: [0.3, 0.7], tags: ["romantic"] },
  romantik:  { hues: [[300, 360]], satRange: [0.3, 0.7], tags: ["romantic"] },
  energetic: { satRange: [0.7, 1], litRange: [0.5, 0.85], tags: ["energetic"] },
  enerjik:   { satRange: [0.7, 1], litRange: [0.5, 0.85], tags: ["energetic"] },
  calm:      { satRange: [0.15, 0.45], litRange: [0.5, 0.8], tags: ["calm"] },
  sakin:     { satRange: [0.15, 0.45], litRange: [0.5, 0.8], tags: ["calm"] },
  elegant:   { satRange: [0.15, 0.55], tags: ["elegant"] },
  zarif:     { satRange: [0.15, 0.55], tags: ["elegant"] },
  playful:   { satRange: [0.55, 0.9], litRange: [0.55, 0.9] },
  oyuncu:    { satRange: [0.55, 0.9], litRange: [0.55, 0.9] },
  serious:   { satRange: [0.1, 0.45], litRange: [0.2, 0.55] },
  ciddi:     { satRange: [0.1, 0.45], litRange: [0.2, 0.55] },
  warm_tone: { hues: [[15, 50]], tags: ["warm-tone"] },

  // --- specific palette presets ---
  earth:     { hues: [[20, 50]], satRange: [0.2, 0.55], litRange: [0.25, 0.65] },
  toprak:    { hues: [[20, 50]], satRange: [0.2, 0.55], litRange: [0.25, 0.65] },
  jewel:     { satRange: [0.6, 0.95], litRange: [0.25, 0.55], tags: ["jewel"] },
  mücevher:  { satRange: [0.6, 0.95], litRange: [0.25, 0.55], tags: ["jewel"] },
  metallic:  { satRange: [0.1, 0.35], litRange: [0.4, 0.7], tags: ["metallic"] },
  metalik:   { satRange: [0.1, 0.35], litRange: [0.4, 0.7], tags: ["metallic"] },

  // --- direct hue keywords ---
  red:       { hues: [[350, 360], [0, 15]] },
  kırmızı:   { hues: [[350, 360], [0, 15]] },
  orange:    { hues: [[15, 40]] },
  turuncu:   { hues: [[15, 40]] },
  yellow:    { hues: [[40, 65]] },
  sarı:      { hues: [[40, 65]] },
  green:     { hues: [[80, 150]] },
  yeşil:     { hues: [[80, 150]] },
  blue:      { hues: [[200, 250]] },
  mavi:      { hues: [[200, 250]] },
  purple:    { hues: [[260, 300]] },
  mor:       { hues: [[260, 300]] },
  pink:      { hues: [[310, 350]] },
  pembe:     { hues: [[310, 350]] },
  brown:     { hues: [[20, 40]], satRange: [0.2, 0.55], litRange: [0.2, 0.5] },
  kahverengi:{ hues: [[20, 40]], satRange: [0.2, 0.55], litRange: [0.2, 0.5] },
  beige:     { hues: [[25, 45]], satRange: [0.1, 0.3], litRange: [0.7, 0.9] },
  bej:       { hues: [[25, 45]], satRange: [0.1, 0.3], litRange: [0.7, 0.9] },
  gold:      { hues: [[40, 55]], satRange: [0.4, 0.7], litRange: [0.45, 0.7] },
  altın:     { hues: [[40, 55]], satRange: [0.4, 0.7], litRange: [0.45, 0.7] },
  silver:    { satRange: [0.02, 0.18], litRange: [0.6, 0.85] },
  gümüş:     { satRange: [0.02, 0.18], litRange: [0.6, 0.85] },
  cream:     { hues: [[40, 65]], satRange: [0.1, 0.3], litRange: [0.85, 0.95] },
  krem:      { hues: [[40, 65]], satRange: [0.1, 0.3], litRange: [0.85, 0.95] },
};

function normalize(s: string): string {
  return s.toLowerCase()
    .replace(/[ç]/g, "ç").replace(/[ğ]/g, "ğ").replace(/[ı]/g, "ı")
    .replace(/[ö]/g, "ö").replace(/[ş]/g, "ş").replace(/[ü]/g, "ü")
    .trim();
}

function tokenize(prompt: string): string[] {
  const cleaned = normalize(prompt).replace(/[^\p{L}\p{N}\s_-]/gu, " ");
  return cleaned.split(/[\s_-]+/).filter(Boolean);
}

function intersectRange(a?: [number, number], b?: [number, number]): [number, number] | undefined {
  if (!a) return b;
  if (!b) return a;
  const lo = Math.max(a[0], b[0]);
  const hi = Math.min(a[1], b[1]);
  if (lo > hi) {
    // No overlap — return a softer compromise (midpoint)
    const mid = (a[0] + a[1] + b[0] + b[1]) / 4;
    return [Math.max(0, mid - 0.1), Math.min(1, mid + 0.1)];
  }
  return [lo, hi];
}

export function parsePrompt(prompt: string): Bias {
  const tokens = tokenize(prompt);
  const hits: Bias[] = [];
  for (const t of tokens) {
    if (D[t]) hits.push(D[t]);
  }
  if (!hits.length) return {};

  const merged: Bias = {};
  const tags: string[] = [];
  for (const h of hits) {
    if (h.hues) merged.hues = [...(merged.hues ?? []), ...h.hues];
    merged.satRange = intersectRange(merged.satRange, h.satRange);
    merged.litRange = intersectRange(merged.litRange, h.litRange);
    if (h.tags) tags.push(...h.tags);
  }
  if (tags.length) merged.tags = tags;
  return merged;
}

export function pickHueFromBias(bias: Bias, fallback = 200): number {
  if (!bias.hues?.length) return fallback;
  const r = bias.hues[Math.floor(Math.random() * bias.hues.length)];
  return r[0] + Math.random() * (r[1] - r[0]);
}

export function clampToBias(sat: number, val: number, bias: Bias): [number, number] {
  let s = sat, v = val;
  if (bias.satRange) {
    s = Math.max(bias.satRange[0], Math.min(bias.satRange[1], s));
  }
  if (bias.litRange) {
    v = Math.max(bias.litRange[0], Math.min(bias.litRange[1], v));
  }
  return [s, v];
}
