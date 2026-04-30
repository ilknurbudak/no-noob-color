"""PocketBase REST client.

Thin typed wrapper over PocketBase's HTTP API. We use PocketBase as the BaaS
layer (auth, palette records, thumbnail file storage); the Python service
forwards requests with the user's bearer token so PocketBase enforces row-level
ownership rules on the `palettes` collection.

Run PocketBase locally:
    pocketbase serve
    # http://127.0.0.1:8090 (admin UI at /_/)

Environment:
    POCKETBASE_URL  base URL of the PocketBase instance (default http://127.0.0.1:8090)

Collections expected:
    users      built-in PocketBase auth collection
    palettes   schema:
                 name        text
                 swatches    json
                 source      select  (photo|generate|prompt|ref)
                 thumbnail   file    (single, image/*, max ~2MB)
                 owner       relation -> users (single, required, cascade)
               list/view/create/update/delete rules:
                 owner = @request.auth.id
"""
from __future__ import annotations

import os
from typing import Any, Optional

import requests
from dotenv import load_dotenv

load_dotenv()

POCKETBASE_URL = os.getenv("POCKETBASE_URL", "http://127.0.0.1:8090").rstrip("/")
DEFAULT_TIMEOUT = 15  # seconds


class PocketBaseError(Exception):
    """Raised when PocketBase returns a non-2xx response."""

    def __init__(self, status: int, message: str, data: Any = None):
        super().__init__(f"PocketBase {status}: {message}")
        self.status = status
        self.message = message
        self.data = data


def _url(path: str) -> str:
    return f"{POCKETBASE_URL}{path}"


def _headers(token: Optional[str] = None) -> dict[str, str]:
    h = {"Accept": "application/json"}
    if token:
        h["Authorization"] = token
    return h


def _check(resp: requests.Response) -> dict:
    if resp.status_code >= 400:
        try:
            payload = resp.json()
            msg = payload.get("message", resp.text)
        except ValueError:
            payload = None
            msg = resp.text
        raise PocketBaseError(resp.status_code, msg, payload)
    if resp.status_code == 204 or not resp.content:
        return {}
    return resp.json()


# ---------- auth ----------


def signup(email: str, password: str, password_confirm: Optional[str] = None) -> dict:
    """Create a user in the built-in `users` collection."""
    body = {
        "email": email,
        "password": password,
        "passwordConfirm": password_confirm or password,
    }
    resp = requests.post(
        _url("/api/collections/users/records"),
        json=body,
        headers=_headers(),
        timeout=DEFAULT_TIMEOUT,
    )
    return _check(resp)


def login(email: str, password: str) -> dict:
    """Returns {token, record} on success."""
    resp = requests.post(
        _url("/api/collections/users/auth-with-password"),
        json={"identity": email, "password": password},
        headers=_headers(),
        timeout=DEFAULT_TIMEOUT,
    )
    return _check(resp)


def refresh(token: str) -> dict:
    resp = requests.post(
        _url("/api/collections/users/auth-refresh"),
        headers=_headers(token),
        timeout=DEFAULT_TIMEOUT,
    )
    return _check(resp)


def me(token: str) -> dict:
    """Resolve the user record from a bearer token."""
    return refresh(token).get("record", {})


# ---------- palettes ----------


def list_palettes(
    token: str,
    page: int = 1,
    per_page: int = 50,
    sort: str = "-created",
    filter_expr: Optional[str] = None,
) -> dict:
    params: dict[str, Any] = {"page": page, "perPage": per_page, "sort": sort}
    if filter_expr:
        params["filter"] = filter_expr
    resp = requests.get(
        _url("/api/collections/palettes/records"),
        params=params,
        headers=_headers(token),
        timeout=DEFAULT_TIMEOUT,
    )
    return _check(resp)


def get_palette(token: str, record_id: str) -> dict:
    resp = requests.get(
        _url(f"/api/collections/palettes/records/{record_id}"),
        headers=_headers(token),
        timeout=DEFAULT_TIMEOUT,
    )
    return _check(resp)


def create_palette(
    token: str,
    owner_id: str,
    name: str,
    swatches: list[dict],
    source: str,
    thumbnail: Optional[tuple[str, bytes, str]] = None,
) -> dict:
    """Create a palette record. `thumbnail` is (filename, bytes, content_type)."""
    import json

    data = {
        "name": name,
        "swatches": json.dumps(swatches),
        "source": source,
        "owner": owner_id,
    }
    files = None
    if thumbnail is not None:
        filename, blob, ctype = thumbnail
        files = {"thumbnail": (filename, blob, ctype)}
    resp = requests.post(
        _url("/api/collections/palettes/records"),
        data=data,
        files=files,
        headers=_headers(token),
        timeout=DEFAULT_TIMEOUT,
    )
    return _check(resp)


def update_palette(token: str, record_id: str, fields: dict) -> dict:
    resp = requests.patch(
        _url(f"/api/collections/palettes/records/{record_id}"),
        json=fields,
        headers=_headers(token),
        timeout=DEFAULT_TIMEOUT,
    )
    return _check(resp)


def delete_palette(token: str, record_id: str) -> None:
    resp = requests.delete(
        _url(f"/api/collections/palettes/records/{record_id}"),
        headers=_headers(token),
        timeout=DEFAULT_TIMEOUT,
    )
    _check(resp)


def file_url(record: dict, field: str = "thumbnail") -> Optional[str]:
    """Build a public URL for a file field on a PocketBase record."""
    filename = record.get(field)
    if not filename:
        return None
    collection = record.get("collectionName") or record.get("collectionId")
    record_id = record.get("id")
    if not (collection and record_id):
        return None
    return f"{POCKETBASE_URL}/api/files/{collection}/{record_id}/{filename}"


def health() -> bool:
    """Liveness probe — returns True if PocketBase responds to /api/health."""
    try:
        resp = requests.get(_url("/api/health"), timeout=3)
        return resp.status_code == 200
    except requests.RequestException:
        return False
