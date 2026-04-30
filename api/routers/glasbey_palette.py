"""Glasbey: maximum-perceptual-distance palette generation.

Useful for data viz, charts, multi-class labeling — colors are
deliberately spread in CIECAM02-UCS space so each pair stays distinct.
"""
from __future__ import annotations
import warnings
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

# glasbey + colorspacious produce a lot of overflow warnings on import — silence
# them so the API logs stay readable. The math is intentional (large color gamut).
warnings.filterwarnings("ignore", category=RuntimeWarning)
warnings.filterwarnings("ignore", category=SyntaxWarning)

import glasbey  # noqa: E402

router = APIRouter()


class GlasbeyRequest(BaseModel):
    n: int = Field(8, ge=2, le=64, description="Palette size")
    lightness_min: float = Field(20.0, ge=0.0, le=100.0)
    lightness_max: float = Field(80.0, ge=0.0, le=100.0)
    chroma_min: float = Field(20.0, ge=0.0, le=100.0)
    chroma_max: float = Field(90.0, ge=0.0, le=100.0)
    cvd_safe: bool = Field(False, description="Constrain to colors distinct under CVD")
    cvd_type: str = Field("deuteranomaly",
        pattern="^(protanomaly|deuteranomaly|tritanomaly)$")
    cvd_severity: float = Field(50.0, ge=0.0, le=100.0)


@router.post("/generate")
def glasbey_generate(req: GlasbeyRequest):
    """Generate a Glasbey palette — maximally distinct colors in perceptual space."""
    if req.lightness_min >= req.lightness_max:
        raise HTTPException(400, "lightness_min must be < lightness_max")
    if req.chroma_min >= req.chroma_max:
        raise HTTPException(400, "chroma_min must be < chroma_max")

    try:
        hexes = glasbey.create_palette(
            palette_size=req.n,
            lightness_bounds=(req.lightness_min, req.lightness_max),
            chroma_bounds=(req.chroma_min, req.chroma_max),
            colorblind_safe=req.cvd_safe,
            cvd_type=req.cvd_type if req.cvd_safe else "deuteranomaly",
            cvd_severity=req.cvd_severity,
            as_hex=True,
        )
    except Exception as e:
        raise HTTPException(500, f"glasbey failed: {e}") from e

    palette = []
    for h in hexes:
        h = h.upper()
        if len(h) == 7:
            r, g, b = int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16)
            palette.append({"hex": h, "rgb": [r, g, b]})

    return {
        "n": req.n,
        "palette": palette,
        "constraints": {
            "lightness": [req.lightness_min, req.lightness_max],
            "chroma": [req.chroma_min, req.chroma_max],
            "cvd_safe": req.cvd_safe,
            "cvd_type": req.cvd_type if req.cvd_safe else None,
        },
    }
