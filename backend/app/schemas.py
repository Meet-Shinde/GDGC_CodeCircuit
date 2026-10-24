from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator

MAX_CLAUSE_CHARS = 6000


class AnalyzeRequest(BaseModel):
    clause_text: str
    context_type: Literal["rental", "freelance", "general"] = "general"

    @field_validator("clause_text")
    @classmethod
    def _check_text(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Please paste a clause to analyze.")
        if len(v) > MAX_CLAUSE_CHARS:
            raise ValueError(
                f"Clause is too long ({len(v)} characters). Maximum is {MAX_CLAUSE_CHARS}."
            )
        return v


# ---- What we accept from the model (lenient: evidence_verified is NOT trusted/expected) ----
class ModelObligation(BaseModel):
    party: str
    action: str
    timing: Optional[str] = None
    financial_effect: Optional[str] = None
    evidence_quote: Optional[str] = None


class ModelUnclearPoint(BaseModel):
    issue: str
    question_to_ask: str
    evidence_quote: Optional[str] = None


class ModelOutput(BaseModel):
    plain_english: str
    obligations: List[ModelObligation] = Field(default_factory=list)
    unclear_points: List[ModelUnclearPoint] = Field(default_factory=list)
    not_specified: List[str] = Field(default_factory=list)


# ---- What we return (frozen contract) ----
class Obligation(ModelObligation):
    evidence_verified: bool


class UnclearPoint(ModelUnclearPoint):
    evidence_verified: bool


class AnalyzeResponse(BaseModel):
    plain_english: str
    obligations: List[Obligation]
    unclear_points: List[UnclearPoint]
    not_specified: List[str]
    verification_warnings: List[str]