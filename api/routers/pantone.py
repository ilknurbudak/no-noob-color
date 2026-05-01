"""Pantone-like closest match.

Uses an open Pantone-resembling subset (NOT licensed Pantone data).
Matches via CIEDE2000 in Lab. For real production work, use the
licensed Pantone Connect or Pantone Studio app.
"""
from __future__ import annotations
import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services import color_science as cs

router = APIRouter()

DATA_PATH = Path(__file__).parent.parent / "data" / "pantone_subset.json"

with open(DATA_PATH) as f:
    DATASET = json.load(f)
COLORS = DATASET["colors"]
NOTE = DATASET.get("note", "")


def _hex_to_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    if len(h) != 6:
        raise HTTPException(400, f"invalid hex: {h}")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


# Precompute Lab for the dataset.
_LAB_CACHE = [
    (entry, cs.rgb_to_lab(_hex_to_rgb(entry["hex"])))
    for entry in COLORS
]


class MatchRequest(BaseModel):
    palette: list[str] = Field(..., min_length=1, max_length=64)
    top_k: int = Field(1, ge=1, le=10, description="Top-K nearest matches per swatch")


@router.get("/dataset")
def dataset_info():
    """Info about the Pantone-like subset bundled with the service."""
    return {
        "name": DATASET.get("name"),
        "note": NOTE,
        "size": len(COLORS),
        "sample": COLORS[:5],
    }


@router.post("/match")
def pantone_match(req: MatchRequest):
    """For each palette swatch, return the K nearest entries in our
    Pantone-like subset by CIEDE2000."""
    out = []
    for hex_in in req.palette:
        rgb = _hex_to_rgb(hex_in)
        scored: list[tuple[float, dict]] = []
        for entry, target_lab in _LAB_CACHE:
            de = cs.delta_e(rgb, _hex_to_rgb(entry["hex"]), method="CIEDE2000")
            scored.append((de, entry))
        scored.sort(key=lambda x: x[0])
        out.append({
            "input": hex_in,
            "matches": [
                {
                    "code": entry["code"],
                    "name": entry["name"],
                    "hex": entry["hex"],
                    "delta_e": round(de, 2),
                    "grade": cs.delta_e_grade(de),
                }
                for de, entry in scored[: req.top_k]
            ],
        })
    return {
        "note": NOTE,
        "palette": out,
    }
