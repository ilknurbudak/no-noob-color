<script setup lang="ts">
import { useToastStore } from "@/stores/toast";
const toast = useToastStore();
</script>

<template>
  <div class="toast" :class="{ show: toast.visible }" role="status" aria-live="polite">
    {{ toast.message }}
  </div>
</template>

<style scoped>
.toast {
  position: fixed;
  bottom: 96px;
  left: 50%;
  transform: translateX(-50%) translateY(10px);
  background: var(--text);
  color: var(--bg);
  padding: 10px 18px;
  border-radius: 999px;
  font-family: var(--mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .1em;
  z-index: 300;
  opacity: 0;
  pointer-events: none;
  transition: opacity .25s, transform .25s;
  white-space: nowrap;
  box-shadow: 0 12px 40px rgba(0, 0, 0, .18);
  font-weight: 500;
}
.toast.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
</style>
