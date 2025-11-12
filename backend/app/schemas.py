from typing import List
from pydantic import BaseModel, ConfigDict


# ---------- Base models ----------

class DocumentBase(BaseModel):
    name: str
    source: str | None = None

class ChunkBase(BaseModel):
    id: int
    document_id: int
    content: str


# ---------- Requests ----------

class IngestRequest(BaseModel):
    name: str
    source: str | None = None
    text: str


class SearchRequest(BaseModel):
    query: str
    k: int = 5

class QARequest(BaseModel):
    query: str
    k: int = 5


# ---------- Responses ----------

class ChunkOut(ChunkBase):
    model_config = ConfigDict(from_attributes=True)


class QAResponse(BaseModel):
    answer: str
    context: List[ChunkOut]