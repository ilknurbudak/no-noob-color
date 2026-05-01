<script setup lang="ts">
import { ref, computed } from "vue";
import type { Swatch, RGB } from "@/types";
import { rgbToHex, rgbToHsv, hsvToRgb, wcagContrast } from "@/services/color";
import { useToastStore } from "@/stores/toast";

const props = defineProps<{ palette: Swatch[] }>();
const toast = useToastStore();

type Tab = "ig" | "tiktok" | "thumb" | "consistency" | "templates";
const tab = ref<Tab>("ig");
const tabs: { id: Tab; label: string }[] = [
  { id: "ig", label: "IG feed grid" },
  { id: "tiktok", label: "TikTok aesthetic" },
  { id: "thumb", label: "thumbnail tips" },
  { id: "consistency", label: "consistency" },
  { id: "templates", label: "story templates" },
];

// IG 9-grid mock
function igGrid(palette: Swatch[]): string[] {
  // Cycle through palette to fill 9 cells with rotation
  const cells: string[] = [];
  for (let i = 0; i < 9; i++) {
    const sw = palette[i % palette.length];
    cells.push(sw ? rgbToHex(...sw.rgb) : "#FAFAFA");
  }
  return cells;
}
const ig9 = computed(() => igGrid(props.palette));

// TikTok aesthetic detect — match palette to known aesthetic clusters
const TT_AESTHETICS = [
  { id: "coquette", label: "coquette", hue: [320, 360], sat: [0.2, 0.5], val: [0.7, 1.0],
    desc: "soft pinks, lace, pearl" },
  { id: "y2k",      label: "Y2K",       hue: [280, 360], sat: [0.6, 1.0], val: [0.5, 1.0],
    desc: "low-rise pink, glitter, holographic" },
  { id: "clean",    label: "clean girl",hue: [20, 60],   sat: [0.1, 0.3], val: [0.85, 1.0],
    desc: "beige, almond, slicked-back" },
  { id: "grunge",   label: "grunge",    hue: [0, 360],   sat: [0.2, 0.5], val: [0.1, 0.4],
    desc: "muted darks, plaid, decay" },
  { id: "cottage",  label: "cottagecore",hue: [40, 130], sat: [0.25, 0.55],val: [0.6, 0.9],
    desc: "moss, butter, linen" },
  { id: "darkacad", label: "dark academia",hue: [10, 50], sat: [0.3, 0.6], val: [0.2, 0.5],
    desc: "tweed, leather-bound, candle" },
  { id: "vapor",    label: "vaporwave", hue: [180, 320], sat: [0.55, 0.95],val: [0.55, 0.95],
    desc: "magenta + cyan, gradient, retro" },
];

function aestheticMatch(palette: Swatch[]) {
  const scores: { id: string; label: string; score: number; desc: string }[] = [];
  for (const a of TT_AESTHETICS) {
    let hits = 0;
    for (const sw of palette) {
      const [h, s, v] = rgbToHsv(...sw.rgb);
      const hueOk = a.hue[0] <= a.hue[1]
        ? h >= a.hue[0] && h <= a.hue[1]
        : h >= a.hue[0] || h <= a.hue[1];
      const satOk = s >= a.sat[0] && s <= a.sat[1];
      const valOk = v >= a.val[0] && v <= a.val[1];
      if (hueOk && satOk && valOk) hits++;
    }
    scores.push({ id: a.id, label: a.label, score: hits / Math.max(1, palette.length), desc: a.desc });
  }
  return scores.sort((a, b) => b.score - a.score);
}

const aestheticScores = computed(() => aestheticMatch(props.palette));

// THUMBNAIL TIPS — ranked by CTR-friendly factors
function thumbnailScore(palette: Swatch[]) {
  if (!palette.length) return { score: 0, hints: ["empty"] };
  const hints: string[] = [];
  // Want: high contrast pair, warm pop color, dark background option
  const hexes = palette.map(sw => sw.rgb);
  let bestContrast = 0;
  for (let i = 0; i < hexes.length; i++) {
    for (let j = i + 1; j < hexes.length; j++) {
      const c = wcagContrast(hexes[i], hexes[j]);
      if (c > bestContrast) bestContrast = c;
    }
  }
  if (bestContrast >= 7) hints.push("✓ great contrast available");
  else if (bestContrast >= 4.5) hints.push("✓ AA contrast available");
  else hints.push("✗ no high-contrast pair — text will be hard to read");

  const hasWarm = palette.some(sw => {
    const [h, s] = rgbToHsv(...sw.rgb);
    return s > 0.5 && (h < 50 || h > 320);
  });
  if (hasWarm) hints.push("✓ warm pop color present (red/orange/yellow attract clicks)");
  else hints.push("✗ no warm pop — consider adding red/orange for click-through");

  const hasDark = palette.some(sw => rgbToHsv(...sw.rgb)[2] < 0.25);
  if (hasDark) hints.push("✓ dark anchor color for outline / drop shadow");
  else hints.push("○ no dark anchor — outlines may be subtle");

  return { score: bestContrast, hints };
}
const thumbAdvice = computed(() => thumbnailScore(props.palette));

// CONSISTENCY (multi-palette audit) — placeholder, single-palette mode
const consistencyHint = computed(() => {
  if (!props.palette.length) return null;
  const hues = props.palette.map(sw => rgbToHsv(...sw.rgb)[0]);
  const range = Math.max(...hues) - Math.min(...hues);
  if (range < 60) return { type: "tight", note: "Tight hue family — strong feed cohesion." };
  if (range < 180) return { type: "balanced", note: "Balanced — feed will feel curated, not monotone." };
  return { type: "loose", note: "Wide hue range — feed may look noisy. Consider tighter range for IG, looser is fine for TikTok." };
});

// STORY TEMPLATES — 9:16 + 1:1 mock
function storyBg(palette: Swatch[]): string {
  if (!palette.length) return "#fafafa";
  const sorted = [...palette].sort((a, b) => rgbToHsv(...b.rgb)[1] - rgbToHsv(...a.rgb)[1]);
  return rgbToHex(...sorted[0].rgb);
}

async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.show(`Copied ${label}`);
  } catch { toast.show("Copy failed"); }
}
</script>

<template>
  <section v-if="palette.length" class="ct-panel">
    <div class="head">
      <span class="eyebrow">Content Creator</span>
      <div class="tabs">
        <button v-for="t in tabs" :key="t.id" class="tab"
          :class="{ active: tab === t.id }" @click="tab = t.id">{{ t.label }}</button>
      </div>
    </div>

    <!-- IG -->
    <div v-show="tab === 'ig'" class="ig">
      <div class="micro">9-cell IG feed preview · palette cycled across grid</div>
      <div class="ig-grid">
        <div v-for="(c, i) in ig9" :key="i" class="ig-cell"
          :style="{ background: c }"
          @click="copy(c.toUpperCase(), `cell ${i+1}`)"
        ></div>
      </div>
      <p class="note">
        Aim for one cell to disrupt the pattern (the 'pop'). The cycled
        feed is the baseline — your actual posts will alternate based on the
        same harmony.
      </p>
    </div>

    <!-- TIKTOK -->
    <div v-show="tab === 'tiktok'" class="tiktok">
      <div class="micro">aesthetic match · which TikTok cluster does this palette read as?</div>
      <div v-for="a in aestheticScores" :key="a.id" class="aesthetic-row">
        <div class="aesthetic-bar">
          <div class="bar-fill" :style="{ width: (a.score * 100).toFixed(0) + '%' }"></div>
        </div>
        <div class="aesthetic-meta">
          <span class="ae-label">{{ a.label }}</span>
          <span class="ae-score">{{ (a.score * 100).toFixed(0) }}% match</span>
          <span class="ae-desc">{{ a.desc }}</span>
        </div>
      </div>
    </div>

    <!-- THUMB -->
    <div v-show="tab === 'thumb'" class="thumb">
      <div class="micro">YouTube/TikTok thumbnail readability · CTR factors</div>
      <div class="thumb-score">
        <div class="score-num">{{ thumbAdvice.score.toFixed(1) }}<span>:1</span></div>
        <span class="score-label">best contrast pair</span>
      </div>
      <ul class="thumb-hints">
        <li v-for="(h, i) in thumbAdvice.hints" :key="i">{{ h }}</li>
      </ul>
    </div>

    <!-- CONSISTENCY -->
    <div v-show="tab === 'consistency'" class="consistency">
      <div class="micro">cross-platform brand consistency · single-palette audit</div>
      <div v-if="consistencyHint" class="cons-card" :class="consistencyHint.type">
        <span class="cons-type">{{ consistencyHint.type }}</span>
        <p>{{ consistencyHint.note }}</p>
      </div>
      <p class="note">
        Save multiple palettes to your library, then compare them via the
        Library diff tool (coming soon) to audit consistency across feed,
        story, reel, and brand assets.
      </p>
    </div>

    <!-- TEMPLATES -->
    <div v-show="tab === 'templates'" class="templates">
      <div class="micro">9:16 story / 1:1 post quick templates</div>
      <div class="template-grid">
        <div class="story-template" :style="{ background: storyBg(palette) }">
          <div class="story-strip">
            <div v-for="sw in palette" :key="rgbToHex(...sw.rgb)" class="story-sw"
              :style="{ background: rgbToHex(...sw.rgb) }"></div>
          </div>
          <h3>palette of the day</h3>
        </div>
        <div class="post-template" :style="{ background: storyBg(palette) }">
          <div class="post-strip">
            <div v-for="sw in palette" :key="rgbToHex(...sw.rgb)" class="post-sw"
              :style="{ background: rgbToHex(...sw.rgb) }"></div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ct-panel {
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
.note { font-size: 11px; color: var(--text-2); margin: var(--s-3) 0 0; line-height: 1.55; }

/* IG */
.ig-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
  max-width: 380px;
}
.ig-cell { aspect-ratio: 1; cursor: pointer; transition: transform .15s; }
.ig-cell:hover { transform: scale(1.02); z-index: 2; }

/* TIKTOK */
.aesthetic-row {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: var(--s-3);
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid var(--hairline);
}
.aesthetic-row:last-child { border-bottom: none; }
.aesthetic-bar { height: 8px; background: var(--surface-2); border-radius: 4px; overflow: hidden; }
.bar-fill { height: 100%; background: var(--text); }
.aesthetic-meta { display: flex; flex-direction: column; gap: 2px; }
.ae-label { font-family: var(--sans); font-size: 13px; color: var(--text); font-weight: 500; }
.ae-score { font-family: var(--mono); font-size: 10px; color: var(--text-2); }
.ae-desc { font-family: var(--mono); font-size: 9px; color: var(--text-3); letter-spacing: .04em; }

/* THUMB */
.thumb-score {
  display: flex; align-items: baseline; gap: 12px;
  padding: var(--s-4);
  background: var(--surface-2);
  border-radius: 12px;
  margin-bottom: var(--s-3);
}
.score-num {
  font-family: var(--mono); font-size: 32px; font-weight: 700;
  color: var(--text); letter-spacing: -.02em;
}
.score-num span { font-size: 16px; opacity: .55; }
.score-label {
  font-family: var(--mono); font-size: 10px;
  text-transform: uppercase; letter-spacing: .12em; color: var(--text-3);
}
.thumb-hints {
  list-style: none; padding: 0; margin: 0;
  display: flex; flex-direction: column; gap: 6px;
}
.thumb-hints li {
  font-family: var(--mono); font-size: 11px;
  color: var(--text-2); padding: 6px 10px;
  background: var(--surface-2); border-radius: 6px;
  letter-spacing: .04em;
}

/* CONSISTENCY */
.cons-card {
  padding: var(--s-4);
  border: 1px solid var(--hairline);
  border-radius: 12px;
  margin-bottom: var(--s-3);
}
.cons-card.tight { border-color: #2a8a2a; background: rgba(42,138,42,.04); }
.cons-card.balanced { border-color: var(--text); background: var(--surface-2); }
.cons-card.loose { border-color: #b97500; background: rgba(220,150,0,.04); }
.cons-type {
  display: inline-block;
  font-family: var(--mono); font-size: 9px;
  text-transform: uppercase; letter-spacing: .12em;
  padding: 3px 8px; border-radius: 999px;
  background: var(--bg); color: var(--text);
  margin-bottom: 8px;
}
.cons-card p { margin: 0; font-size: 13px; line-height: 1.55; color: var(--text); }

/* TEMPLATES */
.template-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s-3);
}
.story-template {
  aspect-ratio: 9 / 16;
  border-radius: 12px;
  padding: var(--s-4);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: white;
  text-shadow: 0 2px 8px rgba(0,0,0,.3);
}
.story-template h3 {
  font-family: var(--sans); font-style: italic; font-weight: 700;
  font-size: 22px; margin: 0;
}
.story-strip { display: flex; gap: 4px; }
.story-sw { width: 24px; height: 60px; border-radius: 4px; }
.post-template {
  aspect-ratio: 1;
  border-radius: 12px;
  padding: var(--s-4);
  display: flex; align-items: center; justify-content: center;
}
.post-strip { display: grid; grid-template-columns: repeat(auto-fit, minmax(28px, 1fr)); gap: 4px; width: 100%; }
.post-sw { aspect-ratio: 1; border-radius: 4px; }

@media (max-width: 720px) {
  .aesthetic-row, .template-grid { grid-template-columns: 1fr; }
}
</style>
