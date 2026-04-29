# no noob color

iOS palette app for illustrators. Capture colors from life, build palettes, export directly to Procreate.

## Status
Early development. Design + source files prepared locally; Xcode project will be created at packaging time.

## Repository structure

```
no-noob-color/
├── prototype/    Browser-based visual prototype (HTML/CSS/JS)
├── ios-source/   SwiftUI source files, ready to import into Xcode
├── tools/        Standalone scripts (Python) — .swatches export tests, color experiments
└── design/       Color tokens, mockups, notes
```

## Core features
- Photo → palette extraction (k-means, on-device)
- Brush preview per swatch (watercolor / pencil / ink / oil)
- Direct `.swatches` export to Procreate

## Tech
- SwiftUI, iOS 17+
- ZIPFoundation (MIT) for `.swatches` archive writing
- All other functionality uses native Apple frameworks
- No backend, no API, no server
