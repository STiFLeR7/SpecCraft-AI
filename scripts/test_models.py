import sys
import os

sys.path.append(os.getcwd())

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.db.base import Base

# Import all models to trigger mapper initialization
print("Importing User, Project...")
from backend.models.models import User, Project
print("Importing Document...")
from backend.models.document import Document
print("Importing Analytics...")
from backend.models.analytics import Embedding, Query

print("Configuring engine...")
# Use sqlite for memory test to avoid DB connection issues masking mapper issues
engine = create_engine("sqlite:///:memory:")

print("Creating tables...")
try:
    Base.metadata.create_all(bind=engine)
    print("Success: Tables created!")
except Exception as e:
    print(f"FAILED to create tables: {e}")
    import traceback
    traceback.print_exc()
