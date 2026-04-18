from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.core.security import get_current_user
from app.db.database import prisma

router = APIRouter()

class ClaimCreate(BaseModel):
    listingId: str
    ngoId: str
    requestedQuantity: Optional[str] = None

@router.get("")
async def get_claims(
    listing_id: Optional[str] = None,
    ngo_id: Optional[str] = None
):
    """Get all claims with optional filters"""
    where = {}
    
    if listing_id:
        where["listingId"] = listing_id
    if ngo_id:
        where["ngoId"] = ngo_id
    
    claims = await prisma.claim.find_many(
        where=where,
        include={
            "listing": {
                "include": {
                    "donor": {
                        "include": {
                            "user": True
                        }
                    }
                }
            },
            "ngo": {
                "include": {
                    "user": True
                }
            }
        },
        order={"claimedAt": "desc"}
    )
    
    return {"data": claims, "count": len(claims)}

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_claim(
    data: ClaimCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new claim"""
    # Verify user is an NGO
    if current_user["role"] != "NGO":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only NGOs can create claims"
        )
    
    # Check if listing exists and is available
    listing = await prisma.listing.find_unique(where={"id": data.listingId})
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    if listing.status != "AVAILABLE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Listing is not available"
        )
    
    # Create claim
    claim = await prisma.claim.create(
        data={
            "listingId": data.listingId,
            "ngoId": data.ngoId,
            "requestedQuantity": data.requestedQuantity or listing.quantity,
            "status": "PENDING"
        }
    )
    
    # Update listing status
    await prisma.listing.update(
        where={"id": data.listingId},
        data={"status": "CLAIMED"}
    )
    
    return claim

@router.patch("/{claim_id}/status")
async def update_claim_status(
    claim_id: str,
    status: str,
    current_user: dict = Depends(get_current_user)
):
    """Update claim status"""
    claim = await prisma.claim.find_unique(where={"id": claim_id})
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    
    updated_claim = await prisma.claim.update(
        where={"id": claim_id},
        data={"status": status}
    )
    
    return updated_claim
