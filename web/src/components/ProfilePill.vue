<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useProfileStore, PROFILES } from "@/stores/profile";

const profile = useProfileStore();
const open = ref(false);
const root = ref<HTMLElement | null>(null);

const DESCRIPTIONS: Record<string, string> = {
  "sRGB": "screen",
  "Display P3": "Procreate",
  "Adobe RGB": "print prep",
  "CMYK": "offset",
};

function toggle(e: MouseEvent) {
  e.stopPropagation();
  open.value = !open.value;
}
function pick(p: typeof PROFILES[number]) {
  profile.set(p);
  open.value = false;
}
function onDocClick() { open.value = false; }
onMounted(() => document.addEventListener("click", onDocClick));
onUnmounted(() => document.removeEventListener("click", onDocClick));
</script>

<template>
  <div class="wrap" ref="root">
    <button class="profile-pill" @click="toggle">
      <span>{{ profile.current }}</span>
      <span class="chev">▾</span>
    </button>
    <div class="popover" :class="{ open }" @click.stop>
      <button v-for="p in PROFILES" :key="p" :class="{ active: p === profile.current }" @click="pick(p)">
        <span>{{ p }}</span>
        <span class="desc">{{ DESCRIPTIONS[p] }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.wrap { position: relative; display: inline-block; }
.profile-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px;
  border: 1px solid var(--text);
  background: var(--bg);
  color: var(--text);
  border-radius: 999px;
  font-family: var(--mono);
  font-size: 11px;
  cursor: pointer;
  user-select: none;
  transition: background .15s, color .15s;
}
.profile-pill:hover { background: var(--text); color: var(--bg); }
.chev { font-size: 9px; }

.popover {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background: var(--bg);
  border: 1px solid var(--text);
  border-radius: 8px;
  width: 200px;
  z-index: 100;
  display: none;
  overflow: hidden;
}
.popover.open { display: block; }
.popover button {
  width: 100%;
  text-align: left;
  padding: 11px 14px;
  border: none;
  border-bottom: 1px solid var(--hairline);
  background: var(--bg);
  font-family: var(--mono);
  font-size: 11px;
  color: var(--text);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.popover button:last-child { border-bottom: none; }
.popover button:hover { background: var(--surface-hover); }
.popover button.active { background: var(--text); color: var(--bg); }
.popover .desc { font-size: 9px; opacity: .7; }
</style>
