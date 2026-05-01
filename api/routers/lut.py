"""LUT export — palette → .cube 3D LUT for color grading.

Compatible with DaVinci Resolve, Premiere Pro, Final Cut, Photoshop, OBS.
Maps the source's hue distribution onto the palette's hues, preserving
luminance — i.e. the cinematographer's 'apply this look' move.
"""
from __future__ import annotations
from io import BytesIO
from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel, Field
import numpy as np

from services import color_science as cs

router = APIRouter()


class LUTRequest(BaseModel):
    palette: list[str] = Field(..., min_length=2, max_length=12,
        description="Target palette as #hex colors")
    size: int = Field(33, ge=17, le=65, description="Cube size — 17/33/65 standard")
    title: str = Field("nnc-palette", max_length=80)
    strength: float = Field(1.0, ge=0.0, le=1.0,
        description="0=identity, 1=full grade")


def _hex_to_rgb01(h: str) -> np.ndarray:
    h = h.lstrip("#")
    if len(h) != 6:
        raise HTTPException(400, f"invalid hex: {h}")
    return np.array([int(h[i:i+2], 16) / 255.0 for i in (0, 2, 4)])


def _rgb01_to_lab(rgb: np.ndarray) -> np.ndarray:
    r, g, b = rgb
    return np.array(cs.rgb_to_lab((int(r * 255), int(g * 255), int(b * 255))))


def _build_cube(palette_hexes: list[str], size: int, strength: float) -> str:
    palette_rgb = np.array([_hex_to_rgb01(h) for h in palette_hexes])
    palette_lab = np.array([_rgb01_to_lab(p) for p in palette_rgb])

    # Build LUT: for each grid point, find nearest palette color in chroma space,
    # nudge the chroma axis toward it while keeping luminance.
    grid = np.linspace(0.0, 1.0, size)
    lines: list[str] = [
        f'TITLE "{palette_hexes!r} · {len(palette_hexes)} colors"',
        f"LUT_3D_SIZE {size}",
        "DOMAIN_MIN 0.0 0.0 0.0",
        "DOMAIN_MAX 1.0 1.0 1.0",
        "",
    ]
    for ib in range(size):
        for ig in range(size):
            for ir in range(size):
                src = np.array([grid[ir], grid[ig], grid[ib]])
                lab = _rgb01_to_lab(src)
                # Find palette color nearest in a*b* (chroma plane)
                ab_dists = np.linalg.norm(palette_lab[:, 1:3] - lab[1:3], axis=1)
                nearest = int(np.argmin(ab_dists))
                target = palette_lab[nearest]
                # Keep the source luminance, blend chroma toward palette
                new_lab = np.array([lab[0],
                                    lab[1] + (target[1] - lab[1]) * strength,
                                    lab[2] + (target[2] - lab[2]) * strength])
                # back to RGB via colour-science (or fallback inverse Lab→XYZ→sRGB)
                out = _lab_to_rgb01(new_lab)
                out = np.clip(out, 0.0, 1.0)
                lines.append(f"{out[0]:.6f} {out[1]:.6f} {out[2]:.6f}")
    return "\n".join(lines) + "\n"


def _lab_to_rgb01(lab: np.ndarray) -> np.ndarray:
    L, a, b = lab
    fy = (L + 16.0) / 116.0
    fx = a / 500.0 + fy
    fz = fy - b / 200.0
    def finv(t: float) -> float:
        t3 = t ** 3
        return t3 if t3 > 0.008856 else (t - 16/116) / 7.787
    x = finv(fx) * 0.95047
    y = finv(fy) * 1.0
    z = finv(fz) * 1.08883
    r = x * 3.2406 + y * -1.5372 + z * -0.4986
    g = x * -0.9689 + y * 1.8758 + z * 0.0415
    b_ = x * 0.0557 + y * -0.2040 + z * 1.0570
    def srgb(v: float) -> float:
        if v <= 0.0031308: return 12.92 * v
        return 1.055 * (v ** (1/2.4)) - 0.055
    return np.array([srgb(r), srgb(g), srgb(b_)])


@router.post("/cube")
def export_cube(req: LUTRequest):
    """Generate a .cube 3D LUT and return it as a downloadable file."""
    cube_text = _build_cube(req.palette, req.size, req.strength)
    return Response(
        content=cube_text,
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": f'attachment; filename="{req.title}.cube"',
        },
    )


@router.post("/preview")
def preview_cube(req: LUTRequest):
    """Same as /cube but returns the text inline (for in-app preview)."""
    return {
        "title": req.title,
        "size": req.size,
        "strength": req.strength,
        "palette": req.palette,
        "cube": _build_cube(req.palette, req.size, req.strength),
    }
