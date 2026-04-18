"""
Email Token Service
JWT-based tokens for email verification and password reset
"""

import logging
from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt

from app.core.config import settings

logger = logging.getLogger(__name__)

# Token types
TOKEN_TYPE_VERIFY = "verify_email"
TOKEN_TYPE_RESET = "reset_password"

# Token expiry (hours)
VERIFY_TOKEN_EXPIRY = 24
RESET_TOKEN_EXPIRY = 1


def create_email_token(
    user_id: str,
    token_type: str = TOKEN_TYPE_VERIFY,
    expiry_hours: int = VERIFY_TOKEN_EXPIRY
) -> str:
    """
    Create JWT token for email verification or password reset.
    
    Args:
        user_id: User ID
        token_type: Type of token (verify_email or reset_password)
        expiry_hours: Token expiry in hours
        
    Returns:
        JWT token string
    """
    try:
        payload = {
            "user_id": user_id,
            "type": token_type,
            "exp": datetime.utcnow() + timedelta(hours=expiry_hours),
            "iat": datetime.utcnow()
        }
        
        token = jwt.encode(
            payload,
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM
        )
        
        logger.info(f"✅ Token created for user {user_id} (type: {token_type})")
        return token
    
    except Exception as e:
        logger.error(f"❌ Failed to create token: {e}")
        raise


def verify_email_token(token: str) -> Optional[str]:
    """
    Verify email token and return user_id.
    
    Args:
        token: JWT token string
        
    Returns:
        User ID if valid, None otherwise
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        
        user_id = payload.get("user_id")
        token_type = payload.get("type")
        
        if not user_id or token_type != TOKEN_TYPE_VERIFY:
            logger.warning("Invalid token type or missing user_id")
            return None
        
        logger.info(f"✅ Token verified for user {user_id}")
        return user_id
    
    except JWTError as e:
        logger.warning(f"Invalid token: {e}")
        return None
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        return None


def verify_reset_token(token: str) -> Optional[str]:
    """
    Verify password reset token and return user_id.
    
    Args:
        token: JWT token string
        
    Returns:
        User ID if valid, None otherwise
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        
        user_id = payload.get("user_id")
        token_type = payload.get("type")
        
        if not user_id or token_type != TOKEN_TYPE_RESET:
            logger.warning("Invalid token type or missing user_id")
            return None
        
        logger.info(f"✅ Reset token verified for user {user_id}")
        return user_id
    
    except JWTError as e:
        logger.warning(f"Invalid reset token: {e}")
        return None
    except Exception as e:
        logger.error(f"Reset token verification error: {e}")
        return None
