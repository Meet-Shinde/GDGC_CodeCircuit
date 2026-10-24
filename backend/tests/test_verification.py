import pytest

from app.verification import ModelOutputError, extract_json, quote_in_source


def test_pure_helpers():
    assert quote_in_source("a  b", "a\nb c")
    assert not quote_in_source(None, "x")
    with pytest.raises(ModelOutputError):
        extract_json("")