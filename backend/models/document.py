from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from backend.db.base import Base

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"))
    type = Column(String) # code, api, doc, infra
    path = Column(String)
    metadata_ = Column("metadata", JSON) # metadata is reserved
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    project = relationship("Project", back_populates="documents")
    # embeddings relationship can be added here
