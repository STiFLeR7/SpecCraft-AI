import httpx
import asyncio

BASE_URL = "http://127.0.0.1:8000/api/v1"

async def test_rag():
    timeout = httpx.Timeout(60.0, connect=10.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        # 1. Get Project ID for imgshape
        print("Finding imgshape project...")
        resp = await client.get(f"{BASE_URL}/projects/")
        projects = resp.json()
        target_project = next((p for p in projects if "imgshape" in p['repo_url']), None)
        
        if not target_project:
            print("❌ imgshape project not found! Did ingestion fail?")
            return

        project_id = target_project['id']
        print(f"✅ Found Project ID: {project_id}")

        # 2. Ask Question
        question = "How does this code handle image resizing or shapes? Explain the main classes."
        print(f"❓ Asking: {question}")
        
        try:
            chat_resp = await client.post(f"{BASE_URL}/chat/", json={
                "project_id": project_id,
                "message": question
            })
            if chat_resp.status_code == 200:
                data = chat_resp.json()
                print("\n🤖 Answer:")
                print(data['answer'])
                print("\n📄 Citations:")
                for cit in data.get('citations', []):
                    print(f"- {cit.get('name', 'unknown')} (Lines {cit.get('start_line')}-{cit.get('end_line')})")
            else:
                print(f"❌ Chat Request Failed: {chat_resp.text}")
        except Exception as e:
            print(f"❌ Request Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_rag())
