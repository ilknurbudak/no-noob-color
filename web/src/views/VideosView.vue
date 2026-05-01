<script setup lang="ts">
interface VideoSlot {
  title: string;
  duration: string;
  status: "planned" | "scripted" | "recorded" | "published";
  url?: string;
  description: string;
}

const VIDEOS: VideoSlot[] = [
  {
    title: "60-second tour: drop a photo, save a palette, ship .swatches",
    duration: "1:00",
    status: "planned",
    description: "The fastest possible introduction. Drop a photo, watch k-means run, hit save, export to Procreate. For first-time visitors who want to know if this is worth their time.",
  },
  {
    title: "Generate a brand palette in 5 minutes",
    duration: "5:00",
    status: "scripted",
    description: "Pick a seed color in Generate, switch to Brand persona, walk through the 6 tabs (psychology, brand lock, gamut, matched pair, trademark, seasonal). Export Tailwind config + CSS vars at the end.",
  },
  {
    title: "Color script for a short film, start to finish",
    duration: "10:00",
    status: "scripted",
    description: "Real workflow: pull a still from the location, extract a palette, push it through the Concept panel's 5-act timeline, export each act as a .cube LUT, load into DaVinci Resolve. Includes the mistakes.",
  },
  {
    title: "Material 3 theme from one seed",
    duration: "4:00",
    status: "planned",
    description: "What HCT actually does, why Material You feels coherent, how to use the Material persona panel to hand a developer a complete CSS variables file in two clicks.",
  },
  {
    title: "WCAG audit a brand palette in 90 seconds",
    duration: "1:30",
    status: "planned",
    description: "Open UI persona, hit the audit tab, walk through the contrast matrix. Find the failing pairs. Suggest the fixes (darker hover, lighter text, adjacent-color reshuffle).",
  },
  {
    title: "Daily taste training — what your palette is telling you",
    duration: "3:00",
    status: "planned",
    description: "What the bias profile actually tracks (12 hue bins × 5 sat × 5 val), how 30 days of training reshapes generated palettes, what 'consistent taste' looks like vs 'I'm chasing trends'.",
  },
];

function statusLabel(s: VideoSlot["status"]): string {
  return ({
    planned: "planned",
    scripted: "script ready",
    recorded: "in edit",
    published: "live",
  })[s];
}
</script>

<template>
  <section class="videos">
    <header class="head">
      <span class="eyebrow">Video tutorials</span>
      <h1>Workflows, in motion.</h1>
      <p class="lead">
        Six short videos planned. Production-quality, no fluff, real
        screen recording with palette files and grade outputs you can
        download alongside.
      </p>
      <p class="status">
        Currently in pre-production. Subscribe via the
        <a href="https://github.com/ilknurbudak/no-noob-color" target="_blank" rel="noopener">GitHub repo</a>
        for the release feed. Each video lands here with embed + transcript.
      </p>
    </header>

    <div class="list">
      <article v-for="(v, i) in VIDEOS" :key="i" class="video-row" :class="v.status">
        <div class="meta">
          <span class="num">{{ String(i + 1).padStart(2, "0") }}</span>
          <span class="duration">{{ v.duration }}</span>
          <span class="status-pill">{{ statusLabel(v.status) }}</span>
        </div>
        <h2>{{ v.title }}</h2>
        <p>{{ v.description }}</p>
        <a v-if="v.url" :href="v.url" target="_blank" class="watch">watch ↗</a>
      </article>
    </div>
  </section>
</template>

<style scoped>
.videos { max-width: 720px; margin: 0 auto; padding-bottom: var(--s-7); }
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
  margin: 0 0 var(--s-3);
}
.status {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--text-3);
  margin: 0;
  letter-spacing: .04em;
}
.status a { color: var(--text); text-decoration: underline; }

.list { display: flex; flex-direction: column; gap: var(--s-4); }
.video-row {
  border: 1px solid var(--hairline);
  border-radius: 12px;
  padding: var(--s-4);
}
.video-row.published { border-color: var(--text); }
.meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: var(--s-2);
}
.num {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--text-3);
  letter-spacing: .04em;
}
.duration {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--text-2);
  background: var(--surface-2);
  padding: 2px 7px;
  border-radius: 999px;
}
.status-pill {
  font-family: var(--mono);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: .1em;
  padding: 2px 7px;
  border-radius: 999px;
  color: var(--text-3);
  border: 1px solid var(--hairline);
}
.video-row.scripted .status-pill { color: #b97500; border-color: rgba(220,150,0,.3); }
.video-row.recorded .status-pill { color: #2a4a8a; border-color: rgba(30,80,180,.3); }
.video-row.published .status-pill { color: #2a8a2a; border-color: rgba(42,138,42,.3); }
.video-row h2 {
  font-family: var(--sans);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -.015em;
  margin: 0 0 6px;
  line-height: 1.25;
}
.video-row p {
  font-size: 13px;
  line-height: 1.55;
  color: var(--text-2);
  margin: 0;
}
.watch {
  display: inline-block;
  margin-top: var(--s-3);
  font-family: var(--mono);
  font-size: 11px;
  color: var(--text);
  text-decoration: underline;
}
</style>
