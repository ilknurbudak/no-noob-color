"""FastAPI dependency: extract a PocketBase bearer token and resolve the user.

The token is forwarded as-is to PocketBase, which is the source of truth for
identity. We don't cache or re-sign — PocketBase's own JWT TTL applies.
"""
from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Header, HTTPException

from services import pocketbase as pb


def bearer_token(authorization: Annotated[str | None, Header()] = None) -> str:
    if not authorization:
        raise HTTPException(401, "missing Authorization header")
    parts = authorization.split(" ", 1)
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1].strip()
    return authorization.strip()


def current_user(token: Annotated[str, Depends(bearer_token)]) -> dict:
    try:
        record = pb.me(token)
    except pb.PocketBaseError as e:
        raise HTTPException(e.status if 400 <= e.status < 500 else 401, e.message) from e
    if not record.get("id"):
        raise HTTPException(401, "invalid token")
    return record


def current_token_and_user(
    token: Annotated[str, Depends(bearer_token)],
    user: Annotated[dict, Depends(current_user)],
) -> tuple[str, dict]:
    return token, user
