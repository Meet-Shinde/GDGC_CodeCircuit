import logging

import openai
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from . import ai
from .config import get_allowed_origins, model_key_configured
from .prompts import SYSTEM_PROMPT, build_user_prompt
from .schemas import AnalyzeRequest, AnalyzeResponse, ModelOutput, Obligation, UnclearPoint
from .verification import ModelOutputError, extract_json, quote_in_source

load_dotenv()
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("legalease")

MSG_UNAVAILABLE = "The AI service is unavailable right now."

app = FastAPI(title="LegalEase API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

if not model_key_configured():
    log.warning("MODEL_ACCESS_KEY is not set; /api/analyze will return 502 until it is.")


@app.exception_handler(RequestValidationError)
async def _validation_handler(request: Request, exc: RequestValidationError):
    detail = "Invalid request."
    for err in exc.errors():
        msg = str(err.get("msg", ""))
        if "clause_text" in err.get("loc", ()) and msg.startswith("Value error, "):
            detail = msg.removeprefix("Value error, ")
            break
    return JSONResponse(status_code=422, content={"detail": detail})


@app.exception_handler(Exception)
async def _unexpected_handler(request: Request, exc: Exception):
    log.error("unexpected error: %s", type(exc).__name__)  # no clause, prompt or key
    return JSONResponse(status_code=500, content={"detail": "Something went wrong."})


@app.get("/health")
def health():
    return {"status": "ok"}


def build_response(clause: str, model_out: ModelOutput) -> AnalyzeResponse:
    warnings: list[str] = []

    obligations: list[Obligation] = []
    for o in model_out.obligations:
        quote_raw = o.evidence_quote or ""
        if not o.action.strip() and not quote_raw.strip():
            continue  # nothing usable in this item
        n = len(obligations) + 1
        ok = quote_in_source(quote_raw, clause)
        if not quote_raw.strip():
            warnings.append(f"Obligation {n}: no supporting quote was given and it is marked unverified.")
        elif not ok:
            warnings.append(f"Obligation {n}: quoted text was not found in your clause and is marked unverified.")
        data = o.model_dump()
        data["evidence_quote"] = quote_raw
        obligations.append(Obligation(**data, evidence_verified=ok))

    unclear: list[UnclearPoint] = []
    for u in model_out.unclear_points:
        n = len(unclear) + 1
        has_quote = bool((u.evidence_quote or "").strip())
        ok = quote_in_source(u.evidence_quote, clause)
        if has_quote and not ok:
            warnings.append(f"Unclear point {n}: quoted text was not found in your clause and is marked unverified.")
        unclear.append(UnclearPoint(**u.model_dump(), evidence_verified=ok))

    return AnalyzeResponse(
        plain_english=model_out.plain_english,
        obligations=obligations,
        unclear_points=unclear,
        not_specified=model_out.not_specified,
        verification_warnings=warnings,
    )


@app.post("/api/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest):
    log.info("analyze request: context=%s chars=%d", req.context_type, len(req.clause_text))
    try:
        raw = ai.call_model(SYSTEM_PROMPT, build_user_prompt(req.clause_text, req.context_type))
    except ai.ModelNotConfigured:
        raise HTTPException(502, MSG_UNAVAILABLE)
    except openai.APITimeoutError:
        raise HTTPException(504, "The analysis timed out. Please try again.")
    except openai.RateLimitError:
        raise HTTPException(429, "The AI service is busy. Please try again in a moment.")
    except openai.AuthenticationError:
        log.error("model provider rejected credentials")
        raise HTTPException(502, MSG_UNAVAILABLE)
    except openai.APIError as exc:
        log.error("model provider error: %s", type(exc).__name__)
        raise HTTPException(502, MSG_UNAVAILABLE)

    try:
        model_out = ModelOutput.model_validate(extract_json(raw))
    except (ModelOutputError, ValidationError) as exc:
        log.warning("unusable model output: %s", type(exc).__name__)
        raise HTTPException(502, "The AI returned an unreadable result. Please try again.")

    return build_response(req.clause_text, model_out)