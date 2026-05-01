<script setup lang="ts">
import { computed, ref } from "vue";
import type { Swatch } from "@/types";
import { rgbToHex, rgbToCmyk, textColorFor, wcagContrast, wcagGrade } from "@/services/color";
import { nameForRGB, paletteLabel } from "@/services/colorNames";
import { simulate, type CBMode } from "@/services/colorblind";
import { useProfileStore } from "@/stores/profile";
import { useToastStore } from "@/stores/toast";

const props = defineProps<{ swatch: Swatch; cbMode?: CBMode }>();

const profile = useProfileStore();
const toast = useToastStore();

const flipped = ref(false);

const transformed = computed(() => {
  const t = profile.transform([props.swatch.rgb[0], props.swatch.rgb[1], props.swatch.rgb[2]]);
  const clamped: [number, number, number] = [
    Math.round(Math.max(0, Math.min(255, t[0]))),
    Math.round(Math.max(0, Math.min(255, t[1]))),
    Math.round(Math.max(0, Math.min(255, t[2]))),
  ];
  return props.cbMode && props.cbMode !== "normal" ? simulate(clamped, props.cbMode) : clamped;
});
const hex = computed(() => rgbToHex(...transformed.value).toUpperCase());
const rgbStr = computed(() => transformed.value.join(", "));
const cmyk = computed(() => rgbToCmyk(...transformed.value));
const name = computed(() => nameForRGB(transformed.value));
const desc = computed(() => paletteLabel(props.swatch.L, props.swatch.chroma));
const fg = computed(() => textColorFor(...transformed.value));

const wcag = computed(() => {
  const cW = wcagContrast(transformed.value, [255, 255, 255]);
  const cB = wcagContrast(transformed.value, [0, 0, 0]);
  const best = Math.max(cW, cB);
  return { ratio: best.toFixed(1), grade: wcagGrade(best) };
});

async function copy(text: string, e?: MouseEvent) {
  e?.stopPropagation();
  try {
    await navigator.clipboard.writeText(text);
    toast.show(`Copied ${text}`);
  } catch {
    toast.show("Copy failed");
  }
}

function toggle() {
  flipped.value = !flipped.value;
}
</script>

<template>
  <div
    class="card"
    :class="{ flipped }"
    @click="toggle"
    role="button"
    :aria-label="flipped ? 'Show color' : 'Show details'"
    :title="flipped ? 'Tap to flip back' : 'Tap for details'"
  >
    <div class="inner">
      <!-- FRONT: pure color + hex -->
      <div class="face front" :style="{ background: hex, color: fg }">
        <div class="front-name">{{ name }}</div>
        <div class="front-hex">{{ hex }}</div>
        <div class="front-hint">tap</div>
      </div>

      <!-- BACK: full meta -->
      <div class="face back" :style="{ background: hex, color: fg }">
        <div class="back-overlay"></div>
        <div class="back-content">
          <div class="back-head">
            <span class="back-name">{{ name }}</span>
            <span class="back-flip" @click.stop="toggle" title="Flip back">↺</span>
          </div>

          <div class="meta-list">
            <button class="row" @click.stop="copy(hex, $event)">
              <span class="lbl">HEX</span>
              <span class="val">{{ hex }}</span>
            </button>
            <button class="row" @click.stop="copy(`rgb(${rgbStr})`, $event)">
              <span class="lbl">RGB</span>
              <span class="val">{{ rgbStr }}</span>
            </button>
            <button class="row" @click.stop="copy(`cmyk(${cmyk.join('%, ')}%)`, $event)">
              <span class="lbl">CMYK</span>
              <span class="val">{{ cmyk.join("·") }}</span>
            </button>
          </div>

          <div class="wcag-line">
            <span class="badge mono">WCAG {{ wcag.ratio }}:1</span>
            <span class="badge solid" :class="wcag.grade.toLowerCase().replace('·', '-').replace(/\./g, '')">{{ wcag.grade }}</span>
          </div>

          <div class="back-foot">{{ desc }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  flex: 1;
  position: relative;
  min-width: 0;
  perspective: 1000px;
  cursor: pointer;
  container-type: inline-size;
}
.inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform .55s cubic-bezier(.4, .0, .2, 1);
}
.card.flipped .inner {
  transform: rotateY(180deg);
}

.face {
  position: absolute;
  inset: 0;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* FRONT */
.front {
  justify-content: space-between;
  padding: 12px 10px 10px;
  align-items: flex-start;
}
.front-name {
  font-size: clamp(10px, 6.5cqw, 14px);
  font-weight: 700;
  letter-spacing: -.005em;
  line-height: 1.15;
  background: rgba(0, 0, 0, .14);
  padding: 3px 7px;
  border-radius: 4px;
  align-self: flex-start;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.front-hex {
  font-family: var(--mono);
  font-size: clamp(11px, 7.5cqw, 20px);
  font-weight: 700;
  letter-spacing: -.02em;
  background: rgba(0, 0, 0, .14);
  padding: 3px 6px;
  border-radius: 4px;
  align-self: flex-start;
  margin-top: auto;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.front-hint {
  font-family: var(--mono);
  font-size: 8px;
  letter-spacing: .14em;
  text-transform: uppercase;
  opacity: .55;
  margin-top: 4px;
  align-self: flex-end;
}

/* BACK */
.back {
  transform: rotateY(180deg);
  display: flex;
  flex-direction: column;
}
.back-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, .68);
  pointer-events: none;
}
.back-content {
  position: relative;
  padding: 10px 8px 8px;
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 6px;
  color: #ffffff;
  overflow: hidden;
}
.back-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}
.back-name {
  font-family: var(--sans);
  font-size: clamp(10px, 6.5cqw, 13px);
  font-weight: 700;
  letter-spacing: -.01em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.back-flip {
  font-size: 14px;
  cursor: pointer;
  opacity: .65;
  padding: 1px 5px;
  border-radius: 4px;
  transition: opacity .15s, background .15s;
  flex-shrink: 0;
}
.back-flip:hover { opacity: 1; background: rgba(255, 255, 255, .12); }

.meta-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
}
.row {
  background: rgba(255, 255, 255, .08);
  border: none;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 4px 6px;
  border-radius: 4px;
  cursor: pointer;
  font-family: var(--mono);
  color: #ffffff;
  transition: background .15s;
  min-width: 0;
}
.row:hover { background: rgba(255, 255, 255, .18); }
.lbl {
  font-size: 7px;
  text-transform: uppercase;
  letter-spacing: .14em;
  color: rgba(255, 255, 255, .55);
  font-weight: 500;
}
.val {
  font-size: clamp(9px, 5.5cqw, 11px);
  font-weight: 600;
  letter-spacing: 0;
  word-break: break-all;
  line-height: 1.2;
}

.wcag-line {
  display: flex;
  gap: 3px;
  flex-wrap: wrap;
}
.badge {
  font-family: var(--mono);
  font-size: 8px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 999px;
  letter-spacing: .04em;
  white-space: nowrap;
}
.badge.mono {
  background: rgba(255, 255, 255, .14);
  color: #ffffff;
}
.badge.solid.aaa { background: #2a8a2a; color: #ffffff; }
.badge.solid.aa { background: #4a8a2a; color: #ffffff; }
.badge.solid.aa-lg { background: #b97500; color: #ffffff; }
.badge.solid.fail { background: #c00; color: #ffffff; }

.back-foot {
  font-family: var(--sans);
  font-size: 9px;
  font-style: italic;
  font-weight: 500;
  color: rgba(255, 255, 255, .75);
  letter-spacing: -.005em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@container (max-width: 100px) {
  .back-foot { display: none; }
  .front-hint { display: none; }
  .row { padding: 3px 5px; }
  .lbl { font-size: 6.5px; letter-spacing: .1em; }
}
@container (max-width: 75px) {
  .badge { font-size: 7px; padding: 1px 4px; }
  .back-content { padding: 8px 6px 6px; gap: 4px; }
  .back-flip { font-size: 12px; }
  .meta-list { gap: 2px; }
}
</style>
