from backend.worker.celery_app import celery_app
from backend.ingestion.repo_loader import repo_loader
from backend.ingestion.parser import code_parser
from backend.rag.embeddings import embedding_service
from backend.db.session import get_db
from backend.models.document import Document
from backend.models.analytics import Embedding
from backend.models.models import Project
import asyncio

@celery_app.task
def ingest_repo_task(repo_url: str, project_id: str):
    """
    Celery task to clone and parse a repo.
    """
    print(f"Starting ingestion for {repo_url} (Project: {project_id})")
    
    # 1. Clone
    try:
        repo_path = repo_loader.clone_repo(repo_url, repo_id=project_id)
        print(f"Cloned to {repo_path}")
    except Exception as e:
        print(f"Clone failed: {e}")
        return {"status": "failed", "error": str(e)}

    # 2. Walk and Parse
    files = repo_loader.get_file_list(repo_path)
    print(f"Found {len(files)} files")
    
    async def save_chunks(chunks, file_path):
        SessionLocal = await get_db()
        async with SessionLocal() as session:
            # Create Document
            doc = Document(project_id=project_id, type="code", path=file_path, metadata_={"language": "unknown"}) # Detect lang later
            session.add(doc)
            await session.flush()
            
            for chunk in chunks:
                # Embed
                vector = embedding_service.embed_text(chunk['content'])
                
                # Create Embedding
                emb = Embedding(
                    document_id=doc.id,
                    vector=vector,
                    chunk_metadata=chunk # type, name, lines
                )
                session.add(emb)
            await session.commit()

    parsed_count = 0
    loop = asyncio.get_event_loop()

    for file_path in files:
        root_node, content = code_parser.parse_file(file_path)
        if root_node:
            chunks = code_parser.extract_definitions(root_node, content)
            if not chunks:
                 # Fallback to generic text chunking if parser found nothing (e.g. scripts, config)
                 chunks = code_parser.chunk_file_generic(content, file_path)
            
            if chunks:
                # Sync wrapper for async DB
                loop.run_until_complete(save_chunks(chunks, file_path))
                parsed_count += 1
        else:
             # Try generic chunking for unsupported extensions too if needed?
             # For now, let's trust the parser filter, but maybe log it
             pass
    
    print(f"ingest_repo_task completed. Parsed {parsed_count}/{len(files)} files.")
    return {"status": "completed", "files_processed": len(files), "parsed": parsed_count}

@celery_app.task
def test_task(word: str):
    return f"test task return {word}"
