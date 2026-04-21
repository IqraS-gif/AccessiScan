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
    FastAPI dependency that verifies the JWT and returns the current user.

    Usage:
        @app.get("/api/protected")
        async def protected_route(user: CognitoUser = Depends(get_current_user)):
            return {"user_id": user.user_id}
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    try:
        claims = verify_token(token)
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Extract user info from token claims
    user_id = claims.get("sub", "")
    email = claims.get("email", "")
    username = claims.get("cognito:username", claims.get("username", email))

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing user identity",
        )

    return CognitoUser(user_id=user_id, email=email, username=username)


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> CognitoUser | None:
    """
    Optional auth dependency — returns None instead of raising 401
    if no token is provided (useful for endpoints that work both ways).
    """
    if not credentials:
        return None

    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None
