<script setup lang="ts">
import { ref, computed } from "vue";
import type { Swatch, RGB } from "@/types";
import { rgbToHex, rgbToHsv, hsvToRgb } from "@/services/color";

const props = defineProps<{ palette: Swatch[] }>();

type Tab = "timeline" | "light" | "sss" | "tod";
const tab = ref<Tab>("timeline");

const tabs: { id: Tab; label: string }[] = [
  { id: "timeline", label: "color script" },
  { id: "light", label: "light / material" },
  { id: "sss", label: "subsurface" },
  { id: "tod", label: "time of day" },
];

// Color script: derive 5 scenes from a palette by sliding hue + lightness.
const SCENES = [
  { id: "act1", label: "act 1 · setup",        hueShift: 0,    lightness: 0,    sat: 0 },
  { id: "rising", label: "rising tension",      hueShift: -10,  lightness: -0.05,sat: -0.1 },
  { id: "peak",   label: "peak / climax",       hueShift: -20,  lightness: -0.15,sat: 0.15 },
  { id: "fall",   label: "falling action",      hueShift: 10,   lightness: -0.2, sat: -0.1 },
  { id: "act3",   label: "resolution",          hueShift: 30,   lightness: 0.1,  sat: -0.2 },
];

function shiftPalette(palette: Swatch[], dh: number, dl: number, ds: number): RGB[] {
  return palette.map(sw => {
    const [h, s, v] = rgbToHsv(...sw.rgb);
    const newH = (h + dh + 360) % 360;
    const newS = Math.max(0, Math.min(1, s + ds));
    const newV = Math.max(0.05, Math.min(0.98, v + dl));
    return hsvToRgb(newH, newS, newV);
  });
}

const colorScript = computed(() =>
  SCENES.map(s => ({
    ...s,
    palette: shiftPalette(props.palette, s.hueShift, s.lightness, s.sat),
  }))
);

// Light/material sim: 5 lighting conditions
const LIGHTING = [
  { id: "noon",  label: "noon",      tint: [255, 250, 240] as RGB, mix: 0.0 },
  { id: "golden",label: "golden hour",tint: [255, 180, 100] as RGB, mix: 0.35 },
  { id: "blue",  label: "blue hour",  tint: [120, 150, 220] as RGB, mix: 0.4 },
  { id: "moon",  label: "moonlight",  tint: [200, 220, 255] as RGB, mix: 0.5 },
  { id: "neon",  label: "neon",       tint: [255, 50, 200] as RGB,  mix: 0.45 },
];

function tint(rgb: RGB, t: RGB, mix: number): RGB {
  return [
    Math.round(rgb[0] * (1 - mix) + t[0] * mix),
    Math.round(rgb[1] * (1 - mix) + t[1] * mix),
    Math.round(rgb[2] * (1 - mix) + t[2] * mix),
  ];
}

const lightingPreview = computed(() =>
  LIGHTING.map(l => ({
    ...l,
    palette: props.palette.map(sw => tint(sw.rgb, l.tint, l.mix)),
  }))
);

// Subsurface scattering preview — light passes through translucent material.
// Approximate with a warmer / brighter shift toward the SSS color (skin: red,
// candle: orange, marble: yellowish).
const SSS_MATERIALS = [
  { id: "skin",   label: "skin",   sssColor: [240, 90, 70] as RGB, depth: 0.3 },
  { id: "wax",    label: "candle wax", sssColor: [255, 180, 60] as RGB, depth: 0.45 },
  { id: "marble", label: "marble", sssColor: [255, 240, 200] as RGB, depth: 0.2 },
  { id: "leaf",   label: "leaf",   sssColor: [120, 220, 80] as RGB, depth: 0.4 },
];

function sssShift(rgb: RGB, sssColor: RGB, depth: number): RGB {
  return tint(rgb, sssColor, depth);
}

const sssPreview = computed(() =>
  SSS_MATERIALS.map(m => ({
    ...m,
    palette: props.palette.map(sw => sssShift(sw.rgb, m.sssColor, m.depth)),
  }))
);

// Time of day — 6 stops across 24h
const TIME_OF_DAY = [
  { id: "dawn",   label: "dawn 5am",     hueShift: 30,  lightness: -0.05, sat: -0.15 },
  { id: "morning",label: "morning 9am",  hueShift: 5,   lightness: 0.05,  sat: -0.05 },
  { id: "noon",   label: "noon 12pm",    hueShift: 0,   lightness: 0.1,   sat: 0 },
  { id: "golden", label: "golden 6pm",   hueShift: -10, lightness: 0.0,   sat: 0.15 },
  { id: "dusk",   label: "dusk 8pm",     hueShift: -25, lightness: -0.15, sat: 0.05 },
  { id: "night",  label: "midnight",     hueShift: -60, lightness: -0.4,  sat: -0.05 },
];

const todPreview = computed(() =>
  TIME_OF_DAY.map(t => ({
    ...t,
    palette: shiftPalette(props.palette, t.hueShift, t.lightness, t.sat),
  }))
);
</script>

<template>
  <section v-if="palette.length" class="cp-panel">
    <div class="head">
      <span class="eyebrow">Concept Artist</span>
      <div class="tabs">
        <button v-for="t in tabs" :key="t.id" class="tab"
          :class="{ active: tab === t.id }" @click="tab = t.id">{{ t.label }}</button>
      </div>
    </div>

    <!-- COLOR SCRIPT -->
    <div v-show="tab === 'timeline'" class="timeline">
      <div class="micro">5-beat color script · same base palette pushed through narrative arc</div>
      <div v-for="s in colorScript" :key="s.id" class="scene-row">
        <div class="scene-meta">
          <span class="scene-id">{{ s.id }}</span>
          <span class="scene-label">{{ s.label }}</span>
        </div>
        <div class="scene-strip">
          <div v-for="(rgb, i) in s.palette" :key="i" class="scene-cell"
            :style="{ background: rgbToHex(...rgb) }"></div>
        </div>
      </div>
    </div>

    <!-- LIGHTING -->
    <div v-show="tab === 'light'" class="lighting">
      <div class="micro">same palette, 5 lighting conditions</div>
      <div v-for="l in lightingPreview" :key="l.id" class="scene-row">
        <div class="scene-meta">
          <span class="scene-id">{{ l.id }}</span>
          <span class="scene-label">{{ l.label }}</span>
        </div>
        <div class="scene-strip">
          <div v-for="(rgb, i) in l.palette" :key="i" class="scene-cell"
            :style="{ background: rgbToHex(...rgb) }"></div>
        </div>
      </div>
    </div>

    <!-- SUBSURFACE -->
    <div v-show="tab === 'sss'" class="sss">
      <div class="micro">light penetration through translucent materials · approximate</div>
      <div v-for="m in sssPreview" :key="m.id" class="scene-row">
        <div class="scene-meta">
          <span class="scene-id">{{ m.id }}</span>
          <span class="scene-label">{{ m.label }}</span>
        </div>
        <div class="scene-strip">
          <div v-for="(rgb, i) in m.palette" :key="i" class="scene-cell"
            :style="{ background: rgbToHex(...rgb) }"></div>
        </div>
      </div>
    </div>

    <!-- TIME OF DAY -->
    <div v-show="tab === 'tod'" class="tod">
      <div class="micro">24h temperature/value drift · use for environment design sets</div>
      <div v-for="t in todPreview" :key="t.id" class="scene-row">
        <div class="scene-meta">
          <span class="scene-id">{{ t.id }}</span>
          <span class="scene-label">{{ t.label }}</span>
        </div>
        <div class="scene-strip">
          <div v-for="(rgb, i) in t.palette" :key="i" class="scene-cell"
            :style="{ background: rgbToHex(...rgb) }"></div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cp-panel {
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

.scene-row {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: var(--s-3);
  align-items: center;
  margin-bottom: 6px;
}
.scene-meta { display: flex; flex-direction: column; gap: 2px; }
.scene-id { font-family: var(--mono); font-size: 9px; text-transform: uppercase; letter-spacing: .1em; color: var(--text-3); }
.scene-label { font-family: var(--mono); font-size: 11px; color: var(--text); letter-spacing: .04em; }
.scene-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(28px, 1fr));
  gap: 2px;
}
.scene-cell { height: 50px; border-radius: 4px; }

@media (max-width: 720px) {
  .scene-row { grid-template-columns: 1fr; }
}
</style>
