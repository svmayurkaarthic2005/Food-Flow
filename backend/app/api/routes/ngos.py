from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
import logging

from app.db.database import prisma
from app.services.email_queue import email_queue
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

class NGOUpdate(BaseModel):
    organizationName: Optional[str] = None
    registrationNumber: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    serviceAreas: Optional[str] = None

@router.get("/{ngo_id}")
async def get_ngo(ngo_id: str):
    """Get NGO by ID"""
    ngo = await prisma.ngo.find_unique(
        where={"id": ngo_id},
        include={
            "user": True,
            "claims": {
                "take": 10,
                "order": {"claimedAt": "desc"},
                "include": {
                    "listing": True
                }
            }
        }
    )
    
    if not ngo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NGO not found"
        )
    
    return ngo

@router.patch("/{ngo_id}")
async def update_ngo(ngo_id: str, data: NGOUpdate):
    """Update NGO profile"""
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    
    ngo = await prisma.ngo.update(
        where={"id": ngo_id},
        data=update_data
    )
    
    return ngo

import logging
from app.services.email_queue import email_queue

logger = logging.getLogger(__name__)


@router.post("/{ngo_id}/approve")
async def approve_ngo(ngo_id: str, reason: Optional[str] = None):
    """
    Approve NGO registration (admin only).
    Sends approval email to NGO.
    """
    ngo = await prisma.ngo.find_unique(
        where={"id": ngo_id},
        include={"user": True}
    )
    
    if not ngo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NGO not found"
        )
    
    try:
        # Update NGO status (if you have a status field)
        # For now, we'll just send the email
        
        # Queue approval email
        dashboard_link = f"{settings.FRONTEND_URL}/ngo/dashboard"
        
        await email_queue.enqueue_email({
            "to": ngo.user.email,
            "subject": "Your NGO Registration is Approved - FoodFlow",
            "html": _render_template("ngo_approved.html", {
                "name": ngo.user.name,
                "link": dashboard_link
            })
        })
        
        logger.info(f"✅ Approval email queued for NGO {ngo_id}")
        return {"message": "NGO approved and email sent"}
    
    except Exception as e:
        logger.error(f"Error approving NGO: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to approve NGO"
        )


@router.post("/{ngo_id}/reject")
async def reject_ngo(ngo_id: str, reason: str):
    """
    Reject NGO registration (admin only).
    Sends rejection email to NGO.
    """
    ngo = await prisma.ngo.find_unique(
        where={"id": ngo_id},
        include={"user": True}
    )
    
    if not ngo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NGO not found"
        )
    
    try:
        # Queue rejection email
        await email_queue.enqueue_email({
            "to": ngo.user.email,
            "subject": "NGO Registration Status - FoodFlow",
            "html": _render_template("ngo_rejected.html", {
                "name": ngo.user.name,
                "reason": reason
            })
        })
        
        logger.info(f"✅ Rejection email queued for NGO {ngo_id}")
        return {"message": "NGO rejected and email sent"}
    
    except Exception as e:
        logger.error(f"Error rejecting NGO: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reject NGO"
        )


def _render_template(template_name: str, context: dict) -> str:
    """Render email template with context variables"""
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
        
        for key, value in context.items():
            html = html.replace(f"{{{{{key}}}}}", str(value))
        
        return html
    
    except Exception as e:
        logger.error(f"Error rendering template {template_name}: {e}")
        return "<p>Error rendering email template</p>"
