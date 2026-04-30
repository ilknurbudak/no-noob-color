<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { hsvToRgb, rgbToHex } from "@/services/color";
import type { RGB } from "@/types";
import { useTasteStore } from "@/stores/taste";

const taste = useTasteStore();

const POOL_SIZE = 30;
const TARGET_VOTES = 12;

function randomColor(): RGB {
  const h = Math.random() * 360;
  const s = 0.25 + Math.random() * 0.7;
  const v = 0.25 + Math.random() * 0.7;
  return hsvToRgb(h, s, v);
}

const pool = ref<RGB[]>([]);
const idx = ref(0);
const sessionVotes = ref(0);

const current = computed(() => pool.value[idx.value]);
const hex = computed(() => current.value ? rgbToHex(...current.value) : "#000");
const done = computed(() => sessionVotes.value >= TARGET_VOTES || idx.value >= pool.value.length);

function regenerate() {
  pool.value = Array.from({ length: POOL_SIZE }, randomColor);
  idx.value = 0;
  sessionVotes.value = 0;
}

function rate(liked: boolean) {
  if (!current.value) return;
  taste.vote(current.value, liked);
  sessionVotes.value += 1;
  idx.value += 1;
}

onMounted(() => {
  if (!pool.value.length) regenerate();
});

const progress = computed(() => Math.min(100, (sessionVotes.value / TARGET_VOTES) * 100));
</script>

<template>
  <div class="taste">
    <div class="taste-head">
      <div class="eyebrow">Taste training</div>
      <div class="hint">
        Like or skip {{ TARGET_VOTES }} colors — your future palettes adapt.
      </div>
    </div>

    <div v-if="!done" class="card-stack">
      <div class="card" :style="{ background: hex }">
        <div class="hex">{{ hex.toUpperCase() }}</div>
      </div>
      <div class="actions">
        <button class="act skip" @click="rate(false)" aria-label="Skip">
          <svg viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round">
            <path d="M6 6 L18 18 M18 6 L6 18" />
          </svg>
        </button>
        <button class="act like" @click="rate(true)" aria-label="Like">
          <svg viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 21s-7-4.5-9.5-9.5C0.5 7 4 3 8 3c2.5 0 4 2 4 2s1.5-2 4-2c4 0 7.5 4 5.5 8.5C19 16.5 12 21 12 21z" />
          </svg>
        </button>
      </div>
      <div class="progress">
        <div class="bar" :style="{ width: progress + '%' }"></div>
      </div>
      <div class="meta">
        <span>{{ sessionVotes }} / {{ TARGET_VOTES }} this session</span>
        <span>·</span>
        <span>{{ taste.sampleCount }} likes total</span>
      </div>
    </div>

    <div v-else class="done">
      <div class="check">✓</div>
      <div class="msg">Profile updated.</div>
      <div class="meta">{{ taste.sampleCount }} likes informing future palettes.</div>
      <div class="done-actions">
        <button class="act-text" @click="regenerate">train more</button>
        <button class="act-text danger" @click="taste.reset(); regenerate()">reset profile</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.taste {
  border: 1px solid var(--hairline);
  border-radius: 14px;
  padding: var(--s-5);
  background: var(--bg);
}
.taste-head { margin-bottom: var(--s-4); }
.eyebrow {
  font-family: var(--mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .14em;
  color: var(--text-3);
  margin-bottom: 6px;
}
.hint {
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.5;
}

.card-stack { display: flex; flex-direction: column; align-items: center; gap: var(--s-4); }
.card {
  width: 100%;
  max-width: 320px;
  height: 280px;
  border-radius: 16px;
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  padding: 16px;
  transition: background .25s cubic-bezier(.2,.8,.2,1);
  box-shadow: 0 12px 32px rgba(0,0,0,.08);
}
.hex {
  font-family: var(--mono);
  font-size: 11px;
  color: rgba(255, 255, 255, .9);
  background: rgba(0, 0, 0, .35);
  padding: 4px 8px;
  border-radius: 4px;
  letter-spacing: .04em;
}

.actions { display: flex; gap: var(--s-4); }
.act {
  width: 56px; height: 56px;
  border: 1px solid var(--hairline);
  background: var(--bg);
  border-radius: 50%;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text);
  transition: transform .12s, border-color .15s, background .15s;
}
.act:hover { transform: scale(1.05); }
.act.skip:hover { border-color: #c00; color: #c00; }
.act.like:hover { border-color: #2db573; color: #2db573; }
.act svg { width: 22px; height: 22px; }

.progress {
  width: 100%;
  max-width: 320px;
  height: 3px;
  background: var(--surface-2);
  border-radius: 999px;
  overflow: hidden;
}
.bar {
  height: 100%;
  background: var(--text);
  transition: width .3s ease;
}

.meta {
  font-family: var(--mono);
  font-size: 9px;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: .1em;
  display: flex;
  gap: 6px;
}

.done {
  text-align: center;
  padding: var(--s-5) 0;
}
.done .check {
  font-size: 36px;
  color: #2db573;
  font-weight: 200;
  margin-bottom: var(--s-3);
}
.done .msg {
  font-family: var(--sans);
  font-size: 18px;
  font-weight: 700;
  font-style: italic;
  margin-bottom: var(--s-2);
}
.done-actions { margin-top: var(--s-4); display: flex; gap: var(--s-3); justify-content: center; }
.act-text {
  border: none;
  background: transparent;
  color: var(--text-2);
  font-family: var(--mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .1em;
  cursor: pointer;
  padding: 6px 10px;
  border-bottom: 1px solid var(--hairline);
}
.act-text:hover { color: var(--text); border-color: var(--text); }
.act-text.danger:hover { color: #c00; border-color: #c00; }
</style>
