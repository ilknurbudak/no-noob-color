import { defineStore } from "pinia";
import { ref, watch } from "vue";

const KEY = "nnc_theme";

export const useThemeStore = defineStore("theme", () => {
  const mode = ref<"light" | "dark">((() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === "dark" || saved === "light") return saved;
    } catch {}
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  })());

  function apply() {
    if (mode.value === "dark") document.documentElement.dataset.theme = "dark";
    else delete document.documentElement.dataset.theme;
  }
  apply();

  watch(mode, (v) => {
    try { localStorage.setItem(KEY, v); } catch {}
    apply();
  });

  function toggle() {
    mode.value = mode.value === "dark" ? "light" : "dark";
  }

  return { mode, toggle };
});
