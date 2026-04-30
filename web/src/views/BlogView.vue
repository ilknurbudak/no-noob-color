<script setup lang="ts">
import { useRouter } from "vue-router";
import { POSTS } from "@/data/blog/posts";

const router = useRouter();

function open(slug: string) {
  router.push({ name: "blog-post", params: { slug } });
}
</script>

<template>
  <section>
    <header class="blog-head">
      <div class="eyebrow">Field notes · color science for working artists</div>
      <h1>Why this works the way it does.</h1>
      <p class="lead">
        Eight short pieces on the math, history, and human factors behind the
        colors you ship — in this app, on a screen, on paper, in a film.
      </p>
    </header>

    <div class="post-grid">
      <article
        v-for="(p, i) in POSTS"
        :key="p.slug"
        class="post-card"
        @click="open(p.slug)"
      >
        <div class="num">{{ String(i + 1).padStart(2, "0") }}</div>
        <div class="meta">
          <span>{{ p.eyebrow }}</span>
          <span class="dot">·</span>
          <span>{{ p.readingTime }}</span>
        </div>
        <h2>{{ p.title }}</h2>
        <p>{{ p.lead }}</p>
        <span class="cta">read →</span>
      </article>
    </div>
  </section>
</template>

<style scoped>
.blog-head {
  margin-bottom: var(--s-7);
  border-bottom: 1px solid var(--hairline);
  padding-bottom: var(--s-5);
}
.eyebrow {
  font-family: var(--mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .14em;
  color: var(--text-3);
  margin-bottom: var(--s-3);
}
.blog-head h1 {
  font-family: var(--sans);
  font-size: 40px;
  font-weight: 800;
  font-style: italic;
  letter-spacing: -.025em;
  line-height: 1.05;
  margin: 0 0 var(--s-3);
  color: var(--text);
}
.blog-head .lead {
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-2);
  max-width: 620px;
  margin: 0;
}
.post-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--s-4);
}
.post-card {
  position: relative;
  border: 1px solid var(--hairline);
  border-radius: 14px;
  padding: var(--s-5);
  background: var(--bg);
  cursor: pointer;
  transition: transform .15s, border-color .15s, box-shadow .15s;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 240px;
}
.post-card:hover {
  transform: translateY(-2px);
  border-color: var(--text);
  box-shadow: 0 14px 36px rgba(0, 0, 0, .07);
}
.post-card .num {
  position: absolute;
  top: var(--s-4);
  right: var(--s-4);
  font-family: var(--mono);
  font-size: 11px;
  color: var(--text-3);
  font-weight: 600;
  letter-spacing: .06em;
}
.post-card .meta {
  font-family: var(--mono);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: .12em;
  color: var(--text-3);
}
.post-card .meta .dot { margin: 0 6px; }
.post-card h2 {
  font-family: var(--sans);
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -.015em;
  line-height: 1.18;
  margin: 0;
  color: var(--text);
}
.post-card p {
  font-size: 13px;
  line-height: 1.55;
  color: var(--text-2);
  margin: 0;
  flex: 1;
}
.post-card .cta {
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .14em;
  color: var(--text-2);
  margin-top: 4px;
}
.post-card:hover .cta { color: var(--text); }

@media (max-width: 720px) {
  .blog-head h1 { font-size: 30px; }
}
</style>
