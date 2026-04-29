import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { ColorProfile, RGB } from "@/types";

const KEY = "nnc_profile";

const TRANSFORMS: Record<ColorProfile, (rgb: RGB) => RGB> = {
  "sRGB": (rgb) => rgb,
  "Display P3": ([r, g, b]) => {
    const m = 0.96; const grey = (r + g + b) / 3;
    return [r * m + grey * (1 - m), g * m + grey * (1 - m), b * m + grey * (1 - m)];
  },
  "Adobe RGB": ([r, g, b]) => [Math.min(255, r * 0.98), Math.min(255, g * 1.02), b * 0.96],
  "CMYK": ([r, g, b]) => {
    const grey = 0.299 * r + 0.587 * g + 0.114 * b; const m = 0.78;
    return [r * m + grey * (1 - m), g * m + grey * (1 - m), b * m + grey * (1 - m)];
  },
};

export const PROFILES: ColorProfile[] = ["sRGB", "Display P3", "Adobe RGB", "CMYK"];

export const useProfileStore = defineStore("profile", () => {
  const current = ref<ColorProfile>((() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved && (PROFILES as readonly string[]).includes(saved)) return saved as ColorProfile;
    } catch {}
    return "sRGB";
  })());

  function set(p: ColorProfile) {
    current.value = p;
    try { localStorage.setItem(KEY, p); } catch {}
  }

  const transform = computed(() => TRANSFORMS[current.value]);

  return { current, set, transform };
});
