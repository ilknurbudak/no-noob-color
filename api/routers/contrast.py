"""WCAG contrast analysis."""
from __future__ import annotations
from fastapi import APIRouter
from pydantic import BaseModel, Field

from services import color_science as cs

router = APIRouter()


class WCAGRequest(BaseModel):
    fg: str = Field(..., description="Foreground color #hex")
    bg: str = Field(..., description="Background color #hex")


class AuditRequest(BaseModel):
    palette: list[str] = Field(..., description="List of #hex colors")


def _hex_to_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


@router.post("/wcag")
def wcag_pair(req: WCAGRequest):
    fg = _hex_to_rgb(req.fg)
    bg = _hex_to_rgb(req.bg)
    ratio = cs.contrast_ratio(fg, bg)
    return {
        "fg": req.fg,
        "bg": req.bg,
        "ratio": round(ratio, 2),
        "grade": cs.wcag_grade(ratio),
        "passes": {
            "AA_normal": ratio >= 4.5,
            "AA_large": ratio >= 3.0,
            "AAA_normal": ratio >= 7.0,
            "AAA_large": ratio >= 4.5,
        },
    }


@router.post("/audit")
def palette_audit(req: AuditRequest):
    """Return the contrast matrix for every (fg, bg) pair in a palette."""
    rgbs = [_hex_to_rgb(h) for h in req.palette]
    n = len(rgbs)
    matrix = []
    for i in range(n):
        row = []
        for j in range(n):
            r = cs.contrast_ratio(rgbs[i], rgbs[j])
            row.append({
                "ratio": round(r, 2),
                "grade": cs.wcag_grade(r),
            })
        matrix.append(row)
    # Best & worst pairs
    best = {"i": 0, "j": 1, "ratio": 0}
    worst = {"i": 0, "j": 1, "ratio": 999}
    for i in range(n):
        for j in range(i + 1, n):
            r = matrix[i][j]["ratio"]
            if r > best["ratio"]: best = {"i": i, "j": j, "ratio": r}
            if r < worst["ratio"]: worst = {"i": i, "j": j, "ratio": r}
    return {
        "palette": req.palette,
        "matrix": matrix,
        "best_pair": best,
        "worst_pair": worst,
    }
