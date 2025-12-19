import asyncio
import sys
import os

sys.path.append(os.getcwd())

from backend.db.session import get_db

async def test_dep():
    print("Testing get_db...")
    gen = get_db()
    try:
        print("Iterating generator...")
        async for session in gen:
            print(f"Got session: {session}")
            # Do simple query
            from sqlalchemy import text
            res = await session.execute(text("SELECT 1"))
            print(f"Query Result: {res.scalar()}")
            break
    except Exception as e:
        print(f"FAILED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_dep())
