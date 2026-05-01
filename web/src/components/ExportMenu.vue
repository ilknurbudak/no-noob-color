<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import type { Swatch } from "@/types";
import {
  namedSwatches, buildSwatches, buildASE, buildTailwind, buildCSSVars,
  buildJSON, buildSVGPoster, buildText, downloadBlob,
} from "@/services/export";
import { useToastStore } from "@/stores/toast";
import { useProfileStore } from "@/stores/profile";

const props = defineProps<{ palette: Swatch[]; disabled?: boolean }>();

const open = ref(false);
const toast = useToastStore();
const profile = useProfileStore();

function toggle(e: MouseEvent) {
  if (props.disabled) return;
  e.stopPropagation();
  open.value = !open.value;
}
function close() { open.value = false; }
onMounted(() => document.addEventListener("click", close));
onUnmounted(() => document.removeEventListener("click", close));

function transformedNamed() {
  const transformed: Swatch[] = props.palette.map((sw) => {
    const t = profile.transform([sw.rgb[0], sw.rgb[1], sw.rgb[2]]);
    return {
      ...sw,
      rgb: [
        Math.round(Math.max(0, Math.min(255, t[0]))),
        Math.round(Math.max(0, Math.min(255, t[1]))),
        Math.round(Math.max(0, Math.min(255, t[2]))),
      ] as [number, number, number],
    };
  });
  return namedSwatches(transformed);
}

async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.show(`Copied ${label}`);
  } catch {
    toast.show("Copy failed");
  }
}

// True if Web Share Level 2 (file sharing) is supported — iOS Safari 15+,
// Android Chrome 89+. Without this we fall back to download.
const canShareFiles = typeof navigator !== "undefined" && !!navigator.canShare;

async function shareFile(bytes: Uint8Array, filename: string, mime: string, label: string) {
  if (!canShareFiles) {
    downloadBlob(bytes, filename, mime);
    toast.show(`Downloaded ${label}`);
    return;
  }
  try {
    const file = new File([bytes], filename, { type: mime });
    if (navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: label,
        text: `no noob color · ${label}`,
      });
      toast.show(`Shared ${label}`);
      return;
    }
  } catch (e: any) {
    // User cancelled share — silent. Otherwise fallback to download.
    if (e.name !== "AbortError") {
      console.warn("share failed, falling back:", e);
      downloadBlob(bytes, filename, mime);
      toast.show(`Downloaded ${label}`);
    }
    return;
  }
  // Final fallback
  downloadBlob(bytes, filename, mime);
  toast.show(`Downloaded ${label}`);
}

async function shareText(text: string, label: string) {
  if (typeof navigator === "undefined" || !navigator.share) {
    await copy(text, label);
    return;
  }
  try {
    await navigator.share({ title: label, text });
    toast.show(`Shared ${label}`);
  } catch (e: any) {
    if (e.name !== "AbortError") await copy(text, label);
  }
}

async function exportFormat(fmt: string) {
  if (!props.palette.length) return;
  const ts = new Date().toISOString().slice(0, 10);
  const name = `no noob color · ${ts}`;
  const named = transformedNamed();

  try {
    if (fmt === "procreate") {
      await shareFile(buildSwatches(named, name), `palette-${ts}.swatches`,
        "application/octet-stream", "Procreate palette");
    }
    else if (fmt === "ase") {
      await shareFile(buildASE(named, name), `palette-${ts}.ase`,
        "application/octet-stream", "Adobe palette");
    }
    else if (fmt === "tailwind") await copy(buildTailwind(named, name), "Tailwind config");
    else if (fmt === "css") await copy(buildCSSVars(named, name), "CSS variables");
    else if (fmt === "json") await copy(buildJSON(named, name), "JSON");
    else if (fmt === "svg") {
      const svg = buildSVGPoster(named, name);
      const bytes = new TextEncoder().encode(typeof svg === "string" ? svg : new TextDecoder().decode(svg));
      await shareFile(bytes, `palette-${ts}.svg`, "image/svg+xml", "SVG poster");
    }
    else if (fmt === "text") {
      // Prefer share sheet on mobile (AirDrop, Messages, Notes, Procreate)
      await shareText(buildText(named, name), "palette text");
    }
  } catch (e) {
    console.error("export failed", e);
    toast.show("Export failed");
  }
  close();
}
</script>

<template>
  <div class="wrap" @click.stop>
    <button class="chip-btn" :disabled="disabled" @click="toggle">
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 2 V11 M5 8 L8 11 L11 8" />
        <path d="M3 13 H13" />
      </svg>
      Export
      <span class="chev">▾</span>
    </button>
    <div class="menu" :class="{ open }">
      <button @click="exportFormat('procreate')"><span>Procreate</span><span class="ext">.swatches</span></button>
      <button @click="exportFormat('ase')"><span>Adobe</span><span class="ext">.ase</span></button>
      <button @click="exportFormat('tailwind')"><span>Tailwind config</span><span class="ext">copy</span></button>
      <button @click="exportFormat('css')"><span>CSS variables</span><span class="ext">copy</span></button>
      <button @click="exportFormat('json')"><span>JSON</span><span class="ext">copy</span></button>
      <button @click="exportFormat('svg')"><span>SVG poster</span><span class="ext">.svg</span></button>
      <button @click="exportFormat('text')"><span>Copy as text</span><span class="ext">clipboard</span></button>
    </div>
  </div>
</template>

<style scoped>
.wrap { position: relative; display: inline-block; }

.chip-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border: 1px solid var(--hairline);
  background: var(--bg);
  color: var(--text);
  border-radius: 8px;
  font-family: var(--sans);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: background .15s, color .15s, border-color .15s;
  letter-spacing: -.005em;
}
.chip-btn:hover:not(:disabled) {
  background: var(--text); color: var(--bg); border-color: var(--text);
}
.chip-btn:disabled { opacity: .4; cursor: not-allowed; }
.chip-btn svg { width: 12px; height: 12px; }
.chev { font-size: 8px; opacity: .7; margin-left: 2px; }

.menu {
  position: absolute;
  bottom: calc(100% + 6px);
  right: 0;
  background: var(--bg);
  border: 1px solid var(--text);
  border-radius: 8px;
  width: 220px;
  z-index: 100;
  display: none;
  overflow: hidden;
}
.menu.open { display: block; }
.menu button {
  width: 100%;
  text-align: left;
  padding: 12px 14px;
  border: none;
  border-bottom: 1px solid var(--hairline);
  background: var(--bg);
  color: var(--text);
  font-family: var(--sans);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.menu button:last-child { border-bottom: none; }
.menu button:hover { background: var(--surface-hover); }
.menu .ext {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--text-3);
  font-weight: 400;
}
</style>
