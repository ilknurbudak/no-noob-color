<script setup lang="ts">
import { ref, computed } from "vue";
import type { Swatch, RGB } from "@/types";
import { rgbToHex, rgbToHsv, hsvToRgb } from "@/services/color";
import { getApiUrl } from "@/services/api";
import { useToastStore } from "@/stores/toast";

const props = defineProps<{ palette: Swatch[] }>();
const toast = useToastStore();

type Tab = "looks" | "skin" | "dfn" | "lut" | "aces";
const tab = ref<Tab>("looks");

const tabs: { id: Tab; label: string }[] = [
  { id: "looks", label: "film looks" },
  { id: "skin", label: "skin protect" },
  { id: "dfn", label: "day for night" },
  { id: "lut", label: ".cube export" },
  { id: "aces", label: "ACES" },
];

// FILM LOOK PRESETS — apply a hue/sat/value shift to the palette
const LOOKS = [
  { id: "ot", label: "Orange / Teal", desc: "Spielberg / Bay blockbuster",
    apply: (rgb: RGB) => {
      const [h, s, v] = rgbToHsv(...rgb);
      // Push warm hues toward orange (30°), cool hues toward teal (180°)
      const targetH = h < 90 || h > 270 ? 25 : 185;
      const newH = h * 0.7 + targetH * 0.3;
      return hsvToRgb(newH % 360, Math.min(1, s * 1.15), v * 0.95);
    },
  },
  { id: "wes", label: "Wes Anderson", desc: "warm pastel symmetry",
    apply: (rgb: RGB) => {
      const [h, s, v] = rgbToHsv(...rgb);
      return hsvToRgb(h, s * 0.55, Math.min(1, v + 0.12));
    },
  },
  { id: "fincher", label: "Fincher", desc: "cool, desaturated, green-cast",
    apply: (rgb: RGB) => {
      const [h, s, v] = rgbToHsv(...rgb);
      const newH = h * 0.85 + 90 * 0.15;
      return hsvToRgb(newH % 360, s * 0.6, v * 0.85);
    },
  },
  { id: "bleach", label: "Bleach Bypass", desc: "high contrast, low sat",
    apply: (rgb: RGB) => {
      const [h, s, v] = rgbToHsv(...rgb);
      return hsvToRgb(h, s * 0.4, v < 0.5 ? v * 0.7 : Math.min(1, v * 1.15));
    },
  },
  { id: "matrix", label: "Matrix", desc: "green tint, deep shadows",
    apply: (rgb: RGB) => {
      const [h, s, v] = rgbToHsv(...rgb);
      const newH = h * 0.5 + 110 * 0.5;
      return hsvToRgb(newH % 360, Math.min(1, s * 1.1), v * 0.75);
    },
  },
  { id: "gilmore", label: "Gilmore Girls", desc: "warm cosy autumn",
    apply: (rgb: RGB) => {
      const [h, s, v] = rgbToHsv(...rgb);
      const newH = h < 180 ? Math.max(0, h - 10) : Math.max(0, (h - 360) - 10) + 360;
      return hsvToRgb(newH % 360, Math.min(1, s * 1.1), v * 0.9);
    },
  },
];

const lookPreviews = computed(() =>
  LOOKS.map(l => ({
    ...l,
    palette: props.palette.map(sw => l.apply(sw.rgb)),
  }))
);

// SKIN PROTECT — exclude skin-tone vector during a grade.
function isSkinish(rgb: RGB): boolean {
  const [h, s, v] = rgbToHsv(...rgb);
  return (h < 50 || h > 340) && s > 0.18 && s < 0.65 && v > 0.35 && v < 0.92;
}
const skinishSwatches = computed(() =>
  props.palette.map(sw => ({ rgb: sw.rgb, isSkin: isSkinish(sw.rgb) }))
);

// DAY FOR NIGHT — blue shift + green pull + saturation drop + value crush
function dayForNight(rgb: RGB): RGB {
  const [h, s, v] = rgbToHsv(...rgb);
  // Pull hues toward 220 (blue)
  const newH = h * 0.55 + 220 * 0.45;
  return hsvToRgb(newH % 360, s * 0.6, v * 0.45);
}
const dfnPreview = computed(() => props.palette.map(sw => dayForNight(sw.rgb)));

// LUT export — uses /lut/cube endpoint
const lutSize = ref(33);
const lutStrength = ref(0.6);
const lutTitle = ref("nnc-look");
const lutBusy = ref(false);

async function downloadCube() {
  if (!getApiUrl()) {
    toast.show("API not connected — start the Python service");
    return;
  }
  if (!props.palette.length) return;
  lutBusy.value = true;
  try {
    const hexes = props.palette.map(sw => rgbToHex(...sw.rgb));
    const res = await fetch(getApiUrl() + "/lut/cube", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        palette: hexes,
        size: lutSize.value,
        strength: lutStrength.value,
        title: lutTitle.value,
      }),
    });
    if (!res.ok) throw new Error(`LUT export failed: ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${lutTitle.value}.cube`;
    a.click();
    URL.revokeObjectURL(url);
    toast.show("LUT downloaded");
  } catch (e: any) {
    toast.show(e.message || "LUT failed");
  } finally {
    lutBusy.value = false;
  }
}

// ACES preview — show conversion to a few target spaces
const acesTargets = ["sRGB", "Rec.709", "Rec.2020", "P3-D65", "ACEScg"];
</script>

<template>
  <section v-if="palette.length" class="cn-panel">
    <div class="head">
      <span class="eyebrow">Cinematographer</span>
      <div class="tabs">
        <button v-for="t in tabs" :key="t.id" class="tab"
          :class="{ active: tab === t.id }" @click="tab = t.id">{{ t.label }}</button>
      </div>
    </div>

    <!-- LOOKS -->
    <div v-show="tab === 'looks'" class="looks">
      <div class="micro">apply a film 'look' to the palette · 6 cinematic presets</div>
      <div v-for="l in lookPreviews" :key="l.id" class="look-row">
        <div class="look-meta">
          <span class="look-id">{{ l.id }}</span>
          <span class="look-label">{{ l.label }}</span>
          <span class="look-desc">{{ l.desc }}</span>
        </div>
        <div class="look-strip">
          <div v-for="(rgb, i) in l.palette" :key="i" class="look-cell"
            :style="{ background: rgbToHex(...rgb) }"></div>
        </div>
      </div>
    </div>

    <!-- SKIN PROTECT -->
    <div v-show="tab === 'skin'" class="skin">
      <div class="micro">heuristic skin-tone vector flag · protect during grading</div>
      <div class="skin-grid">
        <div v-for="(sw, i) in skinishSwatches" :key="i" class="skin-card"
          :class="{ 'is-skin': sw.isSkin }"
          :style="{ background: rgbToHex(...sw.rgb) }">
          <span class="badge">{{ sw.isSkin ? "skin · protect" : "free to grade" }}</span>
        </div>
      </div>
      <p class="note">
        Heuristic — fast preview only. For real skin protection in DaVinci /
        Premiere, qualify in HSL on the actual footage.
      </p>
    </div>

    <!-- DAY FOR NIGHT -->
    <div v-show="tab === 'dfn'" class="dfn">
      <div class="micro">simulate shooting day, grading to night · classic cheat</div>
      <div class="dfn-grid">
        <div class="dfn-col">
          <span class="dfn-label">day (source)</span>
          <div class="dfn-strip">
            <div v-for="(sw, i) in palette" :key="i" class="dfn-cell"
              :style="{ background: rgbToHex(...sw.rgb) }"></div>
          </div>
        </div>
        <div class="dfn-col">
          <span class="dfn-label">night (graded)</span>
          <div class="dfn-strip">
            <div v-for="(rgb, i) in dfnPreview" :key="i" class="dfn-cell"
              :style="{ background: rgbToHex(...rgb) }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- LUT EXPORT -->
    <div v-show="tab === 'lut'" class="lut">
      <div class="micro">.cube 3D LUT · DaVinci, Premiere, Final Cut, OBS</div>
      <div class="lut-form">
        <label>
          <span>title</span>
          <input v-model="lutTitle" />
        </label>
        <label>
          <span>size · {{ lutSize }}³</span>
          <select v-model.number="lutSize">
            <option :value="17">17 (preview)</option>
            <option :value="33">33 (standard)</option>
            <option :value="65">65 (high-quality)</option>
          </select>
        </label>
        <label>
          <span>strength · {{ lutStrength.toFixed(2) }}</span>
          <input type="range" min="0" max="1" step="0.05" v-model.number="lutStrength" />
        </label>
        <button class="primary" :disabled="lutBusy" @click="downloadCube">
          {{ lutBusy ? "rendering…" : "download .cube" }}
        </button>
      </div>
      <p class="note">
        Built server-side: each grid point is matched to the nearest palette
        color in Lab a*b*, luminance preserved, chroma blended toward the target
        by `strength`. 0 = identity, 1 = full grade.
      </p>
    </div>

    <!-- ACES -->
    <div v-show="tab === 'aces'" class="aces">
      <div class="micro">color space transforms via colour-science</div>
      <p class="note">
        Use the API's <code>/aces/convert</code> endpoint with source +
        target from: <strong>{{ acesTargets.join(", ") }}, ACES2065-1</strong>.
        Bradford chromatic adaptation, out-of-gamut clipped with a
        per-swatch flag. Useful when the palette was sampled in P3 but
        delivery is Rec.709 (or vice-versa).
      </p>
      <pre class="code">curl -s -X POST {{ getApiUrl() || 'http://localhost:8000' }}/aces/convert \
  -H "Content-Type: application/json" \
  -d '&#123;"palette": [{{ palette.map(sw => `"${rgbToHex(...sw.rgb).toUpperCase()}"`).join(', ') }}], "source": "sRGB", "target": "Rec.2020"&#125;'</pre>
    </div>
  </section>
</template>

<style scoped>
.cn-panel {
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

.look-row {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: var(--s-3);
  align-items: center;
  margin-bottom: 6px;
}
.look-meta { display: flex; flex-direction: column; gap: 2px; }
.look-id { font-family: var(--mono); font-size: 9px; text-transform: uppercase; letter-spacing: .1em; color: var(--text-3); }
.look-label { font-family: var(--sans); font-size: 13px; color: var(--text); font-weight: 500; }
.look-desc { font-family: var(--mono); font-size: 9px; color: var(--text-3); letter-spacing: .04em; }
.look-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(28px, 1fr));
  gap: 2px;
}
.look-cell { height: 50px; border-radius: 4px; }

.skin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 6px;
}
.skin-card {
  height: 90px;
  border-radius: 8px;
  padding: 8px;
  display: flex;
  align-items: flex-end;
}
.skin-card.is-skin { box-shadow: 0 0 0 2px #c00 inset; }
.skin-card .badge {
  font-family: var(--mono);
  font-size: 9px;
  background: rgba(0, 0, 0, .55);
  color: white;
  padding: 3px 6px;
  border-radius: 3px;
  letter-spacing: .04em;
}
.note {
  margin: var(--s-3) 0 0;
  font-size: 11px;
  line-height: 1.55;
  color: var(--text-2);
}
.note code {
  font-family: var(--mono);
  font-size: 11px;
  background: var(--surface-2);
  padding: 1px 5px;
  border-radius: 3px;
}

.dfn-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s-3);
}
.dfn-col { display: flex; flex-direction: column; gap: 6px; }
.dfn-label {
  font-family: var(--mono);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: .12em;
  color: var(--text-3);
}
.dfn-strip { display: grid; grid-template-columns: repeat(auto-fit, minmax(28px, 1fr)); gap: 2px; }
.dfn-cell { height: 90px; border-radius: 4px; }

.lut-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--s-3);
  align-items: end;
}
.lut-form label { display: flex; flex-direction: column; gap: 6px; }
.lut-form span {
  font-family: var(--mono);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: var(--text-3);
}
.lut-form input,
.lut-form select {
  border: 1px solid var(--hairline);
  background: var(--bg);
  color: var(--text);
  padding: 7px 10px;
  border-radius: 6px;
  font-family: var(--mono);
  font-size: 12px;
}
.lut-form input[type="range"] { padding: 0; accent-color: var(--text); }
.lut-form .primary {
  padding: 9px 14px;
  border: 1px solid var(--text);
  background: var(--text);
  color: var(--bg);
  border-radius: 8px;
  font-family: var(--sans);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.lut-form .primary:disabled { opacity: .5; cursor: not-allowed; }

.code {
  background: #0a0a0a;
  color: #f5f5f5;
  padding: var(--s-3);
  border-radius: 8px;
  font-family: var(--mono);
  font-size: 11px;
  line-height: 1.55;
  overflow: auto;
  margin-top: var(--s-3);
}

@media (max-width: 720px) {
  .look-row, .dfn-grid { grid-template-columns: 1fr; }
}
</style>
