import { ref } from "vue";
import type { Swatch } from "@/types";
import { extractKMeans, getApiUrl } from "@/services/api";
import { extractPalette, makeThumbnail } from "@/services/extract";

// Resize a File to max dimension `maxDim` while preserving aspect ratio.
// Returns a Blob (image/jpeg quality 0.85). If the input is already small,
// returns the original file untouched.
async function preprocessImage(file: File, maxDim = 1200): Promise<File | Blob> {
  if (file.size < 200_000) return file;
  try {
    const bitmap = await createImageBitmap(file);
    if (Math.max(bitmap.width, bitmap.height) <= maxDim) return file;
    const scale = maxDim / Math.max(bitmap.width, bitmap.height);
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.85 });
    return blob;
  } catch (e) {
    console.warn("image preprocess failed, sending original:", e);
    return file;
  }
}

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
        try {
          const preprocessed = await preprocessImage(file);
          extracted = await extractKMeans(preprocessed as Blob, n, "lab");
        }
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
