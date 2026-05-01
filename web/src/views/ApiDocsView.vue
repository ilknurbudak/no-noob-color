<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getApiUrl, detectApi } from "@/services/api";

interface EndpointGroup {
  name: string;
  desc: string;
  routes: { method: string; path: string; what: string }[];
}

const apiBase = ref<string | null>(null);
const status = ref<"checking" | "live" | "offline">("checking");

onMounted(async () => {
  status.value = "checking";
  apiBase.value = await detectApi(true);
  status.value = apiBase.value ? "live" : "offline";
});

const GROUPS: EndpointGroup[] = [
  {
    name: "Extract",
    desc: "Image → palette",
    routes: [
      { method: "POST", path: "/extract/kmeans", what: "k-means in Lab/RGB/OKLab, mode-snapped" },
      { method: "POST", path: "/extract/colorthief", what: "median-cut (faster)" },
      { method: "POST", path: "/extract/segment", what: "SLIC superpixel + weighted k-means" },
      { method: "POST", path: "/extract/skin-aware", what: "exclude / keep / annotate skin tones" },
    ],
  },
  {
    name: "Generate",
    desc: "Palette generation",
    routes: [
      { method: "POST", path: "/harmonize", what: "base color + rule → palette" },
      { method: "POST", path: "/glasbey/generate", what: "max-distinct N colors via Glasbey" },
      { method: "POST", path: "/tones/generate", what: "single seed → 11-stop OKLCH scale" },
      { method: "POST", path: "/tones/tailwind", what: "+ Tailwind config snippet" },
      { method: "POST", path: "/material/theme", what: "Material 3 — roles + tonal palettes + light/dark" },
      { method: "POST", path: "/material/css-variables", what: "Material 3 as CSS custom properties" },
      { method: "POST", path: "/llm/prompt-to-palette", what: "freeform prompt → palette via OpenAI / Apify" },
      { method: "GET",  path: "/llm/status", what: "configured providers" },
    ],
  },
  {
    name: "Color science",
    desc: "Math, contrast, conversions",
    routes: [
      { method: "POST", path: "/contrast/wcag", what: "pair contrast ratio + AA/AAA grade" },
      { method: "POST", path: "/contrast/audit", what: "NxN palette contrast matrix" },
      { method: "POST", path: "/contrast/delta-e", what: "CIE76 / CIE94 / CIEDE2000 difference" },
      { method: "POST", path: "/contrast/delta-e/matrix", what: "pairwise palette ΔE" },
      { method: "POST", path: "/convert/spaces", what: "RGB ↔ Lab ↔ OKLab ↔ CMYK ↔ HSL" },
      { method: "POST", path: "/colorblind/simulate", what: "Brettel/Viénot CVD" },
      { method: "POST", path: "/aces/convert", what: "sRGB / Rec.709 / Rec.2020 / P3 / ACEScg / ACES2065-1" },
      { method: "GET",  path: "/aces/spaces", what: "list supported RGB spaces" },
      { method: "POST", path: "/lut/cube", what: ".cube 3D LUT download (DaVinci, Premiere, OBS)" },
      { method: "POST", path: "/pantone/match", what: "closest Pantone-like CIEDE2000 match" },
      { method: "GET",  path: "/pantone/dataset", what: "info about bundled subset" },
    ],
  },
  {
    name: "Auth",
    desc: "PocketBase user management",
    routes: [
      { method: "POST", path: "/auth/signup", what: "create user + auto-login" },
      { method: "POST", path: "/auth/login", what: "email + password" },
      { method: "GET",  path: "/auth/me", what: "current user from bearer token" },
      { method: "GET",  path: "/auth/health", what: "PocketBase reachability" },
      { method: "POST", path: "/auth/verify/request", what: "send verification email" },
      { method: "POST", path: "/auth/password/request-reset", what: "send reset email" },
      { method: "POST", path: "/auth/password/confirm-reset", what: "confirm reset with token" },
    ],
  },
  {
    name: "Palettes",
    desc: "Saved library (require bearer token)",
    routes: [
      { method: "GET",    path: "/palettes", what: "list user's palettes" },
      { method: "POST",   path: "/palettes", what: "save (JSON)" },
      { method: "POST",   path: "/palettes/with-thumbnail", what: "save with image (multipart)" },
      { method: "GET",    path: "/palettes/{id}", what: "fetch one" },
      { method: "PATCH",  path: "/palettes/{id}", what: "rename / change source" },
      { method: "DELETE", path: "/palettes/{id}", what: "remove" },
    ],
  },
];

function methodClass(m: string): string {
  return `m-${m.toLowerCase()}`;
}
</script>

<template>
  <section class="api">
    <header class="head">
      <span class="eyebrow">API reference</span>
      <h1>Twenty-eight endpoints. Every one a palette decision.</h1>
      <p class="lead">
        The Python service is the single source of color truth. The frontend
        falls back to local k-means and HSV harmonies when this is offline,
        so palette extraction works without it — but everything below adds
        rigor (CIEDE2000, ACES, Material 3 HCT, Pantone) you can't get
        client-side.
      </p>
      <div class="status-row">
        <span class="status-pill" :class="status">
          <span class="dot"></span>
          <template v-if="status === 'checking'">checking…</template>
          <template v-else-if="status === 'live'">live · {{ apiBase }}</template>
          <template v-else>offline · start uvicorn</template>
        </span>
        <a v-if="status === 'live'" :href="apiBase + '/docs'" target="_blank" class="link">open Swagger UI ↗</a>
        <a v-if="status === 'live'" :href="apiBase + '/redoc'" target="_blank" class="link">open ReDoc ↗</a>
      </div>
    </header>

    <div v-for="g in GROUPS" :key="g.name" class="group">
      <div class="group-head">
        <h2>{{ g.name }}</h2>
        <span class="group-desc">{{ g.desc }}</span>
      </div>
      <div class="routes">
        <div v-for="r in g.routes" :key="r.path" class="route">
          <span class="method" :class="methodClass(r.method)">{{ r.method }}</span>
          <code class="path">{{ r.path }}</code>
          <span class="what">{{ r.what }}</span>
        </div>
      </div>
    </div>

    <div class="footer-note">
      <p>
        Full schemas with request/response shapes are auto-generated by
        FastAPI — open Swagger UI above for try-it-out interactivity.
      </p>
      <p>
        Use the built-in <code>/llm/prompt-to-palette</code> endpoint by
        setting <code>OPENAI_API_KEY</code> or <code>APIFY_API_TOKEN</code> in
        the API service environment.
      </p>
    </div>
  </section>
</template>

<style scoped>
.api { max-width: 800px; margin: 0 auto; padding-bottom: var(--s-7); }
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
  font-size: 32px;
  letter-spacing: -.02em;
  margin: var(--s-3) 0;
  line-height: 1.15;
}
.lead {
  font-size: 14px;
  line-height: 1.65;
  color: var(--text-2);
  margin: 0 0 var(--s-3);
  max-width: 620px;
}
.status-row {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 11px;
  border: 1px solid var(--hairline);
  border-radius: 999px;
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: .04em;
}
.status-pill .dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--text-3);
}
.status-pill.live .dot { background: #2a8a2a; }
.status-pill.offline .dot { background: #c00; }
.status-pill.checking .dot { background: var(--text-2); animation: pulse 1s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .3; } }
.link {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--text);
  text-decoration: underline;
  letter-spacing: .04em;
}

.group { margin-bottom: var(--s-5); }
.group-head {
  display: flex;
  align-items: baseline;
  gap: var(--s-3);
  margin-bottom: var(--s-3);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--hairline);
}
.group-head h2 {
  font-family: var(--sans);
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}
.group-desc {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--text-3);
  letter-spacing: .04em;
}
.routes { display: flex; flex-direction: column; }
.route {
  display: grid;
  grid-template-columns: 60px max-content 1fr;
  gap: 12px;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid var(--hairline);
}
.route:last-child { border-bottom: none; }
.method {
  font-family: var(--mono);
  font-size: 9px;
  font-weight: 700;
  text-align: center;
  padding: 3px 6px;
  border-radius: 4px;
  letter-spacing: .04em;
}
.method.m-get    { background: #e8f4ea; color: #2a7a3a; }
.method.m-post   { background: #e8eef8; color: #2a4a8a; }
.method.m-patch  { background: #fdf3da; color: #8a6a1a; }
.method.m-delete { background: #fae5e5; color: #8a2a2a; }
.path {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--text);
  background: var(--surface-2);
  padding: 3px 8px;
  border-radius: 4px;
}
.what {
  font-size: 12px;
  color: var(--text-2);
  line-height: 1.4;
}

.footer-note {
  margin-top: var(--s-5);
  padding: var(--s-4);
  background: var(--surface-2);
  border-radius: 10px;
}
.footer-note p {
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  color: var(--text-2);
}
.footer-note p + p { margin-top: 8px; }
.footer-note code {
  font-family: var(--mono);
  font-size: 11px;
  background: var(--bg);
  padding: 1px 5px;
  border-radius: 3px;
}

@media (max-width: 600px) {
  .route { grid-template-columns: 50px 1fr; }
  .route .what { grid-column: 1 / -1; padding-left: 62px; }
}
</style>
