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


@router.post("/segment")
async def segment_extract(
    image: UploadFile = File(..., description="Source image"),
    n_segments: int = Form(80, ge=10, le=400, description="Target SLIC segments"),
    palette_size: int = Form(5, ge=2, le=20),
    compactness: float = Form(10.0, ge=1.0, le=50.0),
):
    """SLIC superpixel segmentation → weighted dominant colors per region.

    Each segment contributes its mean Lab color, weighted by pixel count.
    Then we cluster the segment means down to `palette_size` swatches.
    Better than naive k-means for images where small regions matter
    (a tiny pop of red shouldn't be averaged out into the background).
    """
    from skimage import segmentation

    if not (image.content_type or "").startswith("image/"):
        raise HTTPException(400, "must upload an image")

    img = _open_and_thumbnail(await image.read())
    pixels = np.array(img)

    seg_labels = segmentation.slic(
        pixels, n_segments=n_segments, compactness=compactness,
        start_label=0, channel_axis=-1,
    )

    # Per-segment mean RGB + size
    flat_pixels = pixels.reshape(-1, 3)
    flat_labels = seg_labels.reshape(-1)
    seg_means = []
    for sid in range(seg_labels.max() + 1):
        mask = flat_labels == sid
        size = int(mask.sum())
        if size == 0:
            continue
        seg_means.append((flat_pixels[mask].mean(axis=0), size))

    if not seg_means:
        raise HTTPException(500, "segmentation produced no regions")

    # Cluster segment means in Lab, weighted by segment size.
    means = np.array([m for m, _ in seg_means])
    weights = np.array([w for _, w in seg_means], dtype=float)
    feature = np.array([cs.rgb_to_lab(tuple(int(v) for v in m)) for m in means])

    km = KMeans(n_clusters=min(palette_size, len(means)),
                random_state=42, n_init=10).fit(feature, sample_weight=weights)

    swatches = []
    total = weights.sum()
    for cid in range(km.n_clusters):
        in_cluster = km.labels_ == cid
        if not in_cluster.any():
            continue
        cluster_means = means[in_cluster]
        cluster_weights = weights[in_cluster]
        # Weighted mean RGB → snap to nearest segment mean for honesty
        target = (cluster_means * cluster_weights[:, None]).sum(axis=0) / cluster_weights.sum()
        nearest_idx = int(np.argmin(np.linalg.norm(cluster_means - target, axis=1)))
        rgb = tuple(int(v) for v in cluster_means[nearest_idx])
        cluster_total = float(cluster_weights.sum())
        swatches.append({
            **cs.metadata(rgb),
            "weight": round(cluster_total / total, 3),
            "segment_count": int(in_cluster.sum()),
        })

    swatches.sort(key=lambda s: -s["weight"])
    return {
        "method": "SLIC + weighted k-means",
        "image_size": img.size,
        "n_segments": int(seg_labels.max() + 1),
        "palette_size": palette_size,
        "palette": swatches,
    }


def _is_skin_pixel(rgb: np.ndarray) -> np.ndarray:
    """Heuristic skin-tone mask in HSV/RGB. Vectorized over Nx3 array.

    Based on common rule-of-thumb thresholds (Kovac et al. 2003 +
    HSV refinement). Not perfect — falls down on harsh lighting and
    very dark skin — but works as a 'roughly exclude / include' signal.
    """
    r, g, b = rgb[:, 0], rgb[:, 1], rgb[:, 2]
    rule_a = (r > 95) & (g > 40) & (b > 20) & \
             ((rgb.max(axis=1) - rgb.min(axis=1)) > 15) & \
             (np.abs(r - g) > 15) & (r > g) & (r > b)
    return rule_a


@router.post("/skin-aware")
async def skin_aware_extract(
    image: UploadFile = File(..., description="Source image (portrait works best)"),
    n: int = Form(5, ge=2, le=20),
    mode: str = Form("exclude", regex="^(exclude|only|annotate)$",
        description="exclude: drop skin pixels · only: keep only skin · annotate: tag swatches"),
):
    """Extract a palette while either ignoring skin tones (mode=exclude),
    keeping only skin tones (mode=only), or tagging which swatches read
    as skin (mode=annotate).

    Uses a heuristic RGB+HSV skin mask (Kovac 2003 family) — fast, no
    extra deps. For portrait photos this lets you find a 'wardrobe' palette
    without the model's complexion dominating the result.
    """
    if not (image.content_type or "").startswith("image/"):
        raise HTTPException(400, "must upload an image")

    img = _open_and_thumbnail(await image.read())
    pixels = np.array(img).reshape(-1, 3)
    skin_mask = _is_skin_pixel(pixels)

    if mode == "exclude":
        keep = pixels[~skin_mask]
        annotation = None
    elif mode == "only":
        keep = pixels[skin_mask]
        annotation = None
    else:
        keep = pixels
        annotation = skin_mask

    if len(keep) < n * 5:
        raise HTTPException(400, f"not enough pixels after filtering ({len(keep)})")

    feature = np.array([cs.rgb_to_lab(tuple(p)) for p in keep])
    km = KMeans(n_clusters=n, random_state=42, n_init=10).fit(feature)

    swatches = []
    total = len(keep)
    for cid in range(n):
        cluster_pixels = keep[km.labels_ == cid]
        if len(cluster_pixels) == 0:
            continue
        rgb = tuple(int(v) for v in cluster_pixels[len(cluster_pixels) // 2])
        sw = {
            **cs.metadata(rgb),
            "weight": round(int(np.sum(km.labels_ == cid)) / total, 3),
        }
        if annotation is not None:
            cluster_skin_share = float(annotation[km.labels_ == cid].mean())
            sw["skin_share"] = round(cluster_skin_share, 3)
            sw["is_skin"] = cluster_skin_share > 0.6
        swatches.append(sw)

    swatches.sort(key=lambda s: -s["weight"])
    return {
        "mode": mode,
        "image_size": img.size,
        "skin_pixel_share": round(float(skin_mask.mean()), 3),
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
