<script setup lang="ts">
import { useThemeStore } from "@/stores/theme";
import { useToastStore } from "@/stores/toast";
const theme = useThemeStore();
const toast = useToastStore();

function onClick() {
  theme.toggle();
  toast.show(theme.mode === "dark" ? "Dark mode" : "Light mode");
}
</script>

<template>
  <button
    class="theme-fab"
    :class="{ dark: theme.mode === 'dark' }"
    @click="onClick"
    :aria-label="theme.mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
    :title="theme.mode === 'dark' ? 'Currently dark · click for light' : 'Currently light · click for dark'"
  >
    <span class="icon">
      <!-- Sun (shown in light mode) -->
      <svg v-if="theme.mode !== 'dark'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="4"/>
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
      </svg>
      <!-- Moon (shown in dark mode) -->
      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    </span>
  </button>
</template>

<style scoped>
.theme-fab {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 999;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, .25);
  background: rgba(20, 20, 20, .82);
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, .25);
  transition: transform .15s, background .2s, color .2s, border-color .2s;
}
.theme-fab:not(.dark) {
  background: rgba(255, 255, 255, .9);
  color: #0a0a0a;
  border-color: rgba(0, 0, 0, .15);
  box-shadow: 0 6px 20px rgba(0, 0, 0, .1);
}
.theme-fab:hover { transform: scale(1.06); }
.theme-fab:active { transform: scale(.96); }
.icon { width: 18px; height: 18px; display: inline-flex; }
.icon svg { width: 100%; height: 100%; }

@media (max-width: 480px) {
  .theme-fab { top: 12px; right: 12px; width: 40px; height: 40px; }
}
</style>
