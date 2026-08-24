import pytest
from app.agent.sanitizer import sanitize_artifact_html

def test_sanitizer_strips_script_tag():
    dirty_html = "Hello <script>alert('xss');</script>World!"
    clean_html = sanitize_artifact_html(dirty_html)
    assert "<script>" not in clean_html
    assert "Hello " in clean_html

def test_sanitizer_strips_onclick_handler():
    dirty_html = "<a href='#' onclick='stealCookies()'>Click me</a>"
    clean_html = sanitize_artifact_html(dirty_html)
    assert "onclick" not in clean_html
    assert "href" in clean_html
    assert "Click me" in clean_html

def test_sanitizer_preserves_artifact_tags():
    safe_html = "<artifact type=\"ship30_essay\" title=\"My Essay\"><h1>Title</h1><p>Body</p></artifact>"
    clean_html = sanitize_artifact_html(safe_html)
    assert "<artifact type=\"ship30_essay\" title=\"My Essay\">" in clean_html
    assert "<h1>Title</h1>" in clean_html
    assert "<p>Body</p>" in clean_html
