import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { RGB } from "@/types";
import { rgbToHsv } from "@/services/color";

const KEY = "nnc_taste_v1";

interface Vote {
  rgb: RGB;
  liked: boolean;
}

interface Stored {
  votes: Vote[];
}

function load(): Stored {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { votes: [] };
  } catch { return { votes: [] }; }
}
function persist(s: Stored) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}

export interface TasteProfile {
  hueWeights: number[];           // 12-bin histogram (30° each)
  satRange: [number, number];     // 0-1 — central tendency band
  litRange: [number, number];
  sampleCount: number;
  ready: boolean;                 // ≥ 8 votes recommended
}

export const useTasteStore = defineStore("taste", () => {
  const stored = ref<Stored>(load());

  const liked = computed(() => stored.value.votes.filter(v => v.liked));

  const profile = computed<TasteProfile>(() => {
    const bins = new Array(12).fill(0);
    const sats: number[] = [];
    const lits: number[] = [];
    for (const v of liked.value) {
      const [h, s, val] = rgbToHsv(...v.rgb);
      bins[Math.floor(h / 30) % 12] += 1;
      sats.push(s);
      lits.push(val);
    }
    const total = bins.reduce((a, b) => a + b, 0) || 1;
    const hueWeights = bins.map(b => b / total);

    const med = (xs: number[], q: number) => {
      if (!xs.length) return q;
      const s = [...xs].sort((a, b) => a - b);
      return s[Math.floor(s.length / 2)];
    };
    const ms = med(sats, 0.5), ml = med(lits, 0.5);
    const spread = 0.2;
    return {
      hueWeights,
      satRange: [Math.max(0, ms - spread), Math.min(1, ms + spread)],
      litRange: [Math.max(0, ml - spread), Math.min(1, ml + spread)],
      sampleCount: liked.value.length,
      ready: liked.value.length >= 8,
    };
  });

  function vote(rgb: RGB, liked: boolean) {
    stored.value.votes.push({ rgb, liked });
    persist(stored.value);
  }

  function reset() {
    stored.value = { votes: [] };
    persist(stored.value);
  }

  function preferredHue(): number {
    const w = profile.value.hueWeights;
    if (!w.some(v => v > 0)) return 200;
    const max = Math.max(...w);
    const idx = w.indexOf(max);
    return idx * 30 + 15;
  }

  return { profile, vote, reset, preferredHue, sampleCount: computed(() => liked.value.length) };
});
