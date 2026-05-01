<script setup lang="ts">
import { ref, computed } from "vue";
import type { Swatch, RGB } from "@/types";
import { rgbToHex, rgbToHsv, hsvToRgb, textColorFor } from "@/services/color";
import { useToastStore } from "@/stores/toast";

const props = defineProps<{ palette: Swatch[] }>();
const toast = useToastStore();

type Tab = "tints" | "skin" | "media" | "brushes";
const tab = ref<Tab>("tints");

const tabs: { id: Tab; label: string }[] = [
  { id: "tints", label: "tints / shades / tones" },
  { id: "skin", label: "skin tones" },
  { id: "media", label: "media simulator" },
  { id: "brushes", label: "brush slots" },
];

// 5 tints + 5 shades + 5 tones per swatch.
function tintShadeTone(rgb: RGB) {
  const [h, s, v] = rgbToHsv(...rgb);
  const tints: string[] = [];
  const shades: string[] = [];
  const tones: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const t = i * 0.18;
    tints.push(rgbToHex(...hsvToRgb(h, s * (1 - t * 0.8), Math.min(1, v + t))));
    shades.push(rgbToHex(...hsvToRgb(h, s, Math.max(0.05, v - t))));
    tones.push(rgbToHex(...hsvToRgb(h, s * (1 - t * 0.6), v)));
  }
  return { tints, shades, tones };
}

const variations = computed(() =>
  props.palette.map(sw => ({
    base: rgbToHex(...sw.rgb),
    rgb: sw.rgb,
    ...tintShadeTone(sw.rgb),
  }))
);

// Fitzpatrick scale skin tones — 6 reference points.
const FITZPATRICK = [
  { type: "I",   name: "very light",     hex: "#F8DCC8" },
  { type: "II",  name: "light",          hex: "#EFC1A5" },
  { type: "III", name: "medium",         hex: "#D8A082" },
  { type: "IV",  name: "olive",          hex: "#B47B5A" },
  { type: "V",   name: "brown",          hex: "#8C5638" },
  { type: "VI",  name: "deep",           hex: "#5D3B26" },
];

// Media simulator: gouache (mat, slightly darker), watercolor (washed,
// lighter + transparent), oil (slightly more saturated, deep).
type Media = "raw" | "gouache" | "watercolor" | "oil" | "ink";
const mediaMode = ref<Media>("raw");

const mediaModes: { id: Media; label: string; desc: string }[] = [
  { id: "raw", label: "digital", desc: "no media transform" },
  { id: "gouache", label: "gouache", desc: "matte, slightly muted" },
  { id: "watercolor", label: "watercolor", desc: "lightened wash, low sat" },
  { id: "oil", label: "oil", desc: "deeper, slightly more saturated" },
  { id: "ink", label: "ink", desc: "high contrast, cool shift" },
];

function applyMedia(rgb: RGB, mode: Media): RGB {
  const [h, s, v] = rgbToHsv(...rgb);
  switch (mode) {
    case "gouache":    return hsvToRgb(h, Math.max(0, s * 0.85), v * 0.92);
    case "watercolor": return hsvToRgb(h, s * 0.55, Math.min(1, v + 0.15));
    case "oil":        return hsvToRgb(h, Math.min(1, s * 1.1), v * 0.85);
    case "ink":        return hsvToRgb(h, Math.min(1, s * 1.05), v < 0.5 ? v * 0.6 : v);
    default:           return rgb;
  }
}

const mediaPreview = computed(() =>
  props.palette.map(sw => {
    const transformed = applyMedia(sw.rgb, mediaMode.value);
    return { base: rgbToHex(...sw.rgb), out: rgbToHex(...transformed) };
  })
);

async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.show(`Copied ${label}`);
  } catch { toast.show("Copy failed"); }
}

// Brush slots — Procreate has up to ~30 slots per brush, this maps the
// palette to roles a digital painter actually thinks about.
const BRUSH_SLOTS = [
  { role: "outline / sketch", source: "darkest" },
  { role: "primary fill", source: "vibrant" },
  { role: "shadow / depth", source: "darker variant" },
  { role: "highlight / light", source: "lightest tint" },
  { role: "ambient / sky tint", source: "muted lightest" },
  { role: "pop / accent", source: "vibrant complement" },
];

function brushAssignments(palette: Swatch[]) {
  if (!palette.length) return [];
  const sorted = [...palette].sort((a, b) => {
    const va = rgbToHsv(...a.rgb)[2];
    const vb = rgbToHsv(...b.rgb)[2];
    return va - vb;
  });
  const darkest = sorted[0];
  const lightest = sorted[sorted.length - 1];
  const vibrant = [...palette].sort((a, b) =>
    rgbToHsv(...b.rgb)[1] - rgbToHsv(...a.rgb)[1]
  )[0];
  return [
    { role: "outline / sketch", swatch: darkest },
    { role: "primary fill", swatch: vibrant },
    { role: "shadow", swatch: sorted[Math.floor(sorted.length / 4)] || darkest },
    { role: "midtone", swatch: sorted[Math.floor(sorted.length / 2)] || vibrant },
    { role: "highlight", swatch: lightest },
    { role: "accent pop", swatch: palette[palette.length - 1] || vibrant },
  ];
}
const brushSlots = computed(() => brushAssignments(props.palette));
</script>

<template>
  <section v-if="palette.length" class="ill-panel">
    <div class="head">
      <span class="eyebrow">Illustrator & Artist</span>
      <div class="tabs">
        <button v-for="t in tabs" :key="t.id" class="tab"
          :class="{ active: tab === t.id }" @click="tab = t.id">{{ t.label }}</button>
      </div>
    </div>

    <!-- TINTS / SHADES / TONES -->
    <div v-show="tab === 'tints'" class="tints">
      <div class="micro">5 tints (lighter) · 5 shades (darker) · 5 tones (less saturated)</div>
      <div v-for="(v, i) in variations" :key="i" class="var-row">
        <div class="var-base" :style="{ background: v.base, color: textColorFor(...v.rgb) }">
          <span>{{ v.base.toUpperCase() }}</span>
        </div>
        <div class="var-set">
          <div v-for="(t, j) in v.tints" :key="'t'+j" class="var-cell" :style="{ background: t }"
            @click="copy(t.toUpperCase(), 'tint')" :title="`tint ${j+1}`"></div>
        </div>
        <div class="var-set">
          <div v-for="(s, j) in v.shades" :key="'s'+j" class="var-cell" :style="{ background: s }"
            @click="copy(s.toUpperCase(), 'shade')" :title="`shade ${j+1}`"></div>
        </div>
        <div class="var-set">
          <div v-for="(t, j) in v.tones" :key="'tn'+j" class="var-cell" :style="{ background: t }"
            @click="copy(t.toUpperCase(), 'tone')" :title="`tone ${j+1}`"></div>
        </div>
      </div>
    </div>

    <!-- SKIN TONES -->
    <div v-show="tab === 'skin'" class="skin">
      <div class="micro">Fitzpatrick scale · character skin reference</div>
      <div class="skin-grid">
        <div v-for="ft in FITZPATRICK" :key="ft.type" class="skin-card"
          :style="{ background: ft.hex, color: textColorFor(...((ft.hex.match(/.{2}/g) || []).slice(1).map(h => parseInt(h, 16)) as [number,number,number])) }"
          @click="copy(ft.hex, ft.name)"
        >
          <span class="ft-type">{{ ft.type }}</span>
          <span class="ft-name">{{ ft.name }}</span>
          <span class="ft-hex">{{ ft.hex }}</span>
        </div>
      </div>
      <p class="skin-note">
        Drop a portrait via the ref-image zone above for an extracted skin
        palette specific to your subject (or use the API's skin-aware extract).
      </p>
    </div>

    <!-- MEDIA SIMULATOR -->
    <div v-show="tab === 'media'" class="media">
      <div class="micro">how this palette would look in different physical media</div>
      <div class="media-modes">
        <button v-for="m in mediaModes" :key="m.id"
          class="media-chip" :class="{ active: mediaMode === m.id }"
          :title="m.desc" @click="mediaMode = m.id"
        >{{ m.label }}</button>
      </div>
      <div class="media-row">
        <div v-for="(p, i) in mediaPreview" :key="i" class="media-cell"
          :style="{ background: p.out }"
          @click="copy(p.out.toUpperCase(), mediaMode)"
        >
          <span class="m-out">{{ p.out.toUpperCase() }}</span>
          <span class="m-base">was {{ p.base.toUpperCase() }}</span>
        </div>
      </div>
    </div>

    <!-- BRUSH SLOTS -->
    <div v-show="tab === 'brushes'" class="brushes">
      <div class="micro">role assignments for a 6-slot brush kit</div>
      <div class="brush-list">
        <div v-for="b in brushSlots" :key="b.role" class="brush-row">
          <div class="brush-swatch" :style="{ background: rgbToHex(...b.swatch.rgb) }"></div>
          <div class="brush-meta">
            <span class="brush-role">{{ b.role }}</span>
            <span class="brush-hex copyable" @click="copy(rgbToHex(...b.swatch.rgb).toUpperCase(), b.role)">
              {{ rgbToHex(...b.swatch.rgb).toUpperCase() }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ill-panel {
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

/* TINTS */
.var-row {
  display: grid;
  grid-template-columns: 80px repeat(3, 1fr);
  gap: 6px;
  align-items: stretch;
  margin-bottom: 6px;
}
.var-base {
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: .04em;
  padding: 4px;
  height: 36px;
}
.var-set { display: grid; grid-template-columns: repeat(5, 1fr); gap: 2px; }
.var-cell { height: 36px; border-radius: 4px; cursor: pointer; transition: transform .15s; }
.var-cell:hover { transform: scale(1.05); }

/* SKIN */
.skin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 6px;
}
.skin-card {
  padding: var(--s-3);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  cursor: pointer;
  min-height: 90px;
  justify-content: space-between;
}
.ft-type { font-family: var(--mono); font-size: 16px; font-weight: 700; }
.ft-name { font-family: var(--mono); font-size: 10px; text-transform: uppercase; letter-spacing: .08em; opacity: .85; }
.ft-hex { font-family: var(--mono); font-size: 9px; opacity: .7; letter-spacing: .04em; }
.skin-note { font-size: 11px; color: var(--text-2); margin: var(--s-3) 0 0; line-height: 1.5; }

/* MEDIA */
.media-modes { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: var(--s-3); }
.media-chip {
  padding: 6px 12px; border: 1px solid var(--hairline); background: var(--bg);
  color: var(--text-2); border-radius: 999px;
  font-family: var(--mono); font-size: 9px; text-transform: uppercase; letter-spacing: .08em; cursor: pointer;
  transition: background .15s, color .15s, border-color .15s;
}
.media-chip:hover { color: var(--text); border-color: var(--text); }
.media-chip.active { background: var(--text); color: var(--bg); border-color: var(--text); }
.media-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 4px;
}
.media-cell {
  height: 100px;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: rgba(255,255,255,.85);
}
.media-cell .m-out, .media-cell .m-base {
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: .04em;
  background: rgba(0,0,0,.35);
  padding: 2px 5px;
  border-radius: 3px;
  align-self: flex-start;
}
.media-cell .m-base { font-size: 8px; opacity: .7; }

/* BRUSHES */
.brush-list { display: flex; flex-direction: column; gap: 6px; }
.brush-row {
  display: grid;
  grid-template-columns: 36px 1fr;
  gap: 10px;
  align-items: center;
  padding: 6px;
  border: 1px solid var(--hairline);
  border-radius: 8px;
}
.brush-swatch { width: 36px; height: 36px; border-radius: 6px; }
.brush-meta { display: flex; flex-direction: column; gap: 2px; }
.brush-role { font-family: var(--sans); font-size: 12px; color: var(--text); font-weight: 500; }
.brush-hex { font-family: var(--mono); font-size: 10px; color: var(--text-3); cursor: pointer; }
.brush-hex:hover { color: var(--text); }
.copyable { cursor: pointer; }
.copyable:hover { color: var(--text); }

@media (max-width: 720px) {
  .var-row { grid-template-columns: 1fr; }
}
</style>
