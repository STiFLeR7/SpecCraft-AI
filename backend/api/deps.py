from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from supabase import create_client, Client
import os
import os

# Re-use the session dependency logic if needed, or keeping it strictly for auth here
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Initialize Supabase Client (Service Role for Admin tasks if needed, or Anon for public, 
# but for verification we just need the URL/Key to init the client structure)
url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_KEY", "")
supabase: Client = create_client(url, key)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Validates the bearer token using Supabase Auth.
    Returns the user object (dict) containing 'id', 'email', etc.
    """
    try:
        # Verify token by getting the user. 
        # supabase-py's auth.get_user(token) validates the JWT signature and expiration.
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user_response.user
    except Exception as e:
        print(f"Auth Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
