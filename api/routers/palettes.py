"""Palette CRUD — backed by the PocketBase `palettes` collection.

PocketBase enforces ownership rules; this router just forwards the user's
bearer token. We accept JSON for create/update so the browser can post a
swatch array directly, and offer a multipart variant for thumbnail upload.
"""
from __future__ import annotations

import json
from typing import Annotated, Literal, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

from services import pocketbase as pb
from services.auth_dep import bearer_token, current_token_and_user

router = APIRouter()

Source = Literal["photo", "generate", "prompt", "ref"]


class Swatch(BaseModel):
    hex: str
    rgb: list[int] = Field(min_length=3, max_length=3)
    name: Optional[str] = None


class PaletteIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    swatches: list[Swatch]
    source: Source = "photo"


def _shape(record: dict) -> dict:
    """Inflate the JSON-encoded swatches column and add a thumbnail URL."""
    swatches = record.get("swatches")
    if isinstance(swatches, str):
        try:
            swatches = json.loads(swatches)
        except ValueError:
            swatches = []
    return {
        "id": record.get("id"),
        "name": record.get("name"),
        "source": record.get("source"),
        "swatches": swatches or [],
        "thumbnail": pb.file_url(record, "thumbnail"),
        "created": record.get("created"),
        "updated": record.get("updated"),
    }


@router.get("")
def list_palettes(
    auth: Annotated[tuple[str, dict], Depends(current_token_and_user)],
    page: int = 1,
    per_page: int = 50,
):
    token, _user = auth
    try:
        data = pb.list_palettes(token, page=page, per_page=per_page)
    except pb.PocketBaseError as e:
        raise HTTPException(e.status if 400 <= e.status < 600 else 502, e.message) from e
    return {
        "page": data.get("page", page),
        "per_page": data.get("perPage", per_page),
        "total": data.get("totalItems", 0),
        "items": [_shape(r) for r in data.get("items", [])],
    }


@router.post("", status_code=201)
def create_palette(
    body: PaletteIn,
    auth: Annotated[tuple[str, dict], Depends(current_token_and_user)],
):
    token, user = auth
    try:
        record = pb.create_palette(
            token=token,
            owner_id=user["id"],
            name=body.name,
            swatches=[s.model_dump() for s in body.swatches],
            source=body.source,
        )
    except pb.PocketBaseError as e:
        raise HTTPException(e.status if 400 <= e.status < 600 else 502, e.message) from e
    return _shape(record)


@router.post("/with-thumbnail", status_code=201)
async def create_palette_with_thumbnail(
    auth: Annotated[tuple[str, dict], Depends(current_token_and_user)],
    name: str = Form(..., min_length=1, max_length=120),
    swatches: str = Form(..., description="JSON-encoded list of swatches"),
    source: Source = Form("photo"),
    thumbnail: UploadFile = File(..., description="Image thumbnail (PNG/JPEG/WebP)"),
):
    """Multipart variant: send the thumbnail file alongside the swatch JSON."""
    token, user = auth
    try:
        swatch_list = json.loads(swatches)
        if not isinstance(swatch_list, list):
            raise ValueError("swatches must be a JSON array")
    except ValueError as e:
        raise HTTPException(400, f"invalid swatches payload: {e}") from e

    if not (thumbnail.content_type or "").startswith("image/"):
        raise HTTPException(400, "thumbnail must be an image")

    blob = await thumbnail.read()
    try:
        record = pb.create_palette(
            token=token,
            owner_id=user["id"],
            name=name,
            swatches=swatch_list,
            source=source,
            thumbnail=(thumbnail.filename or "thumb.png", blob, thumbnail.content_type or "image/png"),
        )
    except pb.PocketBaseError as e:
        raise HTTPException(e.status if 400 <= e.status < 600 else 502, e.message) from e
    return _shape(record)


@router.get("/{record_id}")
def get_palette(
    record_id: str,
    auth: Annotated[tuple[str, dict], Depends(current_token_and_user)],
):
    token, _user = auth
    try:
        record = pb.get_palette(token, record_id)
    except pb.PocketBaseError as e:
        raise HTTPException(e.status if 400 <= e.status < 600 else 502, e.message) from e
    return _shape(record)


@router.patch("/{record_id}")
def update_palette(
    record_id: str,
    auth: Annotated[tuple[str, dict], Depends(current_token_and_user)],
    name: Optional[str] = None,
    source: Optional[Source] = None,
):
    token, _user = auth
    fields: dict = {}
    if name is not None:
        fields["name"] = name
    if source is not None:
        fields["source"] = source
    if not fields:
        raise HTTPException(400, "nothing to update")
    try:
        record = pb.update_palette(token, record_id, fields)
    except pb.PocketBaseError as e:
        raise HTTPException(e.status if 400 <= e.status < 600 else 502, e.message) from e
    return _shape(record)


@router.delete("/{record_id}", status_code=204)
def delete_palette(
    record_id: str,
    token: Annotated[str, Depends(bearer_token)],
):
    try:
        pb.delete_palette(token, record_id)
    except pb.PocketBaseError as e:
        raise HTTPException(e.status if 400 <= e.status < 600 else 502, e.message) from e
    return None
