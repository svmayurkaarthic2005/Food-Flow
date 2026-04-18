from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional

from app.db.database import prisma
from app.core.security import get_current_user

router = APIRouter()

class DonorUpdate(BaseModel):
    businessName: Optional[str] = None
    businessType: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None

class DonorPreferences(BaseModel):
    emailUpdates: bool = True
    claimAlerts: bool = True
    pickupReminders: bool = True

class LocationSharingUpdate(BaseModel):
    locationSharing: bool


# ============================================================================
# CURRENT USER ENDPOINTS (must come before /{donor_id})
# ============================================================================

@router.patch("/profile")
async def update_profile(data: DonorUpdate, current_user: dict = Depends(get_current_user)):
    """
    Update current donor's profile.
    
    Args:
        data: Profile update data
        current_user: Current authenticated user
        
    Returns:
        Updated donor profile
    """
    try:
        # Get donor by user ID
        donor = await prisma.donor.find_unique(where={"userId": current_user["id"]})
        if not donor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Donor profile not found"
            )
        
        # Update donor profile
        update_data = {k: v for k, v in data.dict().items() if v is not None}
        updated_donor = await prisma.donor.update(
            where={"id": donor.id},
            data=update_data
        )
        
        return updated_donor
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile"
        )


@router.get("/preferences")
async def get_preferences(current_user: dict = Depends(get_current_user)):
    """
    Get notification preferences for current donor.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Notification preferences
    """
    try:
        # Get donor by user ID
        donor = await prisma.donor.find_unique(where={"userId": current_user["id"]})
        if not donor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Donor profile not found"
            )
        
        # Return preferences (stored as JSON in database)
        preferences = donor.preferences if hasattr(donor, 'preferences') else {
            "emailUpdates": True,
            "claimAlerts": True,
            "pickupReminders": True
        }
        
        return preferences
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch preferences"
        )


@router.patch("/preferences")
async def update_preferences(data: DonorPreferences, current_user: dict = Depends(get_current_user)):
    """
    Update notification preferences for current donor.
    
    Args:
        data: Notification preferences
        current_user: Current authenticated user
        
    Returns:
        Updated preferences
    """
    try:
        # Get donor by user ID
        donor = await prisma.donor.find_unique(where={"userId": current_user["id"]})
        if not donor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Donor profile not found"
            )
        
        # Update preferences
        updated_donor = await prisma.donor.update(
            where={"id": donor.id},
            data={"preferences": data.dict()}
        )
        
        return updated_donor.preferences if hasattr(updated_donor, 'preferences') else data.dict()
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update preferences"
        )


@router.patch("/location-sharing")
async def update_location_sharing(data: LocationSharingUpdate, current_user: dict = Depends(get_current_user)):
    """
    Update location sharing preference for current donor.
    
    Args:
        data: Location sharing toggle
        current_user: Current authenticated user
        
    Returns:
        Updated location sharing status
    """
    try:
        # Get donor by user ID
        donor = await prisma.donor.find_unique(where={"userId": current_user["id"]})
        if not donor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Donor profile not found"
            )
        
        # Update location sharing
        updated_donor = await prisma.donor.update(
            where={"id": donor.id},
            data={"locationSharing": data.locationSharing}
        )
        
        return {"locationSharing": updated_donor.locationSharing}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update location sharing"
        )


# ============================================================================
# GENERIC ENDPOINTS (by ID)
# ============================================================================

@router.get("/{donor_id}")
async def get_donor(donor_id: str):
    """Get donor by ID"""
    donor = await prisma.donor.find_unique(
        where={"id": donor_id},
        include={
            "user": True,
            "listings": {
                "take": 10,
                "order": {"createdAt": "desc"}
            }
        }
    )
    
    if not donor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donor not found"
        )
    
    return donor

@router.patch("/{donor_id}")
async def update_donor(donor_id: str, data: DonorUpdate):
    """Update donor profile by ID"""
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    
    donor = await prisma.donor.update(
        where={"id": donor_id},
        data=update_data
    )
    
    return donor
