import { ref } from "vue";
import type { Swatch } from "@/types";
import { extractPalette, makeThumbnail } from "@/services/extract";
import { extractKMeans, getApiUrl } from "@/services/api";

export function useRefImage(defaultN = 5) {
  const palette = ref<Swatch[]>([]);
  const thumbnail = ref<string | null>(null);
  const imageSrc = ref<string | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function loadFile(file: File, n = defaultN) {
    loading.value = true;
    error.value = null;
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });

      const img: HTMLImageElement = await new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = dataUrl;
      });

      imageSrc.value = dataUrl;
      thumbnail.value = makeThumbnail(img);

      let result: Swatch[] | null = null;
      if (getApiUrl()) {
        try { result = await extractKMeans(file, n, "lab"); }
        catch (e) { console.warn("API extract failed, falling back:", e); }
      }
      if (!result) result = await extractPalette(img, n);
      palette.value = result;
    } catch (e: any) {
      error.value = e?.message || "extract failed";
    } finally {
      loading.value = false;
    }
  }

  function reset() {
    palette.value = [];
    thumbnail.value = null;
    imageSrc.value = null;
    error.value = null;
  }

  return { palette, thumbnail, imageSrc, loading, error, loadFile, reset };
}
