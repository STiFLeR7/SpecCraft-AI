from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from backend.db.base import Base

class Embedding(Base):
    __tablename__ = "embeddings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"))
    vector = Column(Vector(384)) # all-MiniLM-L6-v2 dimension
    chunk_metadata = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    document = relationship("Document")

class Query(Base):
    __tablename__ = "queries"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"))
    question = Column(Text)
    response = Column(Text)
    citations = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User")
    project = relationship("Project")
