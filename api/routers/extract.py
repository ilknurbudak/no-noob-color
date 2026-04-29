"""Image → palette extraction.

Two implementations:
  - /extract/kmeans      scikit-learn k-means in Lab/RGB/OKLab
  - /extract/colorthief  median-cut style (Pillow-based), faster on small images
"""
from __future__ import annotations
from io import BytesIO
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from PIL import Image
import numpy as np
from sklearn.cluster import KMeans

from services import color_science as cs

router = APIRouter()

MAX_DIM = 400  # downsample for speed


def _open_and_thumbnail(image_bytes: bytes) -> Image.Image:
    img = Image.open(BytesIO(image_bytes)).convert("RGB")
    img.thumbnail((MAX_DIM, MAX_DIM))
    return img


@router.post("/kmeans")
async def kmeans_extract(
    image: UploadFile = File(..., description="Source image"),
    n: int = Form(5, ge=2, le=30, description="Number of clusters"),
    color_space: str = Form("lab", regex="^(lab|rgb|oklab)$"),
):
    """K-means clustering. Mode-snaps each cluster centroid to its most
    common quantized RGB pixel so output colors are guaranteed to exist
    in the source image (no muddy averaged centroids).
    """
    if not (image.content_type or "").startswith("image/"):
        raise HTTPException(400, "must upload an image")

    img = _open_and_thumbnail(await image.read())
    pixels = np.array(img).reshape(-1, 3)

    if color_space == "lab":
        feature = np.array([cs.rgb_to_lab(tuple(p)) for p in pixels])
    elif color_space == "oklab":
        feature = np.array([cs.rgb_to_oklab(tuple(p)) for p in pixels])
    else:
        feature = pixels.astype(float)

    km = KMeans(n_clusters=n, random_state=42, n_init=10).fit(feature)

    swatches = []
    total = len(pixels)
    for i in range(n):
        cluster_pixels = pixels[km.labels_ == i]
        if len(cluster_pixels) == 0:
            continue
        # Mode of 8-step quantized colors → "honest" pixel from the photo
        quantized = (cluster_pixels // 8) * 8
        unique, counts = np.unique(
            quantized.view(np.dtype((np.void, quantized.dtype.itemsize * 3))),
            return_counts=True,
        )
        mode_idx = int(np.argmax(counts))
        mode_quant = unique[mode_idx].view(quantized.dtype).reshape(3)
        # Find any actual pixel matching that quantized bin
        matches = cluster_pixels[(cluster_pixels // 8 == mode_quant).all(axis=1)]
        rgb = tuple(int(v) for v in matches[0]) if len(matches) else tuple(int(v) for v in cluster_pixels[0])

        swatches.append({
            **cs.metadata(rgb),
            "weight": round(int(np.sum(km.labels_ == i)) / total, 3),
            "cluster_size": int(np.sum(km.labels_ == i)),
        })

    swatches.sort(key=lambda s: -s["weight"])
    return {
        "n": n,
        "color_space": color_space,
        "image_size": img.size,
        "palette": swatches,
    }


@router.post("/colorthief")
async def colorthief_extract(
    image: UploadFile = File(...),
    n: int = Form(5, ge=2, le=30),
):
    """Median-cut palette extraction (fast)."""
    if not (image.content_type or "").startswith("image/"):
        raise HTTPException(400, "must upload an image")

    img = _open_and_thumbnail(await image.read())
    # Pillow's adaptive palette IS median cut
    paletted = img.convert("P", palette=Image.ADAPTIVE, colors=n)
    palette = paletted.getpalette()[: n * 3]
    counts = paletted.getcolors() or []

    swatches = []
    total = sum(c for c, _ in counts) or 1
    for count, idx in counts:
        rgb = (palette[idx * 3], palette[idx * 3 + 1], palette[idx * 3 + 2])
        swatches.append({
            **cs.metadata(rgb),
            "weight": round(count / total, 3),
            "cluster_size": int(count),
        })
    swatches.sort(key=lambda s: -s["weight"])
    return {"n": n, "method": "median-cut", "palette": swatches}
