from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Validates Supabase JWT.
    For MVP, we just decode specific claims or check existence.
    """
    token = credentials.credentials
    # TODO: Implement actual Supabase JWT validation using PyJWT and SUPABASE_JWT_SECRET
    # For now, pass through if token exists
    if not token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    return {"id": "user_id_placeholder", "token": token}
