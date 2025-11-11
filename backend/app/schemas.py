from typing import List
from pydantic import BaseModel

# ---------- Base models ----------


class DocumentBase(BaseModel):
    name: str
    source: str

class ChunkBase(BaseModel):
    id: int
    document_id: int
    content: str


# ---------- Requests ----------

class IngestRequest(BaseModel):
    name: str
    source: str


class SearchRequest(BaseModel):
    query: str
    k: int = 5

class QARequest(BaseModel):
    query: str
    k: int = 5

# ---------- Responses ----------

class ChunkOut(ChunkBase):
    pass


class QAResponse(BaseModel):
    answer: str
    context: List[ChunkOut]