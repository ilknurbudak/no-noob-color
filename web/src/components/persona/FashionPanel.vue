<script setup lang="ts">
import { ref, computed } from "vue";
import type { Swatch, RGB } from "@/types";
import { rgbToHex, rgbToHsv, hsvToRgb } from "@/services/color";

const props = defineProps<{ palette: Swatch[] }>();

type Tab = "seasonal" | "story" | "presets" | "dye" | "pantone";
const tab = ref<Tab>("seasonal");
const tabs: { id: Tab; label: string }[] = [
  { id: "seasonal", label: "seasonal trends" },
  { id: "story", label: "color story" },
  { id: "presets", label: "style presets" },
  { id: "dye", label: "dye lot" },
  { id: "pantone", label: "Pantone match" },
];

// PANTONE COLOR OF THE YEAR (recent)
const PANTONE_TRENDS = [
  { year: 2026, name: "Biscay Bay", hex: "#7DA8B0" },
  { year: 2025, name: "Mocha Mousse", hex: "#A47864" },
  { year: 2024, name: "Peach Fuzz", hex: "#FFBE98" },
  { year: 2023, name: "Viva Magenta", hex: "#BB2649" },
  { year: 2022, name: "Very Peri", hex: "#6667AB" },
  { year: 2021, name: "Illuminating + Ultimate Gray", hex: "#F5DF4D" },
  { year: 2020, name: "Classic Blue", hex: "#0F4C81" },
];

// SEASONAL FASHION PALETTES (broad guides)
const SEASONAL_PALETTES = [
  { season: "SS · Spring/Summer", colors: ["#FFE5B4", "#FFB7B2", "#B5E5CF", "#FFEAA7", "#A8DADC"] },
  { season: "FW · Fall/Winter",   colors: ["#7C3F00", "#3E2723", "#5D4037", "#37474F", "#1B1B1B"] },
  { season: "Resort · Cruise",    colors: ["#F8F0E5", "#E1F5FE", "#B3E5FC", "#FFE0B2", "#FFCDD2"] },
  { season: "Pre-Fall · Transitional", colors: ["#A1887F", "#6D4C41", "#FFD54F", "#8D6E63", "#3E2723"] },
];

// STYLE PRESETS
const STYLE_PRESETS = [
  { id: "couture", label: "couture pastel", desc: "soft, runway, evening",
    colors: ["#FFE0E9", "#F0D7B0", "#D6B5DC", "#B6E0E0", "#FFD4D4"] },
  { id: "streetwear", label: "streetwear neon", desc: "loud, hype, athletic",
    colors: ["#39FF14", "#FF0080", "#00FFFF", "#FFEE00", "#0A0A0A"] },
  { id: "normcore", label: "normcore muted", desc: "quiet, basic, '90s",
    colors: ["#A8B2A2", "#C9C0AE", "#7A7A7A", "#E5E0D5", "#3F3F3F"] },
  { id: "denim", label: "vintage denim", desc: "indigo, wash, americana",
    colors: ["#1F3A5F", "#3D5A80", "#7DA0CA", "#E0E1DD", "#A37B5A"] },
  { id: "monochrome", label: "monochrome luxe", desc: "black, white, gray",
    colors: ["#0A0A0A", "#3F3F3F", "#929292", "#E5E5E5", "#FAFAFA"] },
  { id: "y2k", label: "Y2K candy", desc: "pop, glossy, low-rise",
    colors: ["#FF66C4", "#9D7CFF", "#33D6FF", "#FFD93D", "#FF6B6B"] },
];

// DYE LOT VARIATION
function dyeLot(rgb: RGB, batch: number): RGB {
  // Simulate batch-to-batch variation: small hue jitter, ±5% saturation
  const seed = batch * 0.13;
  const [h, s, v] = rgbToHsv(...rgb);
  const dh = ((seed * 360) % 7) - 3.5;
  const ds = (((seed * 11) % 1) - 0.5) * 0.06;
  const dv = (((seed * 17) % 1) - 0.5) * 0.04;
  return hsvToRgb(
    (h + dh + 360) % 360,
    Math.max(0, Math.min(1, s + ds)),
    Math.max(0, Math.min(1, v + dv)),
  );
}

const dyeBatches = computed(() =>
  props.palette.map(sw => ({
    base: rgbToHex(...sw.rgb),
    batches: [1, 2, 3, 4, 5].map(b => rgbToHex(...dyeLot(sw.rgb, b))),
  }))
);

// COLOR STORY — pull a 'mood' name from hue distribution
function dominantHue(palette: Swatch[]): string {
  if (!palette.length) return "neutral";
  const hues = palette.map(sw => rgbToHsv(...sw.rgb)[0]);
  const avg = hues.reduce((a, b) => a + b, 0) / hues.length;
  if (avg < 30 || avg > 330) return "blush · romance · warmth";
  if (avg < 60) return "amber · harvest · dusk";
  if (avg < 110) return "moss · forest · earthy";
  if (avg < 200) return "ocean · serene · cool";
  if (avg < 280) return "twilight · mystery · regal";
  return "rose · flora · feminine";
}

const colorStoryName = computed(() => dominantHue(props.palette));
</script>

<template>
  <section v-if="palette.length" class="fa-panel">
    <div class="head">
      <span class="eyebrow">Fashion Designer</span>
      <div class="tabs">
        <button v-for="t in tabs" :key="t.id" class="tab"
          :class="{ active: tab === t.id }" @click="tab = t.id">{{ t.label }}</button>
      </div>
    </div>

    <!-- SEASONAL -->
    <div v-show="tab === 'seasonal'" class="seasonal">
      <div class="micro">Pantone Color of the Year reference + seasonal palettes</div>
      <div class="trend-grid">
        <div v-for="t in PANTONE_TRENDS" :key="t.year" class="trend-card"
          :style="{ background: t.hex }">
          <span class="t-year">{{ t.year }}</span>
          <span class="t-name">{{ t.name }}</span>
          <span class="t-hex">{{ t.hex }}</span>
        </div>
      </div>
      <div v-for="s in SEASONAL_PALETTES" :key="s.season" class="season-row">
        <span class="season-label">{{ s.season }}</span>
        <div class="season-strip">
          <div v-for="c in s.colors" :key="c" class="season-cell" :style="{ background: c }"></div>
        </div>
      </div>
    </div>

    <!-- COLOR STORY -->
    <div v-show="tab === 'story'" class="story">
      <div class="micro">collection mood from your palette</div>
      <div class="story-card">
        <div class="story-strip">
          <div v-for="sw in palette" :key="rgbToHex(...sw.rgb)" class="story-cell"
            :style="{ background: rgbToHex(...sw.rgb) }"></div>
        </div>
        <div class="story-name">{{ colorStoryName }}</div>
      </div>
      <p class="note">
        Build a lookbook around this mood — the strip + name describes a
        coherent collection feel, ready for moodboard / line sheet headers.
      </p>
    </div>

    <!-- STYLE PRESETS -->
    <div v-show="tab === 'presets'" class="presets">
      <div class="micro">canonical fashion palette presets · for inspiration</div>
      <div v-for="p in STYLE_PRESETS" :key="p.id" class="preset-row">
        <div class="preset-meta">
          <span class="preset-label">{{ p.label }}</span>
          <span class="preset-desc">{{ p.desc }}</span>
        </div>
        <div class="preset-strip">
          <div v-for="c in p.colors" :key="c" class="preset-cell" :style="{ background: c }"></div>
        </div>
      </div>
    </div>

    <!-- DYE -->
    <div v-show="tab === 'dye'" class="dye">
      <div class="micro">dye lot variation · batch-to-batch shift simulation (5 batches)</div>
      <div v-for="(d, i) in dyeBatches" :key="i" class="dye-row">
        <div class="dye-base" :style="{ background: d.base }"></div>
        <div class="dye-set">
          <div v-for="(b, j) in d.batches" :key="j" class="dye-cell" :style="{ background: b }">
            <span>#{{ j + 1 }}</span>
          </div>
        </div>
      </div>
      <p class="note">
        Real fabric production has ΔE ~3-5 between dye lots. Spec the master
        color but expect ±5° hue and ±5% saturation across runs.
      </p>
    </div>

    <!-- PANTONE -->
    <div v-show="tab === 'pantone'" class="pantone">
      <div class="micro">use the API's /pantone/match endpoint for closest PMS codes</div>
      <p class="note">
        Wired through the FastAPI service: <code>POST /pantone/match</code> with your
        palette returns top-K closest entries from the bundled Pantone-like
        subset, ranked by CIEDE2000.
      </p>
      <pre class="code">curl -X POST http://localhost:8000/pantone/match \
  -H "Content-Type: application/json" \
  -d '&#123;"palette": [{{ palette.map(sw => `"${rgbToHex(...sw.rgb).toUpperCase()}"`).join(", ") }}], "top_k": 3&#125;'</pre>
    </div>
  </section>
</template>

<style scoped>
.fa-panel {
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

.trend-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 6px;
  margin-bottom: var(--s-4);
}
.trend-card {
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-height: 100px;
  justify-content: space-between;
  color: rgba(255,255,255,.95);
}
.t-year, .t-name, .t-hex {
  font-family: var(--mono);
  font-size: 9px;
  background: rgba(0,0,0,.4);
  padding: 2px 5px;
  border-radius: 3px;
  align-self: flex-start;
  letter-spacing: .04em;
}
.t-year { font-size: 13px; font-weight: 700; }

.season-row {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: var(--s-3);
  align-items: center;
  margin-bottom: 4px;
}
.season-label { font-family: var(--mono); font-size: 10px; color: var(--text-2); text-transform: uppercase; letter-spacing: .08em; }
.season-strip { display: grid; grid-template-columns: repeat(5, 1fr); gap: 3px; }
.season-cell { height: 40px; border-radius: 4px; }

.story-card {
  border: 1px solid var(--hairline);
  border-radius: 12px;
  padding: var(--s-4);
}
.story-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(40px, 1fr));
  gap: 4px;
  margin-bottom: var(--s-3);
}
.story-cell { height: 80px; border-radius: 6px; }
.story-name {
  font-family: var(--sans); font-style: italic; font-weight: 700;
  font-size: 22px; color: var(--text);
  letter-spacing: -.01em;
}
.note { font-size: 11px; color: var(--text-2); margin: var(--s-3) 0 0; line-height: 1.5; }
.note code { font-family: var(--mono); background: var(--surface-2); padding: 1px 5px; border-radius: 3px; }

.preset-row {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: var(--s-3);
  align-items: center;
  margin-bottom: 6px;
}
.preset-meta { display: flex; flex-direction: column; gap: 2px; }
.preset-label { font-family: var(--sans); font-size: 12px; color: var(--text); font-weight: 500; }
.preset-desc { font-family: var(--mono); font-size: 9px; color: var(--text-3); letter-spacing: .04em; }
.preset-strip { display: grid; grid-template-columns: repeat(5, 1fr); gap: 3px; }
.preset-cell { height: 50px; border-radius: 4px; }

.dye-row {
  display: grid;
  grid-template-columns: 60px 1fr;
  gap: var(--s-3);
  align-items: center;
  margin-bottom: 6px;
}
.dye-base { width: 60px; height: 50px; border-radius: 6px; border: 1px solid var(--hairline); }
.dye-set { display: grid; grid-template-columns: repeat(5, 1fr); gap: 3px; }
.dye-cell {
  height: 50px; border-radius: 6px;
  display: flex; align-items: flex-end; justify-content: flex-end;
  padding: 4px;
}
.dye-cell span {
  font-family: var(--mono); font-size: 9px;
  background: rgba(0,0,0,.4); color: white;
  padding: 1px 4px; border-radius: 3px;
}

.code {
  background: #0a0a0a; color: #f5f5f5;
  padding: var(--s-3); border-radius: 8px;
  font-family: var(--mono); font-size: 10px;
  line-height: 1.55; overflow: auto;
  margin-top: var(--s-3);
}

@media (max-width: 720px) {
  .season-row, .preset-row, .dye-row { grid-template-columns: 1fr; }
}
</style>
