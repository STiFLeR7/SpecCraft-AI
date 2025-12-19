from backend.db.session import get_db
from backend.models.analytics import Embedding, Query
from backend.models.document import Document
from backend.rag.embeddings import embedding_service
from backend.inference.engine import inference_engine
from sqlalchemy import select
from pgvector.sqlalchemy import Vector
import logging
import uuid as uuid_lib

logger = logging.getLogger(__name__)

async def rag_query(user_query: str, project_id: str):
    # 1. Embed Query
    query_vector = embedding_service.embed_text(user_query)
    
    # 2. Retrieve Documents - FILTER BY PROJECT_ID
    try:
        pid = uuid_lib.UUID(project_id)
    except ValueError:
        return {"answer": "Invalid project ID", "citations": []}
    
    SessionLocal = await get_db()
    async with SessionLocal() as session:
        # Join with Document to filter by project_id
        stmt = select(Embedding).join(Document, Embedding.document_id == Document.id).filter(
            Document.project_id == pid
        ).order_by(
            Embedding.vector.l2_distance(query_vector)
        ).limit(5)
        result = await session.execute(stmt)
        embeddings = result.scalars().all()
        
    # 3. Construct Context
    context_text = "\n\n".join([e.chunk_metadata.get('content', '') for e in embeddings])
    
    # 4. Construct Prompt
    prompt = f"""
    You are SpecCraft AI, an expert software architect.
    Answer the user's question based on the provided code context.
    
    Context:
    {context_text}
    
    Question: {user_query}
    
    Answer:
    """
    
    # 5. Inference
    try:
        # Note: In a real async api, offload this blocking call to threadpool or celery
        response = inference_engine.generate(prompt)
    except Exception as e:
        import traceback
        traceback.print_exc()
        logger.error(f"Inference failed: {e}")
        response = f"Error generating answer: {str(e)}"
        
    return {
        "answer": response,
        "citations": [e.chunk_metadata for e in embeddings]
    }

async def rag_query_stream(user_query: str, project_id: str):
    import json
    # 1. Embed Query
    query_vector = embedding_service.embed_text(user_query)
    
    # 2. Retrieve Documents - FILTER BY PROJECT_ID
    try:
        pid = uuid_lib.UUID(project_id)
    except ValueError:
        yield f"data: {json.dumps({'type': 'error', 'data': 'Invalid project ID'})}\n\n"
        yield "data: [DONE]\n\n"
        return
    
    SessionLocal = await get_db()
    async with SessionLocal() as session:
        # Join with Document to filter by project_id
        stmt = select(Embedding).join(Document, Embedding.document_id == Document.id).filter(
            Document.project_id == pid
        ).order_by(
            Embedding.vector.l2_distance(query_vector)
        ).limit(5)
        result = await session.execute(stmt)
        embeddings = result.scalars().all()
        
    # 3. Construct Context
    context_text = "\n\n".join([e.chunk_metadata.get('content', '') for e in embeddings])
    citations = [e.chunk_metadata for e in embeddings]
    
    # Event 1: Citations
    yield f"data: {json.dumps({'type': 'citations', 'data': citations})}\n\n"
    
    # 4. Construct Prompt
    prompt = f"""
    You are SpecCraft AI, an expert software architect.
    Answer the user's question based on the provided code context.
    
    Context:
    {context_text}
    
    Question: {user_query}
    
    Answer:
    """
    
    # 5. Inference Stream
    try:
        # Blocking call in thread logic is inside engine, so we can iterate
        for token in inference_engine.generate_stream(prompt):
            yield f"data: {json.dumps({'type': 'token', 'data': token})}\n\n"
    except Exception as e:
        logger.error(f"Stream error: {e}")
        yield f"data: {json.dumps({'type': 'error', 'data': str(e)})}\n\n"
        
    yield "data: [DONE]\n\n"
