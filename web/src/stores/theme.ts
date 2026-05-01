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
    const isDark = mode.value === "dark";
    const html = document.documentElement;
    const body = document.body;

    // 1. Data attribute (drives CSS variables)
    html.dataset.theme = isDark ? "dark" : "light";

    // 2. Class fallback (in case some scoped CSS uses .dark like Material 3)
    html.classList.toggle("dark", isDark);
    body?.classList.toggle("dark", isDark);

    // 3. Direct inline styles — bulletproof against any CSS specificity
    //    or service-worker-cached stylesheet weirdness
    const bg = isDark ? "#0d0d0d" : "#ffffff";
    const fg = isDark ? "#ffffff" : "#000000";
    html.style.background = bg;
    html.style.color = fg;
    if (body) {
      body.style.background = bg;
      body.style.color = fg;
    }
    // 4. color-scheme so form controls + scrollbars match
    html.style.colorScheme = isDark ? "dark" : "light";
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
