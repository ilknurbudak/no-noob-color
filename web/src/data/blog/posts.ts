import type { Article } from "./types";

export const POSTS: Article[] = [
  {
    slug: "color-science-foundations",
    eyebrow: "Foundations",
    title: "Color is not what your screen says it is",
    lead: "A pixel value is a number. The color you actually see is a negotiation between physics, biology, and a long chain of decisions made by people you'll never meet.",
    readingTime: "6 min",
    sections: [
      {
        type: "prose",
        body: `Color science begins with a deeply uncomfortable fact: there is no such thing as "the" color of an object. What we call color is the brain's interpretation of how a surface reflects, absorbs, and re-emits photons across a narrow slice of the electromagnetic spectrum. The same shirt looks different under fluorescent office lighting, a sunset, and a phone flash — and it is different, in the only sense that matters.

The job of color science is to make this messy, perceptual phenomenon **measurable, transferrable, and reproducible**. From the first CIE 1931 standard observer experiments — where humans matched mixtures of red, green, and blue lights to test colors viewed through a 2-degree aperture — to today's perceptually uniform OKLab and OKLCH spaces, every color model is an attempt to pin down something that fundamentally lives between the world and the visual cortex.

This blog won't teach you everything. It can't. But it will give you the working vocabulary you need to **trust** the colors you ship — to your screen, to a Procreate canvas, to a printer, or to another pair of human eyes.`,
      },
      { type: "demo", component: "lab" },
      {
        type: "prose",
        body: `Try the converter above. Drag the RGB sliders and watch the L*, a*, b* values shift. Notice how a small change in green produces a large jump in L\\* — that is *not* a quirk of the math. It is the math accurately reflecting the fact that the human eye is dramatically more sensitive to the green portion of the spectrum than to red or blue.

That single insight — perceptual non-uniformity — is the reason CIELAB exists, the reason WCAG contrast ratios weight green heavily, and the reason your "neutral gray" looks slightly green or magenta on different displays.`,
      },
    ],
    sources: [
      {
        title: "Colour Science Resources Hub",
        url: "https://www.colour-science.org/",
        blurb: "Most comprehensive starting point for color science.",
      },
      {
        title: "Awesome Colour (GitHub)",
        url: "https://github.com/colour-science/awesome-colour",
        blurb: "Curated list of color libraries, tools, and articles.",
      },
    ],
  },

  {
    slug: "rgb-cmyk-hex-when-which-why",
    eyebrow: "Color Modes",
    title: "RGB, CMYK, HEX — when each one is the right answer",
    lead: "These are not interchangeable formats. They model different physical realities. Mix them up and you get muddy print, washed-out screens, or a brand color that drifts every time it crosses a medium.",
    readingTime: "5 min",
    sections: [
      {
        type: "prose",
        body: `**RGB** is **additive**: you start in the dark and add light. Red + Green + Blue at full intensity produces white. This is how every screen works — phones, monitors, projectors. Pixel values are literally instructions for how brightly to fire three light emitters.

**CMYK** is **subtractive**: you start with white paper and subtract reflected light by adding ink. Cyan + Magenta + Yellow theoretically produces black, but in practice produces muddy brown, which is why a separate **K**ey (black) channel is added. CMYK is for ink on paper — offset printing, posters, packaging.

**HEX** is just RGB in a different costume. \`#FF8800\` is exactly \`rgb(255, 136, 0)\`. The hex notation is shorter, easier to paste, and historically associated with the web — but underneath it's the same additive light model.`,
      },
      {
        type: "quote",
        body: "If you design a brand identity in RGB and hand the print shop a HEX swatch, they will silently translate it through their CMYK profile and the result will not be the color you approved.",
      },
      {
        type: "prose",
        body: `**Rule of thumb:**

- **Screens, web, video, UI** → RGB (or its HEX shorthand)
- **Print, packaging, fabric** → CMYK
- **Cross-medium brand assets** → specify in CIELAB or Pantone, then translate to RGB and CMYK separately for each output

The single biggest mistake junior designers make is treating "the same number" as "the same color". A \`#FF8800\` orange on your monitor is wider-gamut than any CMYK printer can reproduce. The color you saw isn't the color that ships.`,
      },
      { type: "demo", component: "gamut" },
    ],
    sources: [
      {
        title: "RGB vs CMYK vs HEX — when to use which",
        url: "https://www.geeksforgeeks.org/difference-between-rgb-and-cmyk-color-model/",
        blurb: "Practical comparison of digital and print color modes.",
      },
    ],
  },

  {
    slug: "hsl-hsv-why-ui-loves-them",
    eyebrow: "Color Models",
    title: "HSL and HSV — why every UI tool ships them",
    lead: "Designers don't think in (255, 136, 0). They think 'orange, vivid, slightly muted'. HSL and HSV are the color models that match how your hand reaches for the picker.",
    readingTime: "4 min",
    sections: [
      {
        type: "prose",
        body: `RGB is excellent for telling a screen what to do, terrible for telling a designer what they want. "Make it more orange" is not a coordinate move in RGB space — it's a hue rotation, which means juggling three values at once.

HSL and HSV decouple the three things humans actually *think about*:

- **Hue** — what color (a position on the rainbow, 0-360°)
- **Saturation** — how vivid (gray to neon)
- **Lightness** (HSL) or **Value** (HSV) — how light or dark

Pick a hue, then dial in saturation and lightness independently. This is why every color picker — Photoshop, Figma, Procreate, browser dev tools — gives you HSL/HSV controls.`,
      },
      { type: "demo", component: "hue" },
      {
        type: "prose",
        body: `**HSL vs HSV** — the difference matters less than you'd think:

- **HSV** treats "Value" as raw brightness. \`V=1\` is the most vivid version of a color. Pure red is \`HSV(0, 100%, 100%)\`.
- **HSL** treats "Lightness" symmetrically. \`L=50%\` is the most vivid version; \`L=100%\` is white, \`L=0%\` is black. Pure red is \`HSL(0, 100%, 50%)\`.

HSL is more intuitive for tints/shades (raise lightness for tints, lower for shades). HSV is more intuitive for picking the most saturated version of a hue. Most modern tools default to HSL.

**Critical caveat:** neither is *perceptually* uniform. Two colors with the same HSL lightness can look dramatically different in apparent brightness — which is why CIELAB and OKLCH exist. HSL is convenient; Lab is honest.`,
      },
    ],
    sources: [
      {
        title: "HSL and HSV Explained",
        url: "https://www.rapidtables.com/convert/color/rgb-to-hsl.html",
        blurb: "Reference guide for HSL/HSV models and conversion math.",
      },
    ],
  },

  {
    slug: "cielab-the-honest-color-space",
    eyebrow: "Perceptual Color",
    title: "CIELAB — the color space that respects your eyes",
    lead: "RGB and HSL are about pixels and convenience. Lab is about perception. If you have ever wondered why two colors with the same brightness slider look different — Lab is the answer.",
    readingTime: "6 min",
    sections: [
      {
        type: "prose",
        body: `**CIELAB** (also written L\\*a\\*b\\* or just Lab) was designed in 1976 with one goal: a color space where the **distance between two points equals how different they look to a human**. RGB does not do this — a step from \`(50, 50, 50)\` to \`(50, 100, 50)\` is the same numerical distance as \`(150, 150, 150)\` to \`(150, 200, 150)\`, but the first jump is far more visually dramatic.

Lab has three axes:

- **L\\*** — Lightness, 0 (black) to 100 (white). Roughly logarithmic in luminance, matching the eye's response.
- **a\\*** — Green-Red axis, negative is green, positive is red.
- **b\\*** — Blue-Yellow axis, negative is blue, positive is yellow.

The opponent-color axes (a\\* and b\\*) come from how the visual cortex actually processes signals from cone cells. We see red *or* green, blue *or* yellow — never both. Lab encodes this directly.`,
      },
      {
        type: "quote",
        body: "Almost every serious palette extraction tool — including this one — runs k-means clustering in Lab, not RGB. Cluster centroids in RGB land near the most numerous pixels; centroids in Lab land near the most perceptually distinct ones.",
      },
      {
        type: "prose",
        body: `**Why this matters for tools like no noob color:**

When you drop a photo and we extract a 5-color palette, we convert every pixel to Lab, run k-means, and convert back. The result is a palette that matches what your *eye* picks out as dominant — not what a naive average of pixel values produces. Try the same image in a tool that clusters in RGB and you'll get muddier, less distinguishable swatches.

Newer perceptual spaces — **OKLab** (2020) and **OKLCH** — fix some of CIELAB's remaining quirks (especially around blue and dark colors) and are slowly becoming the modern default. But for most working tools, CIELAB is still the workhorse.`,
      },
    ],
    sources: [
      {
        title: "CIELAB Color Space",
        url: "https://www.hunterlab.com/blog/color-measurement-2/cielab-and-cieluv-color-spaces/",
        blurb: "Industry-standard intro to CIELAB and human perception.",
      },
      {
        title: "Python Colour Documentation",
        url: "https://www.colour-science.org/",
        blurb: "Industry-grade color math: CIE, ICC, OKLab, CIECAM.",
      },
    ],
  },

  {
    slug: "wcag-contrast-and-why-it-matters",
    eyebrow: "Accessibility",
    title: "Contrast ratios — why your beautiful palette might fail",
    lead: "Designed something gorgeous and discovered low-vision users can't read it? The math behind that failure is older than the web and stricter than your aesthetic instincts.",
    readingTime: "5 min",
    sections: [
      {
        type: "prose",
        body: `WCAG (Web Content Accessibility Guidelines) defines contrast as a ratio between the **relative luminance** of two colors. Luminance is computed by:

1. Linearizing each RGB channel (gamma decode)
2. Weighting them by human sensitivity: \`L = 0.2126·R + 0.7152·G + 0.0722·B\`
3. Computing the ratio \`(brighter + 0.05) / (darker + 0.05)\`

Note the green coefficient: **71% of perceived brightness comes from the green channel**. A pure-green text on white is far less contrasty than the RGB values suggest, which is why "lime green on white" is the canonical accessibility disaster.`,
      },
      { type: "demo", component: "contrast" },
      {
        type: "prose",
        body: `**The thresholds:**

- **AA normal text** — ratio ≥ 4.5:1
- **AA large text** (≥ 18pt or ≥ 14pt bold) — ratio ≥ 3.0:1
- **AAA normal text** — ratio ≥ 7.0:1
- **AAA large text** — ratio ≥ 4.5:1

Most designers aim for AA on body copy and AAA on critical UI (form labels, error messages, anything you must read). Brand-color buttons frequently fail AA against white backgrounds — which is why the "darker hover" trend exists; it pushes the resting state into compliance.

**WCAG 3.0** (still draft) replaces this ratio with **APCA** — Advanced Perceptual Contrast Algorithm — which accounts for font weight and size and is significantly more accurate. But until it's standardized, AA/AAA is what audits check.`,
      },
    ],
    sources: [
      {
        title: "Awesome Colour (GitHub)",
        url: "https://github.com/colour-science/awesome-colour",
        blurb: "Includes contrast and accessibility tooling.",
      },
    ],
  },

  {
    slug: "material-color-utilities",
    eyebrow: "Modern Systems",
    title: "Material 3 — Google's bet on dynamic, perceptual color",
    lead: "Material You doesn't pick colors — it derives them from a single seed using HCT, an OKLab-adjacent perceptual model. The result is theming that adapts without ever picking 'the wrong shade of blue'.",
    readingTime: "5 min",
    sections: [
      {
        type: "prose",
        body: `Google's **Material Color Utilities** is the open-source library behind Material Design 3 (Material You) — the system that powers dynamic theming on Android and Google products. It does something no traditional design system does: it **generates an entire palette from one seed color**, dynamically, while guaranteeing accessibility.

The trick is **HCT** — Hue, Chroma, Tone — a custom color space derived from CAM16 (a perceptual model). Unlike HSL, HCT's "tone" axis maps directly to perceived lightness, so a tone-50 surface and a tone-50 accent feel equally bright regardless of hue.`,
      },
      {
        type: "prose",
        body: `**What this enables:**

- **Single-seed theming** — extract one color from a wallpaper, generate light/dark themes, primary/secondary/tertiary roles, and 13 tonal stops per role
- **Guaranteed accessibility** — every text-on-surface combination is tone-aware, so contrast is mathematically enforced
- **Smooth adaptation** — the same seed produces a coherent look across thousands of screens without designers ever picking individual shades

For the no noob color persona system, this is the model we eventually steal: a single user-picked color → an entire app-ready palette with WCAG guarantees baked in. Right now we hand-pick harmonies; Material 3 hand-picks *less* and lets the math do the rest.`,
      },
      {
        type: "quote",
        body: "Material 3 is what happens when a design system stops trusting designers to enforce contrast and starts enforcing it programmatically. The result is more consistent and, importantly, more accessible — without anyone having to remember the rules.",
      },
    ],
    sources: [
      {
        title: "Material Color Utilities (GitHub)",
        url: "https://github.com/material-foundation/material-color-utilities",
        blurb: "Google's open-source library powering Material 3.",
      },
    ],
  },

  {
    slug: "aces-and-opencolorio",
    eyebrow: "Production",
    title: "ACES and OpenColorIO — color management for everything that moves",
    lead: "Film, animation, VFX, and games all face the same problem: a color that goes through eight stages of pipeline must come out the same. ACES and OCIO are how that promise is kept.",
    readingTime: "6 min",
    sections: [
      {
        type: "prose",
        body: `If you have ever worked in film or VFX, you have heard "we're working in ACES" or "the OCIO config is in the project root". These are not quirks — they are the industry's solution to a problem that gets exponentially worse the bigger your pipeline gets.

**ACES (Academy Color Encoding System)** is an open color management standard maintained by the Academy of Motion Picture Arts and Sciences. It defines:

- A **wide-gamut working space** (ACEScg) large enough to hold any camera's native colors plus headroom for grading
- **Input Device Transforms (IDTs)** for every major camera (RED, ARRI, Sony, etc.)
- **Reference Rendering Transforms (RRTs)** that convert the linear scene-referred light into a viewable image
- **Output Device Transforms (ODTs)** for every viewing condition — Rec.709 TV, P3 cinema, Dolby Vision HDR, etc.`,
      },
      {
        type: "prose",
        body: `**OpenColorIO (OCIO)** is the open-source library that *implements* ACES (and other color pipelines) inside the actual tools — Nuke, Maya, Blender, DaVinci Resolve, Houdini, Unreal, Unity. A single \`config.ocio\` file describes every color space and transform; every artist on the project sees the same color regardless of their software.

For a single-developer color tool like no noob color, ACES is overkill — we're not grading 8K RAW footage. But the *idea* — separating "where the color comes from", "where it lives in the pipeline", and "where it's displayed" into three explicit transforms — is the discipline that makes color profiles (sRGB / Display P3 / Adobe RGB / CMYK) actually mean something.

When you toggle the profile picker in this app, you are doing exactly what OCIO does: keeping the underlying color data constant and changing only the **output transform**.`,
      },
    ],
    sources: [
      {
        title: "Academy Color Encoding System (ACES)",
        url: "https://acescentral.com/",
        blurb: "Industry standard for film/VFX color management.",
      },
      {
        title: "OpenColorIO",
        url: "https://opencolorio.org/",
        blurb: "Open-source color management for VFX and animation.",
      },
    ],
  },

  {
    slug: "ten-years-of-colour-science",
    eyebrow: "Ecosystem",
    title: "Ten years of Colour — the Python library that grew up with the web",
    lead: "When Thomas Mansencal started colour-science in 2013, color math in Python meant rolling your own matrix transforms. A decade later, it is the rigor underneath dozens of tools — including this one.",
    readingTime: "4 min",
    sections: [
      {
        type: "prose",
        body: `**colour-science** (the Python package, with the British spelling) is the de-facto standard for serious color computation in Python. If you need CIE 1931, CAM16, OKLab, ICC profiles, spectral distributions, illuminants, observers, or any of the dozens of named color spaces — colour-science has them, with full test coverage and academic citations.

It is what we use in this app's Python microservice for:

- Mode-snapped k-means in Lab/OKLab (extract route)
- Rigorous WCAG luminance computation (contrast route)
- Round-trip color space conversions (convert route)
- Six harmony rules computed in HSV with Lab-aware seed selection (harmonize route)`,
      },
      {
        type: "prose",
        body: `**Why a Python microservice instead of pure JavaScript?**

JavaScript color libraries (chroma.js, colord, culori) are excellent for the web's needs — fast, small, well-typed. But they are deliberately scoped: most don't ship CIECAM, none ship spectral distributions, and the ICC profile handling is limited.

For a tool that aims to be *correct* across mediums (not just "looks right on the screen I designed it on"), a Python service backed by colour-science gives you industry-grade math without reinventing it. The frontend stays small; the heavy lifting happens in 30 lines of Python that delegate to a battle-tested library.

The lesson generalizes: **you don't need to choose between a beautiful frontend and rigorous math.** A microservice boundary lets the right tool do each job.`,
      },
    ],
    sources: [
      {
        title: "10 Years of Colour Science",
        url: "https://www.colour-science.org/",
        blurb: "Retrospective on the library's first decade.",
      },
      {
        title: "Python Colour Documentation",
        url: "https://www.colour-science.org/",
        blurb: "Reference docs covering CIE, ISO, OKLab, and more.",
      },
    ],
  },
];

export function findPost(slug: string): Article | undefined {
  return POSTS.find((p) => p.slug === slug);
}
