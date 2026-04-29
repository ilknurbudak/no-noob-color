// Local-fallback k-means palette extraction in L*a*b* space, with mode-snap
// to actual pixels (so swatches are guaranteed to exist in the source image).

import type { RGB, Swatch } from "@/types";
import { rgbToLab, rgbToHsv } from "./color";

interface PixelRecord {
  L: number; a: number; b: number;
  r: number; g: number; bl: number; // bl = blue (avoid TS clash with bbox)
}

function kmeans(points: number[][], k: number, maxIter = 18) {
  const centroids: number[][] = [];
  centroids.push(points[Math.floor(Math.random() * points.length)].slice(0, 3));
  while (centroids.length < k) {
    const dists = points.map((p) => {
      let m = Infinity;
      for (const c of centroids) {
        const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2;
        if (d < m) m = d;
      }
      return m;
    });
    const sum = dists.reduce((s, x) => s + x, 0) || 1;
    let r = Math.random() * sum;
    let idx = 0;
    for (let i = 0; i < dists.length; i++) {
      r -= dists[i];
      if (r <= 0) { idx = i; break; }
    }
    centroids.push(points[idx].slice(0, 3));
  }
  const assignments = new Array(points.length).fill(0);
  for (let iter = 0; iter < maxIter; iter++) {
    let changed = 0;
    for (let pi = 0; pi < points.length; pi++) {
      const p = points[pi];
      let best = 0, bestD = Infinity;
      for (let i = 0; i < k; i++) {
        const c = centroids[i];
        const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2;
        if (d < bestD) { bestD = d; best = i; }
      }
      if (assignments[pi] !== best) { changed++; assignments[pi] = best; }
    }
    const sums = Array.from({ length: k }, () => [0, 0, 0, 0]);
    for (let pi = 0; pi < points.length; pi++) {
      const p = points[pi]; const a = assignments[pi];
      sums[a][0] += p[0]; sums[a][1] += p[1]; sums[a][2] += p[2]; sums[a][3] += 1;
    }
    for (let i = 0; i < k; i++) {
      if (sums[i][3] === 0) continue;
      centroids[i] = [sums[i][0] / sums[i][3], sums[i][1] / sums[i][3], sums[i][2] / sums[i][3]];
    }
    if (changed === 0) break;
  }
  return { centroids, assignments };
}

export async function extractPalette(img: HTMLImageElement, n = 5): Promise<Swatch[]> {
  const TARGET = 200;
  const scale = TARGET / Math.max(img.naturalWidth, img.naturalHeight);
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;

  const points: number[][] = [];
  const pixels: PixelRecord[] = [];
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a < 200) continue;
    const [L, A, B] = rgbToLab(r, g, b);
    points.push([L, A, B]);
    pixels.push({ L, a: A, b: B, r, g, bl: b });
  }

  const K = Math.max(n + 2, 6);
  const { assignments } = kmeans(points, K);

  // Per-cluster mode (most common quantized RGB) → real pixel
  const clusters: Array<{ size: number; sumChroma: number; rep: PixelRecord | null; buckets: Map<number, { count: number; px: PixelRecord }> }> = Array.from(
    { length: K },
    () => ({ size: 0, sumChroma: 0, rep: null, buckets: new Map() }),
  );
  for (let pi = 0; pi < pixels.length; pi++) {
    const p = pixels[pi];
    const idx = assignments[pi];
    const cl = clusters[idx];
    cl.size++;
    cl.sumChroma += Math.sqrt(p.a * p.a + p.b * p.b);
    const key = ((p.r >> 3) << 16) | ((p.g >> 3) << 8) | (p.bl >> 3);
    const e = cl.buckets.get(key);
    if (e) e.count++;
    else cl.buckets.set(key, { count: 1, px: p });
  }
  for (const cl of clusters) {
    if (!cl.size) continue;
    let bestCount = 0;
    let best: PixelRecord | null = null;
    for (const e of cl.buckets.values()) {
      if (e.count > bestCount) { bestCount = e.count; best = e.px; }
    }
    cl.rep = best;
  }

  const scored = clusters
    .filter((c) => c.size > 0 && c.rep)
    .map((c) => ({
      cluster: c,
      score: Math.sqrt(c.size) * (c.sumChroma / c.size + 5),
    }))
    .sort((a, b) => b.score - a.score);

  const picked: typeof scored = [];
  for (const s of scored) {
    if (picked.length === n) break;
    const rep = s.cluster.rep!;
    const tooClose = picked.some((p) => {
      const r = p.cluster.rep!;
      return Math.sqrt((rep.L - r.L) ** 2 + (rep.a - r.a) ** 2 + (rep.b - r.b) ** 2) < 14;
    });
    if (!tooClose) picked.push(s);
  }
  while (picked.length < n && picked.length < scored.length) picked.push(scored[picked.length]);

  // Sort by hue for visual coherence
  picked.sort((a, b) => {
    const ha = rgbToHsv(a.cluster.rep!.r, a.cluster.rep!.g, a.cluster.rep!.bl)[0];
    const hb = rgbToHsv(b.cluster.rep!.r, b.cluster.rep!.g, b.cluster.rep!.bl)[0];
    return ha - hb;
  });

  return picked.map((s): Swatch => {
    const r = s.cluster.rep!;
    return {
      rgb: [r.r, r.g, r.bl] as RGB,
      L: r.L,
      chroma: Math.sqrt(r.a * r.a + r.b * r.b),
      weight: s.cluster.size / pixels.length,
    };
  });
}

// Smaller thumbnail for library cards
export function makeThumbnail(img: HTMLImageElement, size = 360): string {
  const canvas = document.createElement("canvas");
  const aspect = img.naturalWidth / img.naturalHeight;
  let w: number, h: number;
  if (aspect >= 1) { w = size; h = Math.round(size / aspect); }
  else { h = size; w = Math.round(size * aspect); }
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.78);
}
