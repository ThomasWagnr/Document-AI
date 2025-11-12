import os 
import numpy as np
from typing import List
from google import genai
from google.genai import types


client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

EMBEDDING_MODEL = os.getenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001")
CHAT_MODEL = os.getenv("GEMINI_CHAT_MODEL", "gemini-2.5-flash")
EMBEDDING_DIM = int(os.getenv("EMBEDDING_DIM", "1536"))


def l2_normalize(v: list[float]) -> list[float]:
    x = np.array(v, dtype=np.float32)
    n = np.linalg.norm(x)
    return (x / (n + 1e-12)).tolist()

def _embed(text: str, task_type: str) -> List[float]:
    """
    Returns an embedding vector for the input text.

    Args:
        text: The text to embed

    Returns:
        The embedding vector
    """
    res = client.models.embed_content(
        model=EMBEDDING_MODEL, 
        contents=text,
        config=types.EmbedContentConfig(
            output_dimensionality=EMBEDDING_DIM,
            task_type=task_type,
            
        ))
    vec = res.embeddings[0].values
    
    if EMBEDDING_DIM != 3072:
        vec = l2_normalize(vec)
    return vec

def embed_doc_text(text: str) -> List[float]:
    return _embed(text, "RETRIEVAL_DOCUMENT")


def embed_query_text(text: str) -> List[float]:
    return _embed(text, "RETRIEVAL_QUERY")


def answer_with_context(query: str, context_chunks: list[str]) -> str:
    context_block = "\n\n---\n".join(context_chunks)

    instruction = (
        "You are a concise documentation assistant. Answer strictly from the provided context. "
        "If the answer is not in the context, reply exactly: \"I don't know.\""
    )

    content = f"Context:\n{context_block}\n\nQuestion: {query}"
    

    resp = client.models.generate_content(
        model=CHAT_MODEL,
        contents=content,
        config=types.GenerateContentConfig(
            system_instruction=instruction,
            temperature=0.1,
        ),
    )
    return resp.text.strip()
