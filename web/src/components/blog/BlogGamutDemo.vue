<script setup lang="ts">
import { ref, computed } from "vue";
import { hexToRgb, rgbToCmyk, rgbToHex } from "@/services/color";

const seed = ref("#ff6b1a");
const seedRgb = computed(() => hexToRgb(seed.value));
const cmyk = computed(() => rgbToCmyk(...seedRgb.value));

function naivePrint(rgb: [number, number, number]): [number, number, number] {
  const c = rgbToCmyk(...rgb);
  const k = c[3] / 100;
  return [
    Math.round(255 * (1 - c[0] / 100) * (1 - k)),
    Math.round(255 * (1 - c[1] / 100) * (1 - k)),
    Math.round(255 * (1 - c[2] / 100) * (1 - k)),
  ];
}
const printPreview = computed(() => rgbToHex(...naivePrint(seedRgb.value)));

const presets = ["#ff6b1a", "#00d9ff", "#ff00ff", "#7a4b8a", "#ffe600"];
</script>

<template>
  <div class="demo">
    <div class="demo-eyebrow">live · screen vs print preview</div>
    <div class="gamut-row">
      <div>
        <div class="micro">screen · srgb</div>
        <div class="cell" :style="{ background: seed }">
          <span>{{ seed.toUpperCase() }}</span>
        </div>
        <div class="caption">rgb({{ seedRgb.join(", ") }})</div>
      </div>
      <div class="arrow">→</div>
      <div>
        <div class="micro">print · cmyk roundtrip</div>
        <div class="cell" :style="{ background: printPreview }">
          <span>{{ printPreview.toUpperCase() }}</span>
        </div>
        <div class="caption">cmyk({{ cmyk.join("%, ") }}%)</div>
      </div>
    </div>
    <div class="row">
      <label>
        <span class="lbl">Seed</span>
        <input type="color" v-model="seed" />
        <input type="text" v-model="seed" maxlength="7" class="hex-input" />
      </label>
      <div class="presets">
        <button
          v-for="p in presets"
          :key="p"
          :style="{ background: p }"
          :class="{ active: p === seed }"
          @click="seed = p"
          aria-label="Preset"
        ></button>
      </div>
    </div>
    <p class="note">
      Vibrant screen colors (especially neon orange, magenta, cyan) compress when
      they hit a CMYK printer's gamut. The right-side cell shows what your shop
      will actually run if no profile correction is applied.
    </p>
  </div>
</template>

<style scoped>
.demo {
  border: 1px solid var(--hairline);
  border-radius: 14px;
  padding: var(--s-5);
  background: var(--bg);
  margin: var(--s-5) 0;
}
.demo-eyebrow {
  font-family: var(--mono);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: .14em;
  color: var(--text-3);
  margin-bottom: var(--s-3);
}
.gamut-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: var(--s-3);
  align-items: center;
  margin-bottom: var(--s-4);
}
.gamut-row > div { min-width: 0; }
.cell {
  border-radius: 8px;
  height: 110px;
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  padding: 10px;
  transition: background .12s;
}
.cell span {
  font-family: var(--mono);
  font-size: 10px;
  color: rgba(255, 255, 255, .9);
  background: rgba(0, 0, 0, .35);
  padding: 2px 6px;
  border-radius: 3px;
  letter-spacing: .04em;
}
.micro {
  font-family: var(--mono);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: .12em;
  color: var(--text-3);
  margin-bottom: 6px;
}
.caption {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--text-2);
  margin-top: 8px;
  letter-spacing: .04em;
}
.arrow {
  font-family: var(--mono);
  font-size: 22px;
  color: var(--text-3);
  text-align: center;
  padding-top: 30px;
}
.row {
  display: flex;
  gap: var(--s-4);
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: var(--s-3);
}
.row label { display: flex; align-items: center; gap: 8px; }
.lbl {
  font-family: var(--mono);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: .1em;
  color: var(--text-3);
}
.row input[type=color] {
  width: 38px; height: 28px;
  padding: 2px;
  border: 1px solid var(--hairline);
  border-radius: 6px;
  background: var(--bg);
  cursor: pointer;
}
.hex-input {
  width: 84px;
  font-family: var(--mono);
  font-size: 11px;
  padding: 6px 8px;
  border: 1px solid var(--hairline);
  background: var(--bg);
  color: var(--text);
  border-radius: 6px;
  text-transform: uppercase;
}
.presets { display: flex; gap: 5px; }
.presets button {
  width: 24px; height: 24px;
  border: 1px solid var(--hairline);
  border-radius: 999px;
  cursor: pointer;
  padding: 0;
}
.presets button.active { box-shadow: 0 0 0 2px var(--text); }
.note {
  font-size: 12px;
  color: var(--text-2);
  line-height: 1.55;
  margin: 0;
}
@media (max-width: 600px) {
  .gamut-row { grid-template-columns: 1fr; }
  .arrow { transform: rotate(90deg); padding: 0; }
}
</style>
