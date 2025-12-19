import pytest
from fastapi.testclient import TestClient
from dotenv import load_dotenv
import os

# Load Env Vars
load_dotenv()

# Ensure minimal vars for Supabase Client init (even if mocked later)
if not os.getenv("SUPABASE_URL"):
    os.environ["SUPABASE_URL"] = "https://example.supabase.co"
if not os.getenv("SUPABASE_KEY"):
    os.environ["SUPABASE_KEY"] = "mock-key"

from backend.main import app
from backend.api import deps
from unittest.mock import MagicMock, AsyncMock, patch
import uuid

# Mock User Data
MOCK_USER_ID = uuid.uuid4()
MOCK_USER_EMAIL = "test@speccraft.ai"

class MockUser:
    def __init__(self, id=MOCK_USER_ID, email=MOCK_USER_EMAIL):
        self.id = id
        self.email = email

@pytest.fixture
def mock_user():
    return MockUser()

@pytest.fixture
def mock_db_session():
    """
    Mock database session to prevent real DB connections.
    """
    mock_session = AsyncMock()
    
    # Mock execute to return empty results by default
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []
    mock_result.scalars.return_value.first.return_value = None
    mock_session.execute.return_value = mock_result
    mock_session.get.return_value = None
    
    # Mock context manager
    mock_session_factory = MagicMock()
    mock_session_factory.return_value.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session_factory.return_value.__aexit__ = AsyncMock(return_value=None)
    
    return mock_session_factory

@pytest.fixture
def client(mock_user, mock_db_session):
    """
    Test client with overridden authentication and mocked DB.
    """
    # Override auth dependency
    async def override_get_current_user():
        return mock_user
    
    # Override DB dependency
    async def override_get_db():
        return mock_db_session

    app.dependency_overrides[deps.get_current_user] = override_get_current_user
    
    # Patch get_db at module level
    with patch('backend.api.v1.endpoints.projects.get_db', return_value=mock_db_session):
        with TestClient(app) as c:
            yield c
    
    # Clean up
    app.dependency_overrides = {}

@pytest.fixture
def unauth_client():
    """
    Client without auth override (should fail protected endpoints)
    """
    app.dependency_overrides = {}
    with TestClient(app) as c:
        yield c
