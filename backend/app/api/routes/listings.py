from fastapi import APIRouter, HTTPException, status, Depends, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.core.security import get_current_user
from app.db.database import prisma

router = APIRouter()

class ListingCreate(BaseModel):
    name: str
    description: Optional[str] = None
    quantity: str
    category: str
    address: str
    latitude: float
    longitude: float
    expiryTime: str
    pickupWindow: Optional[str] = None
    donorId: str

class ListingUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    quantity: Optional[str] = None
    status: Optional[str] = None

@router.get("")
async def get_listings(
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    limit: int = Query(100, le=100)
):
    """Get all listings with optional filters"""
    where = {}
    
    if status:
        where["status"] = status
    if category:
        where["category"] = category
    
    listings = await prisma.listing.find_many(
        where=where,
        include={
            "donor": {
                "include": {
                    "user": True
                }
            }
        },
        take=limit,
        order={"createdAt": "desc"}
    )
    
    return {"data": listings, "count": len(listings)}

@router.get("/{listing_id}")
async def get_listing(listing_id: str):
    """Get a specific listing"""
    listing = await prisma.listing.find_unique(
        where={"id": listing_id},
        include={
            "donor": {
                "include": {
                    "user": True
                }
            },
            "claims": {
                "include": {
                    "ngo": {
                        "include": {
                            "user": True
                        }
                    }
                }
            }
        }
    )
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    return listing

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_listing(
    data: ListingCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new listing"""
    # Verify user is a donor
    if current_user["role"] != "DONOR":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only donors can create listings"
        )
    
    listing = await prisma.listing.create(
        data={
            "name": data.name,
            "description": data.description,
            "quantity": data.quantity,
            "category": data.category,
            "address": data.address,
            "latitude": data.latitude,
            "longitude": data.longitude,
            "expiryTime": datetime.fromisoformat(data.expiryTime.replace('Z', '+00:00')),
            "pickupWindow": data.pickupWindow,
            "status": "AVAILABLE",
            "donorId": data.donorId
        }
    )
    
    return listing

@router.patch("/{listing_id}")
async def update_listing(
    listing_id: str,
    data: ListingUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a listing"""
    # Get listing
    listing = await prisma.listing.find_unique(where={"id": listing_id})
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    # Update listing
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    
    updated_listing = await prisma.listing.update(
        where={"id": listing_id},
        data=update_data
    )
    
    return updated_listing

@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_listing(
    listing_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a listing"""
    listing = await prisma.listing.find_unique(where={"id": listing_id})
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    await prisma.listing.delete(where={"id": listing_id})
    return None
