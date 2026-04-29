"""Color theory harmonies — given a base color and rule, return a palette."""
from __future__ import annotations
from fastapi import APIRouter
from pydantic import BaseModel, Field
import colorsys

from services import color_science as cs

router = APIRouter()


class HarmonizeRequest(BaseModel):
    base: str = Field(..., description="Base color as #hex (e.g. '#c14a3a')")
    rule: str = Field("triadic", description="monochromatic|analogous|complementary|triadic|split-complementary|tetradic")
    n: int = Field(5, ge=2, le=20)


def _hex_to_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def _shift_hue(rgb: tuple[int, int, int], deg: float) -> tuple[int, int, int]:
    r, g, b = (c / 255 for c in rgb)
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    h = ((h * 360 + deg) % 360) / 360
    r2, g2, b2 = colorsys.hls_to_rgb(h, l, s)
    return (round(r2 * 255), round(g2 * 255), round(b2 * 255))


def _tone(rgb: tuple[int, int, int], dl: float) -> tuple[int, int, int]:
    """Adjust HSL lightness by dl (e.g., +0.15)."""
    r, g, b = (c / 255 for c in rgb)
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    l = max(0, min(1, l + dl))
    r2, g2, b2 = colorsys.hls_to_rgb(h, l, s)
    return (round(r2 * 255), round(g2 * 255), round(b2 * 255))


@router.post("")
def harmonize(req: HarmonizeRequest):
    base = _hex_to_rgb(req.base)
    out: list[tuple[int, int, int]] = []
    n = req.n

    if req.rule == "monochromatic":
        for i in range(n):
            t = (i / max(1, n - 1)) - 0.5
            out.append(_tone(base, t * 0.6))
    elif req.rule == "analogous":
        for i in range(n):
            offset = (i / max(1, n - 1) - 0.5) * 60  # ±30°
            out.append(_shift_hue(base, offset))
    elif req.rule == "complementary":
        for i in range(n):
            shift = 0 if i < n // 2 else 180
            t = (i % max(1, n // 2)) * 0.1 - 0.1
            out.append(_tone(_shift_hue(base, shift), t))
    elif req.rule == "triadic":
        for i in range(n):
            out.append(_shift_hue(base, (i % 3) * 120))
    elif req.rule == "split-complementary":
        offsets = [0, 150, 210]
        for i in range(n):
            out.append(_shift_hue(base, offsets[i % 3]))
    elif req.rule == "tetradic":
        offsets = [0, 90, 180, 270]
        for i in range(n):
            out.append(_shift_hue(base, offsets[i % 4]))
    else:
        out = [base] * n

    return {
        "base": req.base,
        "rule": req.rule,
        "n": n,
        "palette": [cs.metadata(rgb) for rgb in out],
    }
