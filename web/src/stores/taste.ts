// Taste profile — built up by liking/disliking sample swatches.
// Stored as histograms over hue (12 bins), saturation, lightness.
// Used as an extra bias when generating palettes.
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { hsvToRgb, rgbToHex, rgbToHsv, hexToRgb } from "@/services/color";
import type { Bias } from "@/services/promptBias";

const KEY = "nnc_taste_v1";
const LIKED_KEY = "nnc_taste_liked_v1";
const HUE_BINS = 12;
const SV_BINS = 5;

export interface LikedColor {
  hex: string;
  ts: number;          // timestamp ms
}

interface TasteState {
  hue: number[];
  sat: number[];
  val: number[];
  count: number;
  lastSession: number; // last session timestamp ms (for daily streak)
}

function blank(): TasteState {
  return {
    hue: new Array(HUE_BINS).fill(0),
    sat: new Array(SV_BINS).fill(0),
    val: new Array(SV_BINS).fill(0),
    count: 0,
    lastSession: 0,
  };
}

function loadLiked(): LikedColor[] {
  try {
    const raw = localStorage.getItem(LIKED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function persistLiked(arr: LikedColor[]) {
  try { localStorage.setItem(LIKED_KEY, JSON.stringify(arr)); } catch {}
}

function dayStart(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
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

// Generate a daily-rotating carousel of 30 swatches.
// Seed by day ordinal so the same set shows all day, but it's different
// each day — gives users a reason to come back.
export function trainingSwatches(seedDay?: number): { hex: string; h: number; s: number; v: number }[] {
  const day = seedDay ?? Math.floor(Date.now() / 86400000);
  const out: { hex: string; h: number; s: number; v: number }[] = [];
  // Daily-shifted sweeps + hue offset
  const hueOffset = (day * 17) % 360;
  const sweeps = [
    { s: 0.85, v: 0.85 },   // vivid
    { s: 0.55, v: 0.95 },   // light
    { s: 0.40, v: 0.55 },   // muted-mid
    { s: 0.25, v: 0.85 },   // pastel
    { s: 0.85, v: 0.45 },   // deep
  ];
  for (const sw of sweeps) {
    for (let i = 0; i < 6; i++) {
      const h = (hueOffset + i * 60 + (day * 7) % 30) % 360;
      const rgb = hsvToRgb(h, sw.s, sw.v);
      out.push({ hex: rgbToHex(...rgb), h, s: sw.s, v: sw.v });
    }
  }
  // Shuffle deterministically by day so order varies
  const seeded = (i: number) => ((day * 1103515245 + i * 12345) % 2147483648) / 2147483648;
  out.sort((a, b) => seeded(out.indexOf(a)) - seeded(out.indexOf(b)));
  return out;
}

export const useTasteStore = defineStore("taste", () => {
  const state = ref<TasteState>(load());
  const liked = ref<LikedColor[]>(loadLiked());

  const trained = computed(() => state.value.count > 0);

  // Daily session tracking — true if user trained today
  const trainedToday = computed(() => {
    if (!state.value.lastSession) return false;
    return dayStart(state.value.lastSession) === dayStart(Date.now());
  });

  // Streak: how many consecutive days
  const streak = computed(() => {
    if (!state.value.lastSession) return 0;
    const last = dayStart(state.value.lastSession);
    const today = dayStart(Date.now());
    if (last === today) return 1; // training today counts as 1
    return 0; // simple impl, could track full streak history
  });

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
    state.value.lastSession = Date.now();
    persist(state.value);

    // Save to liked list (dedupe by hex)
    const upperHex = hex.toUpperCase();
    if (!liked.value.find(l => l.hex.toUpperCase() === upperHex)) {
      liked.value.unshift({ hex: upperHex, ts: Date.now() });
      persistLiked(liked.value);
    }
  }

  function skip(_hex: string) {
    // For now a skip just costs nothing — could subtract weight in v2.
  }

  function unlike(hex: string) {
    const upperHex = hex.toUpperCase();
    liked.value = liked.value.filter(l => l.hex.toUpperCase() !== upperHex);
    persistLiked(liked.value);
  }

  function reset() {
    state.value = blank();
    persist(state.value);
    liked.value = [];
    persistLiked(liked.value);
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

  return {
    state, liked, trained, trainedToday, streak,
    like, skip, unlike, reset, bias,
  };
});
