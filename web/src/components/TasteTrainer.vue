<script setup lang="ts">
import { ref, computed } from "vue";
import { useTasteStore, trainingSwatches } from "@/stores/taste";
import { textColorFor, hexToRgb } from "@/services/color";

const taste = useTasteStore();
const swatches = trainingSwatches();
const idx = ref(0);
const done = ref(false);

const current = computed(() => swatches[idx.value]);

function advance() {
  if (idx.value >= swatches.length - 1) { done.value = true; return; }
  idx.value++;
}

function like() { taste.like(current.value.hex); advance(); }
function skip() { taste.skip(current.value.hex); advance(); }

function restart() {
  taste.reset();
  idx.value = 0;
  done.value = false;
}

const fg = computed(() => current.value ? textColorFor(...hexToRgb(current.value.hex)) : "#000");
</script>

<template>
  <div class="trainer">
    <div class="trainer-head">
      <span class="eyebrow">Taste training</span>
      <span class="counter">
        <template v-if="!done">{{ idx + 1 }} / {{ swatches.length }}</template>
        <template v-else>done · {{ taste.state.count }} liked</template>
      </span>
    </div>

    <div v-if="!done" class="card" :style="{ background: current.hex, color: fg }">
      <div class="prompt">do you like this?</div>
      <div class="hex">{{ current.hex.toUpperCase() }}</div>
    </div>

    <div v-else class="card done">
      <div class="prompt">trained</div>
      <p>Generate now uses your taste profile as an additional bias.</p>
    </div>

    <div class="actions">
      <template v-if="!done">
        <button class="btn skip" @click="skip">skip</button>
        <button class="btn like" @click="like">like</button>
      </template>
      <button v-else class="btn ghost" @click="restart">retrain</button>
    </div>
  </div>
</template>

<style scoped>
.trainer {
  border: 1px solid var(--hairline);
  border-radius: 14px;
  padding: var(--s-4);
  background: var(--bg);
}
.trainer-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--s-3);
}
.eyebrow {
  font-family: var(--mono);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: .14em;
  color: var(--text-3);
}
.counter {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--text-2);
  letter-spacing: .04em;
}
.card {
  border-radius: 10px;
  padding: var(--s-5) var(--s-4);
  min-height: 160px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: background .12s, color .12s;
}
.card.done {
  background: var(--surface-2);
  color: var(--text);
}
.card.done p {
  font-size: 12px;
  color: var(--text-2);
  margin: 0;
  line-height: 1.5;
}
.prompt {
  font-family: var(--mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .1em;
  opacity: .8;
}
.hex {
  font-family: var(--mono);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -.01em;
}
.actions {
  margin-top: var(--s-3);
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.btn {
  padding: 8px 16px;
  border: 1px solid var(--hairline);
  background: var(--bg);
  color: var(--text);
  border-radius: 999px;
  font-family: var(--mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .08em;
  cursor: pointer;
  transition: background .15s, color .15s, border-color .15s;
}
.btn:hover { border-color: var(--text); }
.btn.like {
  background: var(--text);
  color: var(--bg);
  border-color: var(--text);
}
.btn.like:hover { opacity: .85; }
.btn.skip { color: var(--text-2); }
.btn.ghost { font-size: 9px; }
</style>
