<script setup lang="ts">
import { computed } from "vue";
import type { Swatch } from "@/types";
import { rgbToHex, rgbToCmyk, textColorFor, wcagContrast, wcagGrade } from "@/services/color";
import { nameForRGB, paletteLabel } from "@/services/colorNames";
import { useProfileStore } from "@/stores/profile";
import { useToastStore } from "@/stores/toast";

const props = defineProps<{ swatch: Swatch }>();

const profile = useProfileStore();
const toast = useToastStore();

const transformed = computed(() => {
  const t = profile.transform([props.swatch.rgb[0], props.swatch.rgb[1], props.swatch.rgb[2]]);
  return [
    Math.round(Math.max(0, Math.min(255, t[0]))),
    Math.round(Math.max(0, Math.min(255, t[1]))),
    Math.round(Math.max(0, Math.min(255, t[2]))),
  ] as [number, number, number];
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

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.show(`Copied ${text}`);
  } catch {
    toast.show("Copy failed");
  }
}
</script>

<template>
  <div class="strip" :style="{ background: hex, color: fg }">
    <div class="strip-top">
      <div class="strip-name">{{ name }}</div>
      <div class="strip-meta">
        RGB:
        <span class="copyable" @click="copy(`rgb(${rgbStr})`)">{{ rgbStr }}</span>
      </div>
      <div class="strip-meta">
        CMYK:
        <span class="copyable" @click="copy(`cmyk(${cmyk[0]}%, ${cmyk[1]}%, ${cmyk[2]}%, ${cmyk[3]}%)`)">
          {{ cmyk.join(", ") }}
        </span>
      </div>
      <div class="strip-meta">
        HEX:
        <span class="copyable" @click="copy(hex)">{{ hex }}</span>
      </div>
      <div class="wcag-line">
        <span class="strip-meta">WCAG {{ wcag.ratio }}:1</span>
        <span class="wcag-badge">{{ wcag.grade }}</span>
      </div>
    </div>
    <div class="strip-hex-big copyable" @click="copy(hex)">{{ hex }}</div>
    <div class="strip-bottom">{{ desc }}</div>
  </div>
</template>

<style scoped>
.strip {
  flex: 1;
  position: relative;
  padding: 18px 14px 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  min-width: 0;
  container-type: inline-size;
}
.strip-top { z-index: 2; position: relative; }
.strip-name {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: -.005em;
  margin-bottom: 8px;
  line-height: 1.15;
}
.strip-meta {
  font-family: var(--mono);
  font-size: 9px;
  line-height: 1.55;
  letter-spacing: .02em;
  opacity: .85;
}
.strip-hex-big {
  position: absolute;
  left: 50%;
  top: 62%;
  transform: translate(-50%, -50%) rotate(-90deg);
  font-family: var(--mono);
  font-size: clamp(14px, 11cqw, 42px);
  font-weight: 700;
  white-space: nowrap;
  letter-spacing: -.04em;
  z-index: 1;
  opacity: .92;
  cursor: pointer;
}
.strip-bottom {
  z-index: 2;
  position: relative;
  font-size: 11px;
  font-style: italic;
  font-weight: 500;
  letter-spacing: -.005em;
}
.copyable {
  cursor: pointer;
  transition: opacity .15s;
  border-radius: 3px;
  padding: 0 2px;
  margin: 0 -2px;
}
.copyable:hover { opacity: .55; }
.wcag-line {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-top: 6px;
  z-index: 2;
  position: relative;
}
.wcag-line .strip-meta {
  background: rgba(0,0,0,.06);
  padding: 1px 5px;
  border-radius: 3px;
}
.wcag-line .wcag-badge {
  font-size: 8px;
  font-weight: 700;
  padding: 2px 5px;
  border-radius: 3px;
  background: rgba(0,0,0,.18);
  letter-spacing: .04em;
  color: inherit;
}
</style>
