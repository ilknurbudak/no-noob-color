# no noob color — API

Python microservice that owns the color science layer **plus** the BaaS bridge to PocketBase. Frontend (Vue, vanilla JS, future iOS app) calls one REST surface — color math runs in Python, auth + palette storage + thumbnails live in PocketBase.

```
   browser  ────►  FastAPI (Python)  ────►  PocketBase
                   color science           auth · records · files
```

## Why a microservice

- **colour-science** is the de-facto industry standard for color math (CIE, ICC, OKLab, CIECAM, etc.). No JS equivalent matches its rigor.
- **scikit-learn** k-means is faster and more robust than rolling our own.
- **scikit-image** has working Lab / OKLab transforms backed by NumPy.
- **PocketBase** ships auth, file storage, realtime, and an admin UI in a single Go binary. We don't reinvent user management; Python forwards bearer tokens and PocketBase enforces row-level ownership.
- Decoupled: frontend stack can be anything — vanilla JS, Vue, Svelte, a Figma plugin, an iOS app — they all hit the same API.

## Stack

| Layer | Library | Why |
|---|---|---|
| Web framework | FastAPI | Async, auto Swagger docs, Pydantic validation |
| Image I/O | Pillow | Standard PIL, fast, format-agnostic |
| Numerics | NumPy | Required by sklearn / scikit-image |
| Clustering | scikit-learn | k-means with smart init |
| Color science | colour-science (rigor) + hand-rolled fallbacks | Best of both |
| BaaS | PocketBase | Auth, palette records, file storage, admin UI in one binary |
| HTTP client | requests | For Python → PocketBase calls |
| Server | Uvicorn | ASGI, fast, hot reload |

## Run locally

You need **two** processes: PocketBase (BaaS) and the FastAPI service.

### 1. Start PocketBase

A `pocketbase/pb_migrations/` directory in this repo creates the `palettes` collection on first boot — no manual setup needed.

Download the binary once (single Go executable, ~15 MB) into `pocketbase/`:

```sh
cd pocketbase
curl -L -o pb.zip "https://github.com/pocketbase/pocketbase/releases/download/v0.37.4/pocketbase_0.37.4_darwin_arm64.zip"
unzip -o pb.zip pocketbase && rm pb.zip
chmod +x pocketbase
```

For other platforms grab the matching asset from <https://github.com/pocketbase/pocketbase/releases>.

First-run admin (one time):

```sh
./pocketbase superuser upsert admin@example.com yourpassword
```

Run it:

```sh
./pocketbase serve
# Server: http://127.0.0.1:8090
# Admin:  http://127.0.0.1:8090/_/
```

The migration runs automatically on first boot, creating the `palettes` collection with row-level rules (`owner = @request.auth.id`) and the schema below:

| Field | Type | Notes |
|---|---|---|
| `name` | text | required, max 120 |
| `swatches` | json | required, max 2 MB |
| `source` | select | `photo / generate / prompt / ref` |
| `thumbnail` | file | image/png, jpeg, webp, max 2 MB |
| `owner` | relation → users | required, cascade delete |
| `created` / `updated` | autodate | system-managed |

The built-in `users` collection already provides email/password auth — no setup needed.

### 2. Start the Python service

```sh
cd api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then edit if PocketBase isn't on the default port
uvicorn main:app --reload --port 8000
```

Then:
- API root + endpoint list:    <http://localhost:8000/>
- Interactive Swagger UI:      <http://localhost:8000/docs>
- ReDoc:                       <http://localhost:8000/redoc>
- PocketBase reachability:     <http://localhost:8000/auth/health>

## Endpoints

| Method | Path | What |
|---|---|---|
| `POST` | `/extract/kmeans` | Image → N dominant colors (k-means in Lab / RGB / OKLab); each centroid mode-snapped to a real pixel |
| `POST` | `/extract/colorthief` | Image → palette via median-cut (Pillow's adaptive palette) |
| `POST` | `/harmonize` | Base color + rule → palette of N derivatives (mono / analog / comp / triadic / split / tetradic) |
| `POST` | `/contrast/wcag` | Foreground vs background → WCAG ratio + grade + AA/AAA pass flags |
| `POST` | `/contrast/audit` | Audit a whole palette → contrast matrix + best/worst pairs |
| `POST` | `/convert/spaces` | Single color → metadata in RGB / HEX / CMYK / HSL / Lab / OKLab / luminance / WCAG-vs-white/black |
| `POST` | `/auth/signup` | Create user in PocketBase + return bearer token |
| `POST` | `/auth/login` | Email + password → bearer token |
| `GET`  | `/auth/me` | Resolve current user from `Authorization: Bearer <token>` |
| `GET`  | `/auth/health` | PocketBase liveness probe |
| `GET`  | `/palettes` | List the current user's saved palettes (paginated) |
| `POST` | `/palettes` | Save a palette (JSON body) |
| `POST` | `/palettes/with-thumbnail` | Save a palette + thumbnail (multipart) |
| `GET`  | `/palettes/{id}` | Fetch a single palette |
| `PATCH`| `/palettes/{id}` | Rename a palette / change source |
| `DELETE` | `/palettes/{id}` | Delete a palette |

All `/palettes/*` and `/auth/me` calls require an `Authorization: Bearer <token>` header where the token came from `/auth/login` or `/auth/signup`.

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

## Deployment

### Render.com (recommended for free, persistent URL)

1. Push this repo to GitHub (already done).
2. Go to <https://dashboard.render.com> → **New** → **Blueprint**.
3. Connect this repo, point to `api/render.yaml` — Render reads it and provisions a free Docker web service.
4. After ~3 minutes, you get `https://nnc-api.onrender.com` (or similar).
5. In the frontend, set `API_URLS` to include that origin.

Free plan: spins down after 15 min idle, cold-start ~30s, 750 hr/mo. Plenty for a prototype.

### HuggingFace Spaces (alternative, ML-friendly)

1. Create a new Space at <https://huggingface.co/new-space>, pick **Docker** SDK.
2. Clone this repo's `api/` directory into the Space repo.
3. Rename `api/space-README.md` → `README.md` in the Space (the YAML frontmatter is what HF reads).
4. Push — Spaces builds the Dockerfile automatically. URL: `https://huggingface.co/spaces/<user>/<space>`.

### Self-host (any Docker host)

```sh
cd api
docker build -t nnc-api .
docker run -p 8000:8000 nnc-api
```

Works on Fly.io, Railway, Cloud Run, your VPS, anywhere Docker runs.

## Roadmap

- `/extract/colorthief` — done (uses Pillow median-cut)
- `/extract/kmeans` — done (Lab/RGB/OKLab + mode-snap)
- `/harmonize` — done (6 rules, N-aware)
- `/contrast/wcag` + `/contrast/audit` — done
- `/convert/spaces` — done
- `/auth/*` + `/palettes/*` — done (PocketBase BaaS)
- `/extract/segment` — TODO: scikit-image SLIC segmentation, give weighted palette per region
- `/extract/skin-aware` — TODO: OpenCV face detection → exclude/include skin tones
- `/prompt-to-palette` — TODO: integrate Claude/OpenAI for free-text prompts
- `/colorblind/simulate` — TODO: rigorous Brettel/Vienot via colour-science
- realtime palette sync via PocketBase websocket — TODO
