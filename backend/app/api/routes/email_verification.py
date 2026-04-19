"""
Email Verification Routes
Handles sending verification emails for user registration
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from app.core.email import EmailService
from datetime import datetime

router = APIRouter()


class VerificationEmailRequest(BaseModel):
    """Request model for sending verification email"""
    email: EmailStr
    name: str
    verification_url: str


@router.post("/send-verification-email")
async def send_verification_email(request: VerificationEmailRequest):
    """
    Send email verification link to user
    
    Args:
        request: VerificationEmailRequest with email, name, and verification URL
        
    Returns:
        Success message
    """
    try:
        # Build HTML email content
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <!-- Header -->
                    <div style="background-color: #10B981; color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h1 style="margin: 0; font-size: 28px;">🍽️ Welcome to FoodFlow!</h1>
                        <p style="margin: 10px 0 0 0; font-size: 16px;">Verify your email to get started</p>
                    </div>
                    
                    <!-- Content -->
                    <div style="background-color: #f9fafb; padding: 30px 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
                        <p style="font-size: 16px;">Hi <strong>{request.name}</strong>,</p>
                        
                        <p style="font-size: 16px;">
                            Thank you for signing up for FoodFlow! We're excited to have you join our community 
                            of food donors, NGOs, and volunteers working together to reduce food waste and help those in need.
                        </p>
                        
                        <p style="font-size: 16px;">
                            To complete your registration and activate your account, please verify your email address 
                            by clicking the button below:
                        </p>
                        
                        <!-- Verification Button -->
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{request.verification_url}" 
                               style="display: inline-block; background-color: #10B981; color: white; 
                                      padding: 15px 40px; text-decoration: none; border-radius: 6px; 
                                      font-size: 16px; font-weight: bold;">
                                Verify Email Address
                            </a>
                        </div>
                        
                        <p style="font-size: 14px; color: #6b7280;">
                            Or copy and paste this link into your browser:
                        </p>
                        <p style="font-size: 14px; color: #3B82F6; word-break: break-all;">
                            {request.verification_url}
                        </p>
                        
                        <div style="margin-top: 30px; padding: 15px; background-color: #FEF3C7; 
                                    border-left: 4px solid #F59E0B; border-radius: 4px;">
                            <p style="margin: 0; font-size: 14px; color: #92400E;">
                                <strong>⚠️ Important:</strong> This verification link will expire in 24 hours. 
                                If you didn't create an account with FoodFlow, please ignore this email.
                            </p>
                        </div>
                        
                        <!-- Footer -->
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; 
                                    font-size: 12px; color: #6b7280; text-align: center;">
                            <p>Need help? Contact us at support@foodflow.app</p>
                            <p style="margin-top: 10px;">
                                © {datetime.now().year} FoodFlow. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </body>
        </html>
        """
        
        # Plain text version
        text_content = f"""
Welcome to FoodFlow!

Hi {request.name},

Thank you for signing up for FoodFlow! To complete your registration, please verify your email address.

Verification Link:
{request.verification_url}

This link will expire in 24 hours.

If you didn't create an account with FoodFlow, please ignore this email.

Need help? Contact us at support@foodflow.app

© {datetime.now().year} FoodFlow. All rights reserved.
        """
        
        # Send email
        success = EmailService.send_email(
            to_email=request.email,
            subject="Verify your FoodFlow account",
            html_content=html_content,
            text_content=text_content
        )
        
        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to send verification email"
            )
        
        return {
            "success": True,
            "message": f"Verification email sent to {request.email}"
        }
        
    except Exception as e:
        print(f"Error sending verification email: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send verification email: {str(e)}"
        )
