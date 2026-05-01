<script setup lang="ts">
import { ref } from "vue";
import BlogLabDemo from "@/components/blog/BlogLabDemo.vue";
import BlogContrastDemo from "@/components/blog/BlogContrastDemo.vue";
import BlogHueDemo from "@/components/blog/BlogHueDemo.vue";
import BlogGamutDemo from "@/components/blog/BlogGamutDemo.vue";

type Demo = "lab" | "contrast" | "hue" | "gamut";
const active = ref<Demo>("lab");

const DEMOS: { id: Demo; label: string; desc: string }[] = [
  { id: "lab", label: "RGB → CIELAB", desc: "drag the sliders, watch L*a*b* shift" },
  { id: "contrast", label: "WCAG contrast", desc: "two-color picker with grade badges" },
  { id: "hue", label: "HSV picker", desc: "hue ribbon + sat/val sliders" },
  { id: "gamut", label: "sRGB → CMYK", desc: "see what print will dull" },
];
</script>

<template>
  <section class="playground">
    <header class="head">
      <span class="eyebrow">Playground</span>
      <h1>Color science you can poke.</h1>
      <p class="lead">
        Four interactive demos that ship with the blog, all on one page so
        you can switch between them quickly. Use these as a teaching aid,
        a sanity check, or just to convince yourself how a color space behaves.
      </p>
    </header>

    <nav class="demo-nav">
      <button v-for="d in DEMOS" :key="d.id"
        class="demo-tab"
        :class="{ active: active === d.id }"
        @click="active = d.id"
      >
        <span class="d-label">{{ d.label }}</span>
        <span class="d-desc">{{ d.desc }}</span>
      </button>
    </nav>

    <div class="demo-stage">
      <BlogLabDemo v-if="active === 'lab'" />
      <BlogContrastDemo v-else-if="active === 'contrast'" />
      <BlogHueDemo v-else-if="active === 'hue'" />
      <BlogGamutDemo v-else-if="active === 'gamut'" />
    </div>
  </section>
</template>

<style scoped>
.playground { max-width: 760px; margin: 0 auto; padding-bottom: var(--s-7); }
.head {
  margin-bottom: var(--s-5);
  border-bottom: 1px solid var(--hairline);
  padding-bottom: var(--s-4);
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
  line-height: 1.1;
}
.lead {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-2);
  margin: 0;
  max-width: 580px;
}
.demo-nav {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 6px;
  margin-bottom: var(--s-4);
}
.demo-tab {
  text-align: left;
  padding: 12px 14px;
  border: 1px solid var(--hairline);
  background: var(--bg);
  color: var(--text);
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 3px;
  transition: background .15s, border-color .15s;
}
.demo-tab:hover { border-color: var(--text); }
.demo-tab.active {
  background: var(--text);
  color: var(--bg);
  border-color: var(--text);
}
.d-label {
  font-family: var(--sans);
  font-size: 12px;
  font-weight: 600;
}
.d-desc {
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: .04em;
  opacity: .7;
}
.demo-stage { min-height: 280px; }
</style>
