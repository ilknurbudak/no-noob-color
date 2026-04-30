import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { LibraryItem, Swatch } from "@/types";
import * as api from "@/services/api";

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

function dataUrlToBlob(dataUrl: string): Blob | null {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return null;
  const [, mime, b64] = m;
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function remoteToLocal(r: api.RemotePalette): LibraryItem {
  return {
    id: r.id,
    ts: new Date(r.created).getTime(),
    palette: r.swatches.map((s) => ({
      rgb: s.rgb,
      L: 0,        // re-derived lazily by consumers if needed
      chroma: 0,
    })),
    thumb: r.thumbnail || "",
    source: (r.source === "generate" ? "generate" : "photo"),
  };
}

export const useLibraryStore = defineStore("library", () => {
  const items = ref<LibraryItem[]>(load());
  const remote = ref(false);
  const syncing = ref(false);

  const isRemote = computed(() => remote.value);

  async function sync() {
    if (!api.getToken()) { remote.value = false; return; }
    syncing.value = true;
    try {
      const list = await api.listPalettes();
      items.value = list.map(remoteToLocal);
      remote.value = true;
    } catch (e) {
      console.warn("library sync failed, falling back to local:", e);
      remote.value = false;
      items.value = load();
    } finally {
      syncing.value = false;
    }
  }

  async function save(palette: Swatch[], thumb: string, source: "photo" | "generate"): Promise<LibraryItem> {
    const local: LibraryItem = {
      id: Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7),
      ts: Date.now(),
      palette: palette.map(sw => ({ rgb: sw.rgb, L: sw.L, chroma: sw.chroma })),
      thumb,
      source,
    };

    if (api.getToken()) {
      try {
        const blob = thumb ? dataUrlToBlob(thumb) || undefined : undefined;
        const name = `palette · ${new Date().toISOString().slice(0, 16).replace("T", " ")}`;
        const remoteRec = await api.savePalette(name, palette, source, blob);
        const item = remoteToLocal(remoteRec);
        if (!item.thumb && thumb) item.thumb = thumb;
        items.value.unshift(item);
        remote.value = true;
        return item;
      } catch (e) {
        console.warn("remote save failed, keeping local:", e);
      }
    }

    items.value.unshift(local);
    persist(items.value);
    return local;
  }

  async function remove(id: string) {
    const wasRemote = remote.value;
    items.value = items.value.filter(i => i.id !== id);
    if (wasRemote && api.getToken()) {
      try { await api.deletePalette(id); }
      catch (e) { console.warn("remote delete failed:", e); }
    } else {
      persist(items.value);
    }
  }

  function bySource(source: "photo" | "generate"): LibraryItem[] {
    return items.value.filter(i => (i.source ?? "photo") === source);
  }

  function resetToLocal() {
    remote.value = false;
    items.value = load();
  }

  return { items, isRemote, syncing, save, remove, bySource, sync, resetToLocal };
});
