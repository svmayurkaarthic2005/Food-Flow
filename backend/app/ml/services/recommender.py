"""
NGO Recommender System
Recommends top NGOs for food listings based on distance, capacity, and acceptance rate
"""

import math
from functools import lru_cache
from typing import List, Optional, Tuple
from datetime import datetime, timedelta

from prisma import Prisma
from app.ml.schemas.ml_schemas import NGOMatch


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on Earth.
    
    Args:
        lat1, lon1: Coordinates of first point
        lat2, lon2: Coordinates of second point
        
    Returns:
        Distance in kilometers
    """
    # Earth's radius in kilometers
    R = 6371.0
    
    # Convert to radians
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    # Haversine formula
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    distance = R * c
    return distance


async def calculate_ngo_metrics(
    ngo_id: str,
    db: Prisma
) -> Tuple[float, float]:
    """
    Calculate capacity score and acceptance rate for an NGO.
    
    Args:
        ngo_id: NGO database ID
        db: Prisma client instance
        
    Returns:
        Tuple of (capacity_score, acceptance_rate)
    """
    # Get NGO data
    ngo = await db.ngo.find_unique(
        where={'id': ngo_id},
        include={'claims': True}
    )
    
    if not ngo:
        return 0.0, 0.0
    
    # Calculate capacity score (0-1, higher is better)
    # Based on available storage capacity
    if ngo.storageCapacity > 0:
        available_capacity = ngo.storageCapacity - ngo.currentStorage
        capacity_score = min(available_capacity / ngo.storageCapacity, 1.0)
    else:
        capacity_score = 0.0
    
    # Calculate acceptance rate (0-1, higher is better)
    # Based on claims in last 90 days
    if ngo.claims:
        ninety_days_ago = datetime.now() - timedelta(days=90)
        recent_claims = [
            c for c in ngo.claims 
            if c.claimedAt >= ninety_days_ago
        ]
        
        if recent_claims:
            accepted_claims = [
                c for c in recent_claims 
                if c.status in ['ACCEPTED', 'COMPLETED']
            ]
            acceptance_rate = len(accepted_claims) / len(recent_claims)
        else:
            acceptance_rate = 0.5  # Default for NGOs with no recent claims
    else:
        acceptance_rate = 0.5  # Default for new NGOs
    
    return capacity_score, acceptance_rate


async def recommend_ngos_for_listing(
    listing_id: str,
    db: Prisma,
    top_n: int = 3,
    max_distance_km: float = 50.0
) -> List[NGOMatch]:
    """
    Recommend top NGOs for a food listing.
    
    Scoring Formula:
        score = (0.5 × normalized_distance) + (0.3 × capacity_score) + (0.2 × acceptance_rate)
        Lower score = better match
    
    Args:
        listing_id: Food listing ID
        db: Prisma client instance
        top_n: Number of top recommendations to return
        max_distance_km: Maximum distance to consider (km)
        
    Returns:
        List of NGOMatch objects, sorted by score (best first)
    """
    # Get listing details
    listing = await db.foodlisting.find_unique(
        where={'id': listing_id}
    )
    
    if not listing:
        return []
    
    # Get all active NGOs
    ngos = await db.ngo.find_many(
        include={
            'user': True,
            'claims': True
        }
    )
    
    if not ngos:
        return []
    
    # Calculate scores for each NGO
    ngo_scores = []
    
    for ngo in ngos:
        # Calculate distance
        distance_km = haversine_distance(
            listing.latitude,
            listing.longitude,
            ngo.latitude,
            ngo.longitude
        )
        
        # Skip if too far
        if distance_km > max_distance_km:
            continue
        
        # Get capacity and acceptance rate
        capacity_score, acceptance_rate = await calculate_ngo_metrics(ngo.id, db)
        
        # Normalize distance (inverse scaling: closer = lower score)
        # Use sigmoid-like normalization
        normalized_distance = distance_km / max_distance_km
        
        # Calculate final score (lower is better)
        final_score = (
            0.5 * normalized_distance +
            0.3 * (1 - capacity_score) +  # Invert: higher capacity = lower score
            0.2 * (1 - acceptance_rate)    # Invert: higher acceptance = lower score
        )
        
        # Convert to 0-100 scale (higher is better for display)
        display_score = int((1 - final_score) * 100)
        
        ngo_scores.append({
            'ngo': ngo,
            'distance_km': round(distance_km, 2),
            'capacity_score': round(capacity_score, 2),
            'acceptance_rate': round(acceptance_rate, 2),
            'final_score': final_score,
            'display_score': max(0, min(100, display_score))
        })
    
    # Sort by final_score (lower is better)
    ngo_scores.sort(key=lambda x: x['final_score'])
    
    # Take top N
    top_ngos = ngo_scores[:top_n]
    
    # Convert to NGOMatch objects
    matches = []
    for item in top_ngos:
        ngo = item['ngo']
        matches.append(NGOMatch(
            ngo_id=int(ngo.id) if ngo.id.isdigit() else hash(ngo.id) % (10 ** 8),
            name=ngo.organizationName,
            score=item['display_score'],
            distance_km=item['distance_km'],
            trust_score=ngo.trustScore,
            trust_label=ngo.trustLabel
        ))
    
    return matches


@lru_cache(maxsize=100)
def get_cached_recommendations_key(listing_id: str) -> str:
    """
    Generate cache key for recommendations.
    LRU cache wrapper for recommendation results.
    
    Args:
        listing_id: Food listing ID
        
    Returns:
        Cache key string
    """
    return f"recommendations:{listing_id}"


async def get_recommendations_with_cache(
    listing_id: str,
    db: Prisma,
    top_n: int = 3
) -> List[NGOMatch]:
    """
    Get recommendations with LRU caching.
    
    Args:
        listing_id: Food listing ID
        db: Prisma client instance
        top_n: Number of recommendations
        
    Returns:
        List of NGOMatch objects
    """
    # Note: LRU cache is on the key generation, actual caching would need Redis
    # For now, this provides in-memory caching of the cache key
    cache_key = get_cached_recommendations_key(listing_id)
    
    # Get fresh recommendations
    # In production, check Redis here using cache_key
    recommendations = await recommend_ngos_for_listing(listing_id, db, top_n)
    
    return recommendations
