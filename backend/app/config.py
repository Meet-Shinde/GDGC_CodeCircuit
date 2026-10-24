import os


def get_allowed_origins() -> list[str]:
    raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
    return [o.strip() for o in raw.split(",") if o.strip()]


def model_key_configured() -> bool:
    key = os.getenv("MODEL_ACCESS_KEY", "")
    return bool(key) and key != "replace_me"