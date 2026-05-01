<script setup lang="ts">
import { ref, watch, computed, onMounted } from "vue";
import type { Swatch, Harmony } from "@/types";
import PaletteStrips from "@/components/PaletteStrips.vue";
import ProfilePill from "@/components/ProfilePill.vue";
import ExportMenu from "@/components/ExportMenu.vue";
import TabInfo from "@/components/TabInfo.vue";
import { usePersonaStore } from "@/stores/persona";
import { useLibraryStore } from "@/stores/library";
import { useToastStore } from "@/stores/toast";
import { harmonize as apiHarmonize, getApiUrl } from "@/services/api";
import { hexToRgb, rgbToHex, rgbToHsv, hsvToRgb, rgbToLab } from "@/services/color";
import { CB_MODES, type CBMode } from "@/services/colorblind";
import { useRefImage } from "@/composables/useRefImage";
import { parsePrompt, biasToPalette, type Bias } from "@/services/promptBias";
import { useTasteStore } from "@/stores/taste";
import TasteTrainer from "@/components/TasteTrainer.vue";
import UIPanel from "@/components/persona/UIPanel.vue";
import IllustratorPanel from "@/components/persona/IllustratorPanel.vue";
import ConceptPanel from "@/components/persona/ConceptPanel.vue";
import CinemaPanel from "@/components/persona/CinemaPanel.vue";

const persona = usePersonaStore();
const lib = useLibraryStore();
const toast = useToastStore();

const baseHex = ref("#7a4b8a");
const rule = ref<Harmony>("auto");
const n = ref(5);
const palette = ref<Swatch[]>([]);
const loading = ref(false);
const cbMode = ref<CBMode>("normal");
const refImg = useRefImage(1);
const prompt = ref("");
const promptInfo = computed(() => parsePrompt(prompt.value));
const taste = useTasteStore();
const useTaste = ref(false);
const showTrainer = ref(false);

function combineBias(a: Bias, b: Bias): Bias {
  const out: Bias = { ...a };
  if (b.hue) out.hue = b.hue;
  if (b.sat) {
    out.sat = a.sat
      ? [Math.max(a.sat[0], b.sat[0]), Math.min(a.sat[1], b.sat[1])]
      : b.sat;
    if (out.sat[0] > out.sat[1]) out.sat = [out.sat[1], out.sat[0]];
  }
  if (b.val) {
    out.val = a.val
      ? [Math.max(a.val[0], b.val[0]), Math.min(a.val[1], b.val[1])]
      : b.val;
    if (out.val[0] > out.val[1]) out.val = [out.val[1], out.val[0]];
  }
  return out;
}

function generateFromPrompt() {
  const info = promptInfo.value;
  let bias: Bias = info.bias;
  if (useTaste.value && taste.trained) bias = combineBias(bias, taste.bias);
  const matchCount = info.matched.length + (useTaste.value && taste.trained ? 1 : 0);
  if (!matchCount) {
    toast.show("No keywords matched");
    return;
  }
  palette.value = biasToPalette(bias, n.value);
}

async function onRefDrop(e: DragEvent) {
  e.preventDefault();
  const f = e.dataTransfer?.files?.[0];
  if (!f) return;
  const extracted = await refImg.load(f, 5);
  if (extracted.length) {
    const sw = extracted[0];
    const hex = "#" + sw.rgb.map(v => v.toString(16).padStart(2, "0")).join("");
    baseHex.value = hex;
    palette.value = extracted;
  }
}
function onRefClick(e: MouseEvent) {
  const input = (e.currentTarget as HTMLElement).querySelector("input") as HTMLInputElement;
  input?.click();
}
async function onRefChange(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (!f) return;
  const extracted = await refImg.load(f, 5);
  if (extracted.length) {
    const sw = extracted[0];
    const hex = "#" + sw.rgb.map(v => v.toString(16).padStart(2, "0")).join("");
    baseHex.value = hex;
    palette.value = extracted;
  }
}

const HARMONY_OPTIONS: { id: Harmony; label: string }[] = [
  { id: "auto", label: "auto" },
  { id: "monochromatic", label: "mono" },
  { id: "analogous", label: "analogous" },
  { id: "complementary", label: "complement" },
  { id: "triadic", label: "triadic" },
  { id: "split-complementary", label: "split" },
  { id: "tetradic", label: "tetradic" },
];

function localHarmonize(hex: string, kind: Harmony, count: number): Swatch[] {
  const rgb = hexToRgb(hex);
  const [h, s, v] = rgbToHsv(...rgb);
  const offsets: Record<Exclude<Harmony, "auto">, number[]> = {
    monochromatic: [0],
    analogous: [-30, -15, 0, 15, 30],
    complementary: [0, 180],
    triadic: [0, 120, 240],
    "split-complementary": [0, 150, 210],
    tetradic: [0, 90, 180, 270],
  };
  const baseKind: Exclude<Harmony, "auto"> = kind === "auto" ? "analogous" : kind;
  const ring = offsets[baseKind];
  const out: Swatch[] = [];
  for (let i = 0; i < count; i++) {
    const offset = ring[i % ring.length];
    let nh = (h + offset + 360) % 360;
    let ns = s;
    let nv = v;
    if (baseKind === "monochromatic") {
      const t = count === 1 ? 0.5 : i / (count - 1);
      nv = 0.25 + 0.6 * t;
      ns = Math.max(0.15, s);
    } else if (i >= ring.length) {
      const ladder = (Math.floor(i / ring.length)) * 0.12;
      nv = Math.max(0.15, Math.min(0.95, v - ladder));
    }
    const newRgb = hsvToRgb(nh, ns, nv);
    const [L, a, b] = rgbToLab(...newRgb);
    out.push({ rgb: newRgb, L, chroma: Math.sqrt(a * a + b * b) });
  }
  return out;
}

async function generate() {
  loading.value = true;
  let result: Swatch[] | null = null;
  if (getApiUrl()) {
    try { result = await apiHarmonize(baseHex.value, rule.value === "auto" ? "analogous" : rule.value, n.value); }
    catch (err) { console.warn("API harmonize failed, falling back:", err); }
  }
  if (!result) result = localHarmonize(baseHex.value, rule.value, n.value);
  palette.value = result;
  loading.value = false;
}

function applyPersona() {
  if (!persona.active) return;
  n.value = persona.active.size;
}

watch(() => persona.active?.id, applyPersona);
onMounted(() => { applyPersona(); generate(); });

function makeThumbFromPalette(pal: Swatch[]): string {
  const canvas = document.createElement("canvas");
  canvas.width = 360; canvas.height = 270;
  const ctx = canvas.getContext("2d")!;
  const stripW = canvas.width / Math.max(1, pal.length);
  pal.forEach((sw, i) => {
    ctx.fillStyle = rgbToHex(...sw.rgb);
    ctx.fillRect(i * stripW, 0, stripW + 1, canvas.height);
  });
  return canvas.toDataURL("image/png");
}

async function onSave() {
  if (!palette.value.length) return;
  await lib.save(palette.value, makeThumbFromPalette(palette.value), "generate");
  toast.show("Saved to Library");
}

const personaName = computed(() => persona.active?.name ?? "no persona");
</script>

<template>
  <section>
    <div class="persona-row">
      <span class="section-label"><span class="num">01</span>Persona</span>
      <div class="persona-chips">
        <button
          v-for="p in persona.PERSONAS"
          :key="p.id"
          class="persona-chip"
          :class="{ active: persona.activeId === p.id }"
          :title="p.desc"
          @click="persona.activeId === p.id ? persona.clear() : persona.set(p.id)"
        >{{ p.name.split(' ')[0] }}</button>
      </div>
      <span class="persona-active">{{ personaName }}</span>
    </div>

    <div class="studio-grid">
      <div class="studio-controls">
        <div class="section-label"><span class="num">02</span>Studio</div>

        <label class="ctrl">
          <span>Base color</span>
          <div class="base-row">
            <input type="color" v-model="baseHex" />
            <input type="text" v-model="baseHex" class="base-hex" maxlength="7" />
          </div>
        </label>

        <label class="ctrl">
          <span>Harmony</span>
          <div class="rule-grid">
            <button
              v-for="o in HARMONY_OPTIONS"
              :key="o.id"
              class="rule-chip"
              :class="{ active: rule === o.id }"
              @click="rule = o.id"
            >{{ o.label }}</button>
          </div>
        </label>

        <label class="ctrl">
          <span>Size · {{ n }}</span>
          <input type="range" min="2" max="20" v-model.number="n" />
        </label>

        <button class="generate-btn" :disabled="loading" @click="generate">
          {{ loading ? "generating…" : "Generate" }}
        </button>

        <label class="ctrl prompt-ctrl">
          <span>
            Prompt
            <span class="prompt-meta" v-if="prompt">
              · {{ promptInfo.matched.length }}/{{ promptInfo.tokens.length }} matched
            </span>
          </span>
          <div class="prompt-row">
            <input
              type="text"
              v-model="prompt"
              placeholder="warm vintage sunset · soluk pastel deniz"
              @keydown.enter="generateFromPrompt"
            />
            <button class="prompt-btn" :disabled="!promptInfo.matched.length" @click="generateFromPrompt">
              from prompt
            </button>
          </div>
          <div v-if="prompt && promptInfo.unknown.length" class="prompt-unknown">
            ignored: {{ promptInfo.unknown.join(", ") }}
          </div>
          <div class="taste-row">
            <label class="taste-toggle">
              <input type="checkbox" v-model="useTaste" :disabled="!taste.trained" />
              <span>use my taste{{ taste.trained ? ` · ${taste.state.count} liked` : " · not trained" }}</span>
            </label>
            <button class="prompt-btn ghost" @click.prevent="showTrainer = !showTrainer">
              {{ showTrainer ? "hide" : (taste.trained ? "retrain" : "train") }}
            </button>
          </div>
        </label>

        <TasteTrainer v-if="showTrainer" class="trainer-slot" />

        <div class="ref-zone"
          @click="onRefClick"
          @dragover.prevent
          @drop="onRefDrop"
          :class="{ has: !!refImg.dataUrl.value, busy: refImg.loading.value }"
        >
          <img v-if="refImg.dataUrl.value" :src="refImg.dataUrl.value" alt="" />
          <span v-else-if="refImg.loading.value">extracting…</span>
          <span v-else>drop ref image · seeds palette</span>
          <input type="file" accept="image/*" @change="onRefChange" hidden />
        </div>
      </div>

      <div class="studio-output">
        <div class="palette-header">
          <div class="section-label"><span class="num">03</span>Palette</div>
          <ProfilePill />
        </div>

        <div class="cb-row">
          <span class="cb-lbl">Color blindness preview</span>
          <div class="cb-chips">
            <button
              v-for="m in CB_MODES"
              :key="m.id"
              class="cb-chip"
              :class="{ active: cbMode === m.id }"
              :title="m.desc"
              @click="cbMode = m.id"
            >{{ m.label }}</button>
          </div>
        </div>

        <PaletteStrips
          :palette="palette"
          :cb-mode="cbMode"
          :empty-mini="['#7a4b8a', '#9d6bb5', '#c4a3d8', '#5d3a6b', '#3a2347']"
          empty-tag="example · plum"
          empty-message="Pick a base color and harmony rule. Output adapts to the active persona."
        />

        <div class="palette-footer">
          <button class="chip-btn ghost" :disabled="!palette.length" @click="onSave">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round">
              <path d="M4 2 H12 V14 L8 11 L4 14 Z" />
            </svg>
            Save
          </button>
          <ExportMenu :palette="palette" :disabled="!palette.length" />
        </div>
      </div>
    </div>

    <UIPanel v-if="persona.activeId === 'ui'" :palette="palette" />
    <IllustratorPanel v-if="persona.activeId === 'illustrator'" :palette="palette" />
    <ConceptPanel v-if="persona.activeId === 'concept'" :palette="palette" />
    <CinemaPanel v-if="persona.activeId === 'cinema'" :palette="palette" />

    <TabInfo
      eyebrow="How it works"
      title="Generative palettes, persona-aware"
      lead="Pick a base color, choose a harmony rule, and the studio derives a palette in HSV/Lab space — preferring the Python service for rigor and falling back to local math when offline."
    >
      <li>
        <strong>Six harmony rules</strong>
        Mono, analogous, complementary, triadic, split-complementary, tetradic — all N-aware.
      </li>
      <li>
        <strong>Persona defaults</strong>
        Each persona auto-applies palette size and downstream output preferences.
      </li>
      <li>
        <strong>Color profile aware</strong>
        Same swatches, different output transform: sRGB, Display P3, Adobe RGB, CMYK.
      </li>
      <li>
        <strong>Save anywhere</strong>
        Signed in: synced to your PocketBase. Logged out: local only — your call.
      </li>
    </TabInfo>
  </section>
</template>

<style scoped>
.persona-row {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  flex-wrap: wrap;
  margin-bottom: var(--s-5);
}
.persona-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.persona-chip {
  padding: 6px 11px;
  border: 1px solid var(--hairline);
  background: var(--bg);
  color: var(--text-2);
  border-radius: 999px;
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: .08em;
  cursor: pointer;
  transition: background .15s, color .15s, border-color .15s;
}
.persona-chip:hover { color: var(--text); border-color: var(--text); }
.persona-chip.active { background: var(--text); color: var(--bg); border-color: var(--text); }
.persona-active {
  margin-left: auto;
  font-family: var(--mono);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: .1em;
  color: var(--text-3);
}

.studio-grid {
  display: grid;
  grid-template-columns: minmax(280px, 2fr) minmax(0, 3fr);
  gap: var(--s-5);
  align-items: start;
}
.studio-controls, .studio-output { min-width: 0; }

.section-label {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: .1em;
  margin-bottom: var(--s-3);
  display: block;
}
.section-label .num {
  color: var(--text-2);
  margin-right: 6px;
  font-weight: 500;
}

.ctrl {
  display: block;
  margin-bottom: var(--s-4);
}
.ctrl > span {
  display: block;
  font-family: var(--mono);
  font-size: 10px;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: .1em;
  margin-bottom: 8px;
}
.base-row { display: flex; gap: 8px; align-items: center; }
.base-row input[type="color"] {
  width: 44px; height: 32px;
  padding: 2px;
  border: 1px solid var(--hairline);
  border-radius: 6px;
  background: var(--bg);
  cursor: pointer;
}
.base-hex {
  flex: 1;
  font-family: var(--mono);
  font-size: 12px;
  padding: 7px 10px;
  border: 1px solid var(--hairline);
  background: var(--bg);
  color: var(--text);
  border-radius: 6px;
  text-transform: uppercase;
}
.base-hex:focus { outline: none; border-color: var(--text); }

.rule-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 6px;
}
.rule-chip {
  padding: 7px 4px;
  border: 1px solid var(--hairline);
  background: var(--bg);
  color: var(--text-2);
  border-radius: 6px;
  font-family: var(--mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .06em;
  cursor: pointer;
  transition: background .15s, color .15s, border-color .15s;
}
.rule-chip:hover { color: var(--text); border-color: var(--text); }
.rule-chip.active { background: var(--text); color: var(--bg); border-color: var(--text); }

input[type="range"] {
  width: 100%;
  accent-color: var(--text);
}

.generate-btn {
  width: 100%;
  padding: 11px;
  border: 1px solid var(--text);
  background: var(--text);
  color: var(--bg);
  border-radius: 8px;
  font-family: var(--sans);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: -.005em;
  cursor: pointer;
  transition: opacity .15s;
}
.generate-btn:disabled { opacity: .5; cursor: not-allowed; }

.ref-zone {
  margin-top: var(--s-3);
  border: 1.5px dashed var(--hairline);
  border-radius: 10px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  position: relative;
  transition: border-color .15s, background .15s;
  font-family: var(--mono);
  font-size: 10px;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: .08em;
  text-align: center;
  padding: 0 8px;
}
.ref-zone:hover { border-color: var(--text); color: var(--text); }
.ref-zone.has { border-style: solid; padding: 0; }
.ref-zone.busy { opacity: .7; }
.ref-zone img { width: 100%; height: 100%; object-fit: cover; display: block; }

.prompt-ctrl { margin-top: var(--s-3); }
.prompt-meta {
  text-transform: none;
  letter-spacing: 0;
  color: var(--text-2);
  font-size: 9px;
}
.prompt-row { display: flex; gap: 6px; }
.prompt-row input {
  flex: 1;
  border: 1px solid var(--hairline);
  background: var(--bg);
  color: var(--text);
  padding: 7px 10px;
  border-radius: 6px;
  font-family: var(--sans);
  font-size: 12px;
}
.prompt-row input:focus { outline: none; border-color: var(--text); }
.prompt-btn {
  padding: 7px 11px;
  border: 1px solid var(--text);
  background: var(--bg);
  color: var(--text);
  border-radius: 6px;
  font-family: var(--mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .06em;
  cursor: pointer;
  white-space: nowrap;
  transition: background .15s, color .15s;
}
.prompt-btn:hover:not(:disabled) { background: var(--text); color: var(--bg); }
.prompt-btn:disabled { opacity: .4; cursor: not-allowed; }
.prompt-unknown {
  margin-top: 6px;
  font-family: var(--mono);
  font-size: 9px;
  color: var(--text-3);
  letter-spacing: .04em;
}
.taste-row {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}
.taste-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--mono);
  font-size: 10px;
  color: var(--text-2);
  letter-spacing: .04em;
  cursor: pointer;
  text-transform: lowercase;
}
.taste-toggle input { accent-color: var(--text); cursor: pointer; }
.taste-toggle input:disabled + span { opacity: .55; cursor: not-allowed; }
.prompt-btn.ghost {
  border-color: var(--hairline);
  color: var(--text-2);
}
.prompt-btn.ghost:hover { color: var(--text); border-color: var(--text); background: var(--bg); }
.trainer-slot { margin-top: var(--s-3); }

.palette-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--s-3);
  gap: var(--s-3);
  flex-wrap: wrap;
}
.palette-header .section-label { margin: 0; }
.cb-row {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  flex-wrap: wrap;
  margin-bottom: var(--s-3);
}
.cb-lbl {
  font-family: var(--mono);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: .12em;
  color: var(--text-3);
}
.cb-chips {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.cb-chip {
  padding: 5px 10px;
  border: 1px solid var(--hairline);
  background: var(--bg);
  color: var(--text-2);
  border-radius: 999px;
  font-family: var(--mono);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: .08em;
  cursor: pointer;
  transition: background .15s, color .15s, border-color .15s;
}
.cb-chip:hover { color: var(--text); border-color: var(--text); }
.cb-chip.active { background: var(--text); color: var(--bg); border-color: var(--text); }
.palette-footer {
  margin-top: var(--s-3);
  display: flex;
  justify-content: flex-end;
  gap: var(--s-2);
  align-items: center;
}
.chip-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border: 1px solid var(--hairline);
  background: var(--bg);
  color: var(--text);
  border-radius: 8px;
  font-family: var(--sans);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: background .15s, color .15s, border-color .15s;
}
.chip-btn:hover:not(:disabled) {
  background: var(--text); color: var(--bg); border-color: var(--text);
}
.chip-btn:disabled { opacity: .4; cursor: not-allowed; }
.chip-btn svg { width: 12px; height: 12px; }

@media (max-width: 880px) {
  .studio-grid { grid-template-columns: 1fr; gap: var(--s-5); }
  .persona-active { margin-left: 0; width: 100%; }
  .palette-header { flex-wrap: wrap; }
  .palette-footer {
    justify-content: stretch;
    flex-wrap: wrap;
  }
  .palette-footer .chip-btn,
  .palette-footer :deep(.wrap),
  .palette-footer :deep(.chip-btn) {
    flex: 1;
    justify-content: center;
  }
}
@media (max-width: 480px) {
  .studio-grid { gap: var(--s-4); }
  .ctrl { margin-bottom: var(--s-3); }
  .rule-grid { grid-template-columns: repeat(auto-fit, minmax(64px, 1fr)); }
  .palette-footer { gap: 6px; }
}
</style>
