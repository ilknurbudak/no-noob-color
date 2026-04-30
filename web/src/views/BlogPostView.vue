<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { marked } from "marked";
import { findPost, POSTS } from "@/data/blog/posts";
import BlogLabDemo from "@/components/blog/BlogLabDemo.vue";
import BlogContrastDemo from "@/components/blog/BlogContrastDemo.vue";
import BlogHueDemo from "@/components/blog/BlogHueDemo.vue";
import BlogGamutDemo from "@/components/blog/BlogGamutDemo.vue";

const route = useRoute();
const router = useRouter();

marked.setOptions({ breaks: false, gfm: true });

const post = computed(() => findPost(String(route.params.slug)));
const idx = computed(() => POSTS.findIndex((p) => p.slug === post.value?.slug));
const next = computed(() => POSTS[idx.value + 1]);
const prev = computed(() => POSTS[idx.value - 1]);

const demoMap = {
  lab: BlogLabDemo,
  contrast: BlogContrastDemo,
  hue: BlogHueDemo,
  gamut: BlogGamutDemo,
} as const;

function renderProse(body: string): string {
  return marked.parse(body) as string;
}

function go(slug?: string) {
  if (slug) router.push({ name: "blog-post", params: { slug } });
}
</script>

<template>
  <section v-if="post" class="post">
    <button class="back" @click="router.push({ name: 'blog' })">
      ← all posts
    </button>

    <header class="post-head">
      <div class="meta">
        <span>{{ post.eyebrow }}</span>
        <span class="dot">·</span>
        <span>{{ post.readingTime }}</span>
      </div>
      <h1>{{ post.title }}</h1>
      <p class="lead">{{ post.lead }}</p>
    </header>

    <article class="post-body">
      <template v-for="(s, i) in post.sections" :key="i">
        <div v-if="s.type === 'prose'" class="prose" v-html="renderProse(s.body)" />
        <component v-else-if="s.type === 'demo'" :is="demoMap[s.component]" />
        <blockquote v-else-if="s.type === 'quote'" class="quote">
          {{ s.body }}
          <cite v-if="s.cite">— {{ s.cite }}</cite>
        </blockquote>
      </template>
    </article>

    <aside class="sources">
      <div class="sources-eyebrow">Sources & further reading</div>
      <ul>
        <li v-for="src in post.sources" :key="src.url">
          <a :href="src.url" target="_blank" rel="noopener noreferrer">
            <span class="title">{{ src.title }}</span>
            <span v-if="src.blurb" class="blurb">{{ src.blurb }}</span>
            <span class="url">{{ src.url.replace(/^https?:\/\//, "").replace(/\/$/, "") }} ↗</span>
          </a>
        </li>
      </ul>
    </aside>

    <nav class="post-nav">
      <button v-if="prev" class="nav-arrow prev" @click="go(prev.slug)">
        <span class="dir">← previous</span>
        <span class="t">{{ prev.title }}</span>
      </button>
      <span v-else></span>
      <button v-if="next" class="nav-arrow next" @click="go(next.slug)">
        <span class="dir">next →</span>
        <span class="t">{{ next.title }}</span>
      </button>
    </nav>
  </section>

  <section v-else class="not-found">
    <h2>Post not found</h2>
    <button @click="router.push({ name: 'blog' })">back to blog</button>
  </section>
</template>

<style scoped>
.post { max-width: 720px; margin: 0 auto; padding-bottom: var(--s-7); }

.back {
  border: none;
  background: transparent;
  color: var(--text-2);
  font-family: var(--mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .12em;
  cursor: pointer;
  padding: 6px 0;
  margin-bottom: var(--s-4);
}
.back:hover { color: var(--text); }

.post-head { margin-bottom: var(--s-6); }
.meta {
  font-family: var(--mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .14em;
  color: var(--text-3);
  margin-bottom: var(--s-3);
}
.meta .dot { margin: 0 6px; }
.post-head h1 {
  font-family: var(--sans);
  font-size: 36px;
  font-weight: 800;
  font-style: italic;
  letter-spacing: -.02em;
  line-height: 1.1;
  margin: 0 0 var(--s-4);
  color: var(--text);
}
.post-head .lead {
  font-size: 17px;
  line-height: 1.55;
  color: var(--text-2);
  margin: 0;
}

.post-body { margin-top: var(--s-5); }
.prose {
  font-size: 15px;
  line-height: 1.75;
  color: var(--text);
}
.prose :deep(p) { margin: 0 0 var(--s-4); }
.prose :deep(strong) { font-weight: 600; }
.prose :deep(em) { font-style: italic; }
.prose :deep(code) {
  font-family: var(--mono);
  font-size: 13px;
  background: var(--surface-2);
  padding: 1px 5px;
  border-radius: 3px;
}
.prose :deep(ul) { padding-left: 1.4em; margin: var(--s-3) 0; }
.prose :deep(li) { margin-bottom: 6px; }

.quote {
  margin: var(--s-5) 0;
  padding: var(--s-4) var(--s-5);
  border-left: 3px solid var(--text);
  background: var(--surface-2);
  font-size: 15px;
  font-style: italic;
  line-height: 1.55;
  color: var(--text);
  border-radius: 0 8px 8px 0;
}
.quote cite {
  display: block;
  margin-top: 8px;
  font-style: normal;
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: .1em;
  color: var(--text-3);
  text-transform: uppercase;
}

.sources {
  margin: var(--s-7) 0 var(--s-5);
  padding-top: var(--s-5);
  border-top: 1px solid var(--hairline);
}
.sources-eyebrow {
  font-family: var(--mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .14em;
  color: var(--text-3);
  margin-bottom: var(--s-3);
}
.sources ul { list-style: none; padding: 0; margin: 0; }
.sources li { margin-bottom: var(--s-3); }
.sources a {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--s-3);
  border: 1px solid var(--hairline);
  border-radius: 8px;
  text-decoration: none;
  transition: border-color .15s, background .15s;
}
.sources a:hover { border-color: var(--text); background: var(--surface-hover); }
.sources .title { color: var(--text); font-weight: 600; font-size: 13px; }
.sources .blurb { color: var(--text-2); font-size: 12px; line-height: 1.5; }
.sources .url {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--text-3);
  letter-spacing: .04em;
}

.post-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s-3);
  margin-top: var(--s-5);
}
.nav-arrow {
  text-align: left;
  border: 1px solid var(--hairline);
  border-radius: 10px;
  background: var(--bg);
  padding: var(--s-3);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: border-color .15s, background .15s;
}
.nav-arrow:hover { border-color: var(--text); }
.nav-arrow.next { text-align: right; }
.nav-arrow .dir {
  font-family: var(--mono);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: .12em;
  color: var(--text-3);
}
.nav-arrow .t {
  font-family: var(--sans);
  font-size: 13px;
  color: var(--text);
  font-weight: 500;
  line-height: 1.3;
}

.not-found { text-align: center; padding: var(--s-7) 0; }
.not-found button {
  margin-top: var(--s-4);
  padding: 8px 16px;
  border: 1px solid var(--text);
  background: var(--text);
  color: var(--bg);
  border-radius: 8px;
  font-family: var(--mono);
  font-size: 11px;
  cursor: pointer;
}

@media (max-width: 600px) {
  .post-head h1 { font-size: 26px; }
  .post-nav { grid-template-columns: 1fr; }
}
</style>
