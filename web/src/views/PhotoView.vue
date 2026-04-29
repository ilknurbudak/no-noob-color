<script setup lang="ts">
// TODO (next session): port from prototype/index.html
//   - drop zone + drag/drop animation
//   - k-means extraction (local fallback) + API extraction via @/services/api
//   - palette strips with WCAG badges
//   - save-to-library + export menu (Procreate, ASE, Tailwind, CSS, JSON, SVG, text)
//   - color profile selector
//   - copy-to-clipboard on swatch click
</script>

<template>
  <section class="placeholder">
    <h2>Photo</h2>
    <p>Coming soon — drop a photo, extract a palette via k-means in L*a*b*.</p>
    <p class="port">Migration in progress — see <code>prototype/index.html</code> for the working version.</p>
  </section>
</template>

<style scoped>
.placeholder {
  text-align: center;
  padding: var(--s-7) var(--s-5);
  border: 1px dashed var(--hairline);
  border-radius: 14px;
  color: var(--text-2);
}
.placeholder h2 {
  font-family: var(--sans);
  font-weight: 800;
  font-style: italic;
  font-size: 32px;
  letter-spacing: -.02em;
  margin-bottom: var(--s-3);
  color: var(--text);
}
.placeholder .port {
  font-family: var(--mono);
  font-size: 11px;
  margin-top: var(--s-4);
  color: var(--text-3);
}
.placeholder code {
  background: var(--surface-2);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
}
</style>
