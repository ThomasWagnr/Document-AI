from sqlalchemy.orm import Session
from sqlalchemy import select

from . import models
from .llm import embed_text

CHUNK_SIZE = 256
CHUNK_OVERLAP = 32

def store_document(db: Session, name: str, text: str, source: str) -> models.Document:
    """
    Ingestion: Chunk the document, embed the chunks, store in the database.
    
    Args:
        db: The database session
        name: The name of the document
        text: The text of the document
        source: The source of the document

    Returns:
        The document
    """
    doc = models.Document(name=name, source=source)
    db.add(doc)
    db.flush()

    words = text.split()
    chunks = []
    step = CHUNK_SIZE - CHUNK_OVERLAP
    for i in range(0, len(words), step):
        chunk_text =  " ".join(words[i:i+CHUNK_SIZE]).strip()
        if not chunk_text:
            continue

        emb = embed_text(chunk_text)


        chunk = models.Chunk(document_id=doc.id, content=chunk_text, embedding=emb)
        chunks.append(chunk)
    
    db.add_all(chunks)
    db.commit()
    db.refresh(doc)
    return doc


def search_chunks(db: Session, query: str, k: int = 5) -> list[models.Chunk]:
    """
    Search: Embed the query, retrieve the most similar chunks, return the context.

    Args:
        db: The database session
        query: The query to search for
        k: The number of chunks to return (default: 5)

    Returns:
        The k most similar chunks
    """
    q_emb = embed_text(query)
    stmt = select(models.Chunk).order_by(models.Chunk.embedding.l2_distance(q_emb)).limit(k)

    chunks = db.execute(stmt).scalars().all()
    return chunks