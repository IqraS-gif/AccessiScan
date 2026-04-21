"""
AWS Cognito JWT Token Verification Module.

Downloads the Cognito User Pool's JWKS (JSON Web Key Set) public keys
and uses them to verify JWT access/id tokens issued by Cognito.
"""

import os
import json
import time
import urllib.request
from jose import jwt, JWTError
from dotenv import load_dotenv

load_dotenv()

COGNITO_REGION = os.getenv("AWS_DEFAULT_REGION", "us-east-1")
COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID", "")
COGNITO_APP_CLIENT_ID = os.getenv("COGNITO_APP_CLIENT_ID", "")

# Cognito JWKS URL
JWKS_URL = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}/.well-known/jwks.json"
ISSUER = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}"

# Cache for JWKS keys
_jwks_cache = None
_jwks_cache_time = 0
JWKS_CACHE_DURATION = 3600  # Re-fetch keys every hour


def _get_jwks():
    """Fetch and cache the JWKS public keys from Cognito."""
    global _jwks_cache, _jwks_cache_time

    now = time.time()
    if _jwks_cache and (now - _jwks_cache_time) < JWKS_CACHE_DURATION:
        return _jwks_cache

    try:
        print(f"🔑 Fetching Cognito JWKS from: {JWKS_URL}")
        response = urllib.request.urlopen(JWKS_URL)
        _jwks_cache = json.loads(response.read().decode("utf-8"))
        _jwks_cache_time = now
        print("✅ JWKS keys cached successfully")
        return _jwks_cache
    except Exception as e:
        print(f"❌ Failed to fetch JWKS: {e}")
        if _jwks_cache:
            return _jwks_cache
        raise


def verify_token(token: str) -> dict:
    """
    Verify a Cognito JWT token and return its claims.

    Args:
        token: The JWT token string (access or id token)

    Returns:
        dict with claims including 'sub' (user ID), 'email', etc.

    Raises:
        JWTError: If the token is invalid, expired, or tampered with.
    """
    jwks = _get_jwks()

    # Get the key ID from the token header
    try:
        unverified_header = jwt.get_unverified_header(token)
    except JWTError:
        raise JWTError("Unable to parse token header")

    kid = unverified_header.get("kid")
    if not kid:
        raise JWTError("Token header missing 'kid'")

    # Find the matching public key
    rsa_key = None
    for key in jwks.get("keys", []):
        if key["kid"] == kid:
            rsa_key = key
            break

    if not rsa_key:
        # Try refreshing the keys in case they were rotated
        global _jwks_cache_time
        _jwks_cache_time = 0
        jwks = _get_jwks()
        for key in jwks.get("keys", []):
            if key["kid"] == kid:
                rsa_key = key
                break

    if not rsa_key:
        raise JWTError("Unable to find matching key for token")

    # Verify the token
    try:
        claims = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            audience=COGNITO_APP_CLIENT_ID,
            issuer=ISSUER,
        )
        return claims
    except jwt.ExpiredSignatureError:
        raise JWTError("Token has expired")
    except jwt.JWTClaimsError as e:
        raise JWTError(f"Invalid token claims: {e}")
    except Exception as e:
        raise JWTError(f"Token verification failed: {e}")
