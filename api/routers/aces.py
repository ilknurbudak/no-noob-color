"""ACES color space transforms via colour-science.

Maps colors between ACEScg, ACES2065-1 (AP0), Rec.709, sRGB, P3-D65, Rec.2020.
For VFX / cinematography pipelines.
"""
from __future__ import annotations
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import numpy as np

try:
    import colour
    HAS_COLOUR = True
except ImportError:
    HAS_COLOUR = False

router = APIRouter()


SPACES = ["sRGB", "Rec.709", "Rec.2020", "P3-D65", "ACEScg", "ACES2065-1"]
COLOUR_NAMES = {
    "sRGB": "sRGB",
    "Rec.709": "ITU-R BT.709",
    "Rec.2020": "ITU-R BT.2020",
    "P3-D65": "Display P3",
    "ACEScg": "ACEScg",
    "ACES2065-1": "ACES2065-1",
}


class TransformRequest(BaseModel):
    palette: list[str] = Field(..., min_length=1, max_length=64)
    source: str = Field(..., description="Source space")
    target: str = Field(..., description="Target space")


def _hex_to_rgb01(h: str) -> np.ndarray:
    h = h.lstrip("#")
    if len(h) != 6:
        raise HTTPException(400, f"invalid hex: {h}")
    return np.array([int(h[i:i+2], 16) / 255.0 for i in (0, 2, 4)])


def _clamp_to_hex(rgb01: np.ndarray) -> str:
    rgb = np.clip(rgb01, 0.0, 1.0) * 255
    return "#{:02X}{:02X}{:02X}".format(*(int(round(v)) for v in rgb))


@router.get("/spaces")
def list_spaces():
    """List supported color spaces for /aces/convert."""
    return {"spaces": SPACES, "needs_colour_science": True, "available": HAS_COLOUR}


@router.post("/convert")
def aces_convert(req: TransformRequest):
    """Transform a palette from source RGB space to target RGB space.

    Note: chromatic adaptation is performed automatically by colour-science
    (Bradford). Out-of-gamut destinations are clipped — `clipped` flag in
    the response tells you which swatches were affected.
    """
    if not HAS_COLOUR:
        raise HTTPException(503, "colour-science library not installed")
    if req.source not in COLOUR_NAMES:
        raise HTTPException(400, f"unknown source: {req.source}. allowed: {SPACES}")
    if req.target not in COLOUR_NAMES:
        raise HTTPException(400, f"unknown target: {req.target}. allowed: {SPACES}")

    src_name = COLOUR_NAMES[req.source]
    tgt_name = COLOUR_NAMES[req.target]
    rgb_in = np.array([_hex_to_rgb01(h) for h in req.palette])

    try:
        rgb_out = colour.RGB_to_RGB(
            rgb_in,
            input_colourspace=src_name,
            output_colourspace=tgt_name,
            chromatic_adaptation_transform="Bradford",
        )
    except Exception as e:
        raise HTTPException(500, f"colour-science transform failed: {e}") from e

    out = []
    for orig, transformed in zip(req.palette, rgb_out):
        clipped = bool(np.any(transformed < 0.0) or np.any(transformed > 1.0))
        out.append({
            "input": orig,
            "output": _clamp_to_hex(transformed),
            "rgb_unclamped": [float(round(v, 6)) for v in transformed],
            "clipped": clipped,
        })

    return {
        "source": req.source,
        "target": req.target,
        "palette": out,
        "clipped_count": sum(1 for s in out if s["clipped"]),
    }
