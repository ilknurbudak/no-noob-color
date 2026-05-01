<script setup lang="ts">
import { computed, ref } from "vue";
import { useLibraryStore } from "@/stores/library";
import { useAuthStore } from "@/stores/auth";
import { rgbToHex, hexToRgb, wcagContrast } from "@/services/color";

const lib = useLibraryStore();
const auth = useAuthStore();
const query = ref("");
const onlyStarred = ref(false);

function normalizeHex(h: string): string {
  return h.replace(/[^0-9a-f]/gi, "").toLowerCase();
}

function matchesQuery(item: typeof lib.items[number], q: string): boolean {
  if (!q) return true;
  const lower = q.toLowerCase().trim();
  const hexClean = normalizeHex(lower);

  // Hex needle (3 or 6 char prefix)
  if (hexClean.length >= 3) {
    const palHexes = item.palette.map(p =>
      rgbToHex(p.rgb[0], p.rgb[1], p.rgb[2]).slice(1).toLowerCase()
    );
    if (palHexes.some(h => h.startsWith(hexClean) || h.includes(hexClean))) return true;
  }

  // Source filter (photo, generate, etc.)
  if (item.source && item.source.toLowerCase().includes(lower)) return true;

  // Name (if present in future)
  if ((item as any).name && (item as any).name.toLowerCase().includes(lower)) return true;

  // Date prefix (e.g. "2026-05")
  if (lower.match(/^\d{4}/)) {
    const d = new Date(item.ts).toISOString().slice(0, 10);
    if (d.startsWith(lower)) return true;
  }

  return false;
}

const items = computed(() => lib.items
  .filter(i => matchesQuery(i, query.value))
  .filter(i => !onlyStarred.value || lib.isStarred(i.id))
);

function clearQuery() { query.value = ""; }
</script>

<template>
  <section>
    <div class="library-filters">
      <div class="search-wrap">
        <input
          v-model="query"
          class="search-input"
          type="text"
          placeholder="search · hex (#7a4 / 7a4b8a) · source · date (2026-05)"
        />
        <button v-if="query" class="search-clear" @click="clearQuery" aria-label="Clear">×</button>
      </div>
      <button
        class="filter-pill"
        :class="{ active: onlyStarred }"
        @click="onlyStarred = !onlyStarred"
      >
        <span class="star">★</span> starred only
      </button>
      <span class="library-count">
        <strong>{{ items.length }}</strong>
        <template v-if="query || onlyStarred">/ {{ lib.items.length }} </template>
        {{ items.length === 1 ? "palette" : "palettes" }}
      </span>
      <span class="sync-state" :class="{ remote: lib.isRemote, syncing: lib.syncing }">
        <span class="dot"></span>
        <template v-if="lib.syncing">syncing</template>
        <template v-else-if="lib.isRemote">cloud · {{ auth.user?.email.split("@")[0] }}</template>
        <template v-else>local only</template>
      </span>
    </div>

    <div v-if="items.length === 0 && !query" class="empty-large">
      <p>No palettes saved yet.</p>
      <p>generate or drop a reference image, then save</p>
    </div>

    <div v-else-if="items.length === 0 && query" class="empty-large">
      <p>No matches for "{{ query }}"</p>
      <p>try a hex prefix, source name, or date</p>
    </div>

    <div v-else class="library-list">
      <div v-for="item in items" :key="item.id" class="library-card">
        <button class="lib-delete" @click="lib.remove(item.id)" aria-label="Delete">×</button>
        <button
          class="lib-star"
          :class="{ active: lib.isStarred(item.id) }"
          @click="lib.toggleStar(item.id)"
          :aria-label="lib.isStarred(item.id) ? 'Unstar' : 'Star'"
        >★</button>
        <img v-if="item.thumb" class="lib-thumb" :src="item.thumb" alt="" />
        <div v-else class="lib-thumb-fallback"></div>
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
.search-wrap {
  position: relative;
  flex: 1;
  min-width: 200px;
  max-width: 380px;
}
.search-input {
  width: 100%;
  border: 1px solid var(--hairline);
  background: var(--bg);
  color: var(--text);
  padding: 8px 30px 8px 12px;
  border-radius: 999px;
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: .04em;
}
.search-input:focus { outline: none; border-color: var(--text); }
.search-input::placeholder { color: var(--text-3); }
.search-clear {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 22px; height: 22px;
  border: none;
  background: var(--surface-2);
  color: var(--text-2);
  border-radius: 50%;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
.search-clear:hover { background: var(--text); color: var(--bg); }

.filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border: 1px solid var(--hairline);
  background: var(--bg);
  color: var(--text-2);
  border-radius: 999px;
  font-family: var(--mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .08em;
  cursor: pointer;
  transition: background .15s, color .15s, border-color .15s;
}
.filter-pill:hover { color: var(--text); border-color: var(--text); }
.filter-pill.active { background: var(--text); color: var(--bg); border-color: var(--text); }
.filter-pill .star { font-size: 11px; line-height: 1; }

.library-count {
  font-family: var(--mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .12em;
  color: var(--text-2);
}
.library-count strong {
  color: var(--text);
  font-weight: 700;
}
.sync-state {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--mono);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: .1em;
  color: var(--text-3);
}
.sync-state .dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--text-3);
}
.sync-state.remote .dot { background: #2db573; }
.sync-state.syncing .dot {
  background: var(--text-2);
  animation: syncPulse 1s infinite;
}
@keyframes syncPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .3; }
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
.lib-thumb,
.lib-thumb-fallback {
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
.lib-star {
  position: absolute;
  top: 8px; left: 8px;
  width: 28px; height: 28px;
  border: none;
  background: rgba(0, 0, 0, .55);
  color: rgba(255, 255, 255, .4);
  border-radius: 50%;
  font-size: 14px;
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity .15s, color .15s;
  opacity: 0;
}
.library-card:hover .lib-star { opacity: 1; }
.lib-star.active { opacity: 1; color: #ffd400; }
.lib-star:hover { color: #ffd400; }
.count-meta {
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--text-3);
  font-size: 9px;
}
</style>
