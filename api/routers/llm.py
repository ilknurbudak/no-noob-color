"""LLM-driven palette generation.

Two providers, env-keyed, optional:
  - OPENAI_API_KEY   → OpenAI structured output (gpt-4o-mini default)
  - APIFY_API_TOKEN  → Apify color-palette actor

Falls back gracefully: returns 503 if no key is configured. The frontend
local promptBias parser remains the always-available baseline.
"""
from __future__ import annotations
import json
import os
from typing import Optional

import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
APIFY_API_TOKEN = os.getenv("APIFY_API_TOKEN")
APIFY_ACTOR = os.getenv("APIFY_COLOR_ACTOR", "lukaskrivka/color-palette-generator")


class PromptRequest(BaseModel):
    prompt: str = Field(..., min_length=2, max_length=400)
    n: int = Field(5, ge=2, le=12)
    provider: str = Field("auto", pattern="^(auto|openai|apify)$")


class PaletteResult(BaseModel):
    provider: str
    prompt: str
    palette: list[dict]
    model: Optional[str] = None
    notes: Optional[str] = None


def _openai_palette(prompt: str, n: int) -> dict:
    if not OPENAI_API_KEY:
        raise HTTPException(503, "OPENAI_API_KEY not configured")
    sys_prompt = (
        f"You are a color palette designer. Given a prompt, return EXACTLY {n} "
        f"colors that capture the mood. Output ONLY valid JSON in this format: "
        f'{{"palette": [{{"hex": "#RRGGBB", "name": "short name"}}]}}. '
        f"No prose. No explanations."
    )
    body = {
        "model": OPENAI_MODEL,
        "messages": [
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": prompt},
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.7,
    }
    resp = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
        json=body,
        timeout=30,
    )
    if resp.status_code >= 400:
        raise HTTPException(resp.status_code, f"OpenAI: {resp.text[:200]}")
    msg = resp.json()["choices"][0]["message"]["content"]
    try:
        parsed = json.loads(msg)
    except json.JSONDecodeError as e:
        raise HTTPException(502, f"LLM returned non-JSON: {e}") from e
    palette = parsed.get("palette", [])
    if not isinstance(palette, list) or not palette:
        raise HTTPException(502, "LLM returned no palette")
    return {"palette": palette[:n], "model": OPENAI_MODEL}


def _apify_palette(prompt: str, n: int) -> dict:
    if not APIFY_API_TOKEN:
        raise HTTPException(503, "APIFY_API_TOKEN not configured")
    url = f"https://api.apify.com/v2/acts/{APIFY_ACTOR}/run-sync-get-dataset-items"
    resp = requests.post(
        url,
        params={"token": APIFY_API_TOKEN},
        json={"prompt": prompt, "count": n},
        timeout=60,
    )
    if resp.status_code >= 400:
        raise HTTPException(resp.status_code, f"Apify: {resp.text[:200]}")
    data = resp.json()
    palette = []
    for item in data[:n]:
        hex_v = item.get("hex") or item.get("color")
        if hex_v:
            palette.append({"hex": hex_v, "name": item.get("name", "")})
    if not palette:
        raise HTTPException(502, "Apify returned empty palette")
    return {"palette": palette, "model": APIFY_ACTOR}


@router.post("/prompt-to-palette", response_model=PaletteResult)
def prompt_to_palette(req: PromptRequest):
    """Send a freeform prompt to an LLM provider, get back N swatches."""
    provider = req.provider
    if provider == "auto":
        if OPENAI_API_KEY: provider = "openai"
        elif APIFY_API_TOKEN: provider = "apify"
        else:
            raise HTTPException(
                503,
                "No LLM provider configured. Set OPENAI_API_KEY or APIFY_API_TOKEN.",
            )

    if provider == "openai":
        result = _openai_palette(req.prompt, req.n)
    else:
        result = _apify_palette(req.prompt, req.n)

    # Normalize swatches
    palette = []
    for sw in result["palette"]:
        hex_v = (sw.get("hex") or "").strip()
        if not hex_v.startswith("#"): hex_v = "#" + hex_v
        if len(hex_v) != 7:
            continue
        try:
            r = int(hex_v[1:3], 16); g = int(hex_v[3:5], 16); b = int(hex_v[5:7], 16)
        except ValueError:
            continue
        palette.append({
            "hex": hex_v.upper(),
            "rgb": [r, g, b],
            "name": sw.get("name", ""),
        })

    if not palette:
        raise HTTPException(502, "LLM response had no valid swatches")

    return PaletteResult(
        provider=provider,
        prompt=req.prompt,
        palette=palette,
        model=result.get("model"),
    )


@router.get("/status")
def llm_status():
    """Which providers are reachable in this deployment."""
    return {
        "openai": bool(OPENAI_API_KEY),
        "apify": bool(APIFY_API_TOKEN),
        "model": OPENAI_MODEL if OPENAI_API_KEY else None,
        "actor": APIFY_ACTOR if APIFY_API_TOKEN else None,
    }
