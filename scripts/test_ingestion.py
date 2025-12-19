import httpx
import asyncio
import sys

BASE_URL = "http://127.0.0.1:8000/api/v1"

async def test_flow(repo_url: str):
    timeout = httpx.Timeout(30.0, connect=10.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        # 1. Check API Status
        print("Checking API with GET /projects/...")
        try:
            response = await client.get(f"{BASE_URL}/projects/")
            print(f"GET /projects/ status: {response.status_code}")
            if response.status_code == 200:
                print(f"Projects: {response.json()}")
            else:
                print(f"GET failed: {response.text}")
        except Exception as e:
            print(f"GET Connection error: {e}")
            return

        # 2. Create Project
        print(f"Creating project for {repo_url}...")
        try:
            response = await client.post(f"{BASE_URL}/projects/", params={"repo_url": repo_url})
            response.raise_for_status()
            print(f"Project created: {response.json()}")
        except Exception as e:
            print(f"Failed to create project: {e}")
            return

        print("Waiting for ingestion (10s)...")
        await asyncio.sleep(10)
        
        # 3. List Again
        response = await client.get(f"{BASE_URL}/projects/")
        projects = response.json()
        print(f"Total projects: {len(projects)}")
        found = any(p['repo_url'] == repo_url for p in projects)
        if found:
            print("Project found in list!")
        else:
            print("Project NOT found.")

if __name__ == "__main__":
    asyncio.run(test_flow("https://github.com/STiFLeR7/imgshape"))
