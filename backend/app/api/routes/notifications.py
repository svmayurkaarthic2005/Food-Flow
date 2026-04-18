"""
Notifications API
Endpoints for sending status updates and notifications
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from prisma import Prisma

from app.core.email import EmailService
from app.db.database import get_db


router = APIRouter(prefix="/api/notifications", tags=["notifications"])


# ============================================================================
# SCHEMAS
# ============================================================================

class StatusUpdateRequest(BaseModel):
    """Request to send status update email"""
    to_email: EmailStr
    status: str  # success, warning, error, info
    title: str
    message: str
    details: Optional[Dict[str, Any]] = None


class MLTrainingNotificationRequest(BaseModel):
    """Request to send ML training notification"""
    to_email: EmailStr
    model_name: str
    status: str  # started, completed, failed
    metrics: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None


class DataCollectionReportRequest(BaseModel):
    """Request to send data collection report"""
    to_email: EmailStr
    report_data: Dict[str, Dict[str, Any]]


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/send-status-update")
async def send_status_update(request: StatusUpdateRequest):
    """
    Send a status update email.
    
    Args:
        request: StatusUpdateRequest with email details
        
    Returns:
        Success message
    """
    try:
        success = EmailService.send_status_update(
            to_email=request.to_email,
            status=request.status,
            title=request.title,
            message=request.message,
            details=request.details
        )
        
        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to send email"
            )
        
        return {
            "success": True,
            "message": f"Status update sent to {request.to_email}"
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error sending email: {str(e)}"
        )


@router.post("/send-ml-training-notification")
async def send_ml_training_notification(request: MLTrainingNotificationRequest):
    """
    Send ML model training notification.
    
    Args:
        request: MLTrainingNotificationRequest with training details
        
    Returns:
        Success message
    """
    try:
        success = EmailService.send_ml_training_notification(
            to_email=request.to_email,
            model_name=request.model_name,
            status=request.status,
            metrics=request.metrics,
            error_message=request.error_message
        )
        
        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to send email"
            )
        
        return {
            "success": True,
            "message": f"ML training notification sent to {request.to_email}"
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error sending email: {str(e)}"
        )


@router.post("/send-data-collection-report")
async def send_data_collection_report(request: DataCollectionReportRequest):
    """
    Send data collection status report.
    
    Args:
        request: DataCollectionReportRequest with report data
        
    Returns:
        Success message
    """
    try:
        success = EmailService.send_data_collection_report(
            to_email=request.to_email,
            report_data=request.report_data
        )
        
        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to send email"
            )
        
        return {
            "success": True,
            "message": f"Data collection report sent to {request.to_email}"
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error sending email: {str(e)}"
        )


@router.post("/send-bulk-status-update")
async def send_bulk_status_update(
    emails: list[str],
    status: str,
    title: str,
    message: str,
    details: Optional[Dict[str, Any]] = None
):
    """
    Send status update to multiple recipients.
    
    Args:
        emails: List of recipient emails
        status: Status type
        title: Email title
        message: Email message
        details: Additional details
        
    Returns:
        Summary of sent emails
    """
    try:
        results = {
            "total": len(emails),
            "sent": 0,
            "failed": 0,
            "failed_emails": []
        }
        
        for email in emails:
            success = EmailService.send_status_update(
                to_email=email,
                status=status,
                title=title,
                message=message,
                details=details
            )
            
            if success:
                results["sent"] += 1
            else:
                results["failed"] += 1
                results["failed_emails"].append(email)
        
        return results
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error sending bulk emails: {str(e)}"
        )


# ============================================================================
# HEALTH CHECK
# ============================================================================

@router.get("/health")
async def health_check():
    """Check if email service is working"""
    return {
        "status": "ok",
        "service": "email-notifications",
        "smtp_host": "smtp-relay.brevo.com",
        "smtp_port": 587
    }
