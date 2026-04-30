"""Auth endpoints — thin proxy over PocketBase.

We don't mint our own JWTs. PocketBase issues the token; the frontend stores
it and sends it as `Authorization: Bearer <token>` on subsequent calls.
"""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field

from services import pocketbase as pb
from services.auth_dep import current_user

router = APIRouter()


class SignupBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)


class LoginBody(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    token: str
    user: dict


def _to_response(payload: dict) -> AuthResponse:
    return AuthResponse(token=payload.get("token", ""), user=payload.get("record", {}))


@router.post("/signup", response_model=AuthResponse)
def signup(body: SignupBody):
    try:
        pb.signup(body.email, body.password)
        auth = pb.login(body.email, body.password)
    except pb.PocketBaseError as e:
        raise HTTPException(e.status if 400 <= e.status < 500 else 502, e.message) from e
    return _to_response(auth)


@router.post("/login", response_model=AuthResponse)
def login(body: LoginBody):
    try:
        auth = pb.login(body.email, body.password)
    except pb.PocketBaseError as e:
        if e.status == 400:
            raise HTTPException(401, "invalid email or password") from e
        raise HTTPException(e.status if 400 <= e.status < 500 else 502, e.message) from e
    return _to_response(auth)


@router.get("/me")
def me(user: Annotated[dict, Depends(current_user)]):
    return {"user": user}


@router.get("/health")
def health():
    return {"pocketbase": pb.health(), "url": pb.POCKETBASE_URL}
