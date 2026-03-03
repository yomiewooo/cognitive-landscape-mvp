from __future__ import annotations

import json
import os
import re
from typing import List

from openai import OpenAI


def _heuristic_claims(text: str) -> List[str]:
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if len(s.strip()) > 20]
    return sentences[:12]


PROMPT = """
You extract explicit factual or opinionated claims from text.
Return JSON with this schema:
{
  "claims": ["claim 1", "claim 2"]
}
Keep each claim concise, standalone, and non-redundant.
""".strip()


def extract_claims(text: str) -> List[str]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return _heuristic_claims(text)

    client = OpenAI(api_key=api_key)
    try:
        response = client.responses.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            input=[
                {"role": "system", "content": PROMPT},
                {"role": "user", "content": text[:12000]},
            ],
            temperature=0.2,
        )
        content = response.output_text
        data = json.loads(content)
        claims = [c.strip() for c in data.get("claims", []) if c.strip()]
        return claims or _heuristic_claims(text)
    except Exception:
        return _heuristic_claims(text)


def normalize_beliefs(claims: List[str]) -> List[str]:
    normalized = set()
    for claim in claims:
        claim = claim.lower().strip()
        claim = re.sub(r"[^a-z0-9\s]", "", claim)
        claim = re.sub(r"\s+", " ", claim)
        if claim:
            normalized.add(claim)
    return sorted(normalized)
