// Named-color dictionary — finds the closest English color name for any RGB.
// Lookup is in CIE Lab space for perceptual nearest-neighbor.

import type { RGB } from "@/types";
import { hexToRgb, rgbToLab } from "./color";

interface NamedEntry { name: string; hex: string; lab: [number, number, number] }

const RAW: { name: string; hex: string }[] = [
  { name: "Black", hex: "#000000" },
  { name: "Charcoal", hex: "#36454f" },
  { name: "Graphite", hex: "#2a2a2a" },
  { name: "Slate", hex: "#708090" },
  { name: "Grey", hex: "#808080" },
  { name: "Silver", hex: "#c0c0c0" },
  { name: "Pearl", hex: "#eaeaea" },
  { name: "White", hex: "#ffffff" },
  { name: "Cream", hex: "#fffdd0" },
  { name: "Ivory", hex: "#fffff0" },
  { name: "Bone", hex: "#e3dac9" },
  { name: "Beige", hex: "#f5f5dc" },
  { name: "Sand", hex: "#c2b280" },
  { name: "Khaki", hex: "#c3b091" },
  { name: "Tan", hex: "#d2b48c" },
  { name: "Camel", hex: "#c19a6b" },
  { name: "Brown", hex: "#8b4513" },
  { name: "Sienna", hex: "#a0522d" },
  { name: "Umber", hex: "#635147" },
  { name: "Sepia", hex: "#704214" },
  { name: "Rust", hex: "#b7410e" },
  { name: "Brick", hex: "#9b3a3a" },
  { name: "Wine", hex: "#722f37" },
  { name: "Maroon", hex: "#800000" },
  { name: "Burgundy", hex: "#570404" },
  { name: "Crimson", hex: "#dc143c" },
  { name: "Red", hex: "#e63946" },
  { name: "Scarlet", hex: "#ff2400" },
  { name: "Coral", hex: "#ff7f50" },
  { name: "Salmon", hex: "#fa8072" },
  { name: "Pink", hex: "#ffc0cb" },
  { name: "Rose", hex: "#ff66cc" },
  { name: "Magenta", hex: "#ff00ff" },
  { name: "Plum", hex: "#8e4585" },
  { name: "Lavender", hex: "#b497d6" },
  { name: "Violet", hex: "#8a2be2" },
  { name: "Purple", hex: "#6a0dad" },
  { name: "Indigo", hex: "#4b0082" },
  { name: "Royal", hex: "#4169e1" },
  { name: "Navy", hex: "#1a2752" },
  { name: "Steel", hex: "#4682b4" },
  { name: "Blue", hex: "#0a66dd" },
  { name: "Cobalt", hex: "#0047ab" },
  { name: "Sky", hex: "#87ceeb" },
  { name: "Azure", hex: "#a3d8f4" },
  { name: "Cyan", hex: "#00b7c2" },
  { name: "Teal", hex: "#008080" },
  { name: "Turquoise", hex: "#40e0d0" },
  { name: "Mint", hex: "#98e0b6" },
  { name: "Aqua", hex: "#7fffd4" },
  { name: "Sage", hex: "#9caf88" },
  { name: "Olive", hex: "#808000" },
  { name: "Moss", hex: "#5a6b3b" },
  { name: "Forest", hex: "#1f5132" },
  { name: "Emerald", hex: "#2f8b53" },
  { name: "Green", hex: "#3a8b40" },
  { name: "Lime", hex: "#8fcb46" },
  { name: "Chartreuse", hex: "#7fff00" },
  { name: "Yellow", hex: "#ffd60a" },
  { name: "Lemon", hex: "#fff44f" },
  { name: "Mustard", hex: "#d4a83a" },
  { name: "Gold", hex: "#d4a017" },
  { name: "Amber", hex: "#ffbf00" },
  { name: "Apricot", hex: "#fbceb1" },
  { name: "Peach", hex: "#ffd0a8" },
  { name: "Tangerine", hex: "#f28500" },
  { name: "Orange", hex: "#ff7a00" },
  { name: "Ochre", hex: "#c89c4c" },
];

const NAMED_LAB: NamedEntry[] = RAW.map(({ name, hex }) => {
  const [r, g, b] = hexToRgb(hex);
  return { name, hex, lab: rgbToLab(r, g, b) };
});

export function nameForRGB(rgb: RGB): string {
  const [tL, tA, tB] = rgbToLab(...rgb);
  let best = NAMED_LAB[0];
  let bestD = Infinity;
  for (const n of NAMED_LAB) {
    const [L, A, B] = n.lab;
    const d = (L - tL) ** 2 + (A - tA) ** 2 + (B - tB) ** 2;
    if (d < bestD) { bestD = d; best = n; }
  }
  return best.name;
}

export function paletteLabel(L: number, chroma: number): string {
  const light = L < 25 ? "deep" : L < 50 ? "shadow" : L < 75 ? "mid" : "bright";
  const ch = chroma < 12 ? "muted" : chroma < 30 ? "soft" : "vivid";
  return `${ch} · ${light}`;
}
