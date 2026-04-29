<script setup lang="ts">
import { ref, computed } from "vue";
import { useLibraryStore } from "@/stores/library";
import { rgbToHex } from "@/services/color";

const lib = useLibraryStore();
const filter = ref<"photo" | "generate">("photo");
const items = computed(() => lib.bySource(filter.value));
</script>

<template>
  <section>
    <div class="library-filters">
      <button
        class="filter-chip"
        :class="{ active: filter === 'photo' }"
        @click="filter = 'photo'"
      >
        Photo <span class="count">{{ lib.bySource("photo").length }}</span>
      </button>
      <button
        class="filter-chip"
        :class="{ active: filter === 'generate' }"
        @click="filter = 'generate'"
      >
        Generate <span class="count">{{ lib.bySource("generate").length }}</span>
      </button>
    </div>

    <div v-if="items.length === 0" class="empty-large">
      <p>No {{ filter }} palettes saved yet.</p>
      <p>save from {{ filter }} to populate this tab</p>
    </div>

    <div v-else class="library-list">
      <div v-for="item in items" :key="item.id" class="library-card">
        <button class="lib-delete" @click="lib.remove(item.id)" aria-label="Delete">×</button>
        <span class="lib-tag">{{ item.source === "generate" ? "Generated" : "Photo" }}</span>
        <img class="lib-thumb" :src="item.thumb" alt="" />
        <div class="lib-swatches">
          <span
            v-for="(p, i) in item.palette"
            :key="i"
            class="lib-sw"
            :style="{ background: rgbToHex(p.rgb[0], p.rgb[1], p.rgb[2]) }"
          />
        </div>
        <div class="lib-meta">
          <span>{{ new Date(item.ts).toISOString().slice(0, 10) }}</span>
          <span class="count-meta">{{ item.palette.length }} swatches</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.library-filters {
  display: flex;
  gap: var(--s-2);
  margin-bottom: var(--s-5);
  flex-wrap: wrap;
}
.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border: 1px solid var(--hairline);
  background: var(--bg);
  color: var(--text-2);
  border-radius: 999px;
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: .08em;
  cursor: pointer;
}
.filter-chip:hover { color: var(--text); border-color: var(--text); }
.filter-chip.active { background: var(--text); color: var(--bg); border-color: var(--text); }
.filter-chip .count {
  font-size: 9px;
  opacity: .7;
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(127, 127, 127, .15);
}
.empty-large {
  text-align: center;
  padding: 80px 20px;
  color: var(--text-3);
  font-family: var(--mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .08em;
}
.empty-large p:first-child {
  color: var(--text);
  font-size: 13px;
  font-family: var(--sans);
  text-transform: none;
  letter-spacing: 0;
  margin-bottom: var(--s-3);
}
.library-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 220px));
  gap: 14px;
  justify-content: start;
}
.library-card {
  position: relative;
  border: 1px solid var(--hairline);
  border-radius: 12px;
  overflow: hidden;
  background: var(--bg);
  transition: transform .15s, box-shadow .15s;
}
.library-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, .08);
}
.lib-thumb {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  display: block;
  border-bottom: 1px solid var(--hairline);
  background: var(--surface-2);
}
.lib-swatches {
  display: flex;
  height: 22px;
}
.lib-sw { flex: 1; height: 100%; }
.lib-meta {
  padding: 8px 12px;
  font-family: var(--mono);
  font-size: 10px;
  color: var(--text-2);
  border-top: 1px solid var(--hairline);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.lib-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 3px 8px;
  background: rgba(255, 255, 255, .85);
  color: #000;
  font-family: var(--mono);
  font-size: 8px;
  text-transform: uppercase;
  letter-spacing: .1em;
  border-radius: 4px;
  z-index: 5;
}
.lib-delete {
  position: absolute;
  top: 8px; right: 8px;
  width: 24px; height: 24px;
  border: none;
  background: rgba(0, 0, 0, .65);
  color: white;
  border-radius: 50%;
  font-size: 14px;
  cursor: pointer;
  opacity: 0;
  transition: opacity .15s;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}
.library-card:hover .lib-delete { opacity: 1; }
.count-meta {
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--text-3);
  font-size: 9px;
}
</style>
