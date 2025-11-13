from sqlalchemy import Column, Integer, String, Text, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship, declarative_base
from pgvector.sqlalchemy import Vector
from typing import Optional, List
import os
from dotenv import load_dotenv

load_dotenv()

Base = declarative_base()

EMBEDDING_DIM = int(os.getenv("EMBEDDING_DIM", "1536"))

class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[Optional[str]] = mapped_column(String, index=True)
    source: Mapped[Optional[str]] = mapped_column(String, index=True)

    chunks: Mapped[List["Chunk"]] = relationship(back_populates="document")


class Chunk(Base):
    __tablename__ = "chunks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    document_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("documents.id"), index=True
    )
    page: Mapped[Optional[int]] = mapped_column(Integer, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[list[float]] = mapped_column(
        Vector(EMBEDDING_DIM), nullable=False
    )
    document: Mapped[Optional["Document"]] = relationship(back_populates="chunks")
