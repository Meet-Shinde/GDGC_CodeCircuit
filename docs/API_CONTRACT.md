# LegalEase — API Contract (FROZEN)

Do not rename fields, paths or change types without telling all three teammates.
Items marked **[DECISION]** were ambiguous in the source docs; they are fixed here — confirm with frontend + backend once, then treat as frozen.

Base URL: `VITE_API_BASE_URL` (local: `http://localhost:8000`). All bodies are JSON (UTF-8).

---
## 1. `GET /health`
`200` → `{"status": "ok"}`. No secrets, no model call.

## 2. `POST /api/analyze`

### Request
```json
{ "clause_text": "string, required", "context_type": "rental" }
```
| Field | Type | Rules |
|---|---|---|
| `clause_text` | string | required; trimmed; non-empty after trim; max **6,000** chars (count after trim) |
| `context_type` | `"rental"` \| `"freelance"` \| `"general"` | optional; default `"general"`; anything else → 422 |

### Success response — `200`
```json
{
  "plain_english": "string (2–3 sentences)",
  "obligations": [
    {
      "party": "string",
      "action": "string",
      "timing": "string | null",
      "financial_effect": "string | null",
      "evidence_quote": "string",
      "evidence_verified": true
    }
  ],
  "unclear_points": [
    {
      "issue": "string",
      "question_to_ask": "string",
      "evidence_quote": "string | null",
      "evidence_verified": false
    }
  ],
  "not_specified": ["string"],
  "verification_warnings": ["string"]
}
```
Rules:
- All five top-level keys are **always present**. Empty arrays are valid; never omit a key.
- `timing` / `financial_effect`: `null` when the excerpt does not explicitly state them.
- `evidence_verified` is set **only by backend code** (never trusted from the model). Always a boolean.
- **[DECISION] Mismatched quote:** keep the finding, set `evidence_verified: false`, add one warning to `verification_warnings`. Do not drop findings silently.
- **[DECISION] `evidence_quote: null`** (allowed only on `unclear_points`): `evidence_verified: false`, **no warning**. UI shows no verification badge when the quote is null.
- Obligations with an empty/missing `evidence_quote` are invalid → treat as unverified with a warning (or drop if `action` is also empty).
- `verification_warnings` example: `"Obligation 2: quoted text was not found in your clause and is marked unverified."`

### Error responses
**[DECISION]** Every non-2xx response body is exactly `{"detail": "<human-readable message>"}` — a plain **string**, never a list/object. Backend must add a handler so FastAPI's default 422 list becomes a string. Frontend shows `detail` as-is; if the body isn't JSON, show a generic message.

| Situation | Status | Example `detail` |
|---|---|---|
| Empty / whitespace-only clause | 422 | "Please paste a clause to analyze." |
| > 6,000 chars | 422 | "Clause is too long (max 6,000 characters)." |
| Bad `context_type` / malformed JSON body | 422 | "Invalid request." |
| Provider rate limit | 429 | "The AI service is busy. Please try again in a moment." |
| Provider timeout | 504 | "The analysis timed out. Please try again." |
| Provider error / unreachable / bad key | 502 | "The AI service is unavailable right now." |
| Model output not parseable / wrong shape | 502 | "The AI returned an unreadable result. Please try again." |
| Unexpected server error | 500 | "Something went wrong." |

Never return tracebacks, prompts, the key, or the user's clause in an error.

### curl
```bash
curl -sS http://localhost:8000/health
curl -sS -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"clause_text":"The Tenant shall give the Landlord written notice at least 60 days before vacating the premises.","context_type":"rental"}'
```

---
## 3. Shared types

### TypeScript (`frontend/src/types/analysis.ts`)
```ts
export type ContextType = "rental" | "freelance" | "general";

export interface AnalyzeRequest { clause_text: string; context_type?: ContextType; }

export interface Obligation {
  party: string;
  action: string;
  timing: string | null;
  financial_effect: string | null;
  evidence_quote: string;
  evidence_verified: boolean;
}

export interface UnclearPoint {
  issue: string;
  question_to_ask: string;
  evidence_quote: string | null;
  evidence_verified: boolean;
}

export interface AnalysisResult {
  plain_english: string;
  obligations: Obligation[];
  unclear_points: UnclearPoint[];
  not_specified: string[];
  verification_warnings: string[];
}
```

### Pydantic (`backend/app/schemas.py`)
```python
from typing import Literal, Optional
from pydantic import BaseModel, Field

class AnalyzeRequest(BaseModel):
    clause_text: str = Field(..., max_length=6000)   # strip + empty check in a validator
    context_type: Literal["rental", "freelance", "general"] = "general"

# What the MODEL is asked to return (no evidence_verified):
class ModelObligation(BaseModel):
    party: str
    action: str
    timing: Optional[str] = None
    financial_effect: Optional[str] = None
    evidence_quote: str = ""

class ModelUnclearPoint(BaseModel):
    issue: str
    question_to_ask: str
    evidence_quote: Optional[str] = None

class ModelOutput(BaseModel):
    plain_english: str
    obligations: list[ModelObligation] = []
    unclear_points: list[ModelUnclearPoint] = []
    not_specified: list[str] = []

# What the API RETURNS (backend adds evidence_verified + warnings):
class Obligation(ModelObligation):
    evidence_verified: bool

class UnclearPoint(ModelUnclearPoint):
    evidence_verified: bool

class AnalysisResult(BaseModel):
    plain_english: str
    obligations: list[Obligation]
    unclear_points: list[UnclearPoint]
    not_specified: list[str]
    verification_warnings: list[str]
```
Note: max_length=6000 on the raw field counts untrimmed text; trim first (validator with `mode="before"`) so 6,000 means trimmed length.

### Environment variables
| Name | Where | Secret |
|---|---|---|
| `MODEL_ACCESS_KEY` | backend | **yes** |
| `MODEL_BASE_URL` (`https://inference.do-ai.run/v1`) | backend | no |
| `MODEL_ID` (`openai-gpt-oss-20b`) | backend | no |
| `ALLOWED_ORIGINS` (comma-separated exact origins) | backend | no |
| `VITE_API_BASE_URL` | frontend, build time | no |