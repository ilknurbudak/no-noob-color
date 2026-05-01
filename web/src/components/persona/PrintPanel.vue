<script setup lang="ts">
import { ref, computed } from "vue";
import type { Swatch, RGB } from "@/types";
import { rgbToHex, rgbToHsv, hsvToRgb, rgbToCmyk } from "@/services/color";
import { useToastStore } from "@/stores/toast";

const props = defineProps<{ palette: Swatch[] }>();
const toast = useToastStore();

type Tab = "gamut" | "icc" | "ink" | "spot" | "bleed" | "finish";
const tab = ref<Tab>("gamut");

const tabs: { id: Tab; label: string }[] = [
  { id: "gamut", label: "CMYK gamut" },
  { id: "icc", label: "ICC profile" },
  { id: "ink", label: "ink density" },
  { id: "spot", label: "spot color" },
  { id: "bleed", label: "bleed / safe" },
  { id: "finish", label: "finish sim" },
];

// CMYK GAMUT
function cmykGamutCheck(rgb: RGB) {
  const cmyk = rgbToCmyk(...rgb);
  const [h, s, v] = rgbToHsv(...rgb);
  const outOfGamut = (s > 0.85 && (h > 110 && h < 220)) || (s > 0.92 && v > 0.85);
  // Approximate adjusted color for printable space
  const adjusted = outOfGamut ? hsvToRgb(h, s * 0.75, v * 0.92) : rgb;
  return {
    cmyk,
    out_of_gamut: outOfGamut,
    print_safe_hex: rgbToHex(...adjusted),
  };
}

const gamutAudit = computed(() =>
  props.palette.map(sw => ({
    hex: rgbToHex(...sw.rgb),
    rgb: sw.rgb,
    ...cmykGamutCheck(sw.rgb),
  }))
);

// ICC PROFILES — preset shifts
const ICC_PROFILES = [
  { id: "fogra39", label: "FOGRA39", desc: "Coated paper, ISO 12647-2 (EU standard)",
    shift: { c: 0, m: 0, y: 0, k: 0 } },
  { id: "fogra51", label: "FOGRA51", desc: "PSO Coated v3 (newest EU)",
    shift: { c: 0, m: 0, y: 0, k: 0 } },
  { id: "gracol", label: "GRACoL 2013", desc: "US commercial press",
    shift: { c: -2, m: 0, y: 2, k: 0 } },
  { id: "swop", label: "SWOP", desc: "US web press, news/magazine",
    shift: { c: 0, m: 5, y: 5, k: -5 } },
  { id: "japan", label: "Japan Color 2011", desc: "Japanese commercial",
    shift: { c: 5, m: 0, y: -3, k: 0 } },
];

const iccProfile = ref(ICC_PROFILES[0]);

const iccPreview = computed(() =>
  props.palette.map(sw => {
    const cmyk = rgbToCmyk(...sw.rgb);
    const sh = iccProfile.value.shift;
    return {
      original: rgbToHex(...sw.rgb).toUpperCase(),
      cmyk_original: cmyk,
      cmyk_adjusted: [
        Math.max(0, Math.min(100, cmyk[0] + sh.c)),
        Math.max(0, Math.min(100, cmyk[1] + sh.m)),
        Math.max(0, Math.min(100, cmyk[2] + sh.y)),
        Math.max(0, Math.min(100, cmyk[3] + sh.k)),
      ] as [number, number, number, number],
    };
  })
);

// INK DENSITY — total ink coverage
const inkDensity = computed(() =>
  props.palette.map(sw => {
    const [c, m, y, k] = rgbToCmyk(...sw.rgb);
    const total = c + m + y + k;
    return {
      hex: rgbToHex(...sw.rgb).toUpperCase(),
      cmyk: [c, m, y, k] as [number, number, number, number],
      total,
      status: total > 320 ? "danger" : total > 280 ? "warning" : "ok",
    };
  })
);

// SPOT COLOR — flag swatches that should be spot-printed (very saturated /
// out of CMYK gamut → would be Pantone spot)
const spotCandidates = computed(() =>
  props.palette
    .map((sw, i) => {
      const [, s, v] = rgbToHsv(...sw.rgb);
      const candidate = s > 0.8 && v > 0.5;
      return {
        index: i,
        hex: rgbToHex(...sw.rgb).toUpperCase(),
        rgb: sw.rgb,
        recommended: candidate,
      };
    })
);

// BLEED / SAFE
const printSize = ref<"a4" | "a3" | "letter" | "square">("a4");
const printSizes = {
  a4: { w: 210, h: 297, label: "A4 (210×297mm)" },
  a3: { w: 297, h: 420, label: "A3 (297×420mm)" },
  letter: { w: 216, h: 279, label: "US Letter (216×279mm)" },
  square: { w: 300, h: 300, label: "Square (300×300mm)" },
};

// FINISH — special print effects (foil, UV, holographic)
const FINISHES = [
  { id: "matte", label: "matte coating", effect: "darken slightly, low specular" },
  { id: "gloss", label: "gloss coating", effect: "slight contrast boost" },
  { id: "uv", label: "spot UV", effect: "high gloss on selected area" },
  { id: "foil-gold", label: "gold foil", effect: "metallic warm specular" },
  { id: "foil-silver", label: "silver foil", effect: "metallic cool specular" },
  { id: "holographic", label: "holographic", effect: "iridescent rainbow shift" },
];

const finishMode = ref(FINISHES[0].id);
const finishCss = computed(() => {
  switch (finishMode.value) {
    case "matte": return "filter: brightness(0.94) contrast(0.98);";
    case "gloss": return "filter: brightness(1.04) contrast(1.05);";
    case "uv": return "filter: brightness(1.08) contrast(1.1) saturate(1.05);";
    case "foil-gold": return "filter: hue-rotate(-15deg) saturate(1.4) brightness(1.15); background-image: linear-gradient(135deg, rgba(255,200,80,.35), transparent 60%);";
    case "foil-silver": return "filter: saturate(0.4) brightness(1.18) contrast(1.1); background-image: linear-gradient(135deg, rgba(255,255,255,.4), transparent 60%);";
    case "holographic": return "background-image: linear-gradient(120deg, rgba(255,0,128,.25), rgba(0,200,255,.25), rgba(255,255,0,.25));";
    default: return "";
  }
});

async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.show(`Copied ${label}`);
  } catch { toast.show("Copy failed"); }
}
</script>

<template>
  <section v-if="palette.length" class="pr-panel">
    <div class="head">
      <span class="eyebrow">Print Designer</span>
      <div class="tabs">
        <button v-for="t in tabs" :key="t.id" class="tab"
          :class="{ active: tab === t.id }" @click="tab = t.id">{{ t.label }}</button>
      </div>
    </div>

    <!-- CMYK GAMUT -->
    <div v-show="tab === 'gamut'" class="gamut">
      <div class="micro">CMYK gamut warning · which colors will dull on press</div>
      <div v-for="(g, i) in gamutAudit" :key="i" class="g-row" :class="{ outg: g.out_of_gamut }">
        <div class="g-cell" :style="{ background: g.hex }"></div>
        <div class="g-meta">
          <span class="g-hex">{{ g.hex.toUpperCase() }}</span>
          <span class="g-cmyk">CMYK {{ g.cmyk.join(" / ") }}%</span>
          <span v-if="g.out_of_gamut" class="g-warn">
            ⚠ out of CMYK gamut · suggested
            <span class="copyable" @click="copy(g.print_safe_hex.toUpperCase(), 'safe')">{{ g.print_safe_hex.toUpperCase() }}</span>
          </span>
        </div>
        <div v-if="g.out_of_gamut" class="g-suggest" :style="{ background: g.print_safe_hex }"></div>
      </div>
    </div>

    <!-- ICC -->
    <div v-show="tab === 'icc'" class="icc">
      <div class="micro">ICC profile preset · CMYK values shift per press standard</div>
      <div class="icc-modes">
        <button v-for="p in ICC_PROFILES" :key="p.id"
          class="icc-chip" :class="{ active: iccProfile.id === p.id }"
          :title="p.desc" @click="iccProfile = p">{{ p.label }}</button>
      </div>
      <div class="icc-desc">{{ iccProfile.desc }}</div>
      <div class="icc-table">
        <div v-for="(row, i) in iccPreview" :key="i" class="icc-row">
          <div class="icc-swatch" :style="{ background: row.original }"></div>
          <span class="icc-hex">{{ row.original }}</span>
          <span class="icc-cmyk">{{ row.cmyk_original.join("/") }}</span>
          <span class="icc-arrow">→</span>
          <span class="icc-cmyk">{{ row.cmyk_adjusted.join("/") }}</span>
        </div>
      </div>
    </div>

    <!-- INK -->
    <div v-show="tab === 'ink'" class="ink">
      <div class="micro">total ink coverage · &gt;320 = drying problems on coated stock</div>
      <div v-for="(d, i) in inkDensity" :key="i" class="ink-row" :class="d.status">
        <div class="ink-swatch" :style="{ background: d.hex }"></div>
        <div class="ink-meta">
          <span class="ink-hex">{{ d.hex }}</span>
          <span class="ink-cmyk">C {{ d.cmyk[0] }} · M {{ d.cmyk[1] }} · Y {{ d.cmyk[2] }} · K {{ d.cmyk[3] }}</span>
        </div>
        <div class="ink-bar">
          <div class="bar-fill" :style="{ width: Math.min(100, d.total / 4) + '%' }"></div>
        </div>
        <span class="ink-total">{{ d.total }}%</span>
      </div>
    </div>

    <!-- SPOT -->
    <div v-show="tab === 'spot'" class="spot">
      <div class="micro">spot color recommendations · use Pantone for these instead of CMYK</div>
      <div v-for="s in spotCandidates" :key="s.index" class="spot-row">
        <div class="spot-cell" :style="{ background: s.hex }"></div>
        <div class="spot-meta">
          <span class="spot-hex">{{ s.hex }}</span>
          <span v-if="s.recommended" class="spot-rec">recommended as spot — high saturation, will dull in CMYK</span>
          <span v-else class="spot-ok">CMYK is fine</span>
        </div>
      </div>
      <p class="note">
        Use the <code>/pantone/match</code> API to find the closest Pantone code
        for each spot recommendation.
      </p>
    </div>

    <!-- BLEED -->
    <div v-show="tab === 'bleed'" class="bleed">
      <div class="micro">bleed (3mm) + safe area (5mm in) preview</div>
      <div class="bleed-modes">
        <button v-for="(s, key) in printSizes" :key="key"
          class="bleed-chip" :class="{ active: printSize === key }"
          @click="printSize = key as any">{{ s.label }}</button>
      </div>
      <div class="canvas-wrap">
        <div class="canvas"
          :style="{ aspectRatio: `${printSizes[printSize].w} / ${printSizes[printSize].h}` }">
          <div class="bleed-area">
            <div class="trim-area">
              <div class="safe-area">
                <div class="palette-grid">
                  <div v-for="sw in palette" :key="rgbToHex(...sw.rgb)"
                    class="palette-cell"
                    :style="{ background: rgbToHex(...sw.rgb) }"></div>
                </div>
                <span class="lbl-safe">safe area</span>
              </div>
              <span class="lbl-trim">trim</span>
            </div>
            <span class="lbl-bleed">bleed 3mm</span>
          </div>
        </div>
      </div>
    </div>

    <!-- FINISH -->
    <div v-show="tab === 'finish'" class="finish">
      <div class="micro">special finish simulator · approximate visual effect</div>
      <div class="finish-modes">
        <button v-for="f in FINISHES" :key="f.id"
          class="finish-chip" :class="{ active: finishMode === f.id }"
          :title="f.effect" @click="finishMode = f.id">{{ f.label }}</button>
      </div>
      <div class="finish-strip">
        <div v-for="sw in palette" :key="rgbToHex(...sw.rgb)" class="finish-cell"
          :style="`background: ${rgbToHex(...sw.rgb)}; ${finishCss}`"
        ></div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.pr-panel {
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

/* GAMUT */
.g-row {
  display: grid;
  grid-template-columns: 56px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 10px;
  border: 1px solid var(--hairline);
  border-radius: 10px;
  margin-bottom: 6px;
}
.g-row.outg { border-color: #b97500; background: rgba(220,150,0,.04); }
.g-cell { width: 56px; height: 56px; border-radius: 8px; }
.g-suggest { width: 56px; height: 56px; border-radius: 8px; }
.g-meta { display: flex; flex-direction: column; gap: 2px; }
.g-hex { font-family: var(--mono); font-size: 11px; color: var(--text); }
.g-cmyk { font-family: var(--mono); font-size: 10px; color: var(--text-2); }
.g-warn { font-family: var(--mono); font-size: 10px; color: #b97500; }
.copyable { cursor: pointer; text-decoration: underline; }
.copyable:hover { opacity: .7; }

/* ICC */
.icc-modes, .bleed-modes, .finish-modes { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: var(--s-3); }
.icc-chip, .bleed-chip, .finish-chip {
  padding: 6px 12px; border: 1px solid var(--hairline); background: var(--bg);
  color: var(--text-2); border-radius: 999px;
  font-family: var(--mono); font-size: 9px; text-transform: uppercase; letter-spacing: .08em;
  cursor: pointer; transition: background .15s, color .15s, border-color .15s;
}
.icc-chip:hover, .bleed-chip:hover, .finish-chip:hover { color: var(--text); border-color: var(--text); }
.icc-chip.active, .bleed-chip.active, .finish-chip.active { background: var(--text); color: var(--bg); border-color: var(--text); }
.icc-desc {
  font-family: var(--mono); font-size: 10px; color: var(--text-2);
  letter-spacing: .04em; margin-bottom: var(--s-3);
}
.icc-row {
  display: grid;
  grid-template-columns: 32px 60px 1fr auto 1fr;
  gap: 10px;
  align-items: center;
  font-family: var(--mono);
  font-size: 11px;
  padding: 6px 8px;
  border-bottom: 1px solid var(--hairline);
}
.icc-row:last-child { border-bottom: none; }
.icc-swatch { width: 32px; height: 32px; border-radius: 6px; }
.icc-hex { color: var(--text); }
.icc-cmyk { color: var(--text-2); }
.icc-arrow { color: var(--text-3); font-size: 14px; }

/* INK */
.ink-row {
  display: grid;
  grid-template-columns: 36px 1fr 200px 60px;
  gap: 10px;
  align-items: center;
  padding: 6px 8px;
  border-bottom: 1px solid var(--hairline);
}
.ink-row:last-child { border-bottom: none; }
.ink-swatch { width: 36px; height: 36px; border-radius: 6px; }
.ink-meta { display: flex; flex-direction: column; gap: 2px; }
.ink-hex { font-family: var(--mono); font-size: 11px; color: var(--text); }
.ink-cmyk { font-family: var(--mono); font-size: 9px; color: var(--text-3); }
.ink-bar { height: 8px; background: var(--surface-2); border-radius: 4px; overflow: hidden; }
.bar-fill { height: 100%; background: linear-gradient(90deg, #2a8a2a 0%, #b97500 70%, #c00 100%); }
.ink-total { font-family: var(--mono); font-size: 11px; text-align: right; color: var(--text); }
.ink-row.warning .ink-total { color: #b97500; }
.ink-row.danger .ink-total { color: #c00; font-weight: 700; }

/* SPOT */
.spot-row {
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 10px;
  align-items: center;
  padding: 10px;
  border: 1px solid var(--hairline);
  border-radius: 10px;
  margin-bottom: 6px;
}
.spot-cell { width: 56px; height: 56px; border-radius: 8px; }
.spot-meta { display: flex; flex-direction: column; gap: 2px; }
.spot-hex { font-family: var(--mono); font-size: 11px; color: var(--text); }
.spot-rec { font-family: var(--mono); font-size: 10px; color: #b97500; }
.spot-ok { font-family: var(--mono); font-size: 10px; color: var(--text-3); }
.note { font-size: 11px; color: var(--text-2); margin-top: var(--s-3); }
.note code { font-family: var(--mono); background: var(--surface-2); padding: 1px 5px; border-radius: 3px; }

/* BLEED */
.canvas-wrap { display: flex; justify-content: center; }
.canvas {
  background: var(--surface-2);
  width: 100%;
  max-width: 380px;
  position: relative;
  border-radius: 4px;
}
.bleed-area, .trim-area, .safe-area {
  position: absolute;
  border-style: dashed;
  border-width: 1px;
}
.bleed-area {
  inset: 0;
  border-color: #c00;
  background: repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(192,0,0,.07) 6px, rgba(192,0,0,.07) 7px);
}
.trim-area {
  inset: 4%;
  border-color: var(--text-3);
  background: var(--bg);
}
.safe-area {
  inset: 6%;
  border-color: #2a8a2a;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
}
.palette-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(20px, 1fr));
  gap: 3px;
  width: 100%;
}
.palette-cell { aspect-ratio: 1; border-radius: 2px; }
.lbl-bleed, .lbl-trim, .lbl-safe {
  position: absolute;
  font-family: var(--mono);
  font-size: 8px;
  text-transform: uppercase;
  letter-spacing: .08em;
  background: var(--bg);
  padding: 1px 4px;
  border-radius: 2px;
}
.lbl-bleed { top: -2px; left: 6px; color: #c00; }
.lbl-trim { top: -2px; left: 6px; color: var(--text-3); }
.lbl-safe { bottom: 4px; right: 4px; color: #2a8a2a; }

/* FINISH */
.finish-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
  gap: 4px;
}
.finish-cell {
  height: 110px;
  border-radius: 8px;
  border: 1px solid var(--hairline);
}
</style>
