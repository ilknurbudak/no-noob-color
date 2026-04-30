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


class DeltaERequest(BaseModel):
    a: str = Field(..., description="First color #hex")
    b: str = Field(..., description="Second color #hex")
    method: str = Field("CIEDE2000", pattern="^(CIE76|CIE94|CIEDE2000)$")


class DeltaEMatrixRequest(BaseModel):
    palette: list[str] = Field(..., description="List of #hex colors")
    method: str = Field("CIEDE2000", pattern="^(CIE76|CIE94|CIEDE2000)$")


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


@router.post("/delta-e")
def delta_e_pair(req: DeltaERequest):
    """Perceptual difference between two colors via CIEDE2000 (default)."""
    a = _hex_to_rgb(req.a)
    b = _hex_to_rgb(req.b)
    de = cs.delta_e(a, b, method=req.method)
    return {
        "a": req.a,
        "b": req.b,
        "method": req.method,
        "delta_e": round(de, 3),
        "grade": cs.delta_e_grade(de),
    }


@router.post("/delta-e/matrix")
def delta_e_matrix(req: DeltaEMatrixRequest):
    """Pairwise CIEDE2000 matrix for a palette — useful for finding
    duplicate/near-duplicate swatches."""
    rgbs = [_hex_to_rgb(h) for h in req.palette]
    n = len(rgbs)
    matrix = []
    closest = {"i": 0, "j": 1, "delta_e": float("inf")}
    for i in range(n):
        row = []
        for j in range(n):
            de = cs.delta_e(rgbs[i], rgbs[j], method=req.method)
            row.append(round(de, 3))
            if i < j and de < closest["delta_e"]:
                closest = {"i": i, "j": j, "delta_e": round(de, 3)}
        matrix.append(row)
    return {
        "palette": req.palette,
        "method": req.method,
        "matrix": matrix,
        "closest_pair": closest,
    }
