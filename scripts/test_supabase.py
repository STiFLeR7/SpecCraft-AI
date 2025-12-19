import asyncio
import sys
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

sys.path.append(os.getcwd())
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def test_supabase():
    # Force asyncpg driver if missing
    url = DATABASE_URL
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://")
    
    print(f"Connecting to: {url.split('@')[1] if '@' in url else 'INVALID URL'}")
    try:
        engine = create_async_engine(url, echo=False)
        async with engine.connect() as conn:
            # Check version
            res = await conn.execute(text("SELECT version();"))
            print(f"Postgres Version: {res.scalar()}")
            
            # Check pgvector
            res = await conn.execute(text("SELECT * FROM pg_extension WHERE extname = 'vector';"))
            ext = res.fetchone()
            if ext:
                print("✅ pgvector extension is ENABLED.")
            else:
                print("⚠️ pgvector extension NOT FOUND. Attempting to enable...")
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                print("✅ pgvector extension ENABLED.")
                
    except Exception as e:
        print(f"❌ Connection Failed: {e}")

if __name__ == "__main__":
    if not DATABASE_URL:
        print("❌ DATABASE_URL not set in .env")
    else:
        asyncio.run(test_supabase())
