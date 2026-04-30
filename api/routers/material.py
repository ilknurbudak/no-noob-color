"""Material 3 (Material You) theming via Google's HCT color utilities.

Single seed → primary/secondary/tertiary/neutral roles + 13 tonal stops each
+ light/dark schemes — every text-on-surface combo contrast-guaranteed.
"""
from __future__ import annotations
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from material_color_utilities_python import (
    themeFromSourceColor, argbFromHex, hexFromArgb,
)

router = APIRouter()

PALETTE_NAMES = ["primary", "secondary", "tertiary", "neutral", "neutralVariant", "error"]
TONAL_STOPS = [0, 10, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 95, 98, 99, 100]
ROLE_KEYS = [
    "primary", "onPrimary", "primaryContainer", "onPrimaryContainer",
    "secondary", "onSecondary", "secondaryContainer", "onSecondaryContainer",
    "tertiary", "onTertiary", "tertiaryContainer", "onTertiaryContainer",
    "error", "onError", "errorContainer", "onErrorContainer",
    "background", "onBackground",
    "surface", "onSurface", "surfaceVariant", "onSurfaceVariant",
    "outline", "outlineVariant",
    "shadow", "scrim",
    "inverseSurface", "inverseOnSurface", "inversePrimary",
]


class ThemeRequest(BaseModel):
    seed: str = Field(..., description="Seed color #hex")


def _scheme_to_dict(scheme) -> dict:
    out = {}
    for key in ROLE_KEYS:
        getter = f"get_{key}"
        if hasattr(scheme, getter):
            try:
                out[key] = hexFromArgb(getattr(scheme, getter))
                continue
            except Exception:
                pass
        if hasattr(scheme, key):
            try:
                val = getattr(scheme, key)
                if isinstance(val, int):
                    out[key] = hexFromArgb(val)
            except Exception:
                pass
    return out


@router.post("/theme")
def material_theme(req: ThemeRequest):
    """Return a complete Material 3 theme: roles + tonal palettes + schemes."""
    try:
        argb = argbFromHex(req.seed)
    except Exception as e:
        raise HTTPException(400, f"invalid seed: {e}") from e

    theme = themeFromSourceColor(argb)

    # Tonal palettes — 16 stops each
    palettes = {}
    for name in PALETTE_NAMES:
        if name not in theme["palettes"]:
            continue
        p = theme["palettes"][name]
        palettes[name] = {
            str(stop): hexFromArgb(p.tone(stop))
            for stop in TONAL_STOPS
        }

    # Light + dark role schemes
    schemes = {
        "light": _scheme_to_dict(theme["schemes"]["light"]),
        "dark": _scheme_to_dict(theme["schemes"]["dark"]),
    }

    return {
        "seed": req.seed,
        "schemes": schemes,
        "palettes": palettes,
        "stops": TONAL_STOPS,
        "roles": ROLE_KEYS,
    }


@router.post("/css-variables")
def material_css(req: ThemeRequest):
    """Theme as copy-pastable CSS custom properties (light + dark via [data-theme])."""
    data = material_theme(req)
    light = "\n".join(f"  --md-{k}: {v};" for k, v in data["schemes"]["light"].items())
    dark = "\n".join(f"  --md-{k}: {v};" for k, v in data["schemes"]["dark"].items())
    css = f""":root {{\n{light}\n}}\n\n[data-theme='dark'] {{\n{dark}\n}}"""
    return {"seed": req.seed, "css": css}
