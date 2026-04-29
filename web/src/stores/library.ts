import { defineStore } from "pinia";
import { ref } from "vue";
import type { LibraryItem, Swatch } from "@/types";

const KEY = "nnc_library_v1";

function load(): LibraryItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function persist(items: LibraryItem[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
}

export const useLibraryStore = defineStore("library", () => {
  const items = ref<LibraryItem[]>(load());

  function save(palette: Swatch[], thumb: string, source: "photo" | "generate"): LibraryItem {
    const item: LibraryItem = {
      id: Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7),
      ts: Date.now(),
      palette: palette.map(sw => ({ rgb: sw.rgb, L: sw.L, chroma: sw.chroma })),
      thumb,
      source,
    };
    items.value.unshift(item);
    persist(items.value);
    return item;
  }

  function remove(id: string) {
    items.value = items.value.filter(i => i.id !== id);
    persist(items.value);
  }

  function bySource(source: "photo" | "generate"): LibraryItem[] {
    return items.value.filter(i => (i.source ?? "photo") === source);
  }

  return { items, save, remove, bySource };
});
