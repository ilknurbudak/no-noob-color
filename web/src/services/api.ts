// Bridge to the Python FastAPI microservice.
// Tries multiple base URLs; vite proxy makes "/api" work in dev.

import type { Swatch } from "@/types";

const CANDIDATES = ["/api", "http://localhost:8000", "http://127.0.0.1:8000"];

let baseUrl: string | null = null;
let lastChecked = 0;

async function pingOnce(url: string, timeoutMs = 1500): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url + "/", { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return false;
    const data = await res.json();
    return data && typeof data.name === "string" && data.name.includes("noob");
  } catch {
    return false;
  }
}

export async function detectApi(force = false): Promise<string | null> {
  const now = Date.now();
  if (!force && baseUrl && now - lastChecked < 30_000) return baseUrl;
  for (const u of CANDIDATES) {
    if (await pingOnce(u)) {
      baseUrl = u;
      lastChecked = now;
      return baseUrl;
    }
  }
  baseUrl = null;
  lastChecked = now;
  return null;
}

export function getApiUrl(): string | null {
  return baseUrl;
}

export async function extractKMeans(
  blob: Blob,
  n = 5,
  colorSpace: "lab" | "rgb" | "oklab" = "lab",
): Promise<Swatch[]> {
  if (!baseUrl) throw new Error("API not connected");
  const fd = new FormData();
  fd.append("image", blob, "upload.jpg");
  fd.append("n", String(n));
  fd.append("color_space", colorSpace);
  const res = await fetch(baseUrl + "/extract/kmeans", { method: "POST", body: fd });
  if (!res.ok) throw new Error(`extract failed: ${res.status}`);
  const data = await res.json();
  return data.palette.map((sw: any) => ({
    rgb: [sw.rgb.r, sw.rgb.g, sw.rgb.b] as [number, number, number],
    L: sw.lab.L,
    chroma: Math.sqrt(sw.lab.a * sw.lab.a + sw.lab.b * sw.lab.b),
    weight: sw.weight,
    apiMeta: sw,
  }));
}

export async function harmonize(
  baseHex: string,
  rule: string,
  n = 5,
): Promise<Swatch[]> {
  if (!baseUrl) throw new Error("API not connected");
  const res = await fetch(baseUrl + "/harmonize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base: baseHex, rule, n }),
  });
  if (!res.ok) throw new Error(`harmonize failed: ${res.status}`);
  const data = await res.json();
  return data.palette.map((sw: any) => ({
    rgb: [sw.rgb.r, sw.rgb.g, sw.rgb.b] as [number, number, number],
    L: sw.lab.L,
    chroma: Math.sqrt(sw.lab.a * sw.lab.a + sw.lab.b * sw.lab.b),
    apiMeta: sw,
  }));
}

export async function auditPalette(hexes: string[]) {
  if (!baseUrl) throw new Error("API not connected");
  const res = await fetch(baseUrl + "/contrast/audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ palette: hexes }),
  });
  if (!res.ok) throw new Error(`audit failed: ${res.status}`);
  return res.json();
}
