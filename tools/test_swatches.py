"""Generate a Procreate .swatches file to validate the format end-to-end."""

import colorsys
import json
import zipfile
from pathlib import Path

OUTPUT_DIR = Path(__file__).parent / "output"
OUTPUT_FILE = OUTPUT_DIR / "test-palette.swatches"

PALETTE_NAME = "no noob color · test"

COLORS = [
    ("warm red",  (220,  60,  50)),
    ("ochre",     (200, 150,  60)),
    ("sage",      (130, 160, 110)),
    ("dusk blue", ( 70, 100, 140)),
    ("ink",       ( 30,  30,  35)),
]


def rgb_to_hsb(r: int, g: int, b: int) -> tuple[float, float, float]:
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    return h, s, v


def make_swatch(rgb: tuple[int, int, int]) -> dict:
    h, s, v = rgb_to_hsb(*rgb)
    return {
        "hue": h,
        "saturation": s,
        "brightness": v,
        "alpha": 1.0,
        "colorSpace": 0,
    }


def main() -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)

    swatches: list = [make_swatch(rgb) for _, rgb in COLORS]
    swatches += [None] * (30 - len(swatches))

    palette = [{"name": PALETTE_NAME, "swatches": swatches}]

    with zipfile.ZipFile(OUTPUT_FILE, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("Swatches.json", json.dumps(palette, indent=2))

    print(f"Wrote: {OUTPUT_FILE}")
    print(f"Palette: {PALETTE_NAME}")
    print(f"Colors: {len(COLORS)}")
    for name, rgb in COLORS:
        h, s, v = rgb_to_hsb(*rgb)
        print(f"  {name:10s}  RGB{rgb!s:18s}  HSB({h:.2f}, {s:.2f}, {v:.2f})")


if __name__ == "__main__":
    main()
