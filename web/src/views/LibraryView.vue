<script setup lang="ts">
import { computed, ref } from "vue";
import { useLibraryStore } from "@/stores/library";
import { useAuthStore } from "@/stores/auth";
import { useTasteStore } from "@/stores/taste";
import { rgbToHex, textColorFor, hexToRgb } from "@/services/color";
import { useToastStore } from "@/stores/toast";

const lib = useLibraryStore();
const auth = useAuthStore();
const taste = useTasteStore();
const toast = useToastStore();
const query = ref("");
const onlyStarred = ref(false);
const activeFolder = ref<string | null>(null);
const activeTag = ref<string | null>(null);
const tab = ref<"palettes" | "liked">("palettes");
const editingTagsFor = ref<string | null>(null);
const newTagInput = ref("");
const newFolderName = ref("");
const showFolderManager = ref(false);

function openTagsFor(id: string) {
  editingTagsFor.value = editingTagsFor.value === id ? null : id;
  newTagInput.value = "";
}

function commitTag(id: string) {
  const t = newTagInput.value.trim();
  if (!t) return;
  lib.addTag(id, t);
  newTagInput.value = "";
}

function makeFolder() {
  const name = newFolderName.value.trim();
  if (!name) return;
  lib.createFolder(name);
  newFolderName.value = "";
}

function exportLibrary() {
  const json = lib.exportAll();
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nnc-library-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast.show("Library exported");
}

function importLibrary(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const result = lib.importAll(reader.result as string);
      toast.show(`Imported ${result.added} (${result.skipped} duplicate)`);
    } catch (err: any) {
      toast.show(err.message || "Import failed");
    }
  };
  reader.readAsText(file);
  (e.target as HTMLInputElement).value = "";
}

// DIFF MODE
const diffMode = ref(false);
const selectedForDiff = ref<string[]>([]);

function toggleDiff(id: string) {
  if (selectedForDiff.value.includes(id)) {
    selectedForDiff.value = selectedForDiff.value.filter(x => x !== id);
  } else if (selectedForDiff.value.length < 2) {
    selectedForDiff.value = [...selectedForDiff.value, id];
  } else {
    selectedForDiff.value = [selectedForDiff.value[1], id];
  }
}

const diffPair = computed(() => {
  if (selectedForDiff.value.length !== 2) return null;
  const a = lib.items.find(i => i.id === selectedForDiff.value[0]);
  const b = lib.items.find(i => i.id === selectedForDiff.value[1]);
  if (!a || !b) return null;
  return { a, b };
});

function paletteDistance(a: typeof lib.items[number], b: typeof lib.items[number]): number {
  // Average ΔLab between sorted Lab values
  const labA = a.palette.map(p => {
    const [r, g, bl] = p.rgb;
    return { r, g, b: bl };
  });
  const labB = b.palette.map(p => {
    const [r, g, bl] = p.rgb;
    return { r, g, b: bl };
  });
  const minLen = Math.min(labA.length, labB.length);
  if (!minLen) return 0;
  // Greedy match: for each in a, find nearest in b
  let total = 0;
  for (const sa of labA) {
    let min = Infinity;
    for (const sb of labB) {
      const d = Math.sqrt((sa.r-sb.r)**2 + (sa.g-sb.g)**2 + (sa.b-sb.b)**2);
      if (d < min) min = d;
    }
    total += min;
  }
  return total / labA.length;
}

async function shareLink(item: typeof lib.items[number]) {
  const hexes = item.palette.map(p =>
    rgbToHex(p.rgb[0], p.rgb[1], p.rgb[2]).slice(1).toLowerCase()
  );
  const name = (item as any).name || `palette-${item.id.slice(0, 6)}`;
  const slug = `${encodeURIComponent(name)}~${hexes.join("-")}`;
  const url = `${window.location.origin}${window.location.pathname}#/share/${slug}`;
  try {
    await navigator.clipboard.writeText(url);
    toast.show("Share link copied");
  } catch { toast.show("Copy failed"); }
}

async function copyHex(hex: string) {
  try {
    await navigator.clipboard.writeText(hex);
    toast.show(`Copied ${hex}`);
  } catch { toast.show("Copy failed"); }
}

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
  .filter(i => !activeTag.value || lib.getTags(i.id).includes(activeTag.value))
  .filter(i => {
    if (!activeFolder.value) return true;
    const f = lib.folders.find(x => x.id === activeFolder.value);
    return f ? f.items.includes(i.id) : true;
  })
);

function clearQuery() { query.value = ""; }
</script>

<template>
  <section>
    <div class="library-tabs">
      <button class="lib-tab" :class="{ active: tab === 'palettes' }" @click="tab = 'palettes'">
        Palettes <span class="lib-tab-count">{{ lib.items.length }}</span>
      </button>
      <button class="lib-tab" :class="{ active: tab === 'liked' }" @click="tab = 'liked'">
        Liked colors <span class="lib-tab-count">{{ taste.liked.length }}</span>
      </button>
    </div>

    <div v-if="tab === 'palettes'" class="library-filters">
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
      <button
        class="filter-pill"
        :class="{ active: diffMode }"
        @click="diffMode = !diffMode; selectedForDiff = []"
      >
        diff mode
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
      <div class="io-buttons">
        <button class="io-btn" @click="exportLibrary" :disabled="!lib.items.length" title="Export library as JSON">
          export
        </button>
        <label class="io-btn">
          import
          <input type="file" accept="application/json" @change="importLibrary" hidden />
        </label>
      </div>
    </div>

    <template v-if="tab === 'palettes'">

    <!-- DIFF PANEL -->
    <div v-if="diffMode" class="diff-bar">
      <span class="diff-hint">
        <template v-if="selectedForDiff.length === 0">click two palettes to compare</template>
        <template v-else-if="selectedForDiff.length === 1">click one more palette · {{ selectedForDiff.length }}/2</template>
        <template v-else>2/2 selected · scroll down for diff</template>
      </span>
      <button v-if="selectedForDiff.length" class="filter-pill" @click="selectedForDiff = []">clear</button>
    </div>

    <div v-if="diffPair" class="diff-panel">
      <div class="diff-eyebrow">comparison · avg color distance ≈ {{ paletteDistance(diffPair.a, diffPair.b).toFixed(1) }}</div>
      <div class="diff-grid">
        <div class="diff-side">
          <span class="diff-label">A · {{ new Date(diffPair.a.ts).toISOString().slice(0,10) }}</span>
          <div class="diff-strip">
            <div v-for="(p, i) in diffPair.a.palette" :key="i" class="diff-cell"
              :style="{ background: rgbToHex(p.rgb[0], p.rgb[1], p.rgb[2]) }"
              :title="rgbToHex(p.rgb[0], p.rgb[1], p.rgb[2])"
            ></div>
          </div>
        </div>
        <div class="diff-side">
          <span class="diff-label">B · {{ new Date(diffPair.b.ts).toISOString().slice(0,10) }}</span>
          <div class="diff-strip">
            <div v-for="(p, i) in diffPair.b.palette" :key="i" class="diff-cell"
              :style="{ background: rgbToHex(p.rgb[0], p.rgb[1], p.rgb[2]) }"
              :title="rgbToHex(p.rgb[0], p.rgb[1], p.rgb[2])"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- FOLDERS -->
    <div v-if="lib.folders.length || showFolderManager" class="folder-bar">
      <button
        class="folder-chip"
        :class="{ active: activeFolder === null }"
        @click="activeFolder = null"
      >all</button>
      <button
        v-for="f in lib.folders" :key="f.id"
        class="folder-chip"
        :class="{ active: activeFolder === f.id }"
        @click="activeFolder = activeFolder === f.id ? null : f.id"
      >
        {{ f.name }} <span class="f-count">{{ f.items.length }}</span>
      </button>
      <button class="folder-chip add" @click="showFolderManager = !showFolderManager">+ folder</button>
    </div>
    <div v-if="showFolderManager" class="folder-form">
      <input v-model="newFolderName" placeholder="new folder name" @keydown.enter="makeFolder" />
      <button @click="makeFolder">create</button>
      <button v-if="activeFolder" class="ghost" @click="lib.deleteFolder(activeFolder); activeFolder = null">
        delete '{{ lib.folders.find(f => f.id === activeFolder)?.name }}'
      </button>
    </div>

    <!-- TAG BAR -->
    <div v-if="lib.allTags.length" class="tag-bar">
      <span class="tag-bar-label">tags:</span>
      <button
        v-for="t in lib.allTags" :key="t"
        class="tag-chip"
        :class="{ active: activeTag === t }"
        @click="activeTag = activeTag === t ? null : t"
      >{{ t }}</button>
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
      <div v-for="item in items" :key="item.id" class="library-card"
        :class="{ 'diff-selected': diffMode && selectedForDiff.includes(item.id) }"
        @click="diffMode && toggleDiff(item.id)"
        :style="diffMode ? { cursor: 'pointer' } : {}"
      >
        <button class="lib-delete" @click="lib.remove(item.id)" aria-label="Delete">×</button>
        <button
          class="lib-star"
          :class="{ active: lib.isStarred(item.id) }"
          @click="lib.toggleStar(item.id)"
          :aria-label="lib.isStarred(item.id) ? 'Unstar' : 'Star'"
        >★</button>
        <button
          class="lib-share"
          @click="shareLink(item)"
          aria-label="Copy share link"
          title="Copy share link"
        >↗</button>
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

        <div class="lib-tags">
          <span v-for="t in lib.getTags(item.id)" :key="t" class="lib-tag-chip">
            {{ t }}
            <button class="tag-x" @click="lib.removeTag(item.id, t)" aria-label="Remove tag">×</button>
          </span>
          <button class="tag-add" @click="openTagsFor(item.id)">+ tag</button>
        </div>

        <div v-if="editingTagsFor === item.id" class="tag-editor" @click.stop>
          <input
            v-model="newTagInput"
            placeholder="tag name"
            @keydown.enter="commitTag(item.id)"
          />
          <div v-if="lib.folders.length" class="folder-toggles">
            <span class="ft-label">add to:</span>
            <button
              v-for="f in lib.folders" :key="f.id"
              class="ft-chip"
              :class="{ active: f.items.includes(item.id) }"
              @click="lib.toggleInFolder(f.id, item.id)"
            >{{ f.name }}</button>
          </div>
        </div>
      </div>
    </div>
    </template>

    <!-- LIKED COLORS TAB -->
    <template v-if="tab === 'liked'">
      <div class="liked-head">
        <span class="liked-meta">
          <strong>{{ taste.liked.length }}</strong> liked
          <template v-if="taste.trained">
            · {{ taste.state.count }} sessions
          </template>
          <template v-if="taste.trainedToday">
            · trained today ✓
          </template>
        </span>
        <button v-if="taste.liked.length" class="filter-pill" @click="taste.reset()">reset all</button>
      </div>

      <div v-if="taste.liked.length === 0" class="empty-large">
        <p>No liked colors yet.</p>
        <p>train your taste in Generate to start your collection</p>
      </div>

      <div v-else class="liked-grid">
        <div
          v-for="l in taste.liked" :key="l.hex"
          class="liked-cell"
          :style="{ background: l.hex, color: textColorFor(...hexToRgb(l.hex)) }"
        >
          <button class="liked-unlike" @click="taste.unlike(l.hex)" aria-label="Unlike">×</button>
          <span class="liked-hex" @click="copyHex(l.hex)">{{ l.hex }}</span>
          <span class="liked-date">{{ new Date(l.ts).toISOString().slice(0, 10) }}</span>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.library-tabs {
  display: flex;
  gap: var(--s-2);
  margin-bottom: var(--s-5);
  border-bottom: 1px solid var(--hairline);
}
.lib-tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border: none;
  background: transparent;
  color: var(--text-2);
  font-family: var(--mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .1em;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color .15s, border-color .15s;
}
.lib-tab:hover { color: var(--text); }
.lib-tab.active { color: var(--text); border-bottom-color: var(--text); }
.lib-tab-count {
  font-size: 9px;
  padding: 2px 7px;
  background: var(--surface-2);
  border-radius: 999px;
  color: var(--text-3);
  font-weight: 500;
}
.lib-tab.active .lib-tab-count { background: var(--text); color: var(--bg); }

.library-filters {
  display: flex;
  gap: var(--s-2);
  margin-bottom: var(--s-5);
  flex-wrap: wrap;
  align-items: center;
}

/* LIKED */
.liked-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--s-3);
  margin-bottom: var(--s-4);
  flex-wrap: wrap;
}
.liked-meta {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--text-2);
  letter-spacing: .04em;
}
.liked-meta strong { color: var(--text); font-weight: 700; }
.liked-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 6px;
}
.liked-cell {
  position: relative;
  aspect-ratio: 1;
  border-radius: 10px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: default;
  transition: transform .15s;
}
.liked-cell:hover { transform: translateY(-2px); }
.liked-hex {
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .04em;
  cursor: pointer;
  background: rgba(0,0,0,.3);
  color: white;
  padding: 3px 7px;
  border-radius: 4px;
  align-self: flex-start;
}
.liked-date {
  font-family: var(--mono);
  font-size: 8px;
  letter-spacing: .04em;
  background: rgba(0,0,0,.25);
  color: white;
  padding: 2px 5px;
  border-radius: 3px;
  align-self: flex-start;
  opacity: .85;
}
.liked-unlike {
  position: absolute;
  top: 6px; right: 6px;
  width: 22px; height: 22px;
  border: none;
  background: rgba(0,0,0,.4);
  color: white;
  border-radius: 50%;
  font-size: 13px;
  cursor: pointer;
  opacity: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity .15s;
}
.liked-cell:hover .liked-unlike { opacity: 1; }
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

.io-buttons { display: flex; gap: 4px; }
.io-btn {
  padding: 6px 12px;
  border: 1px solid var(--hairline);
  background: var(--bg);
  color: var(--text-2);
  border-radius: 6px;
  font-family: var(--mono);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: .08em;
  cursor: pointer;
  transition: background .15s, color .15s, border-color .15s;
}
.io-btn:hover:not(:disabled) { color: var(--text); border-color: var(--text); }
.io-btn:disabled { opacity: .4; cursor: not-allowed; }

/* FOLDERS */
.folder-bar {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: var(--s-3);
}
.folder-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--hairline);
  background: var(--bg);
  color: var(--text-2);
  border-radius: 8px;
  font-family: var(--mono);
  font-size: 10px;
  text-transform: lowercase;
  letter-spacing: .04em;
  cursor: pointer;
  transition: background .15s, color .15s, border-color .15s;
}
.folder-chip:hover { color: var(--text); border-color: var(--text); }
.folder-chip.active { background: var(--text); color: var(--bg); border-color: var(--text); }
.folder-chip.add { color: var(--text-3); border-style: dashed; }
.folder-chip .f-count {
  font-size: 9px;
  background: var(--surface-2);
  color: var(--text-3);
  padding: 1px 5px;
  border-radius: 999px;
}
.folder-chip.active .f-count { background: var(--bg); color: var(--text); }
.folder-form {
  display: flex;
  gap: 6px;
  margin-bottom: var(--s-3);
  flex-wrap: wrap;
}
.folder-form input {
  flex: 1;
  min-width: 180px;
  border: 1px solid var(--hairline);
  background: var(--bg);
  color: var(--text);
  padding: 6px 10px;
  border-radius: 6px;
  font-family: var(--mono);
  font-size: 11px;
}
.folder-form button {
  padding: 6px 12px;
  border: 1px solid var(--text);
  background: var(--text);
  color: var(--bg);
  border-radius: 6px;
  font-family: var(--mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .06em;
  cursor: pointer;
}
.folder-form button.ghost {
  background: var(--bg);
  color: #c00;
  border-color: rgba(192,0,0,.3);
}

/* TAG BAR */
.tag-bar {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: var(--s-3);
}
.tag-bar-label {
  font-family: var(--mono);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: .12em;
  color: var(--text-3);
}
.tag-chip {
  padding: 4px 9px;
  border: 1px solid var(--hairline);
  background: var(--bg);
  color: var(--text-2);
  border-radius: 999px;
  font-family: var(--mono);
  font-size: 9px;
  text-transform: lowercase;
  letter-spacing: .04em;
  cursor: pointer;
  transition: background .15s, color .15s, border-color .15s;
}
.tag-chip:hover { color: var(--text); border-color: var(--text); }
.tag-chip.active { background: var(--text); color: var(--bg); border-color: var(--text); }

/* CARD TAGS */
.lib-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  padding: 6px 8px;
  border-top: 1px solid var(--hairline);
}
.lib-tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--mono);
  font-size: 8px;
  letter-spacing: .04em;
  padding: 2px 6px;
  background: var(--surface-2);
  border-radius: 999px;
  color: var(--text-2);
}
.lib-tag-chip .tag-x {
  border: none;
  background: transparent;
  color: var(--text-3);
  cursor: pointer;
  font-size: 11px;
  line-height: 1;
  padding: 0;
}
.lib-tag-chip .tag-x:hover { color: #c00; }
.tag-add {
  font-family: var(--mono);
  font-size: 8px;
  padding: 2px 6px;
  border: 1px dashed var(--hairline);
  background: var(--bg);
  color: var(--text-3);
  border-radius: 999px;
  cursor: pointer;
}
.tag-add:hover { color: var(--text); border-color: var(--text); }

.tag-editor {
  padding: 8px;
  border-top: 1px solid var(--hairline);
  background: var(--surface-2);
}
.tag-editor input {
  width: 100%;
  border: 1px solid var(--hairline);
  background: var(--bg);
  padding: 5px 8px;
  border-radius: 4px;
  font-family: var(--mono);
  font-size: 10px;
  margin-bottom: 6px;
}
.folder-toggles {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  align-items: center;
}
.ft-label {
  font-family: var(--mono);
  font-size: 8px;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: var(--text-3);
  margin-right: 4px;
}
.ft-chip {
  font-family: var(--mono);
  font-size: 8px;
  padding: 2px 6px;
  border: 1px solid var(--hairline);
  background: var(--bg);
  color: var(--text-2);
  border-radius: 4px;
  cursor: pointer;
}
.ft-chip.active { background: var(--text); color: var(--bg); border-color: var(--text); }

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
.library-card.diff-selected {
  border-color: var(--text);
  box-shadow: 0 0 0 2px var(--text);
}

.diff-bar {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  padding: 10px 14px;
  background: var(--surface-2);
  border-radius: 10px;
  margin-bottom: var(--s-3);
  font-family: var(--mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: var(--text-2);
}
.diff-hint { flex: 1; }

.diff-panel {
  border: 1px solid var(--text);
  border-radius: 12px;
  padding: var(--s-4);
  margin-bottom: var(--s-4);
  background: var(--bg);
}
.diff-eyebrow {
  font-family: var(--mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .12em;
  color: var(--text-3);
  margin-bottom: var(--s-3);
}
.diff-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s-3);
}
.diff-side { display: flex; flex-direction: column; gap: 6px; }
.diff-label {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: .04em;
  color: var(--text-2);
}
.diff-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(28px, 1fr));
  gap: 2px;
}
.diff-cell { height: 80px; border-radius: 4px; }

@media (max-width: 600px) {
  .diff-grid { grid-template-columns: 1fr; }
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

.lib-share {
  position: absolute;
  top: 8px; left: 44px;
  width: 28px; height: 28px;
  border: none;
  background: rgba(0, 0, 0, .55);
  color: rgba(255, 255, 255, .55);
  border-radius: 50%;
  font-size: 13px;
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity .15s, color .15s;
}
.library-card:hover .lib-share { opacity: 1; }
.lib-share:hover { color: white; }
.count-meta {
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--text-3);
  font-size: 9px;
}
</style>
