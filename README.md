# Cognitive Landscape (MVP)

Cognitive Landscape analyzes internet/article text, extracts claims, normalizes beliefs, and builds an interactive graph showing support and contradiction relationships.

## Stack

- **Backend**: Python, FastAPI, PostgreSQL, NetworkX, OpenAI API
- **Frontend**: React + TypeScript + D3.js
- **Infra**: Docker Compose

## Features

1. Text ingestion from pasted content or URL
2. Claim extraction (OpenAI-backed with heuristic fallback)
3. Belief normalization (lowercase, punctuation removal, deduplication)
4. Belief graph construction (support / contradiction edges)
5. Interactive D3 graph visualization
6. Contradiction explorer (opposing beliefs side-by-side)

## Run locally

```bash
docker-compose up --build
```

Frontend: http://localhost:5173  
Backend API docs: http://localhost:8000/docs

## API

### `POST /analyze`

Request body:

```json
{
  "text": "optional article text",
  "url": "optional article URL"
}
```

At least one of `text` or `url` is required.

Response includes:
- Extracted `claims`
- Normalized `beliefs`
- `graph` object with nodes/edges
- `contradictions` list

### `GET /analyses/{id}`

Returns persisted analysis record and graph snapshot.

## Notes

- If `OPENAI_API_KEY` is unset, the backend falls back to heuristic sentence-based claim extraction.
- Contradiction detection is heuristic: it checks lexical overlap and mismatched negation markers.
