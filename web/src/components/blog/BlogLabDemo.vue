<script setup lang="ts">
import { ref, computed } from "vue";
import { rgbToLab, rgbToHex } from "@/services/color";

const r = ref(122);
const g = ref(75);
const b = ref(138);

const hex = computed(() => rgbToHex(r.value, g.value, b.value));
const lab = computed(() => rgbToLab(r.value, g.value, b.value));
const Lstr = computed(() => lab.value[0].toFixed(1));
const aStr = computed(() => lab.value[1].toFixed(1));
const bStr = computed(() => lab.value[2].toFixed(1));
</script>

<template>
  <div class="demo">
    <div class="demo-eyebrow">live · rgb → cielab</div>
    <div class="demo-grid">
      <div class="swatch" :style="{ background: hex }">
        <span class="hex">{{ hex.toUpperCase() }}</span>
      </div>
      <div class="controls">
        <label>
          <span class="lbl">R · {{ r }}</span>
          <input type="range" min="0" max="255" v-model.number="r" class="slider r" />
        </label>
        <label>
          <span class="lbl">G · {{ g }}</span>
          <input type="range" min="0" max="255" v-model.number="g" class="slider g" />
        </label>
        <label>
          <span class="lbl">B · {{ b }}</span>
          <input type="range" min="0" max="255" v-model.number="b" class="slider b" />
        </label>
        <div class="lab">
          <div><span class="k">L*</span><span class="v">{{ Lstr }}</span></div>
          <div><span class="k">a*</span><span class="v">{{ aStr }}</span></div>
          <div><span class="k">b*</span><span class="v">{{ bStr }}</span></div>
        </div>
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
.demo-grid {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: var(--s-5);
  align-items: stretch;
}
.swatch {
  border-radius: 10px;
  position: relative;
  min-height: 180px;
  display: flex;
  align-items: flex-end;
  padding: 12px;
  transition: background .12s;
}
.hex {
  font-family: var(--mono);
  font-size: 11px;
  color: rgba(255, 255, 255, .85);
  background: rgba(0, 0, 0, .35);
  padding: 3px 6px;
  border-radius: 4px;
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
.slider { width: 100%; accent-color: var(--text); height: 4px; }
.lab {
  display: flex;
  gap: 14px;
  margin-top: var(--s-2);
  padding-top: var(--s-3);
  border-top: 1px dashed var(--hairline);
}
.lab > div { display: flex; flex-direction: column; gap: 2px; }
.lab .k {
  font-family: var(--mono);
  font-size: 9px;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: .1em;
}
.lab .v {
  font-family: var(--mono);
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
}
@media (max-width: 600px) {
  .demo-grid { grid-template-columns: 1fr; }
  .swatch { min-height: 120px; }
}
</style>
