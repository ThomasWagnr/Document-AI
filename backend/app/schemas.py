from typing import List
from pydantic import BaseModel, ConfigDict

# ---------- Requests ----------

class SearchRequest(BaseModel):
    query: str
    k: int = 5

class QARequest(BaseModel):
    query: str
    k: int = 5

# ---------- Responses ----------

class ChunkOut(BaseModel):
    id: int
    document_id: int
    page: int | None = None
    content: str
    model_config = ConfigDict(from_attributes=True)

class QAResponse(BaseModel):
    answer: str
    context: List[ChunkOut]