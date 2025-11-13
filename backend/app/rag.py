import re
import pymupdf as fitz
import pymupdf4llm 

from typing import Iterable


from sqlalchemy.orm import Session
from sqlalchemy import select

from . import models
from .llm import embed_doc_text, embed_query_text

MD_CHUNK_SIZE = 800
MD_CHUNK_OVERLAP = 120

# --------- PDF → Markdown ---------

def _pdf_to_markdown(data: bytes) -> str:
    """Return one Markdown string with headings / lists / basic tables preserved."""
    doc = fitz.open(stream=data, filetype="pdf")
    return pymupdf4llm.to_markdown(doc)

def _iter_md_sections(md: str) -> Iterable[tuple[str, str]]:
    """Yield (title, body) pairs by splitting on ATX headings (#..######)."""
    parts = re.split(r'(?m)^(#{1,6})\s+(.*)$', md)
    it = iter(parts)
    preamble = next(it, "")
    if preamble.strip():
        yield ("", preamble)
    for _hashes, title, body in zip(it, it, it):
        yield (title.strip(), (body or "").strip())

def _iter_chunks(text: str, size: int, overlap: int) -> Iterable[str]:
    words = text.split()
    step = max(1, size - overlap)
    for i in range(0, len(words), step):
        chunk = " ".join(words[i : i + size]).strip()
        if chunk:
            yield chunk

# --------- Ingestion: PDF ---------


def store_pdf(db: Session, name: str, data: bytes, source: str = "upload") -> models.Document:
    """
    Ingestion pipeline for PDFs:
      PDF bytes -> Markdown -> heading-aware chunking -> embed -> persist chunks
    """
    md = _pdf_to_markdown(data)

    doc = models.Document(name=name, source=source)
    db.add(doc)
    db.flush()

    rows = []
    for title, body in _iter_md_sections(md):
        for chunk_text in _iter_chunks(body, MD_CHUNK_SIZE, MD_CHUNK_OVERLAP):
            text_with_title = f"{title}\n\n{chunk_text}" if title else chunk_text
            emb = embed_doc_text(text_with_title)
            rows.append(
                models.Chunk(
                    document_id=doc.id,              
                    content=text_with_title,
                    embedding=emb,
                )
            )

    if rows:
        db.add_all(rows)
    db.commit()
    db.refresh(doc)
    return doc

# --------- Retrieval ---------

def search_chunks(db: Session, query: str, k: int = 3) -> list[models.Chunk]:
    """
    Embed query (RETRIEVAL_QUERY) and return top-k chunks by vector distance.
    """
    q_emb = embed_query_text(query)

    stmt = (
        select(models.Chunk)
        .order_by(models.Chunk.embedding.l2_distance(q_emb))
        .limit(k) 
    )

    return db.execute(stmt).scalars().all()