from dataclasses import dataclass
from pathlib import Path
import re

from pypdf import PdfReader


@dataclass(frozen=True)
class ExtractedPage:
    physical_page: int
    text: str
    section_title: str
    char_start: int
    char_end: int


def _section_title(text: str, current: str) -> str:
    for line in text.splitlines():
        candidate = " ".join(line.split()).strip()
        if not candidate or len(candidate) > 100:
            continue
        if candidate.isupper() or re.match(r"^(section|article|part)\s+[\w.-]+", candidate, re.I):
            return candidate
    return current or "Document text"


def extract_pdf(path: str | Path) -> list[ExtractedPage]:
    reader = PdfReader(str(path))
    pages: list[ExtractedPage] = []
    offset = 0
    section = "Document text"
    for number, page in enumerate(reader.pages, start=1):
        text = (page.extract_text() or "").strip()
        section = _section_title(text, section)
        start = offset
        offset += len(text)
        pages.append(
            ExtractedPage(
                physical_page=number,
                text=text,
                section_title=section,
                char_start=start,
                char_end=offset,
            )
        )
        offset += 1
    return pages
