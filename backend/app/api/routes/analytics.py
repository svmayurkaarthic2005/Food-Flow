from fastapi import APIRouter, Query
from typing import Optional
from datetime import datetime, timedelta

from app.db.database import prisma

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard_analytics(
    user_id: Optional[str] = Query(None),
    role: Optional[str] = Query(None)
):
    """Get dashboard analytics"""
    
    # Get summary stats
    total_listings = await prisma.listing.count()
    available_listings = await prisma.listing.count(where={"status": "AVAILABLE"})
    claimed_listings = await prisma.listing.count(where={"status": "CLAIMED"})
    total_donors = await prisma.donor.count()
    total_ngos = await prisma.ngo.count()
    
    # Get recent listings
    recent_listings = await prisma.listing.find_many(
        take=10,
        order={"createdAt": "desc"},
        include={
            "donor": {
                "include": {
                    "user": True
                }
            }
        }
    )
    
    # Get recent claims
    recent_claims = await prisma.claim.find_many(
        take=10,
        order={"claimedAt": "desc"},
        include={
            "listing": True,
            "ngo": {
                "include": {
                    "user": True
                }
            }
        }
    )
    
    return {
        "summary": {
            "totalListings": total_listings,
            "availableListings": available_listings,
            "claimedListings": claimed_listings,
            "totalDonors": total_donors,
            "totalNgos": total_ngos
        },
        "recentListings": recent_listings,
        "recentClaims": recent_claims
    }

@router.get("/stats")
async def get_stats():
    """Get platform statistics"""
    
    # Get counts by status
    listings_by_status = {}
    for status in ["AVAILABLE", "CLAIMED", "EXPIRED"]:
        count = await prisma.listing.count(where={"status": status})
        listings_by_status[status.lower()] = count
    
    # Get counts by category
    listings = await prisma.listing.find_many()
    listings_by_category = {}
    for listing in listings:
        category = listing.category or "Other"
        listings_by_category[category] = listings_by_category.get(category, 0) + 1
    
    return {
        "listingsByStatus": listings_by_status,
        "listingsByCategory": listings_by_category,
        "totalDonors": await prisma.donor.count(),
        "totalNgos": await prisma.ngo.count(),
        "totalClaims": await prisma.claim.count()
    }
