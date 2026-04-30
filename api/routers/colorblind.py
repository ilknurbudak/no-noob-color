"""Color-vision deficiency simulation.

Frontend already does Brettel matrices in the browser for instant preview.
This endpoint exists for batch use cases (audit a whole library, generate
contrast reports) and to keep the Python service authoritative on color math.
"""
from __future__ import annotations
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import numpy as np

router = APIRouter()


# Linear-RGB Brettel/Viénot matrices (matching the JS implementation).
MATRICES = {
    "protanopia": np.array([
        [0.152286, 1.052583, -0.204868],
        [0.114503, 0.786281, 0.099216],
        [-0.003882, -0.048116, 1.051998],
    ]),
    "deuteranopia": np.array([
        [0.367322, 0.860646, -0.227968],
        [0.280085, 0.672501, 0.047413],
        [-0.011820, 0.042940, 0.968881],
    ]),
    "tritanopia": np.array([
        [1.255528, -0.076749, -0.178779],
        [-0.078411, 0.930809, 0.147602],
        [0.004733, 0.691367, 0.303900],
    ]),
}


class SimulateRequest(BaseModel):
    palette: list[str] = Field(..., description="List of #hex colors")
    mode: str = Field(..., pattern="^(protanopia|deuteranopia|tritanopia)$")


def _hex_to_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    if len(h) != 6:
        raise HTTPException(400, f"invalid hex: {h}")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def _rgb_to_hex(rgb: tuple[int, int, int]) -> str:
    return "#{:02X}{:02X}{:02X}".format(*rgb)


def _srgb_to_linear(c: float) -> float:
    n = c / 255.0
    return n / 12.92 if n <= 0.04045 else ((n + 0.055) / 1.055) ** 2.4


def _linear_to_srgb(c: float) -> int:
    n = c * 12.92 if c <= 0.0031308 else 1.055 * (c ** (1 / 2.4)) - 0.055
    return int(round(max(0.0, min(1.0, n)) * 255))


def simulate_one(rgb: tuple[int, int, int], mode: str) -> tuple[int, int, int]:
    M = MATRICES[mode]
    r, g, b = (_srgb_to_linear(v) for v in rgb)
    out = M @ np.array([r, g, b])
    return tuple(_linear_to_srgb(v) for v in out)  # type: ignore


@router.post("/simulate")
def simulate_palette(req: SimulateRequest):
    """Apply Brettel/Viénot CVD simulation to a palette."""
    rgbs = [_hex_to_rgb(h) for h in req.palette]
    simulated = [simulate_one(rgb, req.mode) for rgb in rgbs]
    return {
        "mode": req.mode,
        "original": req.palette,
        "simulated": [_rgb_to_hex(rgb) for rgb in simulated],
        "rgb": [{"r": r, "g": g, "b": b} for r, g, b in simulated],
        "prevalence": {
            "protanopia": "1.3% of males",
            "deuteranopia": "5.0% of males (most common)",
            "tritanopia": "<0.01% (rare, often acquired)",
        }[req.mode],
    }
