# LegalEase — Legal Document Explainer

> Understand the clause. See the obligations. Know what to ask.

LegalEase turns a short contract clause into plain English and a **Clause Map**: who must do what, by when, with what stated financial effect, each backed by a quote from the original text, plus explicit "unclear" and "not specified" items.

**This is an informational text-explanation tool. It is not a lawyer and does not give legal advice.** It does not say whether a clause is valid, enforceable, legal, or safe to sign. For consequential decisions, consult a qualified legal professional.

## Target user
Individuals, tenants, freelancers, startups and NGOs who struggle with dense contract wording. The demo focuses on ordinary rental clauses (synthetic text only).

## Differentiator: evidence-backed Clause Map
- Plain-English explanation (2–3 sentences)
- Obligation ledger: party, action, timing/trigger, stated financial effect, exact supporting quote
- Unclear points with a neutral question to ask
- "Not specified" list instead of guessing
- **Backend quote verification:** every evidence quote is checked against the input (whitespace-normalized). Mismatches are marked unverified and a warning is shown.

## Features (MVP)
Text input (max 6,000 chars) · Rental/Freelance/General context · Analyze · loading/empty/oversize/error states · verified/unverified evidence status.

## Stack
React + Vite + TypeScript · FastAPI + Pydantic · DigitalOcean hosted Inference API (OpenAI-compatible client) · DigitalOcean App Platform.

## Architecture
```
Browser (React) → POST /api/analyze → FastAPI (validate, build prompt)
   → DigitalOcean Inference (gpt-oss-20b) → parse + Pydantic validate
   → verify evidence quotes against original text → JSON response → UI
```
No database, no saved clauses, no browser storage.

## Model disclosure
Uses **gpt-oss-20b**, an open-weight model from OpenAI, called through DigitalOcean's **hosted** inference API (not self-hosted). Model reference: https://huggingface.co/openai/gpt-oss-20b. The model is released under the Apache 2.0 license (confirm on the model card). The model license is separate from this repository's MIT license, which covers only our source code.

## Setup
### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in MODEL_ACCESS_KEY
uvicorn app.main:app --reload --port 8000
```
### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev   # http://localhost:5173
```

## Environment variables
| Variable | Where | Secret? |
|---|---|---|
| `MODEL_ACCESS_KEY` | backend | **Yes** — server-side only |
| `MODEL_BASE_URL` | backend | No |
| `MODEL_ID` | backend | No |
| `ALLOWED_ORIGINS` | backend (CORS; set to deployed frontend origin) | No |
| `VITE_API_BASE_URL` | frontend build time (deployed backend URL) | No |

## Deployment (DigitalOcean App Platform)
See `docs/DEPLOYMENT.md` for the exact steps (model key, backend, frontend, CORS). Contract: `docs/API_CONTRACT.md`. Design: `docs/ARCHITECTURE.md`.

## Known limitations
- Informational only; not legal advice.
- Quote verification checks that text is **present** in the input — it does not prove the interpretation is correct.
- Model output can be wrong or incomplete; only a handful of synthetic clauses have been tried, so no accuracy claim is made.
- Single-excerpt, synchronous analysis. No persistence by design; clauses are not stored by our app (the hosted inference provider's own handling is governed by its terms).

## 60-second demo
1. Paste the synthetic rental clause from `docs/QA_CHECKLIST.md` (clause A).
2. Analyze → read the plain-English explanation.
3. Show party / action / timing / exact quote.
4. Show an unclear or "not specified" item.
5. Explain the quote check — and that it does not prove legal correctness.

## License
Source code: Apache 2.o. Model: see Model disclosure.