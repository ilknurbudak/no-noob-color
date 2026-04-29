# no noob color — API

Python microservice that owns the color science layer. Frontend (browser HTML/JS) calls these REST endpoints instead of hand-rolling color math in JavaScript.

## Why a microservice

- **colour-science** is the de-facto industry standard for color math (CIE, ICC, OKLab, CIECAM, etc.). No JS equivalent matches its rigor.
- **scikit-learn** k-means is faster and more robust than rolling our own.
- **scikit-image** has working Lab / OKLab transforms backed by NumPy.
- Decoupled: frontend stack can be anything — vanilla JS, Vue, Svelte, a Figma plugin, an iOS app — they all hit the same API.

## Stack

| Layer | Library | Why |
|---|---|---|
| Web framework | FastAPI | Async, auto Swagger docs, Pydantic validation |
| Image I/O | Pillow | Standard PIL, fast, format-agnostic |
| Numerics | NumPy | Required by sklearn / scikit-image |
| Clustering | scikit-learn | k-means with smart init |
| Color science | colour-science (rigor) + hand-rolled fallbacks | Best of both |
| Server | Uvicorn | ASGI, fast, hot reload |

## Run locally

```sh
cd api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Then:
- API root + endpoint list:    <http://localhost:8000/>
- Interactive Swagger UI:      <http://localhost:8000/docs>
- ReDoc:                       <http://localhost:8000/redoc>

## Endpoints

| Method | Path | What |
|---|---|---|
| `POST` | `/extract/kmeans` | Image → N dominant colors (k-means in Lab / RGB / OKLab); each centroid mode-snapped to a real pixel |
| `POST` | `/extract/colorthief` | Image → palette via median-cut (Pillow's adaptive palette) |
| `POST` | `/harmonize` | Base color + rule → palette of N derivatives (mono / analog / comp / triadic / split / tetradic) |
| `POST` | `/contrast/wcag` | Foreground vs background → WCAG ratio + grade + AA/AAA pass flags |
| `POST` | `/contrast/audit` | Audit a whole palette → contrast matrix + best/worst pairs |
| `POST` | `/convert/spaces` | Single color → metadata in RGB / HEX / CMYK / HSL / Lab / OKLab / luminance / WCAG-vs-white/black |

## Frontend integration sketch

In `prototype/index.html`, replace the inline JS k-means with a call to the service:

```js
async function extractPaletteFromAPI(file, n = 5) {
  const fd = new FormData();
  fd.append("image", file);
  fd.append("n", String(n));
  fd.append("color_space", "oklab");
  const res = await fetch("http://localhost:8000/extract/kmeans", { method: "POST", body: fd });
  const data = await res.json();
  return data.palette;  // [{rgb, hex, cmyk, hsl, lab, oklab, wcag_vs_white, ...}, ...]
}
```

For production, swap the URL for the deployed service (Render / HuggingFace Spaces / Fly.io / Cloud Run).

## Roadmap

- `/extract/colorthief` — done (uses Pillow median-cut)
- `/extract/kmeans` — done (Lab/RGB/OKLab + mode-snap)
- `/harmonize` — done (6 rules, N-aware)
- `/contrast/wcag` + `/contrast/audit` — done
- `/convert/spaces` — done
- `/extract/segment` — TODO: scikit-image SLIC segmentation, give weighted palette per region
- `/extract/skin-aware` — TODO: OpenCV face detection → exclude/include skin tones
- `/prompt-to-palette` — TODO: integrate Claude/OpenAI for free-text prompts
- `/colorblind/simulate` — TODO: rigorous Brettel/Vienot via colour-science
