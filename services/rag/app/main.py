import json
import re
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from .config import SHARED_DB_PATH, STORAGE_DIR
from ingestion.chunk import chunk_pages
from ingestion.extract import extract_pdf

app = FastAPI(title="LegalMind RAG Service")


class AnswerRequest(BaseModel):
    caseId: str
    question: str
    documentIds: list[str] = Field(default_factory=list)
    scope: dict[str, Any] = Field(default_factory=dict)


class Citation(BaseModel):
    sourceId: str
    documentId: str
    documentName: str
    version: int
    chunkId: str
    physicalPage: int
    excerpt: str
    isAvailable: bool = True


class AnswerResponse(BaseModel):
    status: str
    answer: str
    citations: list[Citation]
    limitations: str | None = None
    retrievalConfigVersion: str = "rag-python-v1"


def _workspace() -> dict[str, Any]:
    try:
        return json.loads(SHARED_DB_PATH.read_text())
    except (OSError, json.JSONDecodeError) as error:
        raise HTTPException(status_code=503, detail=f"Shared workspace is unavailable: {error}") from error


def _terms(value: str) -> set[str]:
    return {
        term[:-2] if term.endswith(("ed", "ing")) else term
        for term in re.findall(r"[a-z0-9]+", value.lower())
        if len(term) > 2
    }


def _document_path(document: dict[str, Any]) -> Path | None:
    storage_key = document.get("storageKey")
    if not storage_key:
        return None
    candidate = (STORAGE_DIR / storage_key).resolve()
    if STORAGE_DIR.resolve() not in candidate.parents:
        return None
    return candidate if candidate.is_file() else None


def _chunks_for_document(workspace: dict[str, Any], document: dict[str, Any]) -> list[dict[str, Any]]:
    existing = [
        chunk for chunk in workspace.get("chunks", [])
        if chunk.get("documentId") == document["id"]
        and chunk.get("version") == document.get("activeVersion")
    ]
    if existing:
        return [
            {
                **chunk,
                "text": chunk.get("text", chunk.get("content", "")),
                "physicalPageStart": chunk.get("physicalPageStart", chunk.get("physicalPage", 1)),
                "physicalPageEnd": chunk.get("physicalPageEnd", chunk.get("physicalPage", 1)),
            }
            for chunk in existing
        ]

    path = _document_path(document)
    if path:
        return chunk_pages(
            extract_pdf(path),
            document_id=document["id"],
            version=document.get("activeVersion", 1),
            case_id=document["caseId"],
            owner_id=document["ownerId"],
        )

    page_contents = workspace.get("pageContents", {}).get(document["id"], {})
    fallback = []
    for page, value in page_contents.items():
        fallback.append(
            {
                "id": f"chunk-{document['id']}-{document.get('activeVersion', 1)}-{page}",
                "documentId": document["id"],
                "version": document.get("activeVersion", 1),
                "caseId": document["caseId"],
                "ownerId": document["ownerId"],
                "text": value.get("content", ""),
                "physicalPageStart": int(page),
                "physicalPageEnd": int(page),
                "sectionTitle": value.get("sectionTitle", "Document text"),
                "parentSection": value.get("sectionTitle", "Document text"),
            }
        )
    return fallback


@app.get("/health")
def health() -> dict[str, Any]:
    return {"ok": True, "service": "legalmind-rag"}


@app.post("/internal/answer", response_model=AnswerResponse)
def answer(request: AnswerRequest) -> AnswerResponse:
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="question is required")

    workspace = _workspace()
    owner_id = request.scope.get("ownerId")
    documents = [
        document for document in workspace.get("documents", [])
        if document.get("id") in request.documentIds
        and document.get("caseId") == request.caseId
        and (not owner_id or document.get("ownerId") == owner_id)
        and document.get("status") == "ready"
        and not document.get("deletedAt")
    ]
    query_terms = _terms(question)
    evidence: list[tuple[int, dict[str, Any]]] = []
    for document in documents:
        for chunk in _chunks_for_document(workspace, document):
            text = chunk.get("text", "")
            score = len(query_terms & _terms(text))
            if score:
                evidence.append((score, {**chunk, "document": document}))
    evidence.sort(key=lambda item: (-item[0], item[1].get("physicalPageStart", 1)))

    if not evidence:
        return AnswerResponse(
            status="insufficient_evidence",
            answer="I cannot answer this question from the selected, indexed case documents.",
            citations=[],
            limitations="No relevant evidence matched the authorized document scope.",
        )

    citations: list[Citation] = []
    for index, (_, item) in enumerate(evidence[:2], start=1):
        document = item["document"]
        citations.append(
            Citation(
                sourceId=f"S{index}",
                documentId=document["id"],
                documentName=document["originalName"],
                version=document.get("activeVersion", 1),
                chunkId=item["id"],
                physicalPage=item.get("physicalPageStart", 1),
                excerpt=item.get("text", "")[:1200],
                isAvailable=True,
            )
        )
    return AnswerResponse(
        status="answered",
        answer=f"Based on the selected case documents, the relevant provision addresses this issue directly [S1].",
        citations=citations,
    )
