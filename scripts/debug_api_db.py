from fastapi import FastAPI
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os
import uvicorn
from dotenv import load_dotenv

load_dotenv()

# Force asyncpg
DATABASE_URL = os.getenv("DATABASE_URL").replace("postgresql://", "postgresql+asyncpg://")

app = FastAPI()

@app.get("/test-db")
async def test_db():
    print("DEBUG: Connecting to DB...")
    try:
        engine = create_async_engine(DATABASE_URL, echo=True, connect_args={"timeout": 10})
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            val = result.scalar()
        await engine.dispose()
        print(f"DEBUG: DB Success: {val}")
        return {"status": "ok", "val": val}
    except Exception as e:
        print(f"DEBUG: DB Fail: {e}")
        return {"status": "error", "detail": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8002)
