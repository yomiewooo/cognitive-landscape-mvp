from __future__ import annotations

import json
from typing import Optional

import requests
from bs4 import BeautifulSoup
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from sqlalchemy.orm import Session

from belief_extractor import extract_claims, normalize_beliefs
from graph_builder import build_belief_graph, extract_contradictions
from models import Analysis, get_db, init_db

app = FastAPI(title="Cognitive Landscape API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    text: Optional[str] = None
    url: Optional[HttpUrl] = None


@app.on_event("startup")
def startup() -> None:
    init_db()


def fetch_url_text(url: str) -> str:
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    paragraphs = [p.get_text(" ", strip=True) for p in soup.find_all("p")]
    return "\n".join(paragraphs)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/analyze")
def analyze(payload: AnalyzeRequest, db: Session = Depends(get_db)) -> dict:
    if not payload.text and not payload.url:
        raise HTTPException(status_code=400, detail="Either text or url is required")

    source = "text"
    raw_text = payload.text or ""

    if payload.url:
        source = str(payload.url)
        raw_text = fetch_url_text(str(payload.url))

    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="No text content found")

    claims = extract_claims(raw_text)
    beliefs = normalize_beliefs(claims)
    graph = build_belief_graph(beliefs)
    contradictions = extract_contradictions(graph)

    analysis = Analysis(source=source, raw_text=raw_text[:50000], graph_json=json.dumps(graph))
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return {
        "analysis_id": analysis.id,
        "source": source,
        "claims": claims,
        "beliefs": beliefs,
        "graph": graph,
        "contradictions": contradictions,
    }


@app.get("/analyses/{analysis_id}")
def get_analysis(analysis_id: int, db: Session = Depends(get_db)) -> dict:
    analysis = db.get(Analysis, analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    return {
        "id": analysis.id,
        "source": analysis.source,
        "raw_text": analysis.raw_text,
        "graph": json.loads(analysis.graph_json),
        "created_at": analysis.created_at.isoformat(),
    }
