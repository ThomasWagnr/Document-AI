from typing import List
from pydantic import BaseModel, ConfigDict

# ---------- Requests ----------

class SearchRequest(BaseModel):
    query: str
    k: int = 3

class QARequest(BaseModel):
    query: str
    k: int = 3

# ---------- Responses ----------

class ChunkOut(BaseModel):
    id: int
    document_id: int
    document_name: str | None = None
    content: str
    model_config = ConfigDict(from_attributes=True)

class QAResponse(BaseModel):
    answer: str
    context: List[ChunkOut]

class DocumentOut(BaseModel):
    id: int
    name: str
    source: str
    model_config = ConfigDict(from_attributes=True)