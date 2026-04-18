from fastapi import APIRouter, HTTPException, status, Depends, Request
from pydantic import BaseModel, EmailStr
from datetime import timedelta
from typing import Optional
import logging

from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user
)
from app.core.config import settings
from app.core.oauth import google_oauth_service
from app.db.database import prisma
from app.services.email_queue import email_queue
from app.services.token_service import (
    create_email_token,
    verify_email_token,
    verify_reset_token,
    TOKEN_TYPE_RESET,
    RESET_TOKEN_EXPIRY
)

logger = logging.getLogger(__name__)
router = APIRouter()

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str  # DONOR, NGO, ADMIN

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class RequestResetRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    password: str

class ChangePasswordRequest(BaseModel):
    currentPassword: str
    newPassword: str

@router.post("/signup", response_model=TokenResponse)
async def signup(data: SignupRequest):
    """Register a new user"""
    # Check if user already exists
    existing_user = await prisma.user.find_unique(where={"email": data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password
    hashed_password = get_password_hash(data.password)
    
    # Create user
    user = await prisma.user.create(
        data={
            "email": data.email,
            "passwordHash": hashed_password,
            "name": data.name,
            "role": data.role,
            "emailVerified": False
        }
    )
    
    # Create role-specific profile
    if data.role == "DONOR":
        await prisma.donor.create(
            data={
                "userId": user.id,
                "businessName": data.name,
                "businessType": "Restaurant"
            }
        )
    elif data.role == "NGO":
        await prisma.ngo.create(
            data={
                "userId": user.id,
                "organizationName": data.name,
                "registrationNumber": f"REG-{user.id[:8]}"
            }
        )
    
    # Generate verification token
    verify_token = create_email_token(user.id)
    verify_link = f"{settings.FRONTEND_URL}/verify?token={verify_token}"
    
    # Queue verification email (non-blocking)
    await email_queue.enqueue_email({
        "to": user.email,
        "subject": "Verify Your Email - FoodFlow",
        "html": _render_template("verify_email.html", {
            "name": user.name,
            "link": verify_link,
            "expiry": 24
        })
    })
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role
        }
    }

@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest):
    """Login user"""
    # Find user
    user = await prisma.user.find_unique(where={"email": data.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Verify password
    if not verify_password(data.password, user.passwordHash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role
        }
    }

@router.post("/logout")
async def logout():
    """Logout user and clear session"""
    return {"message": "Successfully logged out"}

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user info"""
    user = await prisma.user.find_unique(
        where={"id": current_user["id"]},
        include={
            "donor": True,
            "ngo": True
        }
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "emailVerified": user.emailVerified,
        "donor": user.donor,
        "ngo": user.ngo
    }

# Google OAuth endpoints
@router.get("/google")
async def google_oauth_login():
    """Initiate Google OAuth login"""
    auth_url = google_oauth_service.get_authorization_url()
    return {"auth_url": auth_url}

@router.get("/callback/google")
async def google_oauth_callback(request: Request):
    """Handle Google OAuth callback"""
    code = request.query_params.get("code")
    error = request.query_params.get("error")
    
    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth error: {error}"
        )
    
    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authorization code not provided"
        )
    
    try:
        # Exchange code for token
        token_data = await google_oauth_service.exchange_code_for_token(code)
        access_token = token_data.get("access_token")
        
        # Get user info from Google
        user_info = await google_oauth_service.get_user_info(access_token)
        
        # Check if user exists in database
        user = await prisma.user.find_unique(where={"email": user_info["email"]})
        
        if not user:
            # Create new user from Google data
            user = await prisma.user.create(
                data={
                    "email": user_info["email"],
                    "name": user_info.get("name", ""),
                    "role": "DONOR",  # Default role
                    "emailVerified": True,
                    "passwordHash": get_password_hash("google-oauth-user")  # Placeholder password
                }
            )
            
            # Create default donor profile
            await prisma.donor.create(
                data={
                    "userId": user.id,
                    "businessName": user_info.get("name", ""),
                    "businessType": "Individual"
                }
            )
        
        # Create JWT token
        jwt_token = create_access_token(
            data={"sub": user.id, "email": user.email, "role": user.role}
        )
        
        # Redirect to frontend with token
        redirect_url = f"http://localhost:3000/auth/success?token={jwt_token}"
        return {"redirect_url": redirect_url}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OAuth authentication failed: {str(e)}"
        )


# ============================================================================
# EMAIL VERIFICATION & PASSWORD RESET
# ============================================================================

@router.post("/verify-email")
async def verify_email(token: str):
    """
    Verify email with token.
    
    Args:
        token: Email verification token
        
    Returns:
        Success message
    """
    user_id = verify_email_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    
    try:
        # Mark user as verified
        await prisma.user.update(
            where={"id": user_id},
            data={"emailVerified": True}
        )
        
        logger.info(f"✅ Email verified for user {user_id}")
        return {"message": "Email verified successfully"}
    
    except Exception as e:
        logger.error(f"Error verifying email: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify email"
        )


@router.post("/request-reset")
async def request_password_reset(data: RequestResetRequest):
    """
    Request password reset email.
    
    Args:
        data: Email address
        
    Returns:
        Success message (always returns success for security)
    """
    try:
        user = await prisma.user.find_unique(where={"email": data.email})
        
        if user:
            # Generate reset token
            reset_token = create_email_token(
                user.id,
                token_type=TOKEN_TYPE_RESET,
                expiry_hours=RESET_TOKEN_EXPIRY
            )
            reset_link = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
            
            # Queue reset email (non-blocking)
            await email_queue.enqueue_email({
                "to": user.email,
                "subject": "Reset Your Password - FoodFlow",
                "html": _render_template("reset_password.html", {
                    "name": user.name,
                    "link": reset_link,
                    "expiry": RESET_TOKEN_EXPIRY
                })
            })
            
            logger.info(f"Password reset email queued for {user.email}")
        else:
            logger.info(f"Password reset requested for non-existent email: {data.email}")
        
        # Always return success for security
        return {"message": "If email exists, reset link has been sent"}
    
    except Exception as e:
        logger.error(f"Error requesting password reset: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process reset request"
        )


@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest):
    """
    Reset password with token.
    
    Args:
        data: Reset token and new password
        
    Returns:
        Success message
    """
    user_id = verify_reset_token(data.token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    try:
        # Hash new password
        hashed_password = get_password_hash(data.password)
        
        # Update password
        await prisma.user.update(
            where={"id": user_id},
            data={"passwordHash": hashed_password}
        )
        
        logger.info(f"✅ Password reset for user {user_id}")
        return {"message": "Password reset successfully"}
    
    except Exception as e:
        logger.error(f"Error resetting password: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset password"
        )


@router.post("/change-password")
async def change_password(data: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    """
    Change password for authenticated user.
    
    Args:
        data: Current and new password
        current_user: Current authenticated user
        
    Returns:
        Success message
    """
    try:
        # Get user from database
        user = await prisma.user.find_unique(where={"id": current_user["id"]})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Verify current password
        if not verify_password(data.currentPassword, user.passwordHash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Current password is incorrect"
            )
        
        # Hash new password
        hashed_password = get_password_hash(data.newPassword)
        
        # Update password
        await prisma.user.update(
            where={"id": current_user["id"]},
            data={"passwordHash": hashed_password}
        )
        
        logger.info(f"✅ Password changed for user {current_user['id']}")
        return {"message": "Password changed successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error changing password: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change password"
        )


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def _render_template(template_name: str, context: dict) -> str:
    """
    Render email template with context variables.
    
    Args:
        template_name: Template filename
        context: Variables to replace in template
        
    Returns:
        Rendered HTML
    """
    import os
    
    template_path = os.path.join(
        os.path.dirname(__file__),
        "..",
        "..",
        "templates",
        "emails",
        template_name
    )
    
    try:
        with open(template_path, "r") as f:
            html = f.read()
        
        # Replace placeholders
        for key, value in context.items():
            html = html.replace(f"{{{{{key}}}}}", str(value))
        
        return html
    
    except Exception as e:
        logger.error(f"Error rendering template {template_name}: {e}")
        return f"<p>Error rendering email template</p>"
