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
    const html = document.documentElement;
    const body = document.body;
    if (mode.value === "dark") {
      html.setAttribute("data-theme", "dark");
      body?.setAttribute("data-theme", "dark");
    } else {
      html.removeAttribute("data-theme");
      body?.removeAttribute("data-theme");
    }
  }
  apply();

  watch(mode, (v) => {
    try { localStorage.setItem(KEY, v); } catch {}
    apply();
  }, { flush: "post" });

  function toggle() {
    mode.value = mode.value === "dark" ? "light" : "dark";
  }

  return { mode, toggle };
});
