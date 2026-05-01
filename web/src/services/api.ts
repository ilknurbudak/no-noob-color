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

// ---------- auth + palettes (PocketBase via Python) ----------

const TOKEN_KEY = "nnc:token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

function requireBase(): string {
  if (!baseUrl) throw new Error("API not connected");
  return baseUrl;
}

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const t = getToken();
  return t ? { ...extra, Authorization: `Bearer ${t}` } : extra;
}

async function jsonOrThrow(res: Response): Promise<any> {
  if (!res.ok) {
    let msg = `${res.status}`;
    try { const j = await res.json(); msg = j.detail || j.message || msg; } catch {}
    throw new Error(msg);
  }
  return res.status === 204 ? null : res.json();
}

export async function signup(email: string, password: string) {
  const res = await fetch(requireBase() + "/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await jsonOrThrow(res);
  setToken(data.token);
  return data;
}

export async function login(email: string, password: string) {
  const res = await fetch(requireBase() + "/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await jsonOrThrow(res);
  setToken(data.token);
  return data;
}

export function logout() {
  setToken(null);
}

export async function me() {
  const res = await fetch(requireBase() + "/auth/me", { headers: authHeaders() });
  return jsonOrThrow(res);
}

export interface RemotePalette {
  id: string;
  name: string;
  source: string;
  swatches: Array<{ hex: string; rgb: [number, number, number]; name?: string }>;
  thumbnail: string | null;
  created: string;
  updated: string;
}

export async function listPalettes(): Promise<RemotePalette[]> {
  const res = await fetch(requireBase() + "/palettes", { headers: authHeaders() });
  const data = await jsonOrThrow(res);
  return data.items;
}

export async function savePalette(
  name: string,
  swatches: Swatch[],
  source: "photo" | "generate" | "prompt" | "ref" = "photo",
  thumbnail?: Blob,
): Promise<RemotePalette> {
  const payload = swatches.map((s) => ({
    hex: "#" + s.rgb.map((v) => v.toString(16).padStart(2, "0")).join(""),
    rgb: s.rgb,
    name: (s as any).name,
  }));
  if (thumbnail) {
    const fd = new FormData();
    fd.append("name", name);
    fd.append("swatches", JSON.stringify(payload));
    fd.append("source", source);
    fd.append("thumbnail", thumbnail, "thumb.png");
    const res = await fetch(requireBase() + "/palettes/with-thumbnail", {
      method: "POST",
      headers: authHeaders(),
      body: fd,
    });
    return jsonOrThrow(res);
  }
  const res = await fetch(requireBase() + "/palettes", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ name, swatches: payload, source }),
  });
  return jsonOrThrow(res);
}

export async function deletePalette(id: string): Promise<void> {
  const res = await fetch(requireBase() + `/palettes/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  await jsonOrThrow(res);
}

// ---------- Material 3 ----------

export interface MaterialTheme {
  seed: string;
  schemes: { light: Record<string, string>; dark: Record<string, string> };
  palettes: Record<string, Record<string, string>>;
  stops: number[];
  roles: string[];
}

export async function materialTheme(seed: string): Promise<MaterialTheme> {
  const res = await fetch(requireBase() + "/material/theme", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ seed }),
  });
  return jsonOrThrow(res);
}

export async function materialCss(seed: string): Promise<{ css: string }> {
  const res = await fetch(requireBase() + "/material/css-variables", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ seed }),
  });
  return jsonOrThrow(res);
}
