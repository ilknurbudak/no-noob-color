<script setup lang="ts">
const credits = [
  { name: "colour-science", desc: "industry-grade Python color math (CIE, OKLab, ICC, ACES)", url: "https://www.colour-science.org/" },
  { name: "scikit-learn", desc: "k-means clustering for image extraction", url: "https://scikit-learn.org/" },
  { name: "scikit-image", desc: "SLIC superpixel segmentation, Lab transforms", url: "https://scikit-image.org/" },
  { name: "Material Color Utilities", desc: "Google's HCT + Material 3 theme generator", url: "https://github.com/material-foundation/material-color-utilities" },
  { name: "Glasbey", desc: "maximum-distinct palette generation in CIECAM02-UCS", url: "https://github.com/lmcinnes/glasbey" },
  { name: "PocketBase", desc: "auth + realtime + file storage in one Go binary", url: "https://pocketbase.io" },
  { name: "FastAPI", desc: "Python web framework", url: "https://fastapi.tiangolo.com" },
  { name: "Vue 3 + Vite", desc: "frontend", url: "https://vuejs.org" },
  { name: "Pinia", desc: "state management", url: "https://pinia.vuejs.org" },
  { name: "Inter, JetBrains Mono", desc: "typography (SIL OFL)", url: "https://rsms.me/inter/" },
];
</script>

<template>
  <section class="about">
    <header class="head">
      <span class="eyebrow">About</span>
      <h1>A color tool that respects what you're trying to do.</h1>
      <p class="lead">
        no noob color started as a single-file HTML prototype for an artist who wanted
        a Procreate-friendly palette extractor. It grew because color is a deeper
        problem than a hex picker can carry — mediums conflict, perception
        misleads, and accessibility math is never optional.
      </p>
    </header>

    <div class="section">
      <h2>What it does</h2>
      <ul>
        <li><strong>Extract</strong> — drop a photo, get k-means swatches in CIELAB or OKLab</li>
        <li><strong>Generate</strong> — base color + harmony rule + persona-aware sizing</li>
        <li><strong>Prompt</strong> — multi-word EN/TR keyword bias + AI provider bridge</li>
        <li><strong>Persona panels</strong> — UI, Illustrator, Concept, Cinema, Brand, Print, Material 3, Fashion, Content</li>
        <li><strong>Library</strong> — search · folders · tags · star · diff · share · export · realtime sync</li>
        <li><strong>Blog</strong> — eight pieces on color science with live demos</li>
      </ul>
    </div>

    <div class="section">
      <h2>Stack</h2>
      <ul class="stack">
        <li>
          <span class="layer">Frontend</span>
          Vue 3 · Vite · TypeScript · Pinia · Vue Router · Tippy
        </li>
        <li>
          <span class="layer">Backend</span>
          Python 3.12 · FastAPI · uvicorn · numpy · sklearn · scikit-image
          · colour-science · Pillow · Material Color Utilities · Glasbey
        </li>
        <li>
          <span class="layer">BaaS</span>
          PocketBase (SQLite, auth, file storage, realtime SSE)
        </li>
      </ul>
    </div>

    <div class="section">
      <h2>Credits</h2>
      <ul class="credits">
        <li v-for="c in credits" :key="c.url">
          <a :href="c.url" target="_blank" rel="noopener noreferrer">
            <span class="title">{{ c.name }}</span>
            <span class="desc">{{ c.desc }}</span>
            <span class="url">{{ c.url.replace(/^https?:\/\//, "").replace(/\/$/, "") }} ↗</span>
          </a>
        </li>
      </ul>
    </div>

    <div class="section">
      <h2>Made by</h2>
      <p>
        Ilknur Budak — fine artist building tools for working creatives.
        <a href="https://github.com/ilknurbudak/no-noob-color" target="_blank" rel="noopener noreferrer">
          source on GitHub ↗
        </a>
      </p>
    </div>
  </section>
</template>

<style scoped>
.about { max-width: 720px; margin: 0 auto; padding-bottom: var(--s-7); }
.head { margin-bottom: var(--s-7); border-bottom: 1px solid var(--hairline); padding-bottom: var(--s-5); }
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
  line-height: 1.1;
  margin: var(--s-3) 0 var(--s-3);
  color: var(--text);
}
.lead {
  font-size: 14px;
  line-height: 1.65;
  color: var(--text-2);
  margin: 0;
}
.section {
  margin-bottom: var(--s-6);
}
.section h2 {
  font-family: var(--mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .14em;
  color: var(--text-3);
  margin: 0 0 var(--s-3);
  font-weight: 600;
}
.section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.section li {
  font-size: 13px;
  line-height: 1.6;
  color: var(--text);
  padding: 6px 0;
  border-bottom: 1px solid var(--hairline);
}
.section li:last-child { border-bottom: none; }
.section li strong { color: var(--text); font-weight: 600; }
.stack li {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: var(--s-3);
}
.stack .layer {
  font-family: var(--mono);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: .12em;
  color: var(--text-3);
  padding-top: 4px;
}
.credits a {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 0;
  text-decoration: none;
  color: var(--text);
  border-bottom: 1px solid var(--hairline);
}
.credits a:hover { background: var(--surface-2); }
.credits .title { font-weight: 600; }
.credits .desc { font-size: 12px; color: var(--text-2); }
.credits .url { font-family: var(--mono); font-size: 10px; color: var(--text-3); letter-spacing: .04em; }
.section p {
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-2);
}
.section p a {
  color: var(--text);
  text-decoration: underline;
}
</style>
