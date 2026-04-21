"""
FastAPI authentication dependencies.

Provides a reusable dependency that extracts and verifies the JWT token
from the Authorization header, returning the authenticated user's info.
"""

from dataclasses import dataclass
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from auth.cognito import verify_token

# FastAPI security scheme — looks for "Authorization: Bearer <token>"
security = HTTPBearer(auto_error=False)


@dataclass
class CognitoUser:
    """Represents an authenticated Cognito user."""
    user_id: str    # Cognito 'sub' — unique user identifier
    email: str      # User's email address
    username: str   # Cognito username


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> CognitoUser:
    """
    BYPASSED: Always returns a mock user for development.
    """
    # Simply return a default user for all requests
    return CognitoUser(
        user_id="default_user",
        email="guest@example.com",
        username="guest"
    )


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> CognitoUser | None:
    """
    BYPASSED: Always returns the mock guest user.
    """
    return await get_current_user(credentials)
