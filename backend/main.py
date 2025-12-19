from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.core.config import settings

from backend.api.v1.api import api_router
import backend.models # Register models

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.include_router(api_router, prefix=settings.API_V1_STR)


# Set all CORS enabled origins
# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    # allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
    allow_origins=["*"], # Explicitly allow all for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Welcome to SpecCraft AI API", "version": settings.VERSION}

@app.get("/health")
def health_check():
    return {"status": "ok"}
