<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { Swatch } from "@/types";
import { rgbToHex } from "@/services/color";
import { materialTheme, materialCss, getApiUrl, type MaterialTheme } from "@/services/api";
import { useToastStore } from "@/stores/toast";

const props = defineProps<{ palette: Swatch[] }>();
const toast = useToastStore();

type Tab = "tonal" | "elevation" | "roles" | "preview" | "css";
const tab = ref<Tab>("tonal");
const tabs: { id: Tab; label: string }[] = [
  { id: "tonal", label: "tonal scale" },
  { id: "elevation", label: "elevation" },
  { id: "roles", label: "roles" },
  { id: "preview", label: "preview" },
  { id: "css", label: "css export" },
];

const theme = ref<MaterialTheme | null>(null);
const cssText = ref("");
const loading = ref(false);
const error = ref<string | null>(null);

const seed = computed(() => props.palette[0] ? rgbToHex(...props.palette[0].rgb) : "#7a4b8a");

async function loadTheme() {
  if (!getApiUrl()) {
    error.value = "API not connected — start the Python service to use Material 3";
    return;
  }
  if (!props.palette.length) return;
  loading.value = true;
  error.value = null;
  try {
    theme.value = await materialTheme(seed.value);
    const css = await materialCss(seed.value);
    cssText.value = css.css;
  } catch (e: any) {
    error.value = e.message || "material/theme failed";
  } finally {
    loading.value = false;
  }
}

watch(() => seed.value, () => loadTheme(), { immediate: true });

// Surface elevation map: dp1, dp2, dp3, dp4, dp5
function elevationOverlay(level: number): string {
  // Material 3 elevations apply primary tint at increasing alpha
  const alphas = [0, 0.05, 0.08, 0.11, 0.12, 0.14];
  return `rgba(0,0,0,${alphas[level] ?? 0.14})`;
}

async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.show(`Copied ${label}`);
  } catch { toast.show("Copy failed"); }
}

const PREVIEW_TONES = ["10", "20", "30", "40", "50", "60", "70", "80", "90", "95", "98", "99", "100"];
</script>

<template>
  <section v-if="palette.length" class="md-panel">
    <div class="head">
      <span class="eyebrow">Material 3 / HCT</span>
      <div class="tabs">
        <button v-for="t in tabs" :key="t.id" class="tab"
          :class="{ active: tab === t.id }" @click="tab = t.id">{{ t.label }}</button>
      </div>
    </div>

    <div v-if="loading" class="status">loading material theme…</div>
    <div v-else-if="error" class="status err">{{ error }}</div>

    <template v-if="theme && !loading">
      <!-- TONAL SCALE -->
      <div v-show="tab === 'tonal'" class="tonal">
        <div class="micro">tonal palettes · 13 stops × 6 roles · seed {{ theme.seed }}</div>
        <div v-for="(tones, palName) in theme.palettes" :key="palName" class="tonal-row">
          <span class="tonal-name">{{ palName }}</span>
          <div class="tonal-strip">
            <div v-for="t in PREVIEW_TONES" :key="t" class="tonal-cell"
              :style="{ background: tones[t] }"
              :title="`${palName} · tone ${t} · ${tones[t]}`"
              @click="copy(tones[t], `${palName}-${t}`)"
            >
              <span>{{ t }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ELEVATION -->
      <div v-show="tab === 'elevation'" class="elevation">
        <div class="micro">surface elevation · primary tint at increasing alpha</div>
        <div class="elev-grid">
          <div v-for="lvl in 6" :key="lvl" class="elev-card"
            :style="{
              background: theme.schemes.light.surface,
              boxShadow: `0 ${(lvl-1)*2}px ${(lvl-1)*4}px rgba(0,0,0,${0.04 * (lvl-1)})`,
            }"
          >
            <div class="elev-overlay" :style="{ background: elevationOverlay(lvl - 1) }"></div>
            <div class="elev-content">
              <span class="dp">dp{{ lvl - 1 }}</span>
              <span class="alpha">{{ ((lvl - 1) * 0.025).toFixed(3) }} α</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ROLES -->
      <div v-show="tab === 'roles'" class="roles">
        <div class="micro">27 semantic roles · light scheme</div>
        <div class="roles-grid">
          <div v-for="(hex, key) in theme.schemes.light" :key="key" class="role-card"
            :style="{ background: hex }"
            @click="copy(hex, key as string)"
          >
            <span class="role-key">{{ key }}</span>
            <span class="role-hex">{{ hex }}</span>
          </div>
        </div>
      </div>

      <!-- PREVIEW (mini app) -->
      <div v-show="tab === 'preview'" class="preview">
        <div class="micro">side-by-side light / dark UI preview</div>
        <div class="preview-grid">
          <div class="preview-mode" :style="{ background: theme.schemes.light.background, color: theme.schemes.light.onBackground }">
            <div class="prev-label">light</div>
            <div class="prev-card" :style="{ background: theme.schemes.light.surface, color: theme.schemes.light.onSurface }">
              <h4>Sample card</h4>
              <p>This is body copy on surface.</p>
              <button :style="{ background: theme.schemes.light.primary, color: theme.schemes.light.onPrimary }">Primary</button>
              <button class="ghost" :style="{ borderColor: theme.schemes.light.outline, color: theme.schemes.light.primary }">Outlined</button>
            </div>
          </div>
          <div class="preview-mode" :style="{ background: theme.schemes.dark.background, color: theme.schemes.dark.onBackground }">
            <div class="prev-label">dark</div>
            <div class="prev-card" :style="{ background: theme.schemes.dark.surface, color: theme.schemes.dark.onSurface }">
              <h4>Sample card</h4>
              <p>This is body copy on surface.</p>
              <button :style="{ background: theme.schemes.dark.primary, color: theme.schemes.dark.onPrimary }">Primary</button>
              <button class="ghost" :style="{ borderColor: theme.schemes.dark.outline, color: theme.schemes.dark.primary }">Outlined</button>
            </div>
          </div>
        </div>
      </div>

      <!-- CSS EXPORT -->
      <div v-show="tab === 'css'" class="css">
        <div class="micro">CSS variables · light + dark via [data-theme='dark']</div>
        <pre class="code">{{ cssText }}</pre>
        <button class="copy-btn" @click="copy(cssText, 'Material 3 CSS')">copy</button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.md-panel {
  margin-top: var(--s-5);
  border: 1px solid var(--hairline);
  border-radius: 14px;
  padding: var(--s-5);
  background: var(--bg);
}
.head { display: flex; justify-content: space-between; align-items: center; gap: var(--s-3); margin-bottom: var(--s-4); flex-wrap: wrap; }
.eyebrow { font-family: var(--mono); font-size: 9px; text-transform: uppercase; letter-spacing: .14em; color: var(--text-3); }
.tabs { display: flex; gap: 4px; flex-wrap: wrap; }
.tab {
  padding: 5px 11px; border: 1px solid var(--hairline); background: var(--bg);
  color: var(--text-2); border-radius: 999px;
  font-family: var(--mono); font-size: 9px; text-transform: uppercase; letter-spacing: .08em;
  cursor: pointer; transition: background .15s, color .15s, border-color .15s;
}
.tab:hover { color: var(--text); border-color: var(--text); }
.tab.active { background: var(--text); color: var(--bg); border-color: var(--text); }
.micro { font-family: var(--mono); font-size: 9px; text-transform: uppercase; letter-spacing: .12em; color: var(--text-3); margin-bottom: var(--s-3); }
.status { font-family: var(--mono); font-size: 11px; color: var(--text-2); padding: var(--s-4) 0; text-align: center; }
.status.err { color: #c00; }

/* TONAL */
.tonal-row {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: var(--s-3);
  align-items: center;
  margin-bottom: 6px;
}
.tonal-name { font-family: var(--mono); font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: var(--text-2); }
.tonal-strip { display: grid; grid-template-columns: repeat(13, 1fr); gap: 1px; }
.tonal-cell {
  height: 36px;
  display: flex; align-items: flex-end; justify-content: center;
  padding-bottom: 3px;
  cursor: pointer;
  transition: transform .15s;
}
.tonal-cell:hover { transform: scale(1.05); z-index: 2; }
.tonal-cell span {
  font-family: var(--mono); font-size: 8px; opacity: .6;
  background: rgba(255,255,255,.6);
  padding: 1px 3px; border-radius: 2px;
}

/* ELEVATION */
.elev-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--s-3);
}
.elev-card {
  position: relative;
  height: 110px;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.elev-overlay { position: absolute; inset: 0; }
.elev-content {
  position: relative;
  display: flex; flex-direction: column; gap: 2px; align-items: center;
  font-family: var(--mono); font-size: 11px;
  color: var(--text);
}
.elev-content .alpha { font-size: 9px; color: var(--text-3); }

/* ROLES */
.roles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 4px;
}
.role-card {
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-height: 70px;
}
.role-key, .role-hex {
  font-family: var(--mono);
  font-size: 9px;
  background: rgba(0,0,0,.4);
  color: white;
  padding: 2px 5px;
  border-radius: 3px;
  align-self: flex-start;
  letter-spacing: .04em;
}
.role-key { font-weight: 600; }

/* PREVIEW */
.preview-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s-3);
}
.preview-mode {
  border-radius: 12px;
  padding: var(--s-4);
  border: 1px solid var(--hairline);
}
.prev-label {
  font-family: var(--mono); font-size: 9px;
  text-transform: uppercase; letter-spacing: .12em;
  opacity: .6; margin-bottom: 8px;
}
.prev-card {
  border-radius: 12px;
  padding: var(--s-4);
}
.prev-card h4 {
  font-family: var(--sans); font-style: italic; font-weight: 700;
  font-size: 16px; margin: 0 0 6px;
}
.prev-card p {
  font-size: 12px; line-height: 1.5; margin: 0 0 var(--s-3); opacity: .85;
}
.prev-card button {
  padding: 8px 14px; border: 1px solid transparent; border-radius: 999px;
  font-family: var(--sans); font-size: 12px; font-weight: 500;
  cursor: pointer; margin-right: 6px;
}
.prev-card button.ghost {
  background: transparent;
}

/* CSS */
.code {
  background: #0a0a0a; color: #f5f5f5;
  padding: var(--s-4); border-radius: 10px;
  font-family: var(--mono); font-size: 11px;
  line-height: 1.55; overflow: auto;
  margin-bottom: var(--s-3);
  max-height: 380px;
}
.copy-btn {
  padding: 7px 14px;
  border: 1px solid var(--text); background: var(--bg); color: var(--text);
  border-radius: 8px;
  font-family: var(--mono); font-size: 10px;
  text-transform: uppercase; letter-spacing: .08em;
  cursor: pointer;
}
.copy-btn:hover { background: var(--text); color: var(--bg); }

@media (max-width: 720px) {
  .tonal-row { grid-template-columns: 1fr; }
  .preview-grid { grid-template-columns: 1fr; }
}
</style>
