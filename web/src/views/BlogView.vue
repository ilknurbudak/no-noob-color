<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { POSTS, TIPS } from "@/data/blog/posts";

const router = useRouter();
const query = ref("");

function open(slug: string) {
  router.push({ name: "blog-post", params: { slug } });
}

function matches(text: string, q: string): boolean {
  if (!q) return true;
  return text.toLowerCase().includes(q.toLowerCase());
}

function searchHaystack(post: typeof POSTS[number]): string {
  return [
    post.title,
    post.lead,
    post.eyebrow,
    ...post.sections.filter(s => s.type === "prose" || s.type === "quote").map((s: any) => s.body),
  ].join(" ");
}

const filteredDeep = computed(() =>
  POSTS.filter(p => matches(searchHaystack(p), query.value))
);
const filteredTips = computed(() =>
  TIPS.filter(p => matches(searchHaystack(p), query.value))
);
</script>

<template>
  <section>
    <header class="blog-head">
      <div class="eyebrow">Field notes · color science for working artists</div>
      <h1>Why this works the way it does.</h1>
      <p class="lead">
        Long-form pieces on the math and history behind the colors you ship,
        plus quick how-to tips for everyday production work.
      </p>
      <div class="blog-links">
        <button @click="router.push('/glossary')" class="blog-link">browse glossary →</button>
      </div>
    </header>

    <div class="search-row">
      <input
        v-model="query"
        class="blog-search"
        type="text"
        placeholder="search articles · tips · keywords"
      />
      <button v-if="query" class="search-clear" @click="query = ''" aria-label="Clear">×</button>
    </div>

    <div v-if="!filteredDeep.length && !filteredTips.length" class="empty">
      <p>No articles match "{{ query }}".</p>
    </div>

    <div v-if="filteredDeep.length" class="section-head">
      <span class="section-eyebrow">Deep dives</span>
      <h2 class="section-title">{{ filteredDeep.length }} {{ query ? 'matching' : '' }} long-form {{ filteredDeep.length === 1 ? 'piece' : 'pieces' }}</h2>
    </div>

    <div v-if="filteredDeep.length" class="post-grid">
      <article
        v-for="(p, i) in filteredDeep"
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

    <div v-if="filteredTips.length" class="section-head tips-head">
      <span class="section-eyebrow">Tips</span>
      <h2 class="section-title">{{ filteredTips.length }} {{ query ? 'matching' : '' }} quick how-{{ filteredTips.length === 1 ? 'to' : 'tos' }}</h2>
    </div>

    <div v-if="filteredTips.length" class="tips-grid">
      <article
        v-for="t in filteredTips"
        :key="t.slug"
        class="tip-card"
        @click="open(t.slug)"
      >
        <div class="tip-meta">
          <span>{{ t.eyebrow }}</span>
        </div>
        <h3>{{ t.title }}</h3>
        <p>{{ t.lead }}</p>
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
  margin: 0 0 var(--s-3);
}
.blog-links { display: flex; gap: 12px; }
.blog-link {
  background: none;
  border: none;
  color: var(--text);
  font-family: var(--mono);
  font-size: 11px;
  text-decoration: underline;
  cursor: pointer;
  letter-spacing: .04em;
  padding: 0;
}
.blog-link:hover { opacity: .7; }
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

.search-row {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--bg);
  padding: var(--s-3) 0;
  margin-bottom: var(--s-4);
  display: flex;
  align-items: center;
}
.blog-search {
  width: 100%;
  border: 1px solid var(--hairline);
  background: var(--bg);
  color: var(--text);
  padding: 11px 18px;
  border-radius: 999px;
  font-family: var(--mono);
  font-size: 12px;
  letter-spacing: .04em;
}
.blog-search:focus { outline: none; border-color: var(--text); }
.search-clear {
  position: absolute;
  right: 8px;
  width: 26px; height: 26px;
  border: none;
  background: var(--surface-2);
  color: var(--text-2);
  border-radius: 50%;
  font-size: 14px;
  cursor: pointer;
}
.search-clear:hover { background: var(--text); color: var(--bg); }
.empty {
  padding: var(--s-6) var(--s-5);
  text-align: center;
  color: var(--text-3);
  font-family: var(--mono);
  font-size: 12px;
  letter-spacing: .04em;
}

.section-head {
  margin: var(--s-7) 0 var(--s-4);
  display: flex;
  align-items: baseline;
  gap: var(--s-3);
  flex-wrap: wrap;
}
.section-head:first-of-type { margin-top: 0; }
.section-eyebrow {
  font-family: var(--mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .14em;
  color: var(--text-3);
}
.section-title {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--text-2);
  font-weight: 500;
  margin: 0;
  text-transform: lowercase;
  letter-spacing: .04em;
}
.tips-head { border-top: 1px solid var(--hairline); padding-top: var(--s-5); }
.tips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--s-3);
}
.tip-card {
  border: 1px solid var(--hairline);
  border-radius: 10px;
  padding: var(--s-4);
  background: var(--surface-2);
  cursor: pointer;
  transition: transform .15s, border-color .15s, box-shadow .15s;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.tip-card:hover {
  transform: translateY(-2px);
  border-color: var(--text);
  box-shadow: 0 10px 24px rgba(0, 0, 0, .05);
}
.tip-meta {
  font-family: var(--mono);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: .12em;
  color: var(--text-3);
}
.tip-card h3 {
  font-family: var(--sans);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -.005em;
  line-height: 1.25;
  margin: 0;
  color: var(--text);
}
.tip-card p {
  font-size: 12px;
  line-height: 1.55;
  color: var(--text-2);
  margin: 0;
}

@media (max-width: 720px) {
  .blog-head h1 { font-size: 30px; }
}
</style>
