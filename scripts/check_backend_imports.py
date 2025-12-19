import sys
import os

# Ensure backend can be imported
sys.path.append(os.getcwd())

print("Attempting to import backend.worker.tasks...")
try:
    from backend.worker import tasks
    print("Success: backend.worker.tasks imported")
except Exception as e:
    print(f"FAILED: backend.worker.tasks: {e}")
    import traceback
    traceback.print_exc()

print("\nAttempting to import backend.api.v1.endpoints.projects...")
try:
    from backend.api.v1.endpoints import projects
    print("Success: projects endpoint imported")
except Exception as e:
    print(f"FAILED: projects endpoint: {e}")
    import traceback
    traceback.print_exc()
