// Multi-word prompt → palette bias.
// Tokenize an EN/TR phrase, look up each token in KEYWORD_BIAS, merge
// (union hue range, intersect saturation/lightness), then sample N swatches.

import type { Swatch } from "@/types";
import { hsvToRgb, rgbToLab } from "./color";

export interface Bias {
  hue?: [number, number];        // hue range degrees (wraps if start > end)
  sat?: [number, number];        // 0..1
  val?: [number, number];        // 0..1
}

// hue ranges roughly:
//   red   350-15
//   orange 15-40
//   yellow 40-65
//   green 65-160
//   cyan  160-200
//   blue  200-250
//   purple 250-300
//   pink  300-350
const KEYWORD_BIAS: Record<string, Bias> = {
  // ------ EN: temperature & feel ------
  warm:       { hue: [350, 65], sat: [0.45, 0.95], val: [0.50, 0.90] },
  cool:       { hue: [160, 280], sat: [0.30, 0.85], val: [0.40, 0.85] },
  hot:        { hue: [350, 30], sat: [0.70, 1.00], val: [0.55, 0.95] },
  cold:       { hue: [180, 250], sat: [0.20, 0.75], val: [0.35, 0.80] },
  vibrant:    { sat: [0.75, 1.00], val: [0.65, 0.95] },
  muted:      { sat: [0.10, 0.40], val: [0.35, 0.75] },
  pastel:     { sat: [0.20, 0.45], val: [0.78, 0.95] },
  neon:       { sat: [0.85, 1.00], val: [0.80, 1.00] },
  vintage:    { sat: [0.20, 0.50], val: [0.40, 0.75], hue: [10, 60] },
  retro:      { sat: [0.55, 0.85], val: [0.55, 0.85], hue: [0, 60] },
  earthy:     { hue: [15, 50], sat: [0.30, 0.65], val: [0.30, 0.70] },
  earth:      { hue: [15, 50], sat: [0.30, 0.65], val: [0.30, 0.70] },
  pale:       { sat: [0.10, 0.35], val: [0.78, 0.97] },
  dark:       { val: [0.10, 0.40] },
  light:      { val: [0.70, 0.95] },
  bright:     { sat: [0.65, 1.00], val: [0.75, 0.98] },
  dusty:      { sat: [0.18, 0.42], val: [0.45, 0.72] },
  moody:      { sat: [0.40, 0.75], val: [0.18, 0.45] },
  dreamy:     { sat: [0.25, 0.55], val: [0.65, 0.92] },
  elegant:    { sat: [0.15, 0.40], val: [0.20, 0.55] },
  feminine:   { hue: [300, 360], sat: [0.30, 0.65], val: [0.65, 0.92] },
  masculine:  { sat: [0.20, 0.55], val: [0.20, 0.50] },
  calm:       { sat: [0.20, 0.45], val: [0.55, 0.85] },
  energetic:  { sat: [0.75, 1.00], val: [0.65, 0.95] },
  professional:{ sat: [0.25, 0.55], val: [0.30, 0.70] },
  playful:    { sat: [0.65, 0.95], val: [0.70, 0.95] },
  serious:    { sat: [0.10, 0.35], val: [0.18, 0.50] },

  // ------ EN: scenes ------
  sunset:     { hue: [350, 50], sat: [0.55, 0.95], val: [0.55, 0.95] },
  sunrise:    { hue: [330, 60], sat: [0.40, 0.85], val: [0.65, 0.95] },
  ocean:      { hue: [180, 230], sat: [0.40, 0.80], val: [0.30, 0.80] },
  sea:        { hue: [180, 230], sat: [0.40, 0.80], val: [0.30, 0.80] },
  forest:     { hue: [80, 140], sat: [0.35, 0.75], val: [0.20, 0.65] },
  desert:     { hue: [20, 45], sat: [0.30, 0.60], val: [0.55, 0.90] },
  autumn:     { hue: [10, 45], sat: [0.55, 0.90], val: [0.40, 0.80] },
  fall:       { hue: [10, 45], sat: [0.55, 0.90], val: [0.40, 0.80] },
  winter:     { hue: [180, 240], sat: [0.10, 0.35], val: [0.65, 0.95] },
  spring:     { hue: [60, 150], sat: [0.40, 0.70], val: [0.70, 0.95] },
  summer:     { hue: [40, 200], sat: [0.55, 0.85], val: [0.70, 0.95] },
  night:      { hue: [220, 270], sat: [0.45, 0.85], val: [0.10, 0.40] },
  midnight:   { hue: [225, 260], sat: [0.50, 0.90], val: [0.05, 0.30] },
  dawn:       { hue: [330, 50], sat: [0.30, 0.65], val: [0.65, 0.95] },
  dusk:       { hue: [260, 350], sat: [0.40, 0.75], val: [0.30, 0.65] },
  garden:     { hue: [80, 160], sat: [0.40, 0.75], val: [0.50, 0.90] },
  beach:      { hue: [40, 200], sat: [0.30, 0.70], val: [0.65, 0.95] },
  jungle:     { hue: [80, 130], sat: [0.55, 0.95], val: [0.20, 0.65] },
  arctic:     { hue: [180, 230], sat: [0.10, 0.40], val: [0.75, 0.98] },
  tropical:   { hue: [40, 200], sat: [0.65, 0.95], val: [0.55, 0.95] },

  // ------ EN: hue families ------
  red:        { hue: [350, 15],  sat: [0.55, 0.95], val: [0.50, 0.90] },
  orange:     { hue: [15, 40],   sat: [0.55, 0.95], val: [0.55, 0.90] },
  yellow:     { hue: [40, 65],   sat: [0.55, 0.95], val: [0.70, 0.98] },
  green:      { hue: [80, 150],  sat: [0.40, 0.85], val: [0.30, 0.85] },
  blue:       { hue: [200, 250], sat: [0.40, 0.85], val: [0.30, 0.85] },
  purple:     { hue: [255, 295], sat: [0.40, 0.85], val: [0.25, 0.80] },
  violet:     { hue: [260, 290], sat: [0.45, 0.85], val: [0.30, 0.80] },
  pink:       { hue: [300, 350], sat: [0.30, 0.75], val: [0.65, 0.95] },
  magenta:    { hue: [305, 335], sat: [0.65, 0.95], val: [0.45, 0.85] },
  teal:       { hue: [165, 195], sat: [0.45, 0.85], val: [0.30, 0.75] },
  indigo:     { hue: [240, 270], sat: [0.55, 0.95], val: [0.20, 0.55] },
  brown:      { hue: [15, 35],   sat: [0.30, 0.55], val: [0.20, 0.50] },
  gray:       { sat: [0.00, 0.10], val: [0.30, 0.85] },
  grey:       { sat: [0.00, 0.10], val: [0.30, 0.85] },

  // ------ EN: subjects ------
  fire:       { hue: [355, 35],  sat: [0.75, 1.00], val: [0.55, 0.95] },
  flame:      { hue: [355, 35],  sat: [0.75, 1.00], val: [0.55, 0.95] },
  ice:        { hue: [180, 220], sat: [0.10, 0.35], val: [0.80, 0.98] },
  storm:      { hue: [220, 260], sat: [0.20, 0.55], val: [0.20, 0.55] },
  sky:        { hue: [195, 230], sat: [0.30, 0.70], val: [0.65, 0.95] },
  cloud:      { sat: [0.05, 0.25], val: [0.78, 0.98] },
  moss:       { hue: [80, 110],  sat: [0.30, 0.55], val: [0.30, 0.65] },
  bone:       { hue: [30, 50],   sat: [0.10, 0.30], val: [0.80, 0.95] },
  sand:       { hue: [35, 55],   sat: [0.20, 0.45], val: [0.70, 0.95] },
  rust:       { hue: [10, 30],   sat: [0.55, 0.85], val: [0.35, 0.65] },
  copper:     { hue: [15, 30],   sat: [0.55, 0.80], val: [0.45, 0.75] },
  gold:       { hue: [40, 55],   sat: [0.65, 0.95], val: [0.65, 0.95] },
  silver:     { sat: [0.00, 0.12], val: [0.65, 0.90] },
  cream:      { hue: [40, 55],   sat: [0.10, 0.30], val: [0.85, 0.98] },
  rose:       { hue: [340, 360], sat: [0.35, 0.70], val: [0.65, 0.92] },
  lavender:   { hue: [255, 285], sat: [0.20, 0.45], val: [0.70, 0.92] },
  mint:       { hue: [140, 170], sat: [0.30, 0.55], val: [0.75, 0.95] },
  coral:      { hue: [355, 20],  sat: [0.50, 0.80], val: [0.70, 0.95] },
  charcoal:   { sat: [0.00, 0.20], val: [0.10, 0.30] },
  ink:        { sat: [0.00, 0.40], val: [0.05, 0.25] },
  ivory:      { hue: [40, 55],   sat: [0.05, 0.20], val: [0.90, 0.99] },
  cherry:     { hue: [355, 10],  sat: [0.65, 0.95], val: [0.40, 0.80] },
  plum:       { hue: [280, 310], sat: [0.45, 0.75], val: [0.30, 0.60] },
  olive:      { hue: [55, 85],   sat: [0.40, 0.65], val: [0.30, 0.55] },
  navy:       { hue: [215, 240], sat: [0.55, 0.95], val: [0.10, 0.35] },
  emerald:    { hue: [130, 160], sat: [0.65, 0.95], val: [0.30, 0.65] },
  ruby:       { hue: [340, 360], sat: [0.75, 0.95], val: [0.35, 0.70] },
  sapphire:   { hue: [215, 235], sat: [0.65, 0.95], val: [0.30, 0.65] },

  // ------ EN: aesthetic genres ------
  cyberpunk:  { hue: [280, 195], sat: [0.75, 1.00], val: [0.40, 0.95] },
  vaporwave:  { hue: [280, 200], sat: [0.55, 0.85], val: [0.65, 0.95] },
  brutalist:  { sat: [0.00, 0.20], val: [0.10, 0.95] },
  scandinavian:{ sat: [0.00, 0.20], val: [0.78, 0.97] },
  minimalist: { sat: [0.00, 0.15], val: [0.20, 0.95] },
  baroque:    { hue: [10, 50],   sat: [0.55, 0.85], val: [0.30, 0.75] },
  gothic:     { sat: [0.30, 0.70], val: [0.05, 0.30] },
  noir:       { sat: [0.00, 0.20], val: [0.05, 0.30] },
  bohemian:   { hue: [10, 50],   sat: [0.45, 0.75], val: [0.40, 0.80] },
  coquette:   { hue: [310, 350], sat: [0.30, 0.55], val: [0.80, 0.97] },
  grunge:     { sat: [0.20, 0.50], val: [0.20, 0.55] },

  // ------ TR ------
  sıcak:      { hue: [350, 65], sat: [0.45, 0.95], val: [0.50, 0.90] },
  sicak:      { hue: [350, 65], sat: [0.45, 0.95], val: [0.50, 0.90] },
  soğuk:      { hue: [160, 280], sat: [0.30, 0.85], val: [0.40, 0.85] },
  soguk:      { hue: [160, 280], sat: [0.30, 0.85], val: [0.40, 0.85] },
  canlı:      { sat: [0.75, 1.00], val: [0.65, 0.95] },
  canli:      { sat: [0.75, 1.00], val: [0.65, 0.95] },
  soluk:      { sat: [0.10, 0.35], val: [0.78, 0.97] },
  toprak:     { hue: [15, 50], sat: [0.30, 0.65], val: [0.30, 0.70] },
  doğal:      { hue: [30, 130], sat: [0.30, 0.60], val: [0.35, 0.75] },
  dogal:      { hue: [30, 130], sat: [0.30, 0.60], val: [0.35, 0.75] },
  pas:        { hue: [10, 30], sat: [0.55, 0.85], val: [0.35, 0.65] },
  bakır:      { hue: [15, 30], sat: [0.55, 0.80], val: [0.45, 0.75] },
  bakir:      { hue: [15, 30], sat: [0.55, 0.80], val: [0.45, 0.75] },
  altın:      { hue: [40, 55], sat: [0.65, 0.95], val: [0.65, 0.95] },
  altin:      { hue: [40, 55], sat: [0.65, 0.95], val: [0.65, 0.95] },
  gümüş:      { sat: [0.00, 0.12], val: [0.65, 0.90] },
  gumus:      { sat: [0.00, 0.12], val: [0.65, 0.90] },
  krem:       { hue: [40, 55], sat: [0.10, 0.30], val: [0.85, 0.98] },
  fildişi:    { hue: [40, 55], sat: [0.05, 0.20], val: [0.90, 0.99] },
  fildisi:    { hue: [40, 55], sat: [0.05, 0.20], val: [0.90, 0.99] },
  kırmızı:    { hue: [350, 15], sat: [0.55, 0.95], val: [0.50, 0.90] },
  kirmizi:    { hue: [350, 15], sat: [0.55, 0.95], val: [0.50, 0.90] },
  turuncu:    { hue: [15, 40], sat: [0.55, 0.95], val: [0.55, 0.90] },
  sarı:       { hue: [40, 65], sat: [0.55, 0.95], val: [0.70, 0.98] },
  sari:       { hue: [40, 65], sat: [0.55, 0.95], val: [0.70, 0.98] },
  yeşil:      { hue: [80, 150], sat: [0.40, 0.85], val: [0.30, 0.85] },
  yesil:      { hue: [80, 150], sat: [0.40, 0.85], val: [0.30, 0.85] },
  mavi:       { hue: [200, 250], sat: [0.40, 0.85], val: [0.30, 0.85] },
  mor:        { hue: [255, 295], sat: [0.40, 0.85], val: [0.25, 0.80] },
  pembe:      { hue: [300, 350], sat: [0.30, 0.75], val: [0.65, 0.95] },
  kahverengi: { hue: [15, 35], sat: [0.30, 0.55], val: [0.20, 0.50] },
  gri:        { sat: [0.00, 0.10], val: [0.30, 0.85] },
  siyah:      { sat: [0.00, 0.20], val: [0.05, 0.20] },
  beyaz:      { sat: [0.00, 0.10], val: [0.90, 1.00] },
  açık:       { val: [0.70, 0.95] },
  acik:       { val: [0.70, 0.95] },
  koyu:       { val: [0.10, 0.40] },
  loş:        { sat: [0.15, 0.45], val: [0.30, 0.55] },
  los:        { sat: [0.15, 0.45], val: [0.30, 0.55] },
  parlak:     { sat: [0.65, 1.00], val: [0.75, 0.98] },
  mat:        { sat: [0.10, 0.40], val: [0.40, 0.75] },
  şık:        { sat: [0.15, 0.40], val: [0.20, 0.55] },
  sik:        { sat: [0.15, 0.40], val: [0.20, 0.55] },
  romantik:   { hue: [300, 360], sat: [0.30, 0.65], val: [0.65, 0.92] },
  modern:     { sat: [0.10, 0.40], val: [0.20, 0.85] },
  klasik:     { hue: [10, 50], sat: [0.30, 0.60], val: [0.30, 0.70] },
  eski:       { sat: [0.20, 0.50], val: [0.30, 0.65] },
  yeni:       { sat: [0.55, 0.95], val: [0.65, 0.95] },
  deniz:      { hue: [180, 230], sat: [0.40, 0.80], val: [0.30, 0.80] },
  okyanus:    { hue: [180, 230], sat: [0.40, 0.80], val: [0.30, 0.80] },
  orman:      { hue: [80, 140], sat: [0.35, 0.75], val: [0.20, 0.65] },
  çöl:        { hue: [20, 45], sat: [0.30, 0.60], val: [0.55, 0.90] },
  col:        { hue: [20, 45], sat: [0.30, 0.60], val: [0.55, 0.90] },
  kar:        { sat: [0.05, 0.20], val: [0.85, 1.00] },
  ateş:       { hue: [355, 35], sat: [0.75, 1.00], val: [0.55, 0.95] },
  ates:       { hue: [355, 35], sat: [0.75, 1.00], val: [0.55, 0.95] },
  buz:        { hue: [180, 220], sat: [0.10, 0.35], val: [0.80, 0.98] },
  gökyüzü:    { hue: [195, 230], sat: [0.30, 0.70], val: [0.65, 0.95] },
  gokyuzu:    { hue: [195, 230], sat: [0.30, 0.70], val: [0.65, 0.95] },
  gece:       { hue: [220, 270], sat: [0.45, 0.85], val: [0.10, 0.40] },
  gündüz:     { sat: [0.40, 0.80], val: [0.70, 0.95] },
  gunduz:     { sat: [0.40, 0.80], val: [0.70, 0.95] },
  şafak:      { hue: [330, 50], sat: [0.30, 0.65], val: [0.65, 0.95] },
  safak:      { hue: [330, 50], sat: [0.30, 0.65], val: [0.65, 0.95] },
  alacakaranlık: { hue: [260, 350], sat: [0.40, 0.75], val: [0.30, 0.65] },
  alacakaranlik: { hue: [260, 350], sat: [0.40, 0.75], val: [0.30, 0.65] },
  ilkbahar:   { hue: [60, 150], sat: [0.40, 0.70], val: [0.70, 0.95] },
  yaz:        { hue: [40, 200], sat: [0.55, 0.85], val: [0.70, 0.95] },
  sonbahar:   { hue: [10, 45], sat: [0.55, 0.90], val: [0.40, 0.80] },
  kış:        { hue: [180, 240], sat: [0.10, 0.35], val: [0.65, 0.95] },
  kis:        { hue: [180, 240], sat: [0.10, 0.35], val: [0.65, 0.95] },
};

const STOPWORDS = new Set([
  "a", "an", "the", "of", "and", "or", "but", "in", "on", "at",
  "ile", "ve", "veya", "ama", "de", "da", "için", "icin",
]);

export interface ParsedPrompt {
  tokens: string[];
  matched: string[];
  unknown: string[];
  bias: Bias;
}

export function parsePrompt(input: string): ParsedPrompt {
  const tokens = input
    .toLowerCase()
    .replace(/[^\p{L}\s-]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));

  const matched: string[] = [];
  const unknown: string[] = [];
  const biases: Bias[] = [];
  for (const t of tokens) {
    const b = KEYWORD_BIAS[t];
    if (b) { matched.push(t); biases.push(b); }
    else unknown.push(t);
  }
  return { tokens, matched, unknown, bias: mergeBiases(biases) };
}

function mergeBiases(biases: Bias[]): Bias {
  if (!biases.length) return {};
  const out: Bias = {};
  // Saturation/value: intersect (tightest range wins).
  let satLo = 0, satHi = 1, satSet = false;
  let valLo = 0, valHi = 1, valSet = false;
  for (const b of biases) {
    if (b.sat) {
      if (!satSet) { [satLo, satHi] = b.sat; satSet = true; }
      else { satLo = Math.max(satLo, b.sat[0]); satHi = Math.min(satHi, b.sat[1]); }
    }
    if (b.val) {
      if (!valSet) { [valLo, valHi] = b.val; valSet = true; }
      else { valLo = Math.max(valLo, b.val[0]); valHi = Math.min(valHi, b.val[1]); }
    }
  }
  if (satSet) {
    if (satLo > satHi) [satLo, satHi] = [satHi, satLo];
    out.sat = [satLo, satHi];
  }
  if (valSet) {
    if (valLo > valHi) [valLo, valHi] = [valHi, valLo];
    out.val = [valLo, valHi];
  }
  // Hue: keep last specified (most specific tends to come last in phrase).
  for (const b of biases) {
    if (b.hue) out.hue = b.hue;
  }
  return out;
}

function rangeSample(lo: number, hi: number, t: number): number {
  return lo + (hi - lo) * t;
}

function hueSample(hue: [number, number] | undefined, t: number): number {
  if (!hue) return t * 360;
  const [a, b] = hue;
  if (a <= b) return rangeSample(a, b, t);
  // wrap around 360 (e.g. 350 -> 15)
  const span = (360 - a) + b;
  const v = a + t * span;
  return v >= 360 ? v - 360 : v;
}

// Spread n swatches across the merged bias.
export function biasToPalette(bias: Bias, n: number, jitter = 0.08): Swatch[] {
  const out: Swatch[] = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const j = (Math.random() - 0.5) * jitter;
    const h = hueSample(bias.hue, Math.max(0, Math.min(1, t + j)));
    const s = bias.sat ? rangeSample(bias.sat[0], bias.sat[1], Math.max(0, Math.min(1, 1 - t + j))) : 0.65;
    const v = bias.val ? rangeSample(bias.val[0], bias.val[1], Math.max(0, Math.min(1, t + j))) : 0.65;
    const rgb = hsvToRgb(h, s, v);
    const [L, a, b] = rgbToLab(...rgb);
    out.push({ rgb, L, chroma: Math.sqrt(a * a + b * b) });
  }
  return out;
}

export function promptKeywordCount(): number {
  return Object.keys(KEYWORD_BIAS).length;
}
