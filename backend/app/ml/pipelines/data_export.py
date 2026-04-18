"""
Data Export Pipeline for ML Module
Exports listings and claims data for ML training and analysis
"""

import pandas as pd
from typing import Optional
from datetime import datetime
from prisma import Prisma
from prisma.models import FoodListing, Claim, Ngo, Donor


async def export_listings_claims_df(db: Optional[Prisma] = None) -> pd.DataFrame:
    """
    Export listings and claims data as a pandas DataFrame.
    
    Args:
        db: Prisma client instance (optional, will create new if not provided)
        
    Returns:
        pd.DataFrame with columns:
            - listing_id: str
            - category: str
            - quantity_kg: float (parsed from quantity string)
            - lat: float
            - lng: float
            - expiry_dt: datetime
            - ngo_id: str (nullable)
            - claimed_at: datetime (nullable)
            - donor_id: str
            - donor_name: str
            - donor_type: str
            - ngo_name: str (nullable)
            - ngo_trust_score: int (nullable)
            - priority: str
            - status: str
    """
    # Create Prisma client if not provided
    should_disconnect = False
    if db is None:
        db = Prisma()
        await db.connect()
        should_disconnect = True
    
    try:
        # Fetch all listings with related data
        listings = await db.foodlisting.find_many(
            include={
                'donor': {
                    'include': {
                        'user': True
                    }
                },
                'claims': {
                    'include': {
                        'ngo': {
                            'include': {
                                'user': True
                            }
                        }
                    }
                }
            },
            order={'createdAt': 'desc'}
        )
        
        # Handle empty dataset
        if not listings:
            return pd.DataFrame(columns=[
                'listing_id', 'category', 'quantity_kg', 'lat', 'lng',
                'expiry_dt', 'ngo_id', 'claimed_at', 'donor_id', 'donor_name',
                'donor_type', 'ngo_name', 'ngo_trust_score', 'priority', 'status'
            ])
        
        # Transform data into list of dictionaries
        data = []
        for listing in listings:
            # Parse quantity to kg (simple extraction of numbers)
            quantity_str = listing.quantity or "0"
            try:
                # Extract first number from quantity string
                quantity_kg = float(''.join(filter(lambda x: x.isdigit() or x == '.', quantity_str.split()[0])))
            except (ValueError, IndexError):
                quantity_kg = 0.0
            
            # Get donor info
            donor_name = listing.donor.user.name if listing.donor and listing.donor.user else "Unknown"
            donor_type = listing.donor.businessType if listing.donor else "Unknown"
            
            # Check if listing has claims
            if listing.claims and len(listing.claims) > 0:
                # Get the first (or most recent) claim
                claim = listing.claims[0]
                ngo_id = claim.ngoId
                claimed_at = claim.claimedAt
                ngo_name = claim.ngo.organizationName if claim.ngo else None
                ngo_trust_score = claim.ngo.trustScore if claim.ngo else None
            else:
                ngo_id = None
                claimed_at = None
                ngo_name = None
                ngo_trust_score = None
            
            data.append({
                'listing_id': listing.id,
                'category': listing.category,
                'quantity_kg': quantity_kg,
                'lat': listing.latitude,
                'lng': listing.longitude,
                'expiry_dt': listing.expiryTime,
                'ngo_id': ngo_id,
                'claimed_at': claimed_at,
                'donor_id': listing.donorId,
                'donor_name': donor_name,
                'donor_type': donor_type,
                'ngo_name': ngo_name,
                'ngo_trust_score': ngo_trust_score,
                'priority': listing.priority,
                'status': listing.status,
            })
        
        # Create DataFrame
        df = pd.DataFrame(data)
        
        # Convert datetime columns
        if not df.empty:
            df['expiry_dt'] = pd.to_datetime(df['expiry_dt'])
            df['claimed_at'] = pd.to_datetime(df['claimed_at'])
        
        return df
        
    finally:
        # Disconnect if we created the connection
        if should_disconnect:
            await db.disconnect()


async def export_ngo_performance_df(db: Optional[Prisma] = None) -> pd.DataFrame:
    """
    Export NGO performance data for trust score calculation.
    
    Args:
        db: Prisma client instance (optional)
        
    Returns:
        pd.DataFrame with NGO performance metrics
    """
    should_disconnect = False
    if db is None:
        db = Prisma()
        await db.connect()
        should_disconnect = True
    
    try:
        ngos = await db.ngo.find_many(
            include={
                'user': True,
                'claims': {
                    'include': {
                        'listing': True
                    }
                }
            }
        )
        
        if not ngos:
            return pd.DataFrame(columns=[
                'ngo_id', 'name', 'total_claims', 'completed_claims',
                'completion_rate', 'trust_score', 'trust_label', 'people_served'
            ])
        
        data = []
        for ngo in ngos:
            total_claims = len(ngo.claims)
            completed_claims = sum(1 for c in ngo.claims if c.status == 'COMPLETED')
            completion_rate = (completed_claims / total_claims * 100) if total_claims > 0 else 0
            
            data.append({
                'ngo_id': ngo.id,
                'name': ngo.organizationName,
                'total_claims': total_claims,
                'completed_claims': completed_claims,
                'completion_rate': completion_rate,
                'trust_score': ngo.trustScore,
                'trust_label': ngo.trustLabel,
                'people_served': ngo.peopleServed,
            })
        
        return pd.DataFrame(data)
        
    finally:
        if should_disconnect:
            await db.disconnect()
