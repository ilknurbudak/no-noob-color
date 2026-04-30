<script setup lang="ts">
import { ref, computed } from "vue";
import { hexToRgb, wcagContrast, wcagGrade } from "@/services/color";

const fg = ref("#1a1a1a");
const bg = ref("#f4ecd6");

const ratio = computed(() => wcagContrast(hexToRgb(fg.value), hexToRgb(bg.value)));
const grade = computed(() => wcagGrade(ratio.value));
const passes = computed(() => ({
  AA_normal: ratio.value >= 4.5,
  AA_large: ratio.value >= 3.0,
  AAA_normal: ratio.value >= 7.0,
  AAA_large: ratio.value >= 4.5,
}));
</script>

<template>
  <div class="demo">
    <div class="demo-eyebrow">live · wcag 2.1 contrast</div>
    <div class="preview" :style="{ background: bg, color: fg }">
      <div class="big">The quick brown fox</div>
      <div class="small">jumps over the lazy dog at 14px regular weight</div>
    </div>
    <div class="row">
      <label>
        <span class="lbl">Text</span>
        <input type="color" v-model="fg" />
        <span class="hex">{{ fg.toUpperCase() }}</span>
      </label>
      <label>
        <span class="lbl">Background</span>
        <input type="color" v-model="bg" />
        <span class="hex">{{ bg.toUpperCase() }}</span>
      </label>
      <div class="ratio">
        <div class="r">{{ ratio.toFixed(2) }}<span>:1</span></div>
        <div class="grade" :class="grade.toLowerCase().replace('·', '-')">{{ grade }}</div>
      </div>
    </div>
    <div class="badges">
      <span class="badge" :class="{ pass: passes.AA_normal }">AA · normal</span>
      <span class="badge" :class="{ pass: passes.AA_large }">AA · large</span>
      <span class="badge" :class="{ pass: passes.AAA_normal }">AAA · normal</span>
      <span class="badge" :class="{ pass: passes.AAA_large }">AAA · large</span>
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
.preview {
  border-radius: 10px;
  padding: 22px 18px;
  margin-bottom: var(--s-3);
  transition: background .12s, color .12s;
}
.preview .big {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -.01em;
  margin-bottom: 6px;
}
.preview .small {
  font-size: 13px;
  opacity: .9;
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
.hex {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--text-2);
  letter-spacing: .04em;
}
.ratio { margin-left: auto; display: flex; align-items: baseline; gap: 10px; }
.ratio .r {
  font-family: var(--mono);
  font-size: 28px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -.02em;
}
.ratio .r span { font-size: 14px; opacity: .55; }
.grade {
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 4px;
  letter-spacing: .06em;
  background: var(--surface-2);
  color: var(--text-2);
}
.grade.aaa { background: #0a0a0a; color: #fff; }
.grade.aa { background: #1f1f1f; color: #fff; }
.grade.aa-lg { background: #4a4a4a; color: #fff; }
.grade.fail { background: #c00; color: #fff; }
.badges { display: flex; gap: 6px; flex-wrap: wrap; }
.badge {
  font-family: var(--mono);
  font-size: 9px;
  padding: 4px 9px;
  border-radius: 4px;
  border: 1px solid var(--hairline);
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: .06em;
}
.badge.pass { background: var(--text); color: var(--bg); border-color: var(--text); }
</style>
