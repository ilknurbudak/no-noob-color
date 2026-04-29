"""Color-space conversions and WCAG metrics.

Uses `colour-science` (industry standard) where it adds rigor — fallbacks to
hand-rolled formulas keep the service usable without it.
"""
from __future__ import annotations
import numpy as np

try:
    import colour
    HAS_COLOUR = True
except ImportError:
    HAS_COLOUR = False


# ---------- WCAG ----------

def relative_luminance(rgb: tuple[int, int, int]) -> float:
    """WCAG 2.1 sRGB relative luminance."""
    def lin(c):
        v = c / 255.0
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = rgb
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)


def contrast_ratio(rgb1: tuple[int, int, int], rgb2: tuple[int, int, int]) -> float:
    l1 = relative_luminance(rgb1)
    l2 = relative_luminance(rgb2)
    lighter, darker = (l1, l2) if l1 > l2 else (l2, l1)
    return (lighter + 0.05) / (darker + 0.05)


def wcag_grade(ratio: float) -> str:
    if ratio >= 7.0: return "AAA"
    if ratio >= 4.5: return "AA"
    if ratio >= 3.0: return "AA-Large"
    return "Fail"


# ---------- Color spaces ----------

def rgb_to_lab(rgb: tuple[int, int, int]) -> tuple[float, float, float]:
    """sRGB → CIE Lab. Uses colour-science if available."""
    arr = np.array([rgb], dtype=np.float64) / 255.0
    if HAS_COLOUR:
        xyz = colour.sRGB_to_XYZ(arr)
        lab = colour.XYZ_to_Lab(xyz)
        return tuple(float(x) for x in lab[0])
    # Fallback: D65 reference
    def lin(c):
        return ((c + 0.055) / 1.055) ** 2.4 if c > 0.04045 else c / 12.92
    r, g, b = lin(arr[0, 0]), lin(arr[0, 1]), lin(arr[0, 2])
    x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047
    y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.0
    z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883
    f = lambda t: t ** (1/3) if t > 0.008856 else 7.787 * t + 16/116
    return (
        116 * f(y) - 16,
        500 * (f(x) - f(y)),
        200 * (f(y) - f(z)),
    )


def rgb_to_oklab(rgb: tuple[int, int, int]) -> tuple[float, float, float]:
    """sRGB → OKLab (Björn Ottosson, 2020). Perceptually uniform, gives smooth gradients."""
    arr = np.array([rgb], dtype=np.float64) / 255.0
    if HAS_COLOUR:
        try:
            xyz = colour.sRGB_to_XYZ(arr)
            ok = colour.XYZ_to_Oklab(xyz)
            return tuple(float(x) for x in ok[0])
        except AttributeError:
            pass
    # Hand-rolled OKLab
    def lin(c):
        return ((c + 0.055) / 1.055) ** 2.4 if c > 0.04045 else c / 12.92
    r, g, b = lin(arr[0, 0]), lin(arr[0, 1]), lin(arr[0, 2])
    l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
    m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
    s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
    l_, m_, s_ = l ** (1/3), m ** (1/3), s ** (1/3)
    return (
        0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
        1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
        0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
    )


def rgb_to_cmyk(rgb: tuple[int, int, int]) -> tuple[int, int, int, int]:
    r, g, b = rgb[0] / 255, rgb[1] / 255, rgb[2] / 255
    k = 1 - max(r, g, b)
    if k >= 1: return (0, 0, 0, 100)
    c = (1 - r - k) / (1 - k)
    m = (1 - g - k) / (1 - k)
    y = (1 - b - k) / (1 - k)
    return (round(c * 100), round(m * 100), round(y * 100), round(k * 100))


def rgb_to_hsl(rgb: tuple[int, int, int]) -> tuple[float, float, float]:
    r, g, b = rgb[0] / 255, rgb[1] / 255, rgb[2] / 255
    mx, mn = max(r, g, b), min(r, g, b)
    l = (mx + mn) / 2
    if mx == mn:
        return (0.0, 0.0, l * 100)
    d = mx - mn
    s = d / (2 - mx - mn) if l > 0.5 else d / (mx + mn)
    if mx == r:   h = ((g - b) / d) % 6
    elif mx == g: h = (b - r) / d + 2
    else:         h = (r - g) / d + 4
    return (h * 60, s * 100, l * 100)


# ---------- Convenience metadata bundle ----------

def metadata(rgb: tuple[int, int, int]) -> dict:
    r, g, b = rgb
    lum = relative_luminance(rgb)
    return {
        "hex": "#{:02x}{:02x}{:02x}".format(r, g, b).upper(),
        "rgb": {"r": r, "g": g, "b": b},
        "cmyk": dict(zip(("c", "m", "y", "k"), rgb_to_cmyk(rgb))),
        "hsl": dict(zip(("h", "s", "l"), (round(v, 1) for v in rgb_to_hsl(rgb)))),
        "lab": dict(zip(("L", "a", "b"), (round(v, 2) for v in rgb_to_lab(rgb)))),
        "oklab": dict(zip(("L", "a", "b"), (round(v, 4) for v in rgb_to_oklab(rgb)))),
        "luminance": round(lum, 4),
        "wcag_vs_white": {
            "ratio": round(contrast_ratio(rgb, (255, 255, 255)), 2),
            "grade": wcag_grade(contrast_ratio(rgb, (255, 255, 255))),
        },
        "wcag_vs_black": {
            "ratio": round(contrast_ratio(rgb, (0, 0, 0)), 2),
            "grade": wcag_grade(contrast_ratio(rgb, (0, 0, 0))),
        },
    }
