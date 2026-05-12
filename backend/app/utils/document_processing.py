from __future__ import annotations

from pathlib import Path

import fitz  # PyMuPDF


def extract_text_from_pdf(file_path: str) -> str:
    doc = fitz.open(file_path)
    parts: list[str] = []
    for page in doc:
        parts.append(page.get_text("text"))
    return "\n".join(parts).strip()


def chunk_text(text: str, *, chunk_size: int = 1200, overlap: int = 150) -> list[str]:
    text = (text or "").strip()
    if not text:
        return []

    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = min(len(text), start + chunk_size)
        chunks.append(text[start:end])
        if end == len(text):
            break
        start = max(0, end - overlap)
    return [c.strip() for c in chunks if c.strip()]


def ensure_dir(path: str) -> None:
    Path(path).mkdir(parents=True, exist_ok=True)
