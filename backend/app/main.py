from fastapi import FastAPI, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from typing import Union
from .db import engine, Base, get_db
from . import schemas, rag

app = FastAPI(title="AI Docs Assistant")

def init_db():
    with engine.begin() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        Base.metadata.create_all(bind=conn)

init_db()

@app.post("/ingest")
def ingest(req: schemas.IngestRequest, db: Session = Depends(get_db)):
    doc = rag.store_document(db, req.name, req.text)
    return {"id": doc.id, "name": doc.name}

@app.post("/search", response_model=list[schemas.ChunkOut])
def search(req: schemas.SearchRequest, db: Session = Depends(get_db)):
    chunks = rag.search_chunks(db, req.query, req.k)
    return chunks