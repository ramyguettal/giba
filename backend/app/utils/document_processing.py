from __future__ import annotations

import re
from pathlib import Path
from typing import Literal

import fitz  # PyMuPDF

DocType = Literal[
    "maintenance_manual",
    "safety_alert",
    "service_bulletin",
    "spare_parts",
    "report",
    "generic",
]


# ──────────────────────────────────────────────────────────────────────────────
# Text extraction
# ──────────────────────────────────────────────────────────────────────────────

def extract_text_from_pdf(file_path: str) -> tuple[str, list[dict]]:
    """
    Returns (full_text, page_metadata) where page_metadata is a list of
    {"page": n, "text": ..., "char_start": ..., "char_end": ...} entries.
    """
    doc = fitz.open(file_path)
    parts: list[str] = []
    page_meta: list[dict] = []
    offset = 0
    for page in doc:
        text = page.get_text("text").strip()
        if not text:
            continue
        start = offset
        parts.append(text)
        offset += len(text) + 2  # account for "\n\n" separator
        page_meta.append({"page": page.number + 1, "text": text, "char_start": start, "char_end": offset})
    full = "\n\n".join(parts)
    return full, page_meta


def extract_text_from_file(file_path: str) -> tuple[str, list[dict]]:
    """Dispatch to PDF or plain-text extractor by file extension."""
    lower = file_path.lower()
    if lower.endswith(".pdf"):
        return extract_text_from_pdf(file_path)
    # Plain text / .txt / .md
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        text = f.read().strip()
    return text, []


# ──────────────────────────────────────────────────────────────────────────────
# Document type detection
# ──────────────────────────────────────────────────────────────────────────────

_ALERT_PATTERNS = re.compile(
    r"\b(safety\s+alert|manufacturer\s+alert|bulletin|urgent|warning|hazard|recall|advisory)\b",
    re.IGNORECASE,
)
_MANUAL_PATTERNS = re.compile(
    r"\b(maintenance\s+manual|operation\s+guide|installation\s+guide|user\s+manual|service\s+manual)\b",
    re.IGNORECASE,
)
_BULLETIN_PATTERNS = re.compile(
    r"\b(service\s+bulletin|technical\s+bulletin|engineering\s+notice|field\s+service)\b",
    re.IGNORECASE,
)
_PARTS_PATTERNS = re.compile(
    r"\b(spare\s+parts?|parts?\s+list|parts?\s+catalog|BoM|BOM|bill\s+of\s+materials)\b",
    re.IGNORECASE,
)


def detect_doc_type(title: str, text_preview: str = "", job_type: str = "") -> DocType:
    """Infer the document type from title, a sample of text, and the job_type."""
    combined = f"{title} {text_preview[:500]}"

    if job_type == "manufacturer-alert":
        return "safety_alert"

    if _ALERT_PATTERNS.search(combined):
        return "safety_alert"
    if _BULLETIN_PATTERNS.search(combined):
        return "service_bulletin"
    if _PARTS_PATTERNS.search(combined):
        return "spare_parts"
    if _MANUAL_PATTERNS.search(combined):
        return "maintenance_manual"

    # Fall back on title keywords
    t = title.lower()
    if any(k in t for k in ("manual", "guide", "handbook")):
        return "maintenance_manual"
    if any(k in t for k in ("alert", "bulletin", "advisory", "notice")):
        return "safety_alert"
    if any(k in t for k in ("parts", "catalog", "bom")):
        return "spare_parts"

    return "generic"


# ──────────────────────────────────────────────────────────────────────────────
# Chunking strategies (type-aware)
# ──────────────────────────────────────────────────────────────────────────────

_CHUNK_PARAMS: dict[DocType, dict] = {
    "maintenance_manual": {"chunk_size": 1100, "overlap": 220, "min_chunk": 20},
    "safety_alert":       {"chunk_size": 700,  "overlap": 180, "min_chunk": 20},
    "service_bulletin":   {"chunk_size": 800,  "overlap": 180, "min_chunk": 20},
    "spare_parts":        {"chunk_size": 600,  "overlap": 100, "min_chunk": 20},
    "report":             {"chunk_size": 1200, "overlap": 150, "min_chunk": 20},
    "generic":            {"chunk_size": 900,  "overlap": 180, "min_chunk": 20},
}

# Section-header patterns for page/section metadata extraction
_SECTION_HEADER = re.compile(
    r"^(Chapter\s+\d+|Section\s+\d+|\d+\.\d*\s+[A-Z]|\#{1,3}\s).+",
    re.MULTILINE,
)


def _split_sentences(text: str) -> list[str]:
    paragraphs = [p.strip() for p in re.split(r"\n{2,}", text) if p.strip()]
    sentences: list[str] = []
    for para in paragraphs:
        parts = re.split(r"(?<=[.!?])\s+(?=[A-Z0-9\-\(])", para)
        sentences.extend(p.strip() for p in parts if p.strip())
    return sentences


def _build_chunks(
    text: str,
    *,
    chunk_size: int,
    overlap: int,
    min_chunk: int,
) -> list[str]:
    """Core chunker: sentence-aware with overlap."""
    text = (text or "").strip()
    if not text:
        return []

    sentences = _split_sentences(text)
    if not sentences:
        return []

    chunks: list[str] = []
    current_parts: list[str] = []
    current_len = 0

    for sentence in sentences:
        slen = len(sentence)

        # Hard-split sentences longer than chunk_size
        if slen > chunk_size:
            if current_parts:
                chunks.append(" ".join(current_parts))
                tail_parts: list[str] = []
                tail_len = 0
                for part in reversed(current_parts):
                    if tail_len + len(part) > overlap:
                        break
                    tail_parts.insert(0, part)
                    tail_len += len(part) + 1
                current_parts = tail_parts
                current_len = tail_len

            start = 0
            while start < slen:
                end = min(slen, start + chunk_size)
                chunks.append(sentence[start:end])
                start = max(0, end - overlap)
            current_parts = []
            current_len = 0
            continue

        if current_len + slen + 1 > chunk_size and current_parts:
            chunks.append(" ".join(current_parts))
            tail_parts = []
            tail_len = 0
            for part in reversed(current_parts):
                if tail_len + len(part) > overlap:
                    break
                tail_parts.insert(0, part)
                tail_len += len(part) + 1
            current_parts = tail_parts
            current_len = tail_len

        current_parts.append(sentence)
        current_len += slen + 1

    if current_parts:
        last = " ".join(current_parts)
        if last.strip():
            chunks.append(last)

    return [c.strip() for c in chunks if len(c.strip()) >= min_chunk]


def chunk_text(
    text: str,
    *,
    doc_type: DocType = "generic",
    chunk_size: int | None = None,
    overlap: int | None = None,
    min_chunk: int | None = None,
) -> list[str]:
    """Public API: chunk text using parameters appropriate for the doc_type."""
    text = (text or "").strip()
    if not text:
        return []
    params = _CHUNK_PARAMS[doc_type]
    chunks = _build_chunks(
        text,
        chunk_size=chunk_size if chunk_size is not None else params["chunk_size"],
        overlap=overlap if overlap is not None else params["overlap"],
        min_chunk=min_chunk if min_chunk is not None else params["min_chunk"],
    )
    # If the text is non-empty but produces no chunks (e.g. very short),
    # return it as a single chunk so nothing is silently dropped.
    return chunks if chunks else [text]


def chunk_with_metadata(
    text: str,
    *,
    doc_type: DocType = "generic",
    page_meta: list[dict] | None = None,
    base_metadata: dict | None = None,
) -> list[tuple[str, dict]]:
    """
    Chunk text and enrich each chunk with page/section metadata.
    Returns list of (chunk_text, metadata_dict).
    """
    chunks = chunk_text(text, doc_type=doc_type)
    base = dict(base_metadata or {})
    base["doc_type"] = doc_type

    result: list[tuple[str, dict]] = []
    char_pos = 0
    for i, chunk in enumerate(chunks):
        meta = dict(base)
        meta["chunk_index"] = i

        # Find section header preceding this chunk (best-effort)
        chunk_start = text.find(chunk[:50].strip(), char_pos)
        if chunk_start == -1:
            chunk_start = char_pos
        header_match = None
        for m in _SECTION_HEADER.finditer(text[:chunk_start]):
            header_match = m
        if header_match:
            meta["section"] = header_match.group(0).strip()[:120]

        # Map to page number if page metadata is available
        if page_meta:
            for pm in page_meta:
                if pm["char_start"] <= chunk_start <= pm["char_end"]:
                    meta["page"] = pm["page"]
                    break

        char_pos = chunk_start
        result.append((chunk, meta))

    return result


def ensure_dir(path: str) -> None:
    Path(path).mkdir(parents=True, exist_ok=True)
