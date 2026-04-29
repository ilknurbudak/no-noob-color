# no noob color — Web

Vite + Vue 3 + TypeScript + Pinia migration of the prototype. The single-HTML
prototype is preserved at `prototype/index.html` as the working reference;
this folder is the proper modular codebase that will replace it.

## Run

```sh
cd web
npm install
npm run dev      # http://localhost:5173
```

The dev server proxies `/api/*` to `http://localhost:8000` (the FastAPI service
in `../api`), so frontend code can `fetch("/api/extract/kmeans", ...)`
seamlessly in dev. In production, configure the same path on the deployed origin.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Build | **Vite 6** | instant HMR, ES modules, tiny config |
| UI | **Vue 3** (`<script setup>`) | reactive Composition API, low ceremony |
| Lang | **TypeScript** | typed Swatch / Palette / Persona models |
| State | **Pinia** | three small stores (theme, persona, library) |
| Routing | **Vue Router 4** | hash routes for tab navigation |
| Tooltips | **Tippy.js** | ported from prototype |

## Structure

```
web/
├── index.html
├── package.json
├── tsconfig.json · tsconfig.node.json · vite.config.ts
├── public/
│   ├── logo.png · logo-lockup.png · drop-arrow.png
└── src/
    ├── main.ts
    ├── App.vue
    ├── style.css                 (global tokens — ports prototype design system)
    ├── types/index.ts            (Swatch, Palette, Persona, MoodSettings…)
    ├── services/
    │   ├── api.ts                (FastAPI client: detectApi · extractKMeans · harmonize · auditPalette)
    │   └── color.ts              (local fallback color science: hex/rgb/hsv/hsl/lab/cmyk + WCAG)
    ├── stores/
    │   ├── theme.ts              (light/dark, persisted)
    │   ├── persona.ts            (6 personas with defaults)
    │   └── library.ts            (saved palettes, sub-source filtering)
    ├── router/index.ts
    ├── components/
    │   ├── BrandHeader.vue       (logo lockup + theme toggle)
    │   └── BottomNav.vue         (Generate · Photo · Library)
    └── views/
        ├── HomeView.vue          (PORTED — hero, 3 cards, About section)
        ├── PhotoView.vue         (STUB — k-means + drop zone next session)
        ├── GenerateView.vue      (STUB — persona + harmony studio next session)
        └── LibraryView.vue       (PORTED — sub-tab filters, card grid, delete)
```

## Migration roadmap

| Phase | What | Status |
|---|---|---|
| Scaffold | Vite + Vue + TS + Pinia + Router skeleton | done |
| Stores | theme, persona, library | done |
| Color science | local fallback + API client | done |
| HomeView | hero + cards + about | done |
| LibraryView | filters + cards | done |
| BrandHeader / BottomNav | extracted components | done |
| **PhotoView** | k-means drop zone, palette strips, exports | **next** |
| **GenerateView** | persona picker, taste training, harmony studio | **next** |
| **MoodStudio component** | shared dropdowns / sliders / tooltips | **next** |
| **PaletteStrip component** | reusable strip rendering | **next** |
| **SourceGrid (canvas)** | generative animation for library loads | **next** |
| **Toast + tippy directive** | global UX | **next** |
| **Export module** | Procreate · ASE · Tailwind · CSS · JSON · SVG · text | **next** |

The old `prototype/index.html` stays untouched until parity is reached, so the
working app is never down.
