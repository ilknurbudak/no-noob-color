<script setup lang="ts">
import { ref, computed } from "vue";
import { hsvToRgb, rgbToHex } from "@/services/color";

const hue = ref(200);
const sat = ref(0.7);
const val = ref(0.85);

const rgb = computed(() => hsvToRgb(hue.value, sat.value, val.value));
const hex = computed(() => rgbToHex(...rgb.value));

const hueStrip = computed(() => {
  const stops: string[] = [];
  for (let h = 0; h < 360; h += 30) {
    stops.push(rgbToHex(...hsvToRgb(h, sat.value, val.value)));
  }
  return `linear-gradient(to right, ${stops.join(", ")})`;
});
</script>

<template>
  <div class="demo">
    <div class="demo-eyebrow">live · hsv picker</div>
    <div class="hue-grid">
      <div class="swatch" :style="{ background: hex }">
        <span class="hex">{{ hex.toUpperCase() }}</span>
        <span class="hsv">hsv({{ Math.round(hue) }}°, {{ Math.round(sat * 100) }}%, {{ Math.round(val * 100) }}%)</span>
      </div>
      <div class="controls">
        <label>
          <span class="lbl">Hue · {{ Math.round(hue) }}°</span>
          <div class="hue-track" :style="{ background: hueStrip }">
            <input type="range" min="0" max="359" v-model.number="hue" class="hue-slider" />
          </div>
        </label>
        <label>
          <span class="lbl">Saturation · {{ Math.round(sat * 100) }}%</span>
          <input type="range" min="0" max="1" step="0.01" v-model.number="sat" class="slider" />
        </label>
        <label>
          <span class="lbl">Value · {{ Math.round(val * 100) }}%</span>
          <input type="range" min="0" max="1" step="0.01" v-model.number="val" class="slider" />
        </label>
      </div>
    </div>
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
.hue-grid {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: var(--s-5);
  align-items: stretch;
}
.swatch {
  border-radius: 10px;
  min-height: 200px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 6px;
  transition: background .12s;
}
.hex {
  font-family: var(--mono);
  font-size: 11px;
  color: rgba(255, 255, 255, .9);
  background: rgba(0, 0, 0, .35);
  padding: 3px 6px;
  border-radius: 4px;
  align-self: flex-start;
  letter-spacing: .04em;
}
.hsv {
  font-family: var(--mono);
  font-size: 9px;
  color: rgba(255, 255, 255, .75);
  background: rgba(0, 0, 0, .25);
  padding: 2px 6px;
  border-radius: 4px;
  align-self: flex-start;
  letter-spacing: .04em;
}
.controls { display: flex; flex-direction: column; gap: var(--s-3); }
.controls label { display: flex; flex-direction: column; gap: 4px; }
.lbl {
  font-family: var(--mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: var(--text-2);
}
.hue-track {
  position: relative;
  border-radius: 4px;
  height: 16px;
}
.hue-slider {
  position: absolute;
  inset: 0;
  width: 100%;
  margin: 0;
  background: transparent;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
}
.hue-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px; height: 22px;
  border-radius: 3px;
  background: var(--bg);
  border: 2px solid var(--text);
  cursor: grab;
}
.hue-slider::-moz-range-thumb {
  width: 12px; height: 22px;
  border-radius: 3px;
  background: var(--bg);
  border: 2px solid var(--text);
  cursor: grab;
}
.slider { width: 100%; accent-color: var(--text); height: 4px; }
@media (max-width: 600px) {
  .hue-grid { grid-template-columns: 1fr; }
  .swatch { min-height: 140px; }
}
</style>
