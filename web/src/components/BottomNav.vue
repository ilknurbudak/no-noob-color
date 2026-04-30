<script setup lang="ts">
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();

const tabs = [
  { name: "generate", label: "Generate" },
  { name: "photo",    label: "Photo" },
  { name: "library",  label: "Library" },
  { name: "blog",     label: "Blog" },
];
</script>

<template>
  <nav class="bottom-nav" aria-label="Sections">
    <button
      v-for="t in tabs"
      :key="t.name"
      class="nav-btn"
      :class="{ active: route.name === t.name }"
      @click="router.push({ name: t.name })"
    >
      {{ t.label }}
    </button>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: var(--s-5);
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  padding: 6px;
  border-radius: 999px;
  background:
    linear-gradient(var(--bg), var(--bg)) padding-box,
    var(--grad) border-box;
  border: 1px solid transparent;
  display: flex;
  gap: 2px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, .06);
  max-width: calc(100vw - var(--s-5));
}
.nav-btn {
  padding: 10px 22px;
  border: none;
  background: transparent;
  color: var(--text);
  border-radius: 999px;
  font-family: var(--sans);
  font-size: 13px;
  font-weight: 400;
  cursor: pointer;
  transition: font-weight .15s, background .15s;
  letter-spacing: -.005em;
}
.nav-btn.active {
  font-weight: 600;
  color: #0a0a0a;
  background: var(--grad-soft);
}
.nav-btn:hover:not(.active) { background: var(--surface-hover); }
@media (max-width: 720px) {
  .nav-btn { padding: 11px 18px; font-size: 12px; min-height: var(--tap); }
}
@media (max-width: 480px) {
  .bottom-nav { bottom: var(--s-4); padding: 5px; }
  .nav-btn { padding: 10px 12px; font-size: 11px; }
}
</style>
