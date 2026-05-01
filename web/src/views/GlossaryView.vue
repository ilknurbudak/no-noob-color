<script setup lang="ts">
import { ref, computed } from "vue";

interface Term {
  term: string;
  short: string;
  long: string;
  category: "perception" | "spaces" | "math" | "production" | "ui" | "media";
}

const TERMS: Term[] = [
  { term: "ACES", short: "Academy Color Encoding System", category: "production",
    long: "Open color management standard from the Academy of Motion Picture Arts and Sciences. Defines a wide-gamut working space (ACEScg) and Input/Output Device Transforms so a single image can move through cameras, software, and displays without color drift." },
  { term: "Achromatic", short: "without hue — black, white, gray", category: "perception",
    long: "A color with zero chroma. In Lab terms, a* = b* = 0. Pure achromatic colors don't exist on most monitors but printer Ks and grayscale gradients aim for them." },
  { term: "Additive", short: "color mixing by adding light", category: "spaces",
    long: "RGB. Three light sources combine: red + green + blue at full intensity = white. The model used by every screen." },
  { term: "APCA", short: "Advanced Perceptual Contrast Algorithm", category: "ui",
    long: "WCAG 3.0 draft replacement for the 4.5:1 ratio. Considers font weight, size, and polarity (light text on dark vs dark text on light). Significantly more accurate than WCAG 2.1's simple luminance ratio." },
  { term: "Bradford transform", short: "chromatic adaptation matrix", category: "math",
    long: "Method to shift colors between reference whites (D50 to D65, etc). Used implicitly when converting between color spaces with different white points. The colour-science library defaults to it." },
  { term: "CIELAB", short: "perceptually uniform color space (1976)", category: "spaces",
    long: "L* (lightness 0-100), a* (green-red), b* (blue-yellow). Distances in Lab approximate perceived color difference, making it the foundation for k-means palette extraction and CIEDE2000 difference math." },
  { term: "CIEDE2000", short: "perceptual color difference formula", category: "math",
    long: "Industry standard for 'how different do these two colors look'. Returns ΔE: <1 imperceptible, 1-2 close inspection only, 2-10 perceptible at a glance, 11+ distinct. Smarter than CIE76 in dark + saturated regions." },
  { term: "CMYK", short: "subtractive ink model", category: "spaces",
    long: "Cyan, Magenta, Yellow, Key (black). Maximum theoretical coverage 400%; practical max ~320%. Different press standards (FOGRA, GRACoL, SWOP) shift these numbers slightly." },
  { term: "Cones", short: "color receptors in the retina", category: "perception",
    long: "Three types — L (long, 'red'), M (medium, 'green'), S (short, 'blue'). Color blindness is a missing or shifted cone type. The eye has ~120 million rods (b&w) but only ~6 million cones." },
  { term: "Chroma", short: "color saturation in perceptual spaces", category: "perception",
    long: "How vivid a color is, distance from neutral gray. Different from saturation in HSL — chroma in Lab/OKLCH is perceptually uniform; HSL saturation is not." },
  { term: "Chromatic adaptation", short: "white point translation", category: "math",
    long: "When you move a color from one white point to another (D65 to D50, etc), you need to recompute the entire color so it 'looks the same' under the new illuminant. Bradford and CAT02 are common matrices." },
  { term: "Color space", short: "coordinate system for color", category: "spaces",
    long: "RGB, HSL, Lab, OKLab, CMYK — each is a different coordinate system. They map to different shapes in 3D and have different properties (perceptual uniformity, gamut, intuition for designers)." },
  { term: "CVD", short: "Color Vision Deficiency", category: "perception",
    long: "Catch-all term: protanopia (no red cones, ~1% males), deuteranopia (no green, ~6% males), tritanopia (no blue, rare). Anomaly variants are partial. The Brettel matrices simulate dichromatic cases." },
  { term: ".cube LUT", short: "3D Look-Up Table file", category: "production",
    long: "Plain text file mapping every input RGB to an output RGB. Used by DaVinci Resolve, Premiere, OBS to apply color grades. 17³, 33³, 65³ are common sizes. The Cinematographer panel exports them." },
  { term: "Delta E", short: "see CIEDE2000 / CIE76 / CIE94", category: "math",
    long: "Generic term for perceptual color difference. Without specifying the formula, it usually means CIE76 (simple Euclidean in Lab) — fast but inaccurate near gamut edges. Always say which method." },
  { term: "Display P3", short: "wide-gamut RGB space", category: "spaces",
    long: "Apple's standard for modern screens — about 25% wider than sRGB, especially in greens and reds. iPhones, MacBooks, iPad Pros all ship in P3. Vivid screen colors that 'pop' usually need P3 to render fully." },
  { term: "FOGRA", short: "European print press standard", category: "production",
    long: "FOGRA39 (coated paper, ISO 12647-2) and FOGRA51 (PSO Coated v3) are the two most common European ICC profiles. EU print shops will assume one of these unless you say otherwise." },
  { term: "Gamut", short: "the range of colors a system can produce", category: "spaces",
    long: "sRGB gamut < Display P3 < Adobe RGB < Rec.2020 < ProPhoto. CMYK printers have a smaller gamut than any of those, especially in greens and saturated cyans. 'Out of gamut' = the color exists in your file but can't be reproduced." },
  { term: "GRACoL", short: "US commercial print standard", category: "production",
    long: "Specification for commercial offset printing in North America. The CGATS GRACoL 2013 ICC profile is what most US shops will use unless asked otherwise." },
  { term: "HCT", short: "Hue, Chroma, Tone — Material 3's space", category: "spaces",
    long: "Custom space derived from CAM16, designed so 'tone' (lightness) maps directly to perceived brightness regardless of hue. Material You themes are all generated from one HCT seed, contrast-guaranteed." },
  { term: "HSL", short: "Hue, Saturation, Lightness", category: "spaces",
    long: "Designer-friendly RGB rotation. Hue 0-360, saturation 0-100%, lightness 0-100%. Pure red is HSL(0, 100%, 50%). Not perceptually uniform — different hues at the same L look different brightness." },
  { term: "HSV", short: "Hue, Saturation, Value", category: "spaces",
    long: "Like HSL but Value=1 is the most vivid version, not the lightest. Most color pickers offer HSV by default. Pure red is HSV(0, 100%, 100%)." },
  { term: "ICC profile", short: "standardized color description", category: "production",
    long: "International Color Consortium file (.icc/.icm) describing exactly how a device renders color. Every monitor, printer, scanner has one. Without ICC profiles, color management is impossible." },
  { term: "Illuminant", short: "reference light source", category: "perception",
    long: "D50 (warm daylight, print industry standard), D65 (cool daylight, screen standard), F2/F11 (fluorescent), A (incandescent). Two colors that match under D65 may not match under A — this is metamerism." },
  { term: "K (in CMYK)", short: "the black ink channel", category: "spaces",
    long: "'Key', because plates are keyed to it for registration. Pure CMY can't produce true black on most papers — CMY = muddy brown. K adds the darkness CMY can't reach." },
  { term: "k-means", short: "clustering algorithm for palettes", category: "math",
    long: "Group N pixels into K clusters that minimize within-cluster variance. Run in Lab space gives perceptually grouped swatches. The 'mode-snap' variant returns an actual pixel from each cluster instead of the centroid." },
  { term: "Luminance", short: "perceived brightness", category: "perception",
    long: "Weighted sum of RGB channels: 0.2126·R + 0.7152·G + 0.0722·B (sRGB). Note green dominates — this is why pure green text on white is hard to read despite the value." },
  { term: "Mode-snap", short: "k-means refinement", category: "math",
    long: "After k-means clustering, replace each centroid with the most common quantized pixel in its cluster. The result palette is guaranteed to consist of colors that genuinely appear in the image, not muddy averages." },
  { term: "OKLab", short: "perceptual space (2020)", category: "spaces",
    long: "Björn Ottosson's modern alternative to CIELAB — better behavior in blue and dark regions. Used in CSS (oklch()), Material 3 generation, and increasingly in modern color tools." },
  { term: "OKLCH", short: "OKLab in cylindrical form", category: "spaces",
    long: "Lightness, Chroma, Hue. Designer-friendly like HSL but perceptually uniform like OKLab. Can be specified directly in modern CSS: oklch(0.7 0.15 200)." },
  { term: "OpenColorIO (OCIO)", short: "VFX color management library", category: "production",
    long: "Open-source library implementing ACES and other color pipelines inside Nuke, Blender, Maya, Resolve, Unreal. A single config.ocio describes every transform; every artist sees the same color." },
  { term: "Pantone", short: "proprietary spot color system", category: "production",
    long: "Print color matching system. Each PMS code maps to a specific ink mix. Used as spot colors when CMYK can't reproduce a brand color (Tiffany Blue, Cadbury Purple). Licensed dataset; we use an open subset." },
  { term: "PMS", short: "Pantone Matching System", category: "production",
    long: "Pantone's catalog — PMS 287 C (Royal Blue), PMS 186 C (Scarlet), etc. C = Coated paper, U = Uncoated. Same ink reads different on different stock." },
  { term: "Rec.709", short: "HDTV color space", category: "spaces",
    long: "Standard for HD broadcast, Blu-ray, most YouTube. Same primaries as sRGB but a different gamma. Most film delivery is in Rec.709 unless explicitly HDR." },
  { term: "Rec.2020", short: "UHD/HDR color space", category: "spaces",
    long: "Wide-gamut standard for 4K UHD and HDR delivery. Significantly larger than Rec.709 — covers 75% of CIE 1931 vs ~35%. Most consumer HDR content is mastered in Rec.2020." },
  { term: "RGB", short: "additive screen primary", category: "spaces",
    long: "Red, Green, Blue — typically 0-255 or 0-1.0 per channel. The native model for every screen. 'sRGB' is a specific RGB variant with a defined gamma curve and primaries." },
  { term: "sRGB", short: "standard web RGB space", category: "spaces",
    long: "ITU-R BT.709 primaries with a specific gamma. Default for the web, most monitors, JPEGs without embedded profile. Smaller than P3, much smaller than ProPhoto." },
  { term: "SLIC", short: "Simple Linear Iterative Clustering", category: "math",
    long: "Superpixel segmentation algorithm. Groups image pixels into roughly equal-sized perceptually similar regions. Used by /extract/segment to find palette colors that respect spatial coherence." },
  { term: "Spot color", short: "premixed ink, not CMYK process", category: "production",
    long: "Single-ink color mixed before printing — Pantone metallics, neons, fluorescents, brand-specific. Required when the color is outside the CMYK gamut. Each spot color = one extra plate = more cost." },
  { term: "Subsurface scattering", short: "light through translucent material", category: "media",
    long: "Skin, wax, marble, leaves — light enters, bounces inside, exits a different color. Skin gets a red shift, candles get warm-orange. The Concept persona panel has a preview." },
  { term: "Tonal palette", short: "lightness scale of one hue", category: "ui",
    long: "Tailwind's 50-950 scale, Material 3's 0-100 tones — same hue, different lightness levels. Perceptually-spaced (more compressed in light end, more stretched in dark) for natural-looking gradients." },
  { term: "Tint", short: "lighter version of a color", category: "ui",
    long: "Add white to a color → a tint. In HSL, raise the lightness. In Lab, raise L*." },
  { term: "Shade", short: "darker version of a color", category: "ui",
    long: "Add black to a color → a shade. In HSL, lower the lightness. In Lab, lower L*." },
  { term: "Tone", short: "less saturated version of a color", category: "ui",
    long: "Add gray to a color → a tone. In HSL, lower the saturation while keeping lightness similar. The middle ground between tint and shade." },
  { term: "WCAG", short: "Web Content Accessibility Guidelines", category: "ui",
    long: "W3C standard for web accessibility. WCAG 2.1 defines the 4.5:1 contrast ratio for AA normal text, 7.0:1 for AAA. WCAG 3.0 (draft) replaces this with APCA, more accurate but not yet binding." },
];

const query = ref("");
const filter = ref<Term["category"] | "all">("all");

const CATEGORIES: { id: Term["category"] | "all"; label: string }[] = [
  { id: "all", label: "all" },
  { id: "spaces", label: "color spaces" },
  { id: "math", label: "math" },
  { id: "perception", label: "perception" },
  { id: "production", label: "production" },
  { id: "ui", label: "ui / web" },
  { id: "media", label: "media" },
];

const filtered = computed(() =>
  TERMS
    .filter(t => filter.value === "all" || t.category === filter.value)
    .filter(t => {
      if (!query.value) return true;
      const q = query.value.toLowerCase();
      return t.term.toLowerCase().includes(q)
        || t.short.toLowerCase().includes(q)
        || t.long.toLowerCase().includes(q);
    })
    .sort((a, b) => a.term.localeCompare(b.term))
);
</script>

<template>
  <section class="glossary">
    <header class="head">
      <span class="eyebrow">Glossary</span>
      <h1>Every term, no jargon detours.</h1>
      <p class="lead">
        {{ TERMS.length }} entries covering color science, accessibility,
        production pipelines, and UI conventions used across this app.
      </p>
    </header>

    <div class="filters">
      <input v-model="query" placeholder="search terms..." class="search" />
      <div class="cat-chips">
        <button v-for="c in CATEGORIES" :key="c.id"
          class="cat-chip" :class="{ active: filter === c.id }"
          @click="filter = c.id"
        >{{ c.label }}</button>
      </div>
    </div>

    <div v-if="filtered.length === 0" class="empty">
      No matches for "{{ query }}".
    </div>

    <dl class="terms">
      <div v-for="t in filtered" :key="t.term" class="term-row">
        <dt>
          <span class="term-name">{{ t.term }}</span>
          <span class="term-cat">{{ t.category }}</span>
        </dt>
        <dd>
          <span class="term-short">{{ t.short }}</span>
          <p class="term-long">{{ t.long }}</p>
        </dd>
      </div>
    </dl>
  </section>
</template>

<style scoped>
.glossary { max-width: 720px; margin: 0 auto; padding-bottom: var(--s-7); }
.head {
  margin-bottom: var(--s-5);
  border-bottom: 1px solid var(--hairline);
  padding-bottom: var(--s-4);
}
.eyebrow {
  font-family: var(--mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .14em;
  color: var(--text-3);
}
.head h1 {
  font-family: var(--sans);
  font-style: italic;
  font-weight: 800;
  font-size: 38px;
  letter-spacing: -.02em;
  margin: var(--s-3) 0 var(--s-3);
  line-height: 1.05;
}
.lead {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-2);
  margin: 0;
}
.filters {
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
  margin-bottom: var(--s-4);
  position: sticky;
  top: 0;
  background: var(--bg);
  padding: var(--s-3) 0;
  z-index: 10;
}
.search {
  width: 100%;
  border: 1px solid var(--hairline);
  background: var(--bg);
  color: var(--text);
  padding: 9px 14px;
  border-radius: 999px;
  font-family: var(--mono);
  font-size: 12px;
}
.search:focus { outline: none; border-color: var(--text); }
.cat-chips { display: flex; gap: 4px; flex-wrap: wrap; }
.cat-chip {
  padding: 5px 11px;
  border: 1px solid var(--hairline);
  background: var(--bg);
  color: var(--text-2);
  border-radius: 999px;
  font-family: var(--mono);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: .08em;
  cursor: pointer;
  transition: background .15s, color .15s, border-color .15s;
}
.cat-chip:hover { color: var(--text); border-color: var(--text); }
.cat-chip.active { background: var(--text); color: var(--bg); border-color: var(--text); }

.terms { display: flex; flex-direction: column; gap: 0; margin: 0; padding: 0; }
.term-row {
  padding: var(--s-4) 0;
  border-bottom: 1px solid var(--hairline);
}
.term-row:last-child { border-bottom: none; }
dt {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 6px;
}
.term-name {
  font-family: var(--mono);
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: .02em;
}
.term-cat {
  font-family: var(--mono);
  font-size: 8px;
  text-transform: uppercase;
  letter-spacing: .12em;
  color: var(--text-3);
  padding: 2px 7px;
  background: var(--surface-2);
  border-radius: 999px;
}
dd { margin: 0; }
.term-short {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--text-2);
  display: block;
  margin-bottom: 6px;
  letter-spacing: .04em;
}
.term-long {
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-2);
  margin: 0;
}
.empty {
  padding: 60px 0;
  text-align: center;
  font-family: var(--mono);
  font-size: 11px;
  color: var(--text-3);
}
</style>
