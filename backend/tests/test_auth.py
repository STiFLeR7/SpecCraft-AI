from fastapi import status

def test_read_projects_unauthorized(unauth_client):
    """
    Ensure specific endpoints are protected.
    """
    response = unauth_client.get("/api/v1/projects/")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_create_project_unauthorized(unauth_client):
    # Missing Auth
    response = unauth_client.post("/api/v1/projects/?repo_url=https://github.com/test/repo")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_read_projects_authorized(client):
    """
    Should return 200 OK (empty list or list of projects) when auth is mocked.
    """
    response = client.get("/api/v1/projects/")
    assert response.status_code == status.HTTP_200_OK
