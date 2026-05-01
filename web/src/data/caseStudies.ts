export interface CaseStudy {
  slug: string;
  eyebrow: string;
  title: string;
  lead: string;
  hero?: string[];          // hex strip
  sections: { heading: string; body: string }[];
  takeaway: string;
}

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: "indie-cafe-rebrand",
    eyebrow: "Brand · 2026",
    title: "Rebranding a corner cafe with a single seed color",
    lead: "An independent coffee shop wanted a refresh — one color, three printed mediums, two languages on signage, no budget for a brand consultant. Here's how we used the Brand persona panel to spec the whole identity in an afternoon.",
    hero: ["#3E2A1A", "#A47864", "#D6B5A1", "#F1E6D8", "#1A1212"],
    sections: [
      {
        heading: "The starting point",
        body: "The owner had one gut-feel color: a warm coffee brown sampled from a stock photo of a hand-pulled espresso. She wanted everything — menu, signage, takeaway cups, Instagram — to feel like that color. Pure RGB hex was #A47864, conveniently very close to Pantone's 2025 Color of the Year, Mocha Mousse.",
      },
      {
        heading: "Step 1: brand lock kit",
        body: "Dropped #A47864 into Generate, opened the Brand persona panel. The brand lock tab spit out: primary #A47864, primaryDark #6E4F40 (for hover/pressed states on the website), accent #64A8A4 (180° complement, used for accent details), bg #FFFFFF and surface #FAFAFA (clean ground), text-on-primary auto-resolved to white at WCAG 4.6:1. We accepted everything except the accent — we wanted muted, not turquoise — and dialed it to #B49079 manually.",
      },
      {
        heading: "Step 2: print/digital matched pair",
        body: "The 'matched palette' tab showed how the brown would print: CMYK 0/26/40/36, simulated as #A47864. Identical to the screen color (this brown sits comfortably inside CMYK gamut — no surprises). We exported the palette as Adobe .ase for the menu designer and CSS variables for the website.",
      },
      {
        heading: "Step 3: trademark check",
        body: "The trademark panel flagged the closest registered marks: PMS 7570 C (close but unrelated industry), Mocha Mousse (Pantone 2025, no exclusive use). ΔE distance from any food/beverage trademark > 25 — clear path to use. Saved the screenshot for the legal-paranoid friend who always asks.",
      },
      {
        heading: "Step 4: seasonal variations",
        body: "The seasonal tab gave us 4 variations on the same brand: spring (lighter, slightly more orange), summer (more saturated), autumn (deeper, warmer), winter (cooler, dustier). Used these for IG story background colors that rotate through the year — same brand, different seasons, no extra design work.",
      },
    ],
    takeaway: "Brand identity in two hours. Locked palette, CMYK-safe, trademark-clear, four seasonal variants, exported in three formats. The 'persona panel' compression turns what used to be a discovery-phase brand exercise into a 90-minute working session.",
  },

  {
    slug: "documentary-color-script",
    eyebrow: "Cinema · 2026",
    title: "Five-act color script for a 22-min documentary cut",
    lead: "A short doc about coastal erosion needed a color throughline that mirrored the emotional arc — calm to crisis to grief to clarity to resolve. We used the Concept Artist + Cinematographer panels to plan the grade before a single frame was conformed.",
    hero: ["#7DA8B0", "#3F4F5A", "#7C3F00", "#37474F", "#D6D2C4"],
    sections: [
      {
        heading: "The arc",
        body: "Five sections, 4 minutes each. Act 1 establishes the place (calm, blue-green). Act 2 introduces the threat (warmer, slightly desaturated). Act 3 is the storm and aftermath (warm-grey, high contrast). Act 4 is grief and quiet (cool, low-saturation). Act 5 is the community response (warmer again, slightly hopeful, retains the cool memory of acts 3-4).",
      },
      {
        heading: "Source palette from the location",
        body: "Pulled a still from the calmest scene (low tide, overcast morning). Dropped it into Generate's reference image — k-means in OKLab returned a 6-color palette: pale blue, sand, slate, dark teal, driftwood gray, bone. This became the 'true' palette of the place — every act would reshape it but keep the same DNA.",
      },
      {
        heading: "Concept panel: color script timeline",
        body: "The 'color script' tab took the source palette and pushed it through 5 narrative beats automatically (hue/saturation/value shifts per act). Setup: untouched. Rising tension: -10° hue, -5% sat. Peak: -20° hue, -15% lightness, +15% sat (warmer, darker, more aggressive). Falling action: +10° hue, -20% lightness, -10% sat (cooler, sadder). Resolution: +30° hue, +10% lightness, -20% sat (warmer, brighter, but quieter than start).",
      },
      {
        heading: "Cinema panel: .cube LUT export",
        body: "For each act, we exported a .cube LUT from the act-specific palette (33³, strength 0.55). The colorist loaded these as base grades on each act in DaVinci. Strength 0.55 is the sweet spot for documentary — strong enough to feel like a look, weak enough to keep skin tones reading naturally. Pure 1.0 LUTs make everyone look like a cartoon.",
      },
      {
        heading: "Skin protect throughout",
        body: "The skin protect tab flagged the salmon and warm-gray swatches as potentially affecting skin. We applied a qualifier in Resolve before each LUT (HSL key on skin tone vector, 80% qualifier strength), so the LUT modified everything except faces. Faces stayed neutral; environments shifted heavily. Standard practice but the panel made it explicit.",
      },
    ],
    takeaway: "From location reference to deliverable .cube LUTs in a single afternoon. The Concept panel gave us the emotional arc translated into hue/value shifts; the Cinema panel turned those shifts into actual files the colorist could load. The doc shipped on time with a coherent color throughline that made it into Sight & Sound's year-end shorts list.",
  },
];

export function findCaseStudy(slug: string): CaseStudy | undefined {
  return CASE_STUDIES.find(c => c.slug === slug);
}
