// UI persona helpers — palette → semantic tokens, hover/active states,
// light/dark theme pair, shadcn-style config export.

import type { Swatch, RGB } from "@/types";
import { rgbToHex, rgbToHsv, hsvToRgb, wcagContrast, rgbToLab } from "./color";

export type SemanticRole =
  | "primary" | "secondary" | "tertiary"
  | "background" | "surface" | "muted"
  | "success" | "warning" | "error" | "info";

export interface SemanticTokens {
  primary: RGB;
  secondary: RGB;
  tertiary: RGB;
  background: RGB;
  surface: RGB;
  muted: RGB;
  success: RGB;
  warning: RGB;
  error: RGB;
  info: RGB;
}

// Score a swatch for "primary-ness": vibrant + medium lightness.
function vibrancy(rgb: RGB): number {
  const [, s, v] = rgbToHsv(...rgb);
  const lightnessScore = 1 - Math.abs(0.55 - v) * 2;
  return s * Math.max(0, lightnessScore);
}

function lightness(rgb: RGB): number {
  return rgbToHsv(...rgb)[2];
}

function hueDistance(a: RGB, b: RGB): number {
  const ha = rgbToHsv(...a)[0];
  const hb = rgbToHsv(...b)[0];
  return Math.min(Math.abs(ha - hb), 360 - Math.abs(ha - hb));
}

export function deriveSemantic(palette: Swatch[]): SemanticTokens {
  if (!palette.length) {
    return {
      primary: [122, 75, 138], secondary: [196, 163, 216], tertiary: [90, 60, 120],
      background: [255, 255, 255], surface: [248, 248, 248], muted: [180, 180, 180],
      success: [46, 160, 67], warning: [230, 145, 56], error: [200, 0, 0], info: [56, 132, 230],
    };
  }
  const sorted = [...palette].sort((a, b) => vibrancy(b.rgb) - vibrancy(a.rgb));
  const primary = sorted[0]?.rgb ?? [122, 75, 138];

  // Secondary: most vibrant with hue distance > 30 from primary
  const secondary = sorted.find(s => hueDistance(s.rgb, primary) > 30)?.rgb
    ?? sorted[1]?.rgb ?? primary;

  // Tertiary: hue different from both
  const tertiary = sorted.find(s =>
    hueDistance(s.rgb, primary) > 30 && hueDistance(s.rgb, secondary) > 30
  )?.rgb ?? sorted[2]?.rgb ?? secondary;

  // Background: lightest swatch (or near-white)
  const lightSorted = [...palette].sort((a, b) => lightness(b.rgb) - lightness(a.rgb));
  const background = lightSorted[0] && lightness(lightSorted[0].rgb) > 0.85
    ? lightSorted[0].rgb : [255, 255, 255] as RGB;

  // Surface: 4% darker than background
  const surface = adjustLightness(background, -0.03);
  // Muted: medium-light gray derived from primary hue, low sat
  const [pH] = rgbToHsv(...primary);
  const muted = hsvToRgb(pH, 0.06, 0.65);

  // Semantic colors: standard hues, slightly tinted toward primary
  const success: RGB = [46, 160, 67];
  const warning: RGB = [230, 145, 56];
  const error: RGB = [200, 0, 0];
  const info: RGB = [56, 132, 230];

  return { primary, secondary, tertiary, background, surface, muted, success, warning, error, info };
}

export function adjustLightness(rgb: RGB, delta: number): RGB {
  const [h, s, v] = rgbToHsv(...rgb);
  return hsvToRgb(h, s, Math.max(0, Math.min(1, v + delta)));
}

export interface InteractiveStates {
  base: string;
  hover: string;
  active: string;
  focus: string;
  disabled: string;
}

export function deriveStates(rgb: RGB): InteractiveStates {
  const baseHex = rgbToHex(...rgb).toUpperCase();
  return {
    base: baseHex,
    hover: rgbToHex(...adjustLightness(rgb, -0.08)).toUpperCase(),
    active: rgbToHex(...adjustLightness(rgb, -0.14)).toUpperCase(),
    focus: rgbToHex(...adjustLightness(rgb, 0.06)).toUpperCase(),
    disabled: rgbToHex(...adjustLightness(rgb, 0.25)).toUpperCase() + " · 50%",
  };
}

// Pair light/dark from primary + bg derived above.
export interface ThemePair {
  light: Record<string, string>;
  dark: Record<string, string>;
}

function darkInvert(rgb: RGB): RGB {
  // For semantic colors: keep hue, push lightness toward 70-80 for dark mode.
  const [h, s, v] = rgbToHsv(...rgb);
  const newV = v < 0.5 ? Math.min(0.85, v + 0.55) : v;
  return hsvToRgb(h, Math.max(0.3, s), newV);
}

export function buildThemePair(tokens: SemanticTokens): ThemePair {
  const toHex = (rgb: RGB) => rgbToHex(...rgb).toUpperCase();
  return {
    light: {
      background: toHex(tokens.background),
      foreground: "#0A0A0A",
      surface: toHex(tokens.surface),
      muted: toHex(tokens.muted),
      primary: toHex(tokens.primary),
      "primary-foreground": "#FFFFFF",
      secondary: toHex(tokens.secondary),
      "secondary-foreground": "#0A0A0A",
      tertiary: toHex(tokens.tertiary),
      success: toHex(tokens.success),
      warning: toHex(tokens.warning),
      error: toHex(tokens.error),
      info: toHex(tokens.info),
      border: "#E5E5E5",
    },
    dark: {
      background: "#0A0A0A",
      foreground: "#F5F5F5",
      surface: "#171717",
      muted: toHex(adjustLightness(tokens.muted, -0.4)),
      primary: toHex(darkInvert(tokens.primary)),
      "primary-foreground": "#0A0A0A",
      secondary: toHex(darkInvert(tokens.secondary)),
      "secondary-foreground": "#F5F5F5",
      tertiary: toHex(darkInvert(tokens.tertiary)),
      success: toHex(darkInvert(tokens.success)),
      warning: toHex(darkInvert(tokens.warning)),
      error: toHex(darkInvert(tokens.error)),
      info: toHex(darkInvert(tokens.info)),
      border: "#262626",
    },
  };
}

// shadcn/ui uses HSL triplets in CSS variables. Convert.
function rgbToHslTriplet(rgb: RGB): string {
  const r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  let h = 0, s = 0;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function shadcnConfig(tokens: SemanticTokens, pair: ThemePair): string {
  const lightVars: string[] = [];
  const darkVars: string[] = [];
  // Map light mode HSL triplets
  const lightMap: Record<string, RGB> = {
    background: tokens.background,
    foreground: [10, 10, 10],
    primary: tokens.primary,
    "primary-foreground": [255, 255, 255],
    secondary: tokens.secondary,
    "secondary-foreground": [10, 10, 10],
    accent: tokens.tertiary,
    "accent-foreground": [10, 10, 10],
    muted: tokens.muted,
    "muted-foreground": [115, 115, 115],
    border: [229, 229, 229],
    destructive: tokens.error,
    "destructive-foreground": [255, 255, 255],
    card: tokens.surface,
    "card-foreground": [10, 10, 10],
  };
  for (const [k, v] of Object.entries(lightMap)) {
    lightVars.push(`    --${k}: ${rgbToHslTriplet(v)};`);
  }
  // Dark mode: keep keys, swap values
  const darkMap: Record<string, string> = {
    background: "0 0% 4%",
    foreground: "0 0% 96%",
    primary: rgbToHslTriplet(darkInvert(tokens.primary)),
    "primary-foreground": "0 0% 4%",
    secondary: rgbToHslTriplet(darkInvert(tokens.secondary)),
    "secondary-foreground": "0 0% 96%",
    accent: rgbToHslTriplet(darkInvert(tokens.tertiary)),
    "accent-foreground": "0 0% 96%",
    muted: "0 0% 15%",
    "muted-foreground": "0 0% 64%",
    border: "0 0% 15%",
    destructive: rgbToHslTriplet(darkInvert(tokens.error)),
    "destructive-foreground": "0 0% 96%",
    card: "0 0% 9%",
    "card-foreground": "0 0% 96%",
  };
  for (const [k, v] of Object.entries(darkMap)) {
    darkVars.push(`    --${k}: ${v};`);
  }
  // Suppress unused-var warning for `pair`
  void pair;
  return `@layer base {
  :root {
${lightVars.join("\n")}
  }

  .dark {
${darkVars.join("\n")}
  }
}`;
}

export function tailwindConfig(tokens: SemanticTokens): string {
  const toHex = (rgb: RGB) => rgbToHex(...rgb).toUpperCase();
  return `// tailwind.config.js — colors slot
{
  colors: {
    primary: '${toHex(tokens.primary)}',
    secondary: '${toHex(tokens.secondary)}',
    tertiary: '${toHex(tokens.tertiary)}',
    surface: '${toHex(tokens.surface)}',
    muted: '${toHex(tokens.muted)}',
    success: '${toHex(tokens.success)}',
    warning: '${toHex(tokens.warning)}',
    error: '${toHex(tokens.error)}',
    info: '${toHex(tokens.info)}',
  }
}`;
}

// Pairwise WCAG audit matrix — for the "live audit" panel.
export interface ContrastCell {
  ratio: number;
  grade: "AAA" | "AA" | "AA·LG" | "FAIL";
}

export function auditMatrix(palette: Swatch[]): ContrastCell[][] {
  const matrix: ContrastCell[][] = [];
  for (const a of palette) {
    const row: ContrastCell[] = [];
    for (const b of palette) {
      const ratio = wcagContrast(a.rgb, b.rgb);
      const grade =
        ratio >= 7 ? "AAA" :
        ratio >= 4.5 ? "AA" :
        ratio >= 3 ? "AA·LG" : "FAIL";
      row.push({ ratio: Math.round(ratio * 10) / 10, grade });
    }
    matrix.push(row);
  }
  return matrix;
}

// 60-30-10 demo arrangement — returns 3 RGB roles.
export function rule603010(palette: Swatch[]): { dominant: RGB; secondary: RGB; accent: RGB } {
  if (!palette.length) {
    return { dominant: [255, 255, 255], secondary: [200, 200, 200], accent: [122, 75, 138] };
  }
  const sortedByLight = [...palette].sort((a, b) => lightness(b.rgb) - lightness(a.rgb));
  const sortedByVibrance = [...palette].sort((a, b) => vibrancy(b.rgb) - vibrancy(a.rgb));
  return {
    dominant: sortedByLight[0]?.rgb ?? [255, 255, 255],
    secondary: sortedByLight[Math.floor(palette.length / 2)]?.rgb ?? [200, 200, 200],
    accent: sortedByVibrance[0]?.rgb ?? [122, 75, 138],
  };
}

// Helper for rgbToLab in case caller wants to import all from one place.
export { rgbToLab };
