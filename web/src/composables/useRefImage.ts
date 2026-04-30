import { ref } from "vue";
import type { Swatch } from "@/types";
import { extractKMeans, getApiUrl } from "@/services/api";
import { extractPalette, makeThumbnail } from "@/services/extract";

// Drop/select a reference image, get back a palette + dataURL thumbnail.
// API-first, local k-means fallback. Used by Photo view and Generate's
// "use as seed" flow.
export function useRefImage(defaultN = 5) {
  const palette = ref<Swatch[]>([]);
  const dataUrl = ref<string | null>(null);
  const thumb = ref<string | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function load(file: File, n = defaultN): Promise<Swatch[]> {
    loading.value = true;
    error.value = null;
    try {
      const url = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = () => rej(r.error);
        r.readAsDataURL(file);
      });
      const img = await new Promise<HTMLImageElement>((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = () => rej(new Error("image load failed"));
        i.src = url;
      });
      dataUrl.value = url;
      thumb.value = makeThumbnail(img);
      let extracted: Swatch[] | null = null;
      if (getApiUrl()) {
        try { extracted = await extractKMeans(file, n, "lab"); }
        catch (e) { console.warn("API ref extract failed, fallback:", e); }
      }
      if (!extracted) extracted = await extractPalette(img, n);
      palette.value = extracted;
      return extracted;
    } catch (e: any) {
      error.value = e.message || "ref image failed";
      throw e;
    } finally {
      loading.value = false;
    }
  }

  function clear() {
    palette.value = [];
    dataUrl.value = null;
    thumb.value = null;
    error.value = null;
  }

  return { palette, dataUrl, thumb, loading, error, load, clear };
}
