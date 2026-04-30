"""no noob color — Python microservice (FastAPI)

Color engine: image → palette extraction, harmony rules, WCAG analysis,
color-space conversions. Frontend talks to this via REST.

Run locally:
    cd api
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000

Docs:
    http://localhost:8000/docs    (Swagger UI)
    http://localhost:8000/redoc   (ReDoc)
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import extract, harmonize, contrast, convert, auth, palettes, colorblind, tones, material, llm, glasbey_palette

app = FastAPI(
    title="no noob color API",
    description="Color science + BaaS bridge for the no noob color web app.",
    version="0.2.0",
)

# CORS — open for local dev. In production, restrict to the deployed frontend origin.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(extract.router, prefix="/extract", tags=["extract"])
app.include_router(harmonize.router, prefix="/harmonize", tags=["harmonize"])
app.include_router(contrast.router, prefix="/contrast", tags=["contrast"])
app.include_router(convert.router, prefix="/convert", tags=["convert"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(palettes.router, prefix="/palettes", tags=["palettes"])
app.include_router(colorblind.router, prefix="/colorblind", tags=["colorblind"])
app.include_router(tones.router, prefix="/tones", tags=["tones"])
app.include_router(material.router, prefix="/material", tags=["material"])
app.include_router(llm.router, prefix="/llm", tags=["llm"])
app.include_router(glasbey_palette.router, prefix="/glasbey", tags=["glasbey"])


@app.get("/")
def root():
    return {
        "name": "no noob color API",
        "version": "0.2.0",
        "endpoints": {
            "POST /extract/kmeans":     "image → N dominant colors via k-means in Lab/RGB/OKLab",
            "POST /extract/colorthief": "image → palette via median-cut (colorthief-style, mode-snapped)",
            "POST /harmonize":          "base color + rule → palette of N derivatives",
            "POST /contrast/wcag":      "WCAG 2.1 contrast analysis between two colors",
            "POST /contrast/audit":     "audit a whole palette against AA/AAA",
            "POST /contrast/delta-e":   "perceptual difference (CIE76/94/CIEDE2000)",
            "POST /contrast/delta-e/matrix": "pairwise delta-e matrix for a palette",
            "POST /colorblind/simulate": "Brettel/Viénot CVD simulation for a palette",
            "POST /tones/generate":     "single seed → 11-stop tonal scale (50-950)",
            "POST /tones/tailwind":     "tonal scale + Tailwind config snippet",
            "POST /material/theme":     "Material 3 theme — roles + 16-stop tonal palettes + light/dark",
            "POST /material/css-variables": "Material 3 theme as CSS variables",
            "POST /llm/prompt-to-palette": "freeform prompt → palette via OpenAI/Apify",
            "GET  /llm/status":         "which LLM providers are configured",
            "POST /glasbey/generate":   "max-distinct N colors via Glasbey algorithm",
            "POST /convert/spaces":     "convert RGB - Lab - OKLab - CMYK - HSL",
            "POST /auth/signup":        "create account in PocketBase users collection",
            "POST /auth/login":         "exchange email+password for a bearer token",
            "GET  /auth/me":            "resolve user from bearer token",
            "GET  /auth/health":        "PocketBase reachability check",
            "GET  /palettes":           "list current user's saved palettes",
            "POST /palettes":           "save a palette (JSON)",
            "POST /palettes/with-thumbnail": "save a palette + thumbnail (multipart)",
            "DELETE /palettes/{id}":    "delete a palette",
            "GET  /docs":               "Swagger UI",
        },
    }
