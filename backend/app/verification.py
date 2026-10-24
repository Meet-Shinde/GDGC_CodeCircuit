"""Quote verification and model-output parsing (stdlib only).

Quote matching checks that the quoted text appears in the source clause after
whitespace normalization. It does NOT prove the interpretation is correct.
"""
import json
import re


def normalize(text: str) -> str:
    return " ".join(text.split())


def quote_in_source(quote, clause: str) -> bool:
    if not quote or not quote.strip():
        return False
    return normalize(quote) in normalize(clause)


class ModelOutputError(Exception):
    """Model returned something we cannot parse into JSON."""


_FENCE = re.compile(r"^```(?:json)?\s*|\s*```$", re.IGNORECASE)


def extract_json(raw: str) -> dict:
    if not raw or not raw.strip():
        raise ModelOutputError("empty model output")
    text = _FENCE.sub("", raw.strip()).strip()
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find("{"), text.rfind("}")
        if start == -1 or end <= start:
            raise ModelOutputError("no JSON object found")
        try:
            data = json.loads(text[start : end + 1])
        except json.JSONDecodeError as exc:
            raise ModelOutputError("malformed JSON") from exc
    if not isinstance(data, dict):
        raise ModelOutputError("JSON root is not an object")
    return data