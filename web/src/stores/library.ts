import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { LibraryItem, Swatch } from "@/types";
import * as api from "@/services/api";

const KEY = "nnc_library_v1";
const STAR_KEY = "nnc_library_stars_v1";
const TAGS_KEY = "nnc_library_tags_v1";
const FOLDERS_KEY = "nnc_library_folders_v1";

function loadStars(): Set<string> {
  try {
    const raw = localStorage.getItem(STAR_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}
function persistStars(set: Set<string>) {
  try { localStorage.setItem(STAR_KEY, JSON.stringify([...set])); } catch {}
}

// Tags: itemId → string[] of lowercase tag names
function loadTags(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(TAGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function persistTags(map: Record<string, string[]>) {
  try { localStorage.setItem(TAGS_KEY, JSON.stringify(map)); } catch {}
}

// Folders: { id, name, items: string[] }
export interface LibraryFolder {
  id: string;
  name: string;
  items: string[];
  ts: number;
}
function loadFolders(): LibraryFolder[] {
  try {
    const raw = localStorage.getItem(FOLDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function persistFolders(arr: LibraryFolder[]) {
  try { localStorage.setItem(FOLDERS_KEY, JSON.stringify(arr)); } catch {}
}

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

  // ---------- favorites (always local) ----------
  const stars = ref<Set<string>>(loadStars());

  function isStarred(id: string): boolean {
    return stars.value.has(id);
  }

  function toggleStar(id: string) {
    if (stars.value.has(id)) stars.value.delete(id);
    else stars.value.add(id);
    // Trigger reactivity
    stars.value = new Set(stars.value);
    persistStars(stars.value);
  }

  // ---------- tags ----------
  const tags = ref<Record<string, string[]>>(loadTags());

  function getTags(id: string): string[] {
    return tags.value[id] || [];
  }

  function setTags(id: string, list: string[]) {
    const cleaned = [...new Set(list.map(t => t.trim().toLowerCase()).filter(t => t))];
    if (cleaned.length === 0) delete tags.value[id];
    else tags.value[id] = cleaned;
    tags.value = { ...tags.value };
    persistTags(tags.value);
  }

  function addTag(id: string, tag: string) {
    setTags(id, [...getTags(id), tag]);
  }

  function removeTag(id: string, tag: string) {
    setTags(id, getTags(id).filter(t => t !== tag.toLowerCase()));
  }

  const allTags = computed(() => {
    const set = new Set<string>();
    for (const list of Object.values(tags.value)) for (const t of list) set.add(t);
    return [...set].sort();
  });

  // ---------- folders ----------
  const folders = ref<LibraryFolder[]>(loadFolders());

  function createFolder(name: string): LibraryFolder {
    const folder: LibraryFolder = {
      id: Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7),
      name: name.trim(),
      items: [],
      ts: Date.now(),
    };
    folders.value = [folder, ...folders.value];
    persistFolders(folders.value);
    return folder;
  }

  function renameFolder(id: string, name: string) {
    const f = folders.value.find(x => x.id === id);
    if (!f) return;
    f.name = name.trim();
    folders.value = [...folders.value];
    persistFolders(folders.value);
  }

  function deleteFolder(id: string) {
    folders.value = folders.value.filter(x => x.id !== id);
    persistFolders(folders.value);
  }

  function toggleInFolder(folderId: string, itemId: string) {
    const f = folders.value.find(x => x.id === folderId);
    if (!f) return;
    if (f.items.includes(itemId)) f.items = f.items.filter(x => x !== itemId);
    else f.items = [...f.items, itemId];
    folders.value = [...folders.value];
    persistFolders(folders.value);
  }

  function foldersFor(itemId: string): LibraryFolder[] {
    return folders.value.filter(f => f.items.includes(itemId));
  }

  return {
    items, isRemote, syncing, save, remove, bySource, sync, resetToLocal,
    stars, isStarred, toggleStar,
    tags, getTags, setTags, addTag, removeTag, allTags,
    folders, createFolder, renameFolder, deleteFolder, toggleInFolder, foldersFor,
  };
});
