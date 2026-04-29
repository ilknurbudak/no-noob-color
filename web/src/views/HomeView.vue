<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();

const cards = [
  {
    num: "01 · Photo",
    title: "From a photograph",
    body: "Drop any image. Five honest colors extracted via k-means in perceptual L*a*b* space and snapped to actual pixels. WCAG ratios on every swatch.",
    cta: "Start with a photo",
    go: "photo",
  },
  {
    num: "02 · Generate",
    title: "From your own taste",
    body: "Pick 30 colors you love. From there, generate palettes using color theory: monochromatic, analogous, complementary, triadic, split-comp, tetradic — biased by mood, temperature, prompt.",
    cta: "Train your palette",
    go: "generate",
  },
  {
    num: "03 · Library",
    title: "Saved & ready",
    body: "Your saves persist locally. Generate-saved palettes restore as animated block-grid art; photo-saved palettes restore with their source thumbnail. Filter by source, export anytime.",
    cta: "Open library",
    go: "library",
  },
];

function go(name: string) {
  router.push({ name });
}
</script>

<template>
  <section class="home">
    <div class="home-hero">
      <h1>no noob <em>color</em></h1>
      <p>
        A minimalist, on-device color palette tool for artists and illustrators.
        Capture a palette from any photo, generate harmonies from your own taste,
        export straight to Procreate or Adobe — all without ever leaving your browser.
      </p>
    </div>

    <div class="home-cards">
      <button v-for="c in cards" :key="c.go" class="home-card" type="button" @click="go(c.go)">
        <div class="home-card-num">{{ c.num }}</div>
        <h3>{{ c.title }}</h3>
        <p>{{ c.body }}</p>
        <div class="home-card-cta">{{ c.cta }} →</div>
      </button>
    </div>

    <section class="tab-info">
      <div class="tab-info-eyebrow">Why no noob color</div>
      <h2 class="tab-info-title">Built for illustrators, not engineers</h2>
      <p class="tab-info-lead">
        Every other palette tool feels designed by software people. no noob color speaks the language
        of artists: gestural ink, hand-drawn UI, real WCAG numbers, ICC color profiles, Procreate-native
        export. No subscriptions, no telemetry, no backend — your taste lives on your device.
      </p>
      <ul class="tab-info-grid">
        <li>
          <strong>On-device</strong>
          All processing happens in your browser. Nothing uploaded, nothing stored on a server (unless you turn on the optional Python service).
        </li>
        <li>
          <strong>Open-source typography</strong>
          Inter + JetBrains Mono (SIL OFL), Tippy.js for tooltips (MIT). No proprietary dependencies.
        </li>
        <li>
          <strong>Honest math</strong>
          k-means in L*a*b* perceptual space, mode-snapped to actual pixels. WCAG contrast on every swatch.
        </li>
        <li>
          <strong>Multi-format export</strong>
          Procreate .swatches, Adobe .ase, Tailwind, CSS variables, JSON, SVG poster — all generated client-side.
        </li>
      </ul>
    </section>
  </section>
</template>

<style scoped>
.home-hero {
  text-align: center;
  padding: var(--s-7) 0 var(--s-8);
  border-bottom: 1px solid var(--hairline);
  margin-bottom: var(--s-7);
}
.home-hero h1 {
  font-family: var(--sans);
  font-weight: 800;
  font-style: italic;
  font-size: 64px;
  letter-spacing: -.035em;
  line-height: 1;
  margin: 0 0 var(--s-4);
  color: var(--text);
}
.home-hero p {
  font-size: 17px;
  line-height: 1.6;
  color: var(--text-2);
  max-width: 580px;
  margin: 0 auto;
}
.home-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--s-4);
  margin-bottom: var(--s-7);
}
.home-card {
  border: 1px solid var(--hairline);
  border-radius: 14px;
  padding: var(--s-5);
  background: var(--bg);
  cursor: pointer;
  transition: border-color .15s, transform .15s, box-shadow .2s;
  text-align: left;
  font-family: inherit;
  color: var(--text);
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
}
.home-card:hover {
  border-color: var(--text);
  transform: translateY(-4px);
  box-shadow: 0 14px 32px rgba(0, 0, 0, .08);
}
.home-card-num {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: .12em;
  margin-bottom: var(--s-2);
}
.home-card h3 {
  font-family: var(--sans);
  font-weight: 700;
  font-size: 22px;
  letter-spacing: -.015em;
  margin: 0;
}
.home-card p {
  font-size: 13px;
  line-height: 1.55;
  color: var(--text-2);
  margin: 0 0 var(--s-3);
}
.home-card-cta {
  font-family: var(--mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .12em;
  color: var(--text);
  font-weight: 600;
  margin-top: auto;
}
@media (max-width: 720px) {
  .home-hero { padding: var(--s-5) 0 var(--s-6); }
  .home-hero h1 { font-size: 44px; }
  .home-hero p { font-size: 14px; }
}

.tab-info {
  margin-top: var(--s-7);
  padding: var(--s-6) var(--s-5);
  background: #0a0a0a;
  color: #ffffff;
  border-radius: 16px;
}
.tab-info-eyebrow {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, .55);
  margin-bottom: var(--s-2);
  font-weight: 500;
}
.tab-info-title {
  font-family: var(--sans);
  font-weight: 700;
  font-style: italic;
  font-size: 24px;
  letter-spacing: -.02em;
  margin: 0 0 var(--s-3);
  color: #ffffff;
}
.tab-info-lead {
  font-size: 13px;
  line-height: 1.65;
  color: rgba(255, 255, 255, .82);
  max-width: 700px;
  margin: 0 0 var(--s-5);
}
.tab-info-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--s-4);
}
.tab-info-grid li {
  font-size: 12px;
  line-height: 1.55;
  color: rgba(255, 255, 255, .72);
  padding-left: var(--s-3);
  border-left: 1px solid rgba(255, 255, 255, .18);
}
.tab-info-grid li strong {
  display: block;
  color: #ffffff;
  font-weight: 600;
  margin-bottom: 4px;
  font-size: 10.5px;
  text-transform: uppercase;
  letter-spacing: .1em;
  font-family: var(--mono);
}
</style>
