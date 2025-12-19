from pydantic_settings import BaseSettings
from typing import List, Union
from pydantic import AnyHttpUrl, validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "SpecCraft AI"
    VERSION: str = "0.1.0"
    DESCRIPTION: str = "System Understanding & Engineering Intelligence Platform"
    API_V1_STR: str = "/api/v1"

    # Allow all for dev
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    
    # Defaults to local postgres for dev if not set
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/speccraft"
    
    REDIS_URL: str = "redis://localhost:6379/0"

    class Config:
        case_sensitive = True
        env_file = ".env"

    @validator("DATABASE_URL", pre=True)
    def force_async_driver(cls, v: str) -> str:
        if v and v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+asyncpg://")
        return v

settings = Settings()
