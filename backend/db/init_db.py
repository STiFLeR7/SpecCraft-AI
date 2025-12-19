from backend.db.base import Base
from backend.db.session import engine
from sqlalchemy import text
from backend.models.models import User, Project
from backend.models.document import Document
from backend.models.analytics import Embedding, Query

async def init_db():
    async with engine.begin() as conn:
        # await conn.run_sync(Base.metadata.drop_all)
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)

if __name__ == "__main__":
    import asyncio
    asyncio.run(init_db())
