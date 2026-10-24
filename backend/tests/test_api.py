import json

import httpx
import openai
import pytest
from fastapi.testclient import TestClient

from app import ai
from app.main import app

client = TestClient(app)

CLAUSE = "The Tenant must give written notice   at least 60 days\nbefore vacating. The deposit may be reduced for damage beyond normal wear."


def fake(payload):
    raw = payload if isinstance(payload, str) else json.dumps(payload)
    return lambda s, u: raw


GOOD = {
    "plain_english": "Tenant must give notice.",
    "obligations": [{
        "party": "Tenant", "action": "Give written notice", "timing": "60 days before vacating",
        "financial_effect": None,
        "evidence_quote": "written notice at least 60 days before vacating",
    }],
    "unclear_points": [{
        "issue": "'normal wear' undefined", "question_to_ask": "What counts as normal wear?",
        "evidence_quote": "beyond normal wear",
    }],
    "not_specified": ["Deposit return deadline is not specified in this excerpt"],
}


def post(text=CLAUSE, **kw):
    return client.post("/api/analyze", json={"clause_text": text, **kw})


def test_normal(monkeypatch):
    monkeypatch.setattr(ai, "call_model", fake(GOOD))
    r = post(context_type="rental")
    assert r.status_code == 200
    d = r.json()
    assert d["obligations"][0]["evidence_verified"] is True  # whitespace-normalized match
    assert d["unclear_points"][0]["evidence_verified"] is True
    assert d["verification_warnings"] == []
    assert set(d) == {"plain_english", "obligations", "unclear_points", "not_specified", "verification_warnings"}


def test_empty_and_whitespace():
    for t in ["", "   \n "]:
        r = post(t)
        assert r.status_code == 422 and "paste a clause" in r.json()["detail"]


def test_too_long():
    r = post("a" * 6001)
    assert r.status_code == 422 and "too long" in r.json()["detail"]


def test_bad_context():
    assert post(context_type="criminal").status_code == 422


def test_invalid_json(monkeypatch):
    monkeypatch.setattr(ai, "call_model", fake("not json at all"))
    assert post().status_code == 502


def test_missing_required_field(monkeypatch):
    monkeypatch.setattr(ai, "call_model", fake({"obligations": []}))
    assert post().status_code == 502


def test_fenced_json(monkeypatch):
    monkeypatch.setattr(ai, "call_model", fake("```json\n" + json.dumps(GOOD) + "\n```"))
    assert post().status_code == 200


def test_quote_mismatch(monkeypatch):
    bad = json.loads(json.dumps(GOOD))
    bad["obligations"][0]["evidence_quote"] = "within 30 days of notice"
    monkeypatch.setattr(ai, "call_model", fake(bad))
    d = post().json()
    assert d["obligations"][0]["evidence_verified"] is False
    assert len(d["verification_warnings"]) == 1


def test_null_quote_unclear_point(monkeypatch):
    p = json.loads(json.dumps(GOOD))
    p["unclear_points"][0]["evidence_quote"] = None
    monkeypatch.setattr(ai, "call_model", fake(p))
    d = post().json()
    assert d["unclear_points"][0]["evidence_verified"] is False
    assert d["verification_warnings"] == []


def test_provider_errors(monkeypatch):
    req = httpx.Request("POST", "http://x")
    cases = [
        (openai.APITimeoutError(request=req), 504),
        (openai.RateLimitError("r", response=httpx.Response(429, request=req), body=None), 429),
        (openai.AuthenticationError("a", response=httpx.Response(401, request=req), body=None), 502),
    ]
    for exc, code in cases:
        def boom(s, u, exc=exc):
            raise exc
        monkeypatch.setattr(ai, "call_model", boom)
        assert post().status_code == code


def test_not_configured(monkeypatch):
    monkeypatch.setattr(ai, "_client", None)
    monkeypatch.delenv("MODEL_ACCESS_KEY", raising=False)
    assert post().status_code == 502

def test_health():
    assert client.get("/health").json() == {"status": "ok"}