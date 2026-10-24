import logging
import os

from openai import OpenAI

log = logging.getLogger("legalease")
_client = None


class ModelNotConfigured(Exception):
    pass


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        key = os.getenv("MODEL_ACCESS_KEY")
        if not key or key == "replace_me":
            raise ModelNotConfigured("MODEL_ACCESS_KEY is not set on the server.")
        _client = OpenAI(
            base_url=os.getenv("MODEL_BASE_URL", "https://inference.do-ai.run/v1"),
            api_key=key,
            timeout=float(os.getenv("MODEL_TIMEOUT_SECONDS", "60")),
            max_retries=1,
        )
    return _client


def call_model(system_prompt: str, user_prompt: str) -> str:
    """Return raw text from the model. Never logs prompts, clause text or the key."""
    resp = _get_client().chat.completions.create(
        model=os.getenv("MODEL_ID", "openai-gpt-oss-20b"),
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.2,
        max_tokens=3000,
    )
    choice = resp.choices[0]
    if choice.finish_reason == "length":
        log.warning("model output truncated (finish_reason=length)")
    return choice.message.content or ""