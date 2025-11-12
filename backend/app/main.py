from fastapi import FastAPI, Depends
from contextlib import asynccontextmanager
from sqlalchemy import text
from sqlalchemy.orm import Session
from .models import Base
from .db import engine, get_db
from . import schemas, rag
from .llm import answer_with_context

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure pgvector and schema exist before serving requests
    with engine.begin() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        Base.metadata.create_all(bind=conn)
    yield

app = FastAPI(title="AI Docs Assistant", lifespan=lifespan)

@app.post("/ingest")
def ingest(req: schemas.IngestRequest, db: Session = Depends(get_db)):
    doc = rag.store_document(db, req.name, req.text)
    return {"id": doc.id, "name": doc.name}

@app.post("/search", response_model=list[schemas.ChunkOut])
def search(req: schemas.SearchRequest, db: Session = Depends(get_db)):
    return rag.search_chunks(db, req.query, req.k)

@app.post("/ask", response_model=schemas.QAResponse)
def ask(req: schemas.QARequest, db: Session = Depends(get_db)):
    chunks = rag.search_chunks(db, req.query, req.k)
    answer = answer_with_context(req.query, [c.content for c in chunks])
    return schemas.QAResponse(answer=answer, context=chunks)