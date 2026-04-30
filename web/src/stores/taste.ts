// Taste profile — built up by liking/disliking sample swatches.
// Stored as histograms over hue (12 bins), saturation, lightness.
// Used as an extra bias when generating palettes.
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { hsvToRgb, rgbToHex, rgbToHsv, hexToRgb } from "@/services/color";
import type { Bias } from "@/services/promptBias";

const KEY = "nnc_taste_v1";
const HUE_BINS = 12;
const SV_BINS = 5;

interface TasteState {
  hue: number[];
  sat: number[];
  val: number[];
  count: number;
}

function blank(): TasteState {
  return {
    hue: new Array(HUE_BINS).fill(0),
    sat: new Array(SV_BINS).fill(0),
    val: new Array(SV_BINS).fill(0),
    count: 0,
  };
}

function load(): TasteState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.hue) && parsed.hue.length === HUE_BINS) return parsed;
    }
  } catch {}
  return blank();
}

function persist(state: TasteState) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
}

function dominantBin(arr: number[]): number {
  let max = -1, idx = 0;
  for (let i = 0; i < arr.length; i++) if (arr[i] > max) { max = arr[i]; idx = i; }
  return idx;
}

function topRange(arr: number[], spread = 1): [number, number] {
  // Find the top bin and a small window around it.
  const idx = dominantBin(arr);
  const lo = Math.max(0, idx - spread);
  const hi = Math.min(arr.length - 1, idx + spread);
  return [lo / arr.length, (hi + 1) / arr.length];
}

// Generate a 30-swatch sampling carousel deterministically by index.
export function trainingSwatches(): { hex: string; h: number; s: number; v: number }[] {
  const out: { hex: string; h: number; s: number; v: number }[] = [];
  const sweeps = [
    { s: 0.85, v: 0.85 },   // vivid
    { s: 0.55, v: 0.95 },   // light
    { s: 0.40, v: 0.55 },   // muted-mid
    { s: 0.25, v: 0.85 },   // pastel
    { s: 0.85, v: 0.45 },   // deep
  ];
  for (const sw of sweeps) {
    for (let h = 0; h < 360; h += 60) {
      const rgb = hsvToRgb(h, sw.s, sw.v);
      out.push({ hex: rgbToHex(...rgb), h, s: sw.s, v: sw.v });
    }
  }
  return out;
}

export const useTasteStore = defineStore("taste", () => {
  const state = ref<TasteState>(load());

  const trained = computed(() => state.value.count > 0);

  function like(hex: string) {
    const rgb = hexToRgb(hex);
    const [h, s, v] = rgbToHsv(...rgb);
    const hueIdx = Math.min(HUE_BINS - 1, Math.floor((h / 360) * HUE_BINS));
    const satIdx = Math.min(SV_BINS - 1, Math.floor(s * SV_BINS));
    const valIdx = Math.min(SV_BINS - 1, Math.floor(v * SV_BINS));
    state.value.hue[hueIdx]++;
    state.value.sat[satIdx]++;
    state.value.val[valIdx]++;
    state.value.count++;
    persist(state.value);
  }

  function skip(_hex: string) {
    // For now a skip just costs nothing — could subtract weight in v2.
  }

  function reset() {
    state.value = blank();
    persist(state.value);
  }

  // Convert profile into a Bias suitable for promptBias.biasToPalette.
  const bias = computed<Bias>(() => {
    if (!state.value.count) return {};
    const [hLo, hHi] = topRange(state.value.hue, 1);
    const [sLo, sHi] = topRange(state.value.sat, 1);
    const [vLo, vHi] = topRange(state.value.val, 1);
    return {
      hue: [hLo * 360, hHi * 360],
      sat: [sLo, sHi],
      val: [vLo, vHi],
    };
  });

  return { state, trained, like, skip, reset, bias };
});
