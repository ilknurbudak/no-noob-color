<script setup lang="ts">
import { ref, computed } from "vue";
import type { Swatch } from "@/types";
import { rgbToHex } from "@/services/color";
import {
  deriveSemantic, deriveStates, buildThemePair,
  shadcnConfig, tailwindConfig, auditMatrix, rule603010,
} from "@/services/personaUI";
import { useToastStore } from "@/stores/toast";

const props = defineProps<{ palette: Swatch[] }>();
const toast = useToastStore();

type Tab = "audit" | "states" | "rule" | "tokens" | "theme" | "shadcn";
const tab = ref<Tab>("audit");

const tokens = computed(() => deriveSemantic(props.palette));
const matrix = computed(() => auditMatrix(props.palette));
const rule = computed(() => rule603010(props.palette));
const themePair = computed(() => buildThemePair(tokens.value));
const stateSamples = computed(() =>
  ([
    { role: "Primary", rgb: tokens.value.primary },
    { role: "Secondary", rgb: tokens.value.secondary },
    { role: "Tertiary", rgb: tokens.value.tertiary },
  ]).map(s => ({ ...s, states: deriveStates(s.rgb) }))
);
const shadcnText = computed(() => shadcnConfig(tokens.value, themePair.value));
const tailwindText = computed(() => tailwindConfig(tokens.value));

async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.show(`Copied ${label}`);
  } catch {
    toast.show("Copy failed");
  }
}

const tabs: { id: Tab; label: string }[] = [
  { id: "audit", label: "audit" },
  { id: "states", label: "states" },
  { id: "rule", label: "60-30-10" },
  { id: "tokens", label: "tokens" },
  { id: "theme", label: "light/dark" },
  { id: "shadcn", label: "shadcn" },
];
</script>

<template>
  <section v-if="palette.length" class="ui-panel">
    <div class="ui-head">
      <span class="eyebrow">UI / Web Designer</span>
      <div class="ui-tabs">
        <button
          v-for="t in tabs"
          :key="t.id"
          class="ui-tab"
          :class="{ active: tab === t.id }"
          @click="tab = t.id"
        >{{ t.label }}</button>
      </div>
    </div>

    <!-- AUDIT -->
    <div v-show="tab === 'audit'" class="audit">
      <div class="micro">WCAG 2.1 contrast matrix · row text on column background</div>
      <div class="audit-grid" :style="{ gridTemplateColumns: `60px repeat(${palette.length}, 1fr)` }">
        <div class="audit-cell head"></div>
        <div v-for="(p, i) in palette" :key="'h'+i" class="audit-cell head"
          :style="{ background: rgbToHex(...p.rgb) }"
        ></div>
        <template v-for="(row, i) in matrix" :key="'r'+i">
          <div class="audit-cell head" :style="{ background: rgbToHex(...palette[i].rgb) }"></div>
          <div v-for="(cell, j) in row" :key="'c'+i+'_'+j"
            class="audit-cell"
            :class="cell.grade.toLowerCase().replace('·', '-').replace(/\./g, '')"
            :style="{
              background: rgbToHex(...palette[j].rgb),
              color: rgbToHex(...palette[i].rgb),
            }"
          >
            {{ cell.ratio }}
          </div>
        </template>
      </div>
      <div class="audit-legend">
        <span class="badge aaa">AAA ≥ 7</span>
        <span class="badge aa">AA ≥ 4.5</span>
        <span class="badge aa-lg">AA Large ≥ 3</span>
        <span class="badge fail">Fail</span>
      </div>
    </div>

    <!-- STATES -->
    <div v-show="tab === 'states'" class="states">
      <div class="micro">interactive states · base / hover / active / focus / disabled</div>
      <div v-for="s in stateSamples" :key="s.role" class="state-row">
        <div class="state-label">{{ s.role }}</div>
        <div class="state-cells">
          <div v-for="(hex, k) in s.states" :key="k" class="state-cell">
            <div class="swatch-preview" :style="{ background: typeof hex === 'string' ? hex.split(' ')[0] : '#000' }"></div>
            <div class="state-meta">
              <span class="state-name">{{ k }}</span>
              <span class="copyable" @click="copy(typeof hex === 'string' ? hex.split(' ')[0] : '', k)">{{ hex }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 60-30-10 -->
    <div v-show="tab === 'rule'" class="rule">
      <div class="micro">classic UI proportion · 60% surface · 30% accent / supporting · 10% pop</div>
      <div class="rule-canvas">
        <div class="rule-bg" :style="{ background: rgbToHex(...rule.dominant) }">
          <div class="rule-fg" :style="{ background: rgbToHex(...rule.secondary) }">
            <div class="rule-pop" :style="{ background: rgbToHex(...rule.accent) }">
              <span>action</span>
            </div>
            <div class="rule-text">
              <h3>Sample interface</h3>
              <p>The dominant color carries 60% — your background and surfaces. Secondary 30% — sidebars, cards. Accent 10% — single buttons or alerts that need attention.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TOKENS -->
    <div v-show="tab === 'tokens'" class="tokens">
      <div class="micro">semantic tokens · auto-derived from palette</div>
      <div class="token-grid">
        <div v-for="(rgb, key) in tokens" :key="key" class="token-card">
          <div class="token-swatch" :style="{ background: rgbToHex(...rgb) }"></div>
          <div class="token-meta">
            <span class="token-key">{{ key }}</span>
            <span class="token-hex copyable" @click="copy(rgbToHex(...rgb).toUpperCase(), key)">
              {{ rgbToHex(...rgb).toUpperCase() }}
            </span>
          </div>
        </div>
      </div>
      <button class="copy-btn" @click="copy(tailwindText, 'Tailwind config')">copy tailwind config</button>
    </div>

    <!-- THEME PAIR -->
    <div v-show="tab === 'theme'" class="theme">
      <div class="micro">light / dark theme pair · same tokens, different output</div>
      <div class="theme-grid">
        <div class="theme-mode light" :style="{ background: themePair.light.background, color: themePair.light.foreground }">
          <div class="theme-label">light</div>
          <div v-for="(hex, key) in themePair.light" :key="'l'+key" class="theme-row">
            <span class="dot" :style="{ background: hex }"></span>
            <span class="key">{{ key }}</span>
            <span class="val copyable" @click="copy(hex, key)">{{ hex }}</span>
          </div>
        </div>
        <div class="theme-mode dark" :style="{ background: themePair.dark.background, color: themePair.dark.foreground }">
          <div class="theme-label">dark</div>
          <div v-for="(hex, key) in themePair.dark" :key="'d'+key" class="theme-row">
            <span class="dot" :style="{ background: hex }"></span>
            <span class="key">{{ key }}</span>
            <span class="val copyable" @click="copy(hex, key)">{{ hex }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- SHADCN -->
    <div v-show="tab === 'shadcn'" class="shadcn">
      <div class="micro">shadcn/ui CSS variables · paste into globals.css</div>
      <pre class="code">{{ shadcnText }}</pre>
      <button class="copy-btn" @click="copy(shadcnText, 'shadcn config')">copy</button>
    </div>
  </section>
</template>

<style scoped>
.ui-panel {
  margin-top: var(--s-5);
  border: 1px solid var(--hairline);
  border-radius: 14px;
  padding: var(--s-5);
  background: var(--bg);
}
.ui-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);
  flex-wrap: wrap;
  margin-bottom: var(--s-4);
}
.eyebrow {
  font-family: var(--mono);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: .14em;
  color: var(--text-3);
}
.ui-tabs { display: flex; gap: 4px; flex-wrap: wrap; }
.ui-tab {
  padding: 5px 11px;
  border: 1px solid var(--hairline);
  background: var(--bg);
  color: var(--text-2);
  border-radius: 999px;
  font-family: var(--mono);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: .08em;
  cursor: pointer;
  transition: background .15s, color .15s, border-color .15s;
}
.ui-tab:hover { color: var(--text); border-color: var(--text); }
.ui-tab.active { background: var(--text); color: var(--bg); border-color: var(--text); }
.micro {
  font-family: var(--mono);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: .12em;
  color: var(--text-3);
  margin-bottom: var(--s-3);
}

/* AUDIT */
.audit-grid {
  display: grid;
  gap: 1px;
  background: var(--hairline);
  border-radius: 8px;
  overflow: hidden;
}
.audit-cell {
  padding: 8px 4px;
  text-align: center;
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 600;
  min-height: 36px;
}
.audit-cell.head { padding: 0; min-height: 24px; }
.audit-cell.fail { opacity: .5; }
.audit-legend {
  display: flex;
  gap: 6px;
  margin-top: var(--s-3);
  flex-wrap: wrap;
}
.audit-legend .badge {
  font-family: var(--mono);
  font-size: 9px;
  padding: 4px 8px;
  border-radius: 4px;
  letter-spacing: .04em;
  border: 1px solid var(--hairline);
  color: var(--text-2);
}
.audit-legend .badge.aaa { background: #0a0a0a; color: #fff; border-color: #0a0a0a; }
.audit-legend .badge.aa { background: #1f1f1f; color: #fff; border-color: #1f1f1f; }
.audit-legend .badge.aa-lg { background: #4a4a4a; color: #fff; border-color: #4a4a4a; }
.audit-legend .badge.fail { background: var(--bg); color: #c00; border-color: #c00; }

/* STATES */
.state-row {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: var(--s-3);
  margin-bottom: var(--s-3);
  align-items: center;
}
.state-label {
  font-family: var(--mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: var(--text-2);
}
.state-cells {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}
.state-cell { display: flex; flex-direction: column; gap: 4px; }
.swatch-preview { height: 32px; border-radius: 6px; border: 1px solid var(--hairline); }
.state-meta {
  display: flex;
  flex-direction: column;
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: .04em;
}
.state-name { color: var(--text-3); text-transform: uppercase; }
.copyable { cursor: pointer; color: var(--text); }
.copyable:hover { opacity: .55; }

/* 60-30-10 */
.rule-canvas { aspect-ratio: 16 / 7; min-height: 240px; }
.rule-bg {
  width: 100%; height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6%;
  border-radius: 12px;
}
.rule-fg {
  width: 50%; height: 75%;
  border-radius: 10px;
  padding: 4%;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: #0a0a0a;
}
.rule-pop {
  align-self: flex-end;
  padding: 8px 18px;
  border-radius: 999px;
  color: #fff;
  font-family: var(--sans);
  font-size: 12px;
  font-weight: 600;
}
.rule-text h3 {
  margin: 0 0 6px;
  font-family: var(--sans);
  font-style: italic;
  font-weight: 700;
  font-size: 18px;
}
.rule-text p {
  font-size: 11px;
  line-height: 1.5;
  margin: 0;
  opacity: .85;
}

/* TOKENS */
.token-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
  margin-bottom: var(--s-3);
}
.token-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  border: 1px solid var(--hairline);
  border-radius: 8px;
}
.token-swatch { width: 32px; height: 32px; border-radius: 6px; }
.token-meta { display: flex; flex-direction: column; min-width: 0; }
.token-key {
  font-family: var(--mono);
  font-size: 10px;
  text-transform: lowercase;
  color: var(--text);
}
.token-hex {
  font-family: var(--mono);
  font-size: 9px;
  color: var(--text-3);
  letter-spacing: .04em;
}
.copy-btn {
  padding: 7px 14px;
  border: 1px solid var(--text);
  background: var(--bg);
  color: var(--text);
  border-radius: 8px;
  font-family: var(--mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .08em;
  cursor: pointer;
}
.copy-btn:hover { background: var(--text); color: var(--bg); }

/* THEME */
.theme-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s-3);
}
.theme-mode {
  border-radius: 12px;
  padding: var(--s-4);
  border: 1px solid var(--hairline);
}
.theme-label {
  font-family: var(--mono);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: .12em;
  margin-bottom: 8px;
  opacity: .65;
}
.theme-row {
  display: grid;
  grid-template-columns: 14px 1fr auto;
  gap: 8px;
  align-items: center;
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: .04em;
  padding: 3px 0;
}
.theme-row .dot { width: 12px; height: 12px; border-radius: 3px; }
.theme-row .key { opacity: .85; }
.theme-row .val { opacity: .7; }

/* SHADCN */
.code {
  background: #0a0a0a;
  color: #f5f5f5;
  padding: var(--s-4);
  border-radius: 10px;
  font-family: var(--mono);
  font-size: 11px;
  line-height: 1.55;
  overflow: auto;
  margin-bottom: var(--s-3);
  max-height: 380px;
}

@media (max-width: 720px) {
  .state-row { grid-template-columns: 1fr; }
  .state-cells { grid-template-columns: repeat(3, 1fr); }
  .theme-grid { grid-template-columns: 1fr; }
}
</style>
