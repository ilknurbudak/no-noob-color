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

from routers import extract, harmonize, contrast, convert

app = FastAPI(
    title="no noob color API",
    description="Color science microservice for the no noob color web app.",
    version="0.1.0",
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


@app.get("/")
def root():
    return {
        "name": "no noob color API",
        "version": "0.1.0",
        "endpoints": {
            "POST /extract/kmeans":    "image → N dominant colors via k-means in Lab/RGB/OKLab",
            "POST /extract/colorthief": "image → palette via median-cut (colorthief-style, mode-snapped)",
            "POST /harmonize":         "base color + rule → palette of N derivatives",
            "POST /contrast/wcag":     "WCAG 2.1 contrast analysis between two colors",
            "POST /contrast/audit":    "audit a whole palette against AA/AAA",
            "POST /convert/spaces":    "convert RGB ↔ Lab ↔ OKLab ↔ CMYK ↔ HSL",
            "GET  /docs":              "Swagger UI",
        },
    }
