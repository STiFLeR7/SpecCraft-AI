import asyncio
import sys
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

sys.path.append(os.getcwd())
load_dotenv()

# Force asyncpg
DATABASE_URL = os.getenv("DATABASE_URL").replace("postgresql://", "postgresql+asyncpg://")

async def verify_data():
    engine = create_async_engine(DATABASE_URL, echo=False)
    async with engine.connect() as conn:
        print("Checking tables...")
        
        # Check Projects
        res = await conn.execute(text("SELECT count(*) FROM projects;"))
        print(f"Projects: {res.scalar()}")

        # Check Documents
        res = await conn.execute(text("SELECT count(*) FROM documents;"))
        doc_count = res.scalar()
        print(f"Documents: {doc_count}")

        # Check Embeddings
        res = await conn.execute(text("SELECT count(*) FROM embeddings;"))
        emb_count = res.scalar()
        print(f"Embeddings: {emb_count}")

        if doc_count > 0 and emb_count > 0:
            print("✅ Data successfully ingested into Supabase!")
        else:
            print("⚠️ Data missing. Creating test data if empty...")
            
if __name__ == "__main__":
    asyncio.run(verify_data())
