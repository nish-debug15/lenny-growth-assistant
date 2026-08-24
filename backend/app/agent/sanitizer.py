import bleach
import re

# Allowed HTML tags and attributes for artifacts
ALLOWED_TAGS = list(bleach.sanitizer.ALLOWED_TAGS) + [
    "h1", "h2", "h3", "h4", "h5", "h6", "p", "div", "span", 
    "table", "thead", "tbody", "tr", "th", "td", "img", "hr", "br",
    "ul", "ol", "li", "strong", "em", "b", "i", "a",
    # We want to allow our custom <artifact> tag
    "artifact"
]

ALLOWED_ATTRIBUTES = {
    **bleach.sanitizer.ALLOWED_ATTRIBUTES,
    "a": ["href", "title", "target"],
    "img": ["src", "alt", "title", "width", "height"],
    "artifact": ["type", "title"],
    "*": ["class", "id"]
}

def sanitize_artifact_html(html_content: str) -> str:
    """
    Sanitize HTML output from the LLM to prevent XSS.
    Strips dangerous tags like <script> while preserving formatting.
    """
    if not html_content:
        return ""
        
    sanitized = bleach.clean(
        html_content,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        strip=True  # Strip disallowed tags instead of escaping them
    )
    return sanitized
