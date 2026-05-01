<script setup lang="ts">
import { ref, computed } from "vue";
import type { Swatch, RGB } from "@/types";
import { rgbToHex, rgbToHsv, hsvToRgb, rgbToCmyk, hexToRgb } from "@/services/color";
import { useToastStore } from "@/stores/toast";

const props = defineProps<{ palette: Swatch[] }>();
const toast = useToastStore();

type Tab = "psych" | "lock" | "gamut" | "matched" | "trademark" | "seasonal";
const tab = ref<Tab>("psych");

const tabs: { id: Tab; label: string }[] = [
  { id: "psych", label: "psychology" },
  { id: "lock", label: "brand lock" },
  { id: "gamut", label: "gamut audit" },
  { id: "matched", label: "rgb / cmyk pair" },
  { id: "trademark", label: "trademark check" },
  { id: "seasonal", label: "seasonal" },
];

// PSYCHOLOGY — hue family → associations
const HUE_PSYCH: { range: [number, number]; family: string; positive: string[]; negative: string[]; brands: string[] }[] = [
  { range: [350, 15],  family: "red",     positive: ["urgency", "passion", "energy", "appetite"], negative: ["aggression", "danger", "warning"], brands: ["Coca-Cola", "Netflix", "YouTube"] },
  { range: [15, 40],   family: "orange",  positive: ["enthusiasm", "warmth", "creativity"], negative: ["cheap", "loud"], brands: ["Nickelodeon", "JBL", "SoundCloud"] },
  { range: [40, 65],   family: "yellow",  positive: ["optimism", "clarity", "youth"], negative: ["caution", "anxiety"], brands: ["McDonald's", "IKEA", "Snapchat"] },
  { range: [65, 160],  family: "green",   positive: ["growth", "nature", "health", "money"], negative: ["envy", "boredom"], brands: ["Spotify", "Whole Foods", "Starbucks"] },
  { range: [160, 200], family: "cyan",    positive: ["clarity", "calm", "tech"], negative: ["sterile", "cold"], brands: ["Twitter / X (legacy)", "Skype"] },
  { range: [200, 250], family: "blue",    positive: ["trust", "stability", "professionalism"], negative: ["sadness", "distance"], brands: ["Facebook", "PayPal", "IBM"] },
  { range: [250, 295], family: "purple",  positive: ["luxury", "creativity", "spirituality"], negative: ["mystery", "decadence"], brands: ["Twitch", "Yahoo", "Cadbury"] },
  { range: [295, 350], family: "pink",    positive: ["playful", "feminine", "modern"], negative: ["frivolous", "naive"], brands: ["T-Mobile", "Cosmopolitan", "Lyft"] },
];

function hueFamily(rgb: RGB) {
  const h = rgbToHsv(...rgb)[0];
  for (const fam of HUE_PSYCH) {
    const [lo, hi] = fam.range;
    if (lo <= hi) { if (h >= lo && h < hi) return fam; }
    else { if (h >= lo || h < hi) return fam; }
  }
  return HUE_PSYCH[0];
}

const psychReadings = computed(() =>
  props.palette.map(sw => ({
    hex: rgbToHex(...sw.rgb),
    rgb: sw.rgb,
    fam: hueFamily(sw.rgb),
  }))
);

// BRAND LOCK — pick "primary" + derive logo/accent/neutral/CTA from one swatch
const lockSeedHex = computed(() =>
  props.palette[0] ? rgbToHex(...props.palette[0].rgb) : "#000000"
);

const lockKit = computed(() => {
  if (!props.palette.length) return null;
  const seed = props.palette[0].rgb;
  const [h, s, v] = rgbToHsv(...seed);
  return {
    primary: rgbToHex(...seed).toUpperCase(),
    primaryDark: rgbToHex(...hsvToRgb(h, s, Math.max(0.05, v - 0.18))).toUpperCase(),
    accent: rgbToHex(...hsvToRgb((h + 180) % 360, Math.min(1, s * 1.05), v)).toUpperCase(),
    bg: "#FFFFFF",
    surface: "#FAFAFA",
    text: v < 0.4 ? "#FFFFFF" : "#0A0A0A",
    border: "#E5E5E5",
    cta: rgbToHex(...hsvToRgb(h, Math.min(1, s * 1.15), Math.min(1, v * 1.05))).toUpperCase(),
  };
});

// GAMUT — flag colors that exceed sRGB simply by checking if they live near
// the corners (heuristic; real gamut check needs colour-science). For now
// flag highly saturated greens and reds as "consider P3 for screens".
function gamutWarn(rgb: RGB): { sRGB: boolean; needsP3: boolean; cmykPrintable: boolean } {
  const [h, s] = rgbToHsv(...rgb);
  const cmyk = rgbToCmyk(...rgb);
  const cmykPrintable = !(s > 0.85 && (h > 100 && h < 220));
  return {
    sRGB: true,
    needsP3: s > 0.92 && (h < 30 || h > 90 && h < 160),
    cmykPrintable,
  };
}

const gamutAudit = computed(() =>
  props.palette.map(sw => ({
    hex: rgbToHex(...sw.rgb),
    rgb: sw.rgb,
    flags: gamutWarn(sw.rgb),
    cmyk: rgbToCmyk(...sw.rgb),
  }))
);

// RGB / CMYK matched pair
const matchedPair = computed(() =>
  props.palette.map(sw => {
    const cmyk = rgbToCmyk(...sw.rgb);
    // Round-trip approximation
    const k = cmyk[3] / 100;
    const r = Math.round(255 * (1 - cmyk[0] / 100) * (1 - k));
    const g = Math.round(255 * (1 - cmyk[1] / 100) * (1 - k));
    const b = Math.round(255 * (1 - cmyk[2] / 100) * (1 - k));
    return {
      original: rgbToHex(...sw.rgb).toUpperCase(),
      printSimulated: rgbToHex(r, g, b).toUpperCase(),
      cmyk,
    };
  })
);

// TRADEMARK — small dataset of famous brand colors (not exhaustive, fair-use ref)
const TRADEMARK_DATABASE: { brand: string; hex: string; field: string }[] = [
  { brand: "Tiffany & Co.", hex: "#0ABAB5", field: "Jewelry — registered" },
  { brand: "Cadbury Purple", hex: "#3F1361", field: "Chocolate — registered" },
  { brand: "UPS Brown",     hex: "#351C15", field: "Logistics — registered" },
  { brand: "T-Mobile Magenta", hex: "#E20074", field: "Telecom — registered" },
  { brand: "Coca-Cola Red",  hex: "#F40009", field: "Beverage — TM" },
  { brand: "Ferrari Red",    hex: "#FF2800", field: "Automotive — Rosso Corsa" },
  { brand: "John Deere Green", hex: "#367C2B", field: "Agriculture" },
  { brand: "Home Depot Orange", hex: "#F96302", field: "Retail" },
  { brand: "IBM Blue",       hex: "#0F62FE", field: "Tech" },
  { brand: "Yves Saint Laurent Black", hex: "#000000", field: "Fashion (Pantone Black)" },
  { brand: "International Klein Blue", hex: "#002FA7", field: "Art" },
  { brand: "Pantone 448 C", hex: "#4A412A", field: "World's ugliest (Australian tobacco packs)" },
];

function colorDist(a: RGB, b: RGB): number {
  return Math.sqrt(
    (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2
  );
}

const trademarkMatches = computed(() =>
  props.palette.map(sw => {
    const ranked = TRADEMARK_DATABASE
      .map(t => ({ ...t, dist: colorDist(sw.rgb, hexToRgb(t.hex)) }))
      .sort((a, b) => a.dist - b.dist);
    const closest = ranked[0];
    return {
      hex: rgbToHex(...sw.rgb).toUpperCase(),
      closest,
      similar: closest.dist < 30,
    };
  })
);

// SEASONAL VARIATION — same brand, 4 seasons
function seasonShift(rgb: RGB, season: "spring" | "summer" | "autumn" | "winter"): RGB {
  const [h, s, v] = rgbToHsv(...rgb);
  switch (season) {
    case "spring": return hsvToRgb(h, s * 0.85, Math.min(1, v + 0.08));
    case "summer": return hsvToRgb(h, Math.min(1, s * 1.1), Math.min(1, v + 0.05));
    case "autumn": return hsvToRgb((h + 350) % 360, Math.min(1, s * 1.05), v * 0.85);
    case "winter": return hsvToRgb((h + 10) % 360, s * 0.7, v * 0.92);
  }
}

const seasonalSets = computed(() =>
  (["spring", "summer", "autumn", "winter"] as const).map(season => ({
    season,
    palette: props.palette.map(sw => seasonShift(sw.rgb, season)),
  }))
);

async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.show(`Copied ${label}`);
  } catch { toast.show("Copy failed"); }
}
</script>

<template>
  <section v-if="palette.length" class="bd-panel">
    <div class="head">
      <span class="eyebrow">Brand Designer</span>
      <div class="tabs">
        <button v-for="t in tabs" :key="t.id" class="tab"
          :class="{ active: tab === t.id }" @click="tab = t.id">{{ t.label }}</button>
      </div>
    </div>

    <!-- PSYCHOLOGY -->
    <div v-show="tab === 'psych'" class="psych">
      <div class="micro">hue family → associations · use as a sanity check, not gospel</div>
      <div v-for="(p, i) in psychReadings" :key="i" class="psych-row">
        <div class="psych-swatch" :style="{ background: p.hex }"></div>
        <div class="psych-meta">
          <span class="psych-fam">{{ p.fam.family }} · {{ p.hex.toUpperCase() }}</span>
          <div class="psych-tags">
            <span v-for="t in p.fam.positive" :key="'p'+t" class="tag positive">{{ t }}</span>
            <span v-for="t in p.fam.negative" :key="'n'+t" class="tag negative">{{ t }}</span>
          </div>
          <span class="psych-brands">e.g. {{ p.fam.brands.join(", ") }}</span>
        </div>
      </div>
    </div>

    <!-- BRAND LOCK -->
    <div v-show="tab === 'lock'" class="lock" v-if="lockKit">
      <div class="micro">single seed → app-ready brand kit · primary swatch from your palette</div>
      <div class="lock-grid">
        <div v-for="(hex, key) in lockKit" :key="key" class="lock-card"
          :style="{ background: hex }"
          @click="copy(hex, key)"
        >
          <span class="lock-key">{{ key }}</span>
          <span class="lock-hex">{{ hex }}</span>
        </div>
      </div>
    </div>

    <!-- GAMUT -->
    <div v-show="tab === 'gamut'" class="gamut">
      <div class="micro">screen / print gamut audit · which swatches will reproduce safely</div>
      <div v-for="(g, i) in gamutAudit" :key="i" class="gamut-row">
        <div class="gamut-swatch" :style="{ background: g.hex }"></div>
        <div class="gamut-meta">
          <span class="gamut-hex">{{ g.hex.toUpperCase() }}</span>
          <div class="gamut-flags">
            <span class="flag ok">sRGB ok</span>
            <span v-if="g.flags.needsP3" class="flag warn">needs P3 for full punch</span>
            <span v-if="!g.flags.cmykPrintable" class="flag bad">CMYK will dull</span>
            <span v-else class="flag ok">CMYK ok</span>
          </div>
          <span class="cmyk">CMYK {{ g.cmyk.join("/") }}</span>
        </div>
      </div>
    </div>

    <!-- MATCHED -->
    <div v-show="tab === 'matched'" class="matched">
      <div class="micro">RGB original vs CMYK roundtrip · same identity, two mediums</div>
      <div v-for="(m, i) in matchedPair" :key="i" class="match-row">
        <div class="match-side">
          <span class="lbl">screen</span>
          <div class="match-cell" :style="{ background: m.original }">
            <span>{{ m.original }}</span>
          </div>
        </div>
        <span class="arrow">→</span>
        <div class="match-side">
          <span class="lbl">print sim</span>
          <div class="match-cell" :style="{ background: m.printSimulated }">
            <span>{{ m.printSimulated }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- TRADEMARK -->
    <div v-show="tab === 'trademark'" class="tm">
      <div class="micro">small reference of registered/famous brand colors · not legal advice</div>
      <div v-for="(t, i) in trademarkMatches" :key="i" class="tm-row"
        :class="{ similar: t.similar }">
        <div class="tm-swatch" :style="{ background: t.hex }"></div>
        <div class="tm-meta">
          <span class="tm-hex">{{ t.hex }}</span>
          <span class="tm-closest">closest: {{ t.closest.brand }} ({{ t.closest.field }}) · {{ t.closest.hex }} · ΔRGB {{ t.closest.dist.toFixed(0) }}</span>
          <span v-if="t.similar" class="tm-warn">⚠ visually close to a registered mark — review before using in adjacent fields</span>
        </div>
      </div>
    </div>

    <!-- SEASONAL -->
    <div v-show="tab === 'seasonal'" class="seasonal">
      <div class="micro">same brand identity, 4 seasonal moods</div>
      <div v-for="set in seasonalSets" :key="set.season" class="season-row">
        <div class="season-meta">
          <span class="season-id">{{ set.season }}</span>
        </div>
        <div class="season-strip">
          <div v-for="(rgb, i) in set.palette" :key="i" class="season-cell"
            :style="{ background: rgbToHex(...rgb) }"></div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.bd-panel {
  margin-top: var(--s-5);
  border: 1px solid var(--hairline);
  border-radius: 14px;
  padding: var(--s-5);
  background: var(--bg);
}
.head { display: flex; justify-content: space-between; align-items: center; gap: var(--s-3); margin-bottom: var(--s-4); flex-wrap: wrap; }
.eyebrow { font-family: var(--mono); font-size: 9px; text-transform: uppercase; letter-spacing: .14em; color: var(--text-3); }
.tabs { display: flex; gap: 4px; flex-wrap: wrap; }
.tab {
  padding: 5px 11px; border: 1px solid var(--hairline); background: var(--bg);
  color: var(--text-2); border-radius: 999px;
  font-family: var(--mono); font-size: 9px; text-transform: uppercase; letter-spacing: .08em;
  cursor: pointer; transition: background .15s, color .15s, border-color .15s;
}
.tab:hover { color: var(--text); border-color: var(--text); }
.tab.active { background: var(--text); color: var(--bg); border-color: var(--text); }
.micro { font-family: var(--mono); font-size: 9px; text-transform: uppercase; letter-spacing: .12em; color: var(--text-3); margin-bottom: var(--s-3); }

/* PSYCH */
.psych-row {
  display: grid;
  grid-template-columns: 60px 1fr;
  gap: var(--s-3);
  align-items: center;
  margin-bottom: var(--s-3);
  padding: var(--s-3);
  border: 1px solid var(--hairline);
  border-radius: 10px;
}
.psych-swatch { width: 56px; height: 56px; border-radius: 8px; }
.psych-meta { display: flex; flex-direction: column; gap: 6px; }
.psych-fam { font-family: var(--mono); font-size: 11px; color: var(--text); letter-spacing: .04em; }
.psych-tags { display: flex; gap: 4px; flex-wrap: wrap; }
.tag {
  font-family: var(--mono);
  font-size: 9px;
  padding: 2px 7px;
  border-radius: 999px;
  letter-spacing: .04em;
}
.tag.positive { background: var(--surface-2); color: var(--text); }
.tag.negative { background: rgba(192,0,0,.08); color: #c00; border: 1px solid rgba(192,0,0,.15); }
.psych-brands { font-family: var(--mono); font-size: 10px; color: var(--text-3); letter-spacing: .04em; }

/* LOCK */
.lock-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 6px;
}
.lock-card {
  aspect-ratio: 1.4;
  border-radius: 10px;
  padding: 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: rgba(255,255,255,.95);
}
.lock-key, .lock-hex {
  font-family: var(--mono);
  font-size: 9px;
  background: rgba(0,0,0,.45);
  padding: 3px 6px;
  border-radius: 3px;
  align-self: flex-start;
  letter-spacing: .04em;
}
.lock-key { text-transform: uppercase; font-weight: 600; }

/* GAMUT */
.gamut-row {
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: var(--s-3);
  align-items: center;
  padding: var(--s-3);
  border: 1px solid var(--hairline);
  border-radius: 10px;
  margin-bottom: 6px;
}
.gamut-swatch { width: 56px; height: 56px; border-radius: 8px; }
.gamut-meta { display: flex; flex-direction: column; gap: 4px; }
.gamut-hex { font-family: var(--mono); font-size: 11px; color: var(--text); letter-spacing: .04em; }
.gamut-flags { display: flex; gap: 4px; flex-wrap: wrap; }
.flag { font-family: var(--mono); font-size: 9px; padding: 2px 7px; border-radius: 999px; letter-spacing: .04em; }
.flag.ok { background: rgba(0,140,0,.1); color: #2a8a2a; }
.flag.warn { background: rgba(220,150,0,.12); color: #b97500; }
.flag.bad { background: rgba(192,0,0,.1); color: #c00; }
.cmyk { font-family: var(--mono); font-size: 10px; color: var(--text-3); letter-spacing: .04em; }

/* MATCHED */
.match-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: var(--s-3);
  align-items: center;
  margin-bottom: var(--s-3);
}
.match-side { display: flex; flex-direction: column; gap: 4px; }
.lbl {
  font-family: var(--mono); font-size: 9px;
  text-transform: uppercase; letter-spacing: .12em; color: var(--text-3);
}
.match-cell {
  height: 100px; border-radius: 8px; padding: 8px;
  display: flex; align-items: flex-end;
}
.match-cell span {
  font-family: var(--mono); font-size: 10px;
  background: rgba(0,0,0,.45); color: white;
  padding: 2px 6px; border-radius: 3px; letter-spacing: .04em;
}
.arrow { font-family: var(--mono); font-size: 18px; color: var(--text-3); }

/* TRADEMARK */
.tm-row {
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: var(--s-3);
  align-items: center;
  padding: var(--s-3);
  border: 1px solid var(--hairline);
  border-radius: 10px;
  margin-bottom: 6px;
}
.tm-row.similar { border-color: #c00; background: rgba(192,0,0,.03); }
.tm-swatch { width: 56px; height: 56px; border-radius: 8px; }
.tm-meta { display: flex; flex-direction: column; gap: 4px; }
.tm-hex { font-family: var(--mono); font-size: 11px; color: var(--text); }
.tm-closest { font-family: var(--mono); font-size: 10px; color: var(--text-2); letter-spacing: .04em; line-height: 1.5; }
.tm-warn { font-family: var(--mono); font-size: 10px; color: #c00; }

/* SEASONAL */
.season-row {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: var(--s-3);
  align-items: center;
  margin-bottom: 6px;
}
.season-id {
  font-family: var(--mono); font-size: 11px;
  text-transform: uppercase; letter-spacing: .1em;
  color: var(--text-2);
}
.season-strip { display: grid; grid-template-columns: repeat(auto-fit, minmax(28px, 1fr)); gap: 2px; }
.season-cell { height: 50px; border-radius: 4px; }

@media (max-width: 720px) {
  .match-row { grid-template-columns: 1fr; }
  .arrow { display: none; }
  .season-row { grid-template-columns: 1fr; }
}
</style>
