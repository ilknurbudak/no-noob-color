<script setup lang="ts">
interface Release {
  version: string;
  date: string;
  highlights: string[];
}

// Hand-curated milestone log. For full git history, see GitHub.
const RELEASES: Release[] = [
  {
    version: "0.7.0",
    date: "2026-05-01",
    highlights: [
      "Library overhaul: search · folders · tags · star · diff mode · share links · realtime sync · bulk JSON export-import",
      "Daily taste training with carousel rotation; liked colors saved to a dedicated Library tab",
      "Profile page with account info + library stats + sign-out",
      "Email verification + password reset flows",
      "Glossary with 40+ terms covering color science, accessibility, production, UI",
      "6-piece tips section in Blog with quick how-tos",
      "Privacy + Terms pages, full SEO + OG metadata",
      "PWA install + offline asset caching, lazy thumbnails, image preprocessing",
      "404 page, About page with library credits",
    ],
  },
  {
    version: "0.6.0",
    date: "2026-04-30",
    highlights: [
      "10 persona panels: UI · Illustrator · Concept · Cinema · Brand · Print · Material 3 · Fashion · Content",
      "Each persona has 4-6 dedicated tabs with tools tuned to that workflow",
      "Color blindness preview (Brettel/Viénot) on all palette strips",
      "Reference image extraction composable shared across views",
      "Prompt-to-palette TR/EN bias parser, ~150 keyword entries",
    ],
  },
  {
    version: "0.5.0",
    date: "2026-04-30",
    highlights: [
      "Python API expansion: CIEDE2000, CVD simulation, 11-stop tonal scale (OKLCH), Material 3 (HCT), Glasbey distinct palettes, SLIC segment + skin-aware extract, .cube LUT export, ACES space transforms, Pantone-like closest match",
      "LLM bridge: /llm/prompt-to-palette via OpenAI or Apify (env-gated)",
    ],
  },
  {
    version: "0.4.0",
    date: "2026-04-30",
    highlights: [
      "Blog: 4th nav tab, 8 in-depth articles + 4 live demo components (RGB→Lab, contrast, hue picker, gamut)",
      "PocketBase BaaS integration: signup/login/me, palette CRUD with thumbnails, row-level ownership rules",
      "Auth UI with persistent session, Library cloud sync indicator",
    ],
  },
  {
    version: "0.3.0",
    date: "2026-04-30",
    highlights: [
      "Vue 3 + Vite + TypeScript scaffold replacing single-file HTML prototype",
      "Pinia stores for theme · persona · library · profile · toast",
      "PaletteStrip + PaletteStrips components with Pantone-style metadata",
      "ExportMenu with 7 formats (Procreate, ASE, Tailwind, CSS, JSON, SVG, text)",
    ],
  },
  {
    version: "0.2.0",
    date: "2026-04-29",
    highlights: [
      "Python FastAPI microservice: /extract/kmeans · /harmonize · /contrast · /convert",
      "colour-science + scikit-learn + Pillow + numpy stack",
      "Frontend → API bridge with auto-detection and local k-means fallback",
    ],
  },
  {
    version: "0.1.0",
    date: "2026-04-28",
    highlights: [
      "Initial single-file HTML prototype",
      "k-means in CIELAB with mode-snap to honest pixels",
      "Pantone-style swatch strips with WCAG inline",
      "Procreate .swatches + Adobe .ase export, hand-rolled binary writers",
      "Persona system v1 (UI / Illustrator / Print / Brand / Game / Editorial)",
      "Taste training carousel + harmony rules + temperature filter",
    ],
  },
];
</script>

<template>
  <section class="changelog">
    <header class="head">
      <span class="eyebrow">Changelog</span>
      <h1>Major milestones, in reverse.</h1>
      <p class="lead">
        A curated log of what shipped when. For the full git history with
        every typo fix and CSS tweak, see
        <a href="https://github.com/ilknurbudak/no-noob-color/commits/main" target="_blank" rel="noopener noreferrer">
          GitHub commits
        </a>.
      </p>
    </header>

    <div class="releases">
      <article v-for="r in RELEASES" :key="r.version" class="release">
        <div class="release-head">
          <span class="version">{{ r.version }}</span>
          <span class="date">{{ r.date }}</span>
        </div>
        <ul>
          <li v-for="(h, i) in r.highlights" :key="i">{{ h }}</li>
        </ul>
      </article>
    </div>
  </section>
</template>

<style scoped>
.changelog { max-width: 720px; margin: 0 auto; padding-bottom: var(--s-7); }
.head {
  margin-bottom: var(--s-6);
  border-bottom: 1px solid var(--hairline);
  padding-bottom: var(--s-5);
}
.eyebrow {
  font-family: var(--mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .14em;
  color: var(--text-3);
}
.head h1 {
  font-family: var(--sans);
  font-style: italic;
  font-weight: 800;
  font-size: 36px;
  letter-spacing: -.02em;
  margin: var(--s-3) 0;
}
.lead {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-2);
  margin: 0;
}
.lead a { color: var(--text); text-decoration: underline; }

.releases { display: flex; flex-direction: column; gap: var(--s-5); }
.release {
  border-left: 2px solid var(--hairline);
  padding-left: var(--s-4);
  position: relative;
}
.release::before {
  content: "";
  position: absolute;
  left: -7px;
  top: 4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--bg);
  border: 2px solid var(--text);
}
.release-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: var(--s-3);
}
.version {
  font-family: var(--mono);
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -.01em;
}
.date {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--text-3);
  letter-spacing: .04em;
}
.release ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.release li {
  font-size: 13px;
  line-height: 1.5;
  color: var(--text);
  padding-left: 14px;
  position: relative;
}
.release li::before {
  content: "·";
  position: absolute;
  left: 0;
  color: var(--text-3);
}
</style>
