"""Color-space conversions: RGB ↔ Lab ↔ OKLab ↔ CMYK ↔ HSL."""
from __future__ import annotations
from fastapi import APIRouter
from pydantic import BaseModel, Field

from services import color_science as cs

router = APIRouter()


class ConvertRequest(BaseModel):
    color: str = Field(..., description="#hex color")


@router.post("/spaces")
def convert_spaces(req: ConvertRequest):
    h = req.color.lstrip("#")
    rgb = (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))
    return cs.metadata(rgb)
