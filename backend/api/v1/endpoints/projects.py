from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import select
from backend.db.session import get_db
from backend.models.models import Project
from backend.models.document import Document
from backend.api import deps
import uuid

router = APIRouter()

@router.get("/", response_model=List[Any])
async def read_projects(
    skip: int = 0,
    limit: int = 100,
    current_user: Any = Depends(deps.get_current_user),
):
    """
    Retrieve projects for the authenticated user.
    """
    try:
        SessionLocal = await get_db()
        async with SessionLocal() as session:
            # Filter by owner_id
            query = select(Project).filter(Project.owner_id == current_user.id).offset(skip).limit(limit)
            result = await session.execute(query)
            projects = result.scalars().all()
            return [{"id": str(p.id), "name": p.name, "repo_url": p.repo_url} for p in projects]
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=Any)
async def create_project(
    repo_url: str,
    background_tasks: BackgroundTasks,
    current_user: Any = Depends(deps.get_current_user),
):
    """
    Create a project and start ingestion (User Scoped).
    """
    from backend.models.models import User
    
    try:
        SessionLocal = await get_db()
        async with SessionLocal() as session:
            # FIRST: Ensure user exists in the users table (sync from Supabase Auth)
            user_result = await session.execute(
                select(User).filter(User.id == current_user.id)
            )
            existing_user = user_result.scalars().first()
            
            if not existing_user:
                # Auto-create user from Supabase Auth data
                new_user = User(
                    id=current_user.id,
                    email=current_user.email,
                    role="user"
                )
                session.add(new_user)
                await session.flush()  # Flush to ensure user is created before project
            
            # Check if project exists FOR THIS USER
            result = await session.execute(
                select(Project).filter(Project.repo_url == repo_url, Project.owner_id == current_user.id)
            )
            existing = result.scalars().first()
            if existing:
                 return {"id": str(existing.id), "name": existing.name, "repo_url": existing.repo_url, "message": "Project already exists"}

            # 1. Create Project in DB
            new_project = Project(
                repo_url=repo_url, 
                name=repo_url.split("/")[-1],
                owner_id=current_user.id
            )
            session.add(new_project)
            await session.commit()
            await session.refresh(new_project)
            
            # 2. Trigger Ingestion SYNCHRONOUSLY (Await it) to avoid Cloud Run CPU throttling
            # We accept this might block for 10-20s, but it guarantees completion.
            await run_ingestion(repo_url, str(new_project.id))
            
            return {"id": str(new_project.id), "name": new_project.name, "repo_url": new_project.repo_url}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

async def run_ingestion(repo_url: str, project_id: str):
    """
    Async ingestion function awaiting all steps.
    """
    from backend.ingestion.repo_loader import repo_loader
    from backend.ingestion.parser import code_parser
    from backend.rag.embeddings import embedding_service
    from backend.models.analytics import Embedding
    import logging
    
    logger = logging.getLogger("ingestion")
    logger.setLevel(logging.INFO)
    
    print(f"[INGEST] Starting ingestion for {repo_url} (Project: {project_id})")
    
    # 1. Clone
    try:
        # Clone is synchronous (uses gitpython blocking), run in threadpool if needed, 
        # but for now direct call is fine if simple.
        repo_path = repo_loader.clone_repo(repo_url, repo_id=project_id)
        print(f"[INGEST] Cloned to {repo_path}")
    except Exception as e:
        print(f"[INGEST] Clone failed: {e}")
        # We don't raise here to avoid crashing the whole request response, 
        # but in a perfect world we would update Project status to 'failed'
        return
    
    # 2. Walk and Parse
    files = repo_loader.get_file_list(repo_path)
    print(f"[INGEST] Found {len(files)} files")
    
    parsed_count = 0
    total_chunks = 0
    
    SessionLocal = await get_db()
    async with SessionLocal() as session:
        for file_path in files:
            try:
                # Parse
                root_node, content = code_parser.parse_file(file_path)
                chunks = []
                if root_node:
                    chunks = code_parser.extract_definitions(root_node, content)
                
                # Fallback
                if not chunks:
                    chunks = code_parser.chunk_file_generic(content, file_path)
                
                if chunks:
                    # Create Document
                    doc = Document(project_id=project_id, type="code", path=file_path, metadata_={"language": "unknown"})
                    session.add(doc)
                    await session.flush() # Get ID
                    
                    for chunk in chunks:
                        # Embed
                        vector = embedding_service.embed_text(chunk['content'])
                        
                        # Create Embedding
                        emb = Embedding(
                            document_id=doc.id,
                            vector=vector,
                            chunk_metadata=chunk
                        )
                        session.add(emb)
                        total_chunks += 1
                    
                    parsed_count += 1
            except Exception as e:
                print(f"[INGEST] Error processing {file_path}: {e}")
        
        await session.commit()
    
    print(f"[INGEST] Completed. Parsed {parsed_count}/{len(files)} files. Total chunks: {total_chunks}")


@router.get("/{project_id}/structure", response_model=Any)
async def get_project_structure(
    project_id: str,
    current_user: Any = Depends(deps.get_current_user),
):
    """
    Returns a graph representation of the project structure.
    Nodes: Files and derived folders.
    """
    try:
        try:
            pid = uuid.UUID(project_id)
        except ValueError:
             return {"nodes": [], "links": []}

        SessionLocal = await get_db()
        async with SessionLocal() as session:
            # Verify Ownership First
            proj = await session.get(Project, pid)
            if not proj:
                raise HTTPException(status_code=404, detail="Project not found")
            
            if str(proj.owner_id) != str(current_user.id):
                 # For now, simplistic privacy. In real app, might allow shared.
                 raise HTTPException(status_code=403, detail="Not authorized to view this project")

            # Fetch all documents for this project
            result = await session.execute(select(Document).filter(Document.project_id == pid))
            docs = result.scalars().all()
            
            if not docs:
                return {"nodes": [], "links": []} 

            # Build Tree
            nodes = []
            links = []
            
            root_id = "ROOT"
            nodes.append({
                "id": root_id,
                "type": "folder",
                "name": "root",
                "path": "/",
                "fileType": None
            })
            
            seen_paths = {"/": root_id}

            for doc in docs:
                clean_path = doc.path.lstrip("/").lstrip("\\")
                parts = clean_path.replace("\\", "/").split("/")
                
                parent_id = root_id
                current_full_path = ""
                
                for i, part in enumerate(parts):
                    if not part: continue
                    current_full_path = f"{current_full_path}/{part}" if current_full_path else part
                    is_file = (i == len(parts) - 1)
                    
                    node_id = f"node-{current_full_path}" 
                    
                    if current_full_path not in seen_paths:
                        nodes.append({
                            "id": node_id,
                            "type": "file" if is_file else "folder",
                            "name": part,
                            "path": current_full_path,
                            "fileType": part.split(".")[-1] if is_file and "." in part else None
                        })
                        seen_paths[current_full_path] = node_id
                        
                        links.append({
                            "source": parent_id,
                            "target": node_id
                        })
                    else:
                        node_id = seen_paths[current_full_path]
                    
                    parent_id = node_id 

            return {"nodes": nodes, "links": links}
    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"nodes": [], "links": []}
