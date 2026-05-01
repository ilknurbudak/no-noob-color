<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import type { Swatch, RGB } from "@/types";
import { hexToRgb, rgbToHex, rgbToLab } from "@/services/color";
import PaletteStrips from "@/components/PaletteStrips.vue";
import ProfilePill from "@/components/ProfilePill.vue";
import ExportMenu from "@/components/ExportMenu.vue";
import { useToastStore } from "@/stores/toast";

const route = useRoute();
const toast = useToastStore();
const palette = ref<Swatch[]>([]);
const name = ref("");
const valid = ref(true);
const sourceLabel = ref("shared");

function decode() {
  // Slug format: name~hex1-hex2-hex3 OR base64 of JSON
  const slug = String(route.params.slug || "");
  if (!slug) { valid.value = false; return; }
  try {
    if (slug.includes("~")) {
      const [n, hexes] = slug.split("~");
      name.value = decodeURIComponent(n);
      const list = hexes.split("-").map(h => "#" + h);
      palette.value = list.map(hex => {
        const rgb = hexToRgb(hex) as RGB;
        const [L, a, b] = rgbToLab(...rgb);
        return { rgb, L, chroma: Math.sqrt(a * a + b * b) };
      });
    } else {
      // base64
      const json = atob(slug.replace(/-/g, "+").replace(/_/g, "/"));
      const obj = JSON.parse(json);
      name.value = obj.name || "shared palette";
      palette.value = (obj.colors || []).map((hex: string) => {
        const rgb = hexToRgb(hex) as RGB;
        const [L, a, b] = rgbToLab(...rgb);
        return { rgb, L, chroma: Math.sqrt(a * a + b * b) };
      });
      sourceLabel.value = obj.source || "shared";
    }
    if (!palette.value.length) valid.value = false;
  } catch {
    valid.value = false;
  }
}

onMounted(decode);

async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href);
    toast.show("Link copied");
  } catch { toast.show("Copy failed"); }
}

const exportable = computed(() => palette.value);
</script>

<template>
  <section class="share">
    <header class="share-head">
      <span class="eyebrow">Shared palette · {{ sourceLabel }}</span>
      <h1>{{ valid ? name || "Untitled palette" : "Invalid share link" }}</h1>
    </header>

    <PaletteStrips
      v-if="valid"
      :palette="palette"
      :empty-message="'no swatches found'"
    />

    <div v-if="valid" class="actions">
      <ProfilePill />
      <ExportMenu :palette="exportable" :disabled="!palette.length" />
      <button class="share-btn" @click="copyLink">copy share link</button>
    </div>

    <div v-if="!valid" class="invalid">
      <p>This link could not be decoded.</p>
      <p>Make sure it was copied in full.</p>
    </div>
  </section>
</template>

<style scoped>
.share { max-width: 900px; margin: 0 auto; padding-bottom: var(--s-7); }
.share-head { margin-bottom: var(--s-5); }
.eyebrow {
  font-family: var(--mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .14em;
  color: var(--text-3);
}
.share-head h1 {
  font-family: var(--sans);
  font-style: italic;
  font-weight: 800;
  font-size: 36px;
  letter-spacing: -.02em;
  margin: var(--s-3) 0 0;
  color: var(--text);
}
.actions {
  margin-top: var(--s-4);
  display: flex;
  gap: var(--s-2);
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.share-btn {
  padding: 7px 12px;
  border: 1px solid var(--text);
  background: var(--text);
  color: var(--bg);
  border-radius: 8px;
  font-family: var(--mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .08em;
  cursor: pointer;
}
.share-btn:hover { opacity: .85; }
.invalid {
  padding: 80px 20px;
  text-align: center;
  color: var(--text-3);
  font-family: var(--mono);
  font-size: 11px;
}
.invalid p:first-child { color: var(--text); font-size: 14px; margin-bottom: var(--s-2); }
</style>
