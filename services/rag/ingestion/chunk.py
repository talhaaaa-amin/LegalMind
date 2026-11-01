from dataclasses import asdict
import re
from typing import Any

from .extract import ExtractedPage


def _windows(text: str, size: int = 2000, overlap: int = 320) -> list[str]:
    if not text:
        return []
    step = max(1, size - overlap)
    return [text[start : start + size].strip() for start in range(0, len(text), step) if text[start : start + size].strip()]


def chunk_pages(
    pages: list[ExtractedPage],
    *,
    document_id: str,
    version: int,
    case_id: str,
    owner_id: str,
) -> list[dict[str, Any]]:
    chunks: list[dict[str, Any]] = []
    index = 0
    for page in pages:
        for text in _windows(page.text):
            chunks.append(
                {
                    "id": f"chunk-{document_id}-{version}-{index}",
                    "documentId": document_id,
                    "version": version,
                    "caseId": case_id,
                    "ownerId": owner_id,
                    "text": text,
                    "physicalPageStart": page.physical_page,
                    "physicalPageEnd": page.physical_page,
                    "sectionTitle": page.section_title,
                    "parentSection": page.section_title,
                    "charStart": page.char_start,
                    "charEnd": page.char_end,
                }
            )
            index += 1
    return chunks
