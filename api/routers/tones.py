"""Tonal palette generation — single seed → 11-stop scale.

Inspired by tints.dev / Tailwind. Tones map to lightness in OKLCH
(perceptually uniform). Stops: 50 (lightest) → 950 (darkest).
"""
from __future__ import annotations
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import numpy as np

try:
    import colour  # noqa
    HAS_COLOUR = True
except ImportError:
    HAS_COLOUR = False

router = APIRouter()


# Target lightness (L*) per stop. Hand-tuned to match Tailwind's perceptual
# spacing — light stops squeeze together near 95, dark stops stretch toward 5.
STOPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
TARGET_L = {
    50:  97.0,
    100: 93.5,
    200: 86.0,
    300: 76.0,
    400: 64.0,
    500: 52.0,
    600: 42.0,
    700: 33.0,
    800: 24.0,
    900: 16.0,
    950: 10.0,
}


def _hex_to_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    if len(h) != 6:
        raise HTTPException(400, f"invalid hex: {h}")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def _srgb_to_linear(c: float) -> float:
    n = c / 255.0
    return n / 12.92 if n <= 0.04045 else ((n + 0.055) / 1.055) ** 2.4


def _linear_to_srgb_byte(c: float) -> int:
    n = c * 12.92 if c <= 0.0031308 else 1.055 * (c ** (1 / 2.4)) - 0.055
    return int(round(max(0.0, min(1.0, n)) * 255))


# OKLab transform (Björn Ottosson, 2020)
M1 = np.array([
    [0.4122214708, 0.5363325363, 0.0514459929],
    [0.2119034982, 0.6806995451, 0.1073969566],
    [0.0883024619, 0.2817188376, 0.6299787005],
])
M1_INV = np.linalg.inv(M1)
M2 = np.array([
    [0.2104542553, 0.7936177850, -0.0040720468],
    [1.9779984951, -2.4285922050, 0.4505937099],
    [0.0259040371, 0.7827717662, -0.8086757660],
])
M2_INV = np.linalg.inv(M2)


def rgb_to_oklab(rgb: tuple[int, int, int]) -> np.ndarray:
    lin = np.array([_srgb_to_linear(c) for c in rgb])
    lms = M1 @ lin
    lms_cbrt = np.cbrt(lms)
    return M2 @ lms_cbrt


def oklab_to_rgb(lab: np.ndarray) -> tuple[int, int, int]:
    lms_cbrt = M2_INV @ lab
    lms = lms_cbrt ** 3
    lin = M1_INV @ lms
    return tuple(_linear_to_srgb_byte(c) for c in lin)  # type: ignore


def oklab_to_oklch(lab: np.ndarray) -> tuple[float, float, float]:
    L, a, b = lab
    C = float(np.hypot(a, b))
    h = float(np.degrees(np.arctan2(b, a))) % 360.0
    return (float(L), C, h)


def oklch_to_oklab(L: float, C: float, h: float) -> np.ndarray:
    rad = np.radians(h)
    return np.array([L, C * np.cos(rad), C * np.sin(rad)])


# Map our 0-100 L* targets onto OKLab L (which is 0..1 with non-linear shape).
def target_oklab_L(target_lstar: float) -> float:
    # Approximation: OKLab L tracks closely with a re-scaled CIELAB L*.
    # Empirical fit: oklab_L ≈ (lstar/100) ** 0.7
    return (target_lstar / 100.0) ** 0.7


class TonesRequest(BaseModel):
    base: str = Field(..., description="Seed color #hex")
    chroma_decay: float = Field(0.85, ge=0.0, le=2.0,
        description="Chroma falloff toward extreme stops (0=flat, 1=natural).")


@router.post("/generate")
def generate_tones(req: TonesRequest):
    """Single seed → 11-stop tonal scale."""
    rgb = _hex_to_rgb(req.base)
    lab = rgb_to_oklab(rgb)
    L0, C0, h0 = oklab_to_oklch(lab)

    out = []
    for stop in STOPS:
        L_target = target_oklab_L(TARGET_L[stop])
        # Reduce chroma at extremes (light & dark) to avoid clipping/garishness.
        # Distance from middle (52 ~ stop 500) drives decay.
        mid_distance = abs(TARGET_L[stop] - 52.0) / 52.0  # 0..1
        chroma_scale = 1.0 - (mid_distance ** 1.4) * (1.0 - (1.0 - req.chroma_decay))
        chroma_scale = max(0.15, chroma_scale)
        new_lab = oklch_to_oklab(L_target, C0 * chroma_scale, h0)
        new_rgb = oklab_to_rgb(new_lab)
        hex_out = "#{:02X}{:02X}{:02X}".format(*new_rgb)
        out.append({
            "stop": stop,
            "hex": hex_out,
            "rgb": {"r": new_rgb[0], "g": new_rgb[1], "b": new_rgb[2]},
            "oklch": {
                "L": round(L_target, 4),
                "C": round(C0 * chroma_scale, 4),
                "h": round(h0, 2),
            },
        })

    # Identify which stop is closest to the input — useful for "this is your 600"
    closest_stop = min(out, key=lambda s: abs(s["oklch"]["L"] - L0))["stop"]

    return {
        "base": req.base,
        "stops": out,
        "seed_at_stop": closest_stop,
        "tailwind": {f"{stop}": entry["hex"] for stop, entry in zip(STOPS, out)},
    }


@router.post("/tailwind")
def tailwind_config(req: TonesRequest):
    """Same as /generate but formatted as a copy-pastable Tailwind snippet."""
    data = generate_tones(req)
    name = "brand"
    lines = [f"// Tailwind config — seed {req.base}", "", "{"]
    lines.append(f"  '{name}': {{")
    for stop, entry in data["tailwind"].items():
        lines.append(f"    '{stop}': '{entry}',")
    lines.append("  },")
    lines.append("}")
    return {
        "base": req.base,
        "config": "\n".join(lines),
        "css_variables": "\n".join(
            f"  --{name}-{stop}: {entry};"
            for stop, entry in data["tailwind"].items()
        ),
    }
