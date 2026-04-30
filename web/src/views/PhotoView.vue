<script setup lang="ts">
import { ref } from "vue";
import type { CBMode } from "@/services/colorblind";
import DropZone from "@/components/DropZone.vue";
import PaletteStrips from "@/components/PaletteStrips.vue";
import ProfilePill from "@/components/ProfilePill.vue";
import ExportMenu from "@/components/ExportMenu.vue";
import TabInfo from "@/components/TabInfo.vue";
import { useRefImage } from "@/composables/useRefImage";
import { useLibraryStore } from "@/stores/library";
import { useToastStore } from "@/stores/toast";

const cbMode = ref<CBMode>("normal");

const CB_OPTIONS: { id: CBMode; label: string }[] = [
  { id: "normal",       label: "normal" },
  { id: "protanopia",   label: "protan" },
  { id: "deuteranopia", label: "deuter" },
  { id: "tritanopia",   label: "tritan" },
];

const { palette, imageSrc, thumbnail, loading, loadFile } = useRefImage(5);
const lib = useLibraryStore();
const toast = useToastStore();

function onSave() {
  if (!palette.value.length || !thumbnail.value) return;
  lib.save(palette.value, thumbnail.value, "photo");
  toast.show("Saved to Library");
}
</script>

<template>
  <section>
    <div class="photo-grid">
      <div class="photo-col-source">
        <div class="section-label"><span class="num">01</span>Source</div>
        <DropZone :image-src="imageSrc" @file="loadFile" />
        <div v-if="loading" class="loading-note">extracting palette…</div>
      </div>

      <div class="photo-col-palette">
        <div class="palette-header">
          <div class="section-label"><span class="num">02</span>Palette</div>
          <ProfilePill />
        </div>

        <PaletteStrips
          :palette="palette"
          :cb-mode="cbMode"
          :empty-mini="['#e8d5b7', '#c19a6b', '#8b5d33', '#4a3520', '#1f1410']"
          empty-tag="example · earth"
          empty-message="Drop a photo to see colors extracted via k-means in L*a*b* space."
        />

        <div class="cb-row">
          <span class="cb-label">vision preview</span>
          <button
            v-for="o in CB_OPTIONS"
            :key="o.id"
            class="cb-chip"
            :class="{ active: cbMode === o.id }"
            @click="cbMode = o.id"
          >{{ o.label }}</button>
        </div>

        <div class="palette-footer">
          <button class="chip-btn ghost" :disabled="!palette.length" @click="onSave">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round">
              <path d="M4 2 H12 V14 L8 11 L4 14 Z" />
            </svg>
            Save
          </button>
          <ExportMenu :palette="palette" :disabled="!palette.length" />
        </div>
      </div>
    </div>

    <TabInfo
      eyebrow="How it works"
      title="From photo to palette"
      lead="Drop any image and five dominant colors are extracted using k-means clustering in perceptual L*a*b* color space — the math behind how human eyes actually group color, not raw RGB distance."
    >
      <li>
        <strong>Honest swatches</strong>
        Each swatch snaps to an actual pixel from your photo, never a muddy averaged centroid.
      </li>
      <li>
        <strong>WCAG inline</strong>
        Every swatch shows its contrast ratio against black/white with AA · AAA · FAIL badges.
      </li>
      <li>
        <strong>Color profile</strong>
        Switch output between sRGB, Display P3, Adobe RGB or CMYK to match the medium.
      </li>
      <li>
        <strong>Multi-format export</strong>
        Procreate, Adobe, Tailwind, CSS, JSON, SVG, plain text — all client-side.
      </li>
    </TabInfo>
  </section>
</template>

<style scoped>
.photo-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
  gap: var(--s-5);
  align-items: start;
}
.photo-col-source, .photo-col-palette { min-width: 0; }
.section-label {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: .1em;
  margin-bottom: var(--s-3);
  display: block;
}
.section-label .num {
  color: var(--text-2);
  margin-right: 6px;
  font-weight: 500;
}
.palette-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--s-3);
  gap: var(--s-3);
  flex-wrap: wrap;
}
.palette-header .section-label { margin: 0; }
.loading-note {
  margin-top: var(--s-3);
  font-family: var(--mono);
  font-size: 10px;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: .12em;
}
.cb-row {
  margin-top: var(--s-3);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.cb-label {
  font-family: var(--mono);
  font-size: 9px;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: .12em;
  margin-right: 4px;
}
.cb-chip {
  padding: 5px 10px;
  border: 1px solid var(--hairline);
  background: var(--bg);
  color: var(--text-2);
  border-radius: 999px;
  font-family: var(--mono);
  font-size: 9px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: .08em;
  cursor: pointer;
  transition: background .15s, color .15s, border-color .15s;
}
.cb-chip:hover { color: var(--text); border-color: var(--text); }
.cb-chip.active { background: var(--text); color: var(--bg); border-color: var(--text); }
.palette-footer {
  margin-top: var(--s-3);
  display: flex;
  justify-content: flex-end;
  gap: var(--s-2);
  align-items: center;
}
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
}
.chip-btn:hover:not(:disabled) {
  background: var(--text); color: var(--bg); border-color: var(--text);
}
.chip-btn:disabled { opacity: .4; cursor: not-allowed; }
.chip-btn svg { width: 12px; height: 12px; }
@media (max-width: 720px) {
  .photo-grid { grid-template-columns: 1fr; gap: var(--s-5); }
  .palette-header { margin-top: var(--s-5); }
}
</style>
