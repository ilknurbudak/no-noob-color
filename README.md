# no noob color

A minimalist, on-device color palette tool for artists and illustrators.
Capture colors from any photo, generate harmonies from your own taste, export straight to Procreate or Adobe.

![demo](docs/source-demo.gif)

## What it does

**Photo** — Drop any image. Five dominant colors are extracted via k-means clustering in perceptual L*a*b* space, then snapped to actual pixels in the source so the palette is colors that genuinely appear in the image (no muddy averaged centroids). Each swatch shows RGB, CMYK, HEX, plus WCAG contrast ratio against black/white with AA / AAA / FAIL badges.

**Generate** — A two-step studio.

1. *Taste training.* On first visit you pick 30 colors you love from a slow-scrolling carousel of large cards (auto-advances at ~125 px/s). Saved locally as your taste profile.
2. *Color Harmony Studio.* Pick a harmony (Auto · Monochromatic · Analogous · Complementary · Triadic · Split-Complementary · Tetradic) — each option has a hover description after 300 ms. Filter by temperature (warm / cool). Bias by keyword (100+ entries, EN + TR: *energy, calm, trust, forest, ocean, sunset, gold, retro, neon, lüks, gece, deniz…*). Set a minimum WCAG contrast (3:1 / 4.5:1 / 7:1) for adjacent swatches. Shuffle re-rolls within your saved palette — output is **always** drawn from your 30 colors, the harmony just decides which 5.

**Library** — Saves persist in localStorage with a thumbnail and a `Photo` / `Generate` source tag. Sub-tabs filter the two sources separately. Click a saved palette to load it back into Photo. Photo-saved palettes restore the source thumbnail; **Generate-saved palettes restore as an animated block-reveal grid in the source area**, animated with that palette's colors (pauses when the tab is hidden).

**Export** — Procreate `.swatches` (validated import-tested), Adobe `.ase`, or copy as text — all generated client-side, no server.

**Color profiles** — Output target switchable: sRGB / Display P3 / Adobe RGB / CMYK.

## Tech

- Plain HTML / CSS / JS, single file, no build step
- Inter (SIL OFL) + JetBrains Mono fonts via Google Fonts CDN
- [Tippy.js](https://atomiks.github.io/tippyjs/) (MIT) + [Popper.js](https://popper.js.org/) for tooltips with hover delay
- Pure-JS k-means in L*a*b* with mode-snapping for honest swatches
- Hand-rolled ZIP writer for `.swatches` (no external dependency)
- Procedural canvas animation for the source generative grid
- All processing happens on-device — no backend, no API, no telemetry

## Run it locally

```sh
git clone git@github.com:ilknurbudak/no-noob-color.git
cd "no-noob-color/prototype"
open index.html      # or just double-click in Finder
```

No build, no install. Open `prototype/index.html` in a browser.

## Repository structure

```
no-noob-color/
├── prototype/
│   ├── index.html          # the whole app
│   ├── logo-lockup.png     # brand mark
│   ├── logo.png            # ink logo (raw)
│   └── drop-arrow.png      # hand-drawn drop indicator
├── tools/
│   └── test_swatches.py    # standalone .swatches format validator
└── docs/
    └── source-demo.gif     # animation preview
```
