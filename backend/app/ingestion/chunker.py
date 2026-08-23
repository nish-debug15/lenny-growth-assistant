import re

# Approximate 1 token ~ 4 chars.
# 512 tokens ~= 2048 characters
# 50 tokens overlap ~= 200 characters overlap
CHUNK_SIZE_CHARS = 2000
OVERLAP_CHARS = 200


def clean_markdown(text: str) -> str:
    """Basic cleanup of markdown to improve embedding quality."""
    # Remove some basic markdown formatting like multiple newlines
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE_CHARS, overlap: int = OVERLAP_CHARS) -> list[str]:
    """
    Split text into chunks of approximate `chunk_size` characters, 
    with `overlap` characters between consecutive chunks.
    Attempts to split cleanly on paragraphs or sentences where possible.
    """
    text = clean_markdown(text)
    if not text:
        return []

    chunks = []
    start = 0
    text_length = len(text)

    while start < text_length:
        end = start + chunk_size

        if end >= text_length:
            chunks.append(text[start:text_length].strip())
            break
        
        # Try to find a good break point (double newline, then single newline, then period)
        # Search backward from `end` to `start + overlap`
        break_point = -1
        
        for separator in ["\n\n", "\n", ". "]:
            idx = text.rfind(separator, start + overlap, end)
            if idx != -1:
                break_point = idx + len(separator)
                break
        
        if break_point == -1:
            # Fallback to hard split if no natural boundary is found
            break_point = end
            
        chunks.append(text[start:break_point].strip())
        start = break_point - overlap

    return chunks
