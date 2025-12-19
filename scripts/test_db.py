import asyncio
import sys
import os

sys.path.append(os.getcwd())

from backend.db.session import AsyncSessionLocal
from sqlalchemy import text

async def test_connection():
    print("Testing DB connection...")
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("SELECT 1"))
            print(f"Success: {result.scalar()}")
    except Exception as e:
        print(f"FAILED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_connection())
