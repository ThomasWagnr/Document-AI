from fastapi import FastAPI, Depends, UploadFile, File, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy import text, select
from sqlalchemy.orm import Session
from .db import engine, get_db
from . import schemas, rag, models
from .llm import answer_with_context
from dotenv import load_dotenv

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure pgvector and schema exist before serving requests
    with engine.begin() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        models.Base.metadata.create_all(bind=conn)
    yield

app = FastAPI(title="AI Docs Assistant", lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Next.js default ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/ingest_pdf")
async def ingest_pdf(file: UploadFile = File(...), db: Session = Depends(get_db)):
    data = await file.read()
    doc = rag.store_pdf(db, name=file.filename, data=data, source="upload")
    return {"id": doc.id, "name": doc.name}

@app.post("/search", response_model=list[schemas.ChunkOut])
def search(req: schemas.SearchRequest, db: Session = Depends(get_db)):
    return rag.search_chunks(db, req.query, req.k)

@app.post("/ask", response_model=schemas.QAResponse)
def ask(req: schemas.QARequest, db: Session = Depends(get_db)):
    chunks = rag.search_chunks(db, req.query, req.k)
    answer = answer_with_context(req.query, [c.content for c in chunks])
    return schemas.QAResponse(answer=answer, context=chunks)

@app.get("/documents", response_model=list[schemas.DocumentOut])
def list_documents(limit: int = 50, offset: int = 0, db: Session = Depends(get_db)):
    stmt = (
        select(models.Document)
        .order_by(models.Document.id.desc())
        .offset(offset)
        .limit(limit)
    )
    return db.execute(stmt).scalars().all()

@app.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: int, db: Session = Depends(get_db)):
    doc = db.get(models.Document, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    db.delete(doc)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)