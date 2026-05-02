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
    const themeStr = isDark ? "dark" : "light";
    const bg = isDark ? "#0d0d0d" : "#ffffff";
    const fg = isDark ? "#ffffff" : "#000000";

    // 1. Data attributes (html + body)
    html.dataset.theme = themeStr;
    if (body) body.dataset.theme = themeStr;

    // 2. Class flags (html + body, light + dark explicit so CSS that
    //    targets either side always matches)
    html.classList.toggle("dark", isDark);
    html.classList.toggle("light", !isDark);
    body?.classList.toggle("dark", isDark);
    body?.classList.toggle("light", !isDark);

    // 3. Direct inline styles with priority — beats any later CSS
    html.style.setProperty("background-color", bg, "important");
    html.style.setProperty("color", fg, "important");
    if (body) {
      body.style.setProperty("background-color", bg, "important");
      body.style.setProperty("color", fg, "important");
    }

    // 4. color-scheme so form controls + scrollbars match
    html.style.colorScheme = themeStr;

    // 5. Debug breadcrumb so we can see this fired in console
    if (typeof window !== "undefined") {
      (window as any).__nncTheme = { mode: themeStr, ts: Date.now() };
    }
  }
  apply();

  watch(mode, (v) => {
    try { localStorage.setItem(KEY, v); } catch {}
    apply();
  });

  function toggle() {
    mode.value = mode.value === "dark" ? "light" : "dark";
    // Persist + apply IMMEDIATELY — don't trust the watch chain in case
    // pinia setup-store reactivity has timing issues.
    try { localStorage.setItem(KEY, mode.value); } catch {}
    apply();
  }

  function setMode(next: "light" | "dark") {
    if (next === mode.value) return;
    mode.value = next;
    try { localStorage.setItem(KEY, next); } catch {}
    apply();
  }

  return { mode, toggle, setMode };
});
