<script setup lang="ts">
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();
const cameraInput = ref<HTMLInputElement | null>(null);

const tabs = [
  { name: "generate", label: "Generate" },
  { name: "library",  label: "Library" },
  { name: "blog",     label: "Blog" },
];

function openCamera() {
  // capture="environment" tells iOS/Android to launch the rear camera.
  // Fallback (desktop): regular file picker.
  cameraInput.value?.click();
}

function onCapture(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  // Stash the file in sessionStorage as a dataURL so GenerateView can pick
  // it up after navigation. Resize handled in useRefImage.
  const reader = new FileReader();
  reader.onload = () => {
    try {
      sessionStorage.setItem("nnc_camera_pending", reader.result as string);
      sessionStorage.setItem("nnc_camera_pending_name", file.name);
    } catch {}
    router.push({ name: "generate", query: { fromCamera: "1" } });
  };
  reader.readAsDataURL(file);

  // Reset input so re-tap fires again
  (e.target as HTMLInputElement).value = "";
}
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

    <button class="nav-btn camera" @click="openCamera" aria-label="Open camera">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 7h3l2-3h6l2 3h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z"/>
        <circle cx="12" cy="13" r="4"/>
      </svg>
    </button>

    <input
      ref="cameraInput"
      type="file"
      accept="image/*"
      capture="environment"
      hidden
      @change="onCapture"
    />
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
  align-items: center;
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

.nav-btn.camera {
  width: 40px;
  height: 40px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--text);
  color: var(--bg);
  margin-left: 4px;
}
.nav-btn.camera:hover { opacity: .85; background: var(--text); }
.nav-btn.camera svg { width: 18px; height: 18px; }

@media (max-width: 720px) {
  .nav-btn { padding: 11px 18px; font-size: 12px; min-height: var(--tap); }
  .nav-btn.camera { width: var(--tap); height: var(--tap); }
}
@media (max-width: 480px) {
  .bottom-nav { bottom: var(--s-4); padding: 5px; }
  .nav-btn { padding: 10px 12px; font-size: 11px; }
}
</style>
