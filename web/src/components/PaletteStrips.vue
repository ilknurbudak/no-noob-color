<script setup lang="ts">
import type { Swatch } from "@/types";
import PaletteStrip from "./PaletteStrip.vue";

defineProps<{
  palette: Swatch[];
  emptyMessage?: string;
  emptyMini?: string[];
  emptyTag?: string;
}>();
</script>

<template>
  <div class="palette-strips">
    <template v-if="palette.length">
      <PaletteStrip v-for="(sw, i) in palette" :key="i" :swatch="sw" />
    </template>
    <div v-else class="palette-empty">
      <div v-if="emptyMini" class="palette-empty-mini">
        <span v-for="(c, i) in emptyMini" :key="i" :style="{ background: c }" />
      </div>
      <div v-if="emptyTag" class="palette-empty-tag">{{ emptyTag }}</div>
      <div v-if="emptyMessage" class="palette-empty-message">{{ emptyMessage }}</div>
    </div>
  </div>
</template>

<style scoped>
.palette-strips {
  display: flex;
  width: 100%;
  height: 460px;
  border: 1px solid var(--hairline);
  border-radius: 14px;
  overflow: hidden;
  position: relative;
}
.palette-empty {
  width: 100%;
  align-self: center;
  text-align: center;
  padding: var(--s-7) var(--s-5);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--s-3);
}
.palette-empty-mini { display: flex; gap: 4px; margin-bottom: var(--s-2); }
.palette-empty-mini span {
  width: 32px; height: 40px; border-radius: 4px; display: block;
}
.palette-empty-tag {
  font-family: var(--mono);
  font-size: 9px;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: .12em;
}
.palette-empty-message {
  color: var(--text-2);
  font-size: 12px;
  line-height: 1.5;
  max-width: 280px;
}
@media (max-width: 720px) {
  .palette-strips {
    overflow-x: auto;
    height: 400px;
    scrollbar-width: none;
  }
  .palette-strips::-webkit-scrollbar { display: none; }
  .palette-strips :deep(.strip) { flex: 0 0 140px; min-width: 140px; }
}
</style>
