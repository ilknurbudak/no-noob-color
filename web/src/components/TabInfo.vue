<script setup lang="ts">
defineProps<{
  eyebrow: string;
  title: string;
  lead: string;
}>();
</script>

<template>
  <section class="tab-info">
    <div class="tab-info-eyebrow">{{ eyebrow }}</div>
    <h2 class="tab-info-title">{{ title }}</h2>
    <p class="tab-info-lead">{{ lead }}</p>
    <ul class="tab-info-grid">
      <slot />
    </ul>
  </section>
</template>

<style scoped>
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
.tab-info-grid :slotted(li) {
  font-size: 12px;
  line-height: 1.55;
  color: rgba(255, 255, 255, .72);
  padding-left: var(--s-3);
  border-left: 1px solid rgba(255, 255, 255, .18);
}
.tab-info-grid :slotted(li) strong {
  display: block;
  color: #ffffff;
  font-weight: 600;
  margin-bottom: 4px;
  font-size: 10.5px;
  text-transform: uppercase;
  letter-spacing: .1em;
  font-family: var(--mono);
}
@media (max-width: 720px) {
  .tab-info { padding: var(--s-5) var(--s-4); border-radius: 12px; }
  .tab-info-title { font-size: 20px; }
}
</style>
