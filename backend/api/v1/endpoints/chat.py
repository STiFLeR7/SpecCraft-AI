from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from backend.inference.rag_flow import rag_query_stream

router = APIRouter()

class ChatRequest(BaseModel):
    project_id: str
    message: str

@router.post("/")
async def chat_endpoint(request: ChatRequest):
    """
    RAG-based chat endpoint (Streaming).
    """
    return StreamingResponse(
        rag_query_stream(request.message, request.project_id),
        media_type="text/event-stream"
    )
