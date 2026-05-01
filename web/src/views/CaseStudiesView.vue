<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { CASE_STUDIES, findCaseStudy } from "@/data/caseStudies";

const route = useRoute();
const router = useRouter();

const slug = computed(() => String(route.params.slug || ""));
const study = computed(() => slug.value ? findCaseStudy(slug.value) : null);
</script>

<template>
  <!-- INDEX -->
  <section v-if="!slug" class="cs">
    <header class="head">
      <span class="eyebrow">Case studies</span>
      <h1>Receipts.</h1>
      <p class="lead">
        Real projects shipped using these tools. Two so far — both
        documented end-to-end, hex codes and exported file paths included.
      </p>
    </header>

    <div class="grid">
      <article
        v-for="c in CASE_STUDIES" :key="c.slug"
        class="card"
        @click="router.push({ name: 'case-study', params: { slug: c.slug } })"
      >
        <div class="hero" v-if="c.hero">
          <div v-for="(h, i) in c.hero" :key="i" class="hero-cell" :style="{ background: h }"></div>
        </div>
        <div class="card-body">
          <span class="card-eyebrow">{{ c.eyebrow }}</span>
          <h2>{{ c.title }}</h2>
          <p>{{ c.lead }}</p>
          <span class="cta">read →</span>
        </div>
      </article>
    </div>
  </section>

  <!-- DETAIL -->
  <section v-else-if="study" class="cs detail">
    <button class="back" @click="router.push('/case-studies')">← all studies</button>
    <header class="d-head">
      <span class="eyebrow">{{ study.eyebrow }}</span>
      <h1>{{ study.title }}</h1>
      <p class="lead">{{ study.lead }}</p>
      <div v-if="study.hero" class="d-strip">
        <div v-for="(h, i) in study.hero" :key="i" :style="{ background: h }"></div>
      </div>
    </header>

    <div class="sections">
      <section v-for="(s, i) in study.sections" :key="i">
        <h2>{{ s.heading }}</h2>
        <p>{{ s.body }}</p>
      </section>
    </div>

    <div class="takeaway">
      <span class="t-label">Takeaway</span>
      <p>{{ study.takeaway }}</p>
    </div>
  </section>

  <section v-else class="cs">
    <p>Case study not found.</p>
    <button @click="router.push('/case-studies')">back</button>
  </section>
</template>

<style scoped>
.cs { max-width: 800px; margin: 0 auto; padding-bottom: var(--s-7); }
.head, .d-head {
  margin-bottom: var(--s-5);
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
.head h1, .d-head h1 {
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
  line-height: 1.65;
  color: var(--text-2);
  margin: 0 0 var(--s-3);
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--s-4);
}
.card {
  border: 1px solid var(--hairline);
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  transition: transform .15s, border-color .15s;
}
.card:hover { transform: translateY(-2px); border-color: var(--text); }
.hero { display: flex; height: 80px; }
.hero-cell { flex: 1; }
.card-body { padding: var(--s-4); }
.card-eyebrow {
  font-family: var(--mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .12em;
  color: var(--text-3);
}
.card h2 {
  font-family: var(--sans);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -.015em;
  margin: 6px 0 var(--s-3);
  line-height: 1.2;
}
.card p {
  font-size: 13px;
  line-height: 1.55;
  color: var(--text-2);
  margin: 0 0 var(--s-3);
}
.cta {
  font-family: var(--mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .14em;
  color: var(--text-2);
  font-weight: 600;
}

/* DETAIL */
.detail { max-width: 720px; }
.back {
  background: none;
  border: none;
  color: var(--text-2);
  font-family: var(--mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .12em;
  cursor: pointer;
  margin-bottom: var(--s-3);
  padding: 4px 0;
}
.d-strip { display: flex; height: 50px; border-radius: 6px; overflow: hidden; }
.d-strip > div { flex: 1; }

.sections section {
  margin-bottom: var(--s-5);
}
.sections h2 {
  font-family: var(--mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .12em;
  color: var(--text-3);
  font-weight: 600;
  margin: 0 0 var(--s-2);
}
.sections p {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text);
  margin: 0;
}

.takeaway {
  margin-top: var(--s-5);
  padding: var(--s-5);
  background: #0a0a0a;
  color: white;
  border-radius: 14px;
}
.t-label {
  display: block;
  font-family: var(--mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .14em;
  opacity: .55;
  margin-bottom: var(--s-2);
}
.takeaway p {
  font-family: var(--sans);
  font-style: italic;
  font-weight: 500;
  font-size: 16px;
  line-height: 1.55;
  margin: 0;
}
</style>
