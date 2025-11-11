from statistics import kde
from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from .db import Base

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    source = Column(String, index=True)

    chunks = relationship("Chunk", back_populates="document")

class Chunk(Base):
    __tablename__ = "chunks"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), index=True)
    content = Column(Text, nullable=False)

    embedding = Column(Text, nullable=False)

    document = relationship("Document", back_populates="chunks")
