from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from backend.core.config import settings

print("DEBUG: session module loaded")


# Global placeholders
engine = None
AsyncSessionLocal = None

async def get_db():
    global engine, AsyncSessionLocal
    print("DEBUG: get_db called (lazy init)")
    
    if engine is None:
        print("DEBUG: Initializing Global Engine")
        engine = create_async_engine(
            settings.DATABASE_URL,
            future=True,
            echo=True,
            pool_pre_ping=True,
            connect_args={"timeout": 10}
        )
        AsyncSessionLocal = sessionmaker(
            engine, class_=AsyncSession, expire_on_commit=False
        )

    # Return session directly for now (manual context management in endpoints)
    # or yield if we revert to Depends
    return AsyncSessionLocal

async def get_db_session():
    # Only for Depends if needed
    AsyncSessionLocal = await get_db()
    async with AsyncSessionLocal() as session:
        yield session
    # try:
    #     async with AsyncSessionLocal() as session:
    #         yield session
    # except Exception as e:
    #     print(f"DB SESSION ERROR: {e}")
    #     raise e
