// Shared types across the app

export type RGB = [number, number, number];

export interface Swatch {
  rgb: RGB;
  L: number;          // CIE Lab L*
  chroma: number;     // sqrt(a*a + b*b)
  weight?: number;    // [0..1] proportion of the source image (when extracted)
  apiMeta?: any;      // raw API response for this swatch (when from FastAPI)
}

export type Palette = Swatch[];

export interface Persona {
  id: string;
  name: string;
  desc: string;
  profile: ColorProfile;
  wcagMin: number;
  preferred: ExportFormat;
  bias: string;
  size: number;
  creativity: number;
  variations: VariationMode;
}

export type ColorProfile = "sRGB" | "Display P3" | "Adobe RGB" | "CMYK";

export type Harmony =
  | "auto"
  | "monochromatic"
  | "analogous"
  | "complementary"
  | "triadic"
  | "split-complementary"
  | "tetradic";

export type Temperature = "any" | "warm" | "cool";

export type VariationMode = "off" | "tints" | "shades" | "tones" | "all";

export type ExportFormat =
  | "procreate"
  | "ase"
  | "tailwind"
  | "css"
  | "json"
  | "svg"
  | "text";

export type ColorBlindMode = "normal" | "protanopia" | "deuteranopia" | "tritanopia";

export interface MoodSettings {
  harmony: Harmony;
  temperature: Temperature;
  keyword: string;
  prompt: string;
  wcagMin: number;
  size: number;
  creativity: number;
  variations: VariationMode;
  cbPreview: ColorBlindMode;
}

export interface LibraryItem {
  id: string;
  ts: number;
  palette: Swatch[];
  thumb: string;       // dataURL
  source: "photo" | "generate";
}
