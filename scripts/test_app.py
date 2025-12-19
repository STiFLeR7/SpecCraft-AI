import sys
import os
sys.path.append(os.getcwd())

from fastapi import FastAPI
from backend.api.v1.endpoints.projects import router as projects_router
import uvicorn

app = FastAPI()

@app.get("/ping")
def ping():
    return {"status": "ok"}

app.include_router(projects_router, prefix="/projects")

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)
