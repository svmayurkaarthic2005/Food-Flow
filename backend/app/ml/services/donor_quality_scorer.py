"""
Donor Quality Scorer
Calculates donor quality scores based on NGO ratings
Used by ML models to improve recommendations and matching
"""

from typing import Dict, Optional, Tuple
from datetime import datetime, timedelta
from prisma import Prisma


async def compute_donor_quality_score(
    donor_id: str,
    db: Prisma,
    min_ratings_required: int = 3
) -> Dict[str, Optional[float] | Optional[str]]:
    """
    Compute quality score for a donor based on NGO ratings.
    
    Formula:
        quality_score = (avg_rating / 5.0) * 100
        
    Category weights (for detailed scoring):
        - Food Quality: 40%
        - Packaging: 20%
        - Timeliness: 20%
        - Communication: 20%
    
    Args:
        donor_id: Donor database ID
        db: Prisma client instance
        min_ratings_required: Minimum ratings needed for scoring
        
    Returns:
        Dictionary with:
            - quality_score: float (0-100) or None
            - rating_count: int
            - average_rating: float (1-5) or None
            - quality_label: "Excellent" | "Good" | "Average" | "Poor" | "New Donor"
    """
    # Get donor with ratings
    donor = await db.donor.find_unique(
        where={'id': donor_id},
        include={
            'ratings': True
        }
    )
    
    if not donor or not donor.ratings:
        return {
            "quality_score": None,
            "rating_count": 0,
            "average_rating": None,
            "quality_label": "New Donor"
        }
    
    # Check minimum ratings requirement
    total_ratings = len(donor.ratings)
    if total_ratings < min_ratings_required:
        return {
            "quality_score": None,
            "rating_count": total_ratings,
            "average_rating": None,
            "quality_label": "New Donor"
        }
    
    # Calculate average overall rating
    average_rating = sum(r.rating for r in donor.ratings) / total_ratings
    
    # Calculate quality score (0-100)
    quality_score = (average_rating / 5.0) * 100
    
    # Calculate category averages if available
    category_ratings = {
        "foodQuality": [],
        "packaging": [],
        "timeliness": [],
        "communication": [],
    }
    
    for rating in donor.ratings:
        if rating.foodQuality:
            category_ratings["foodQuality"].append(rating.foodQuality)
        if rating.packaging:
            category_ratings["packaging"].append(rating.packaging)
        if rating.timeliness:
            category_ratings["timeliness"].append(rating.timeliness)
        if rating.communication:
            category_ratings["communication"].append(rating.communication)
    
    # Calculate weighted category score
    weighted_score = 0.0
    weights = {
        "foodQuality": 0.4,
        "packaging": 0.2,
        "timeliness": 0.2,
        "communication": 0.2,
    }
    
    for category, weight in weights.items():
        if category_ratings[category]:
            avg = sum(category_ratings[category]) / len(category_ratings[category])
            weighted_score += (avg / 5.0) * weight
    
    # Use weighted score if available, otherwise use overall rating
    if weighted_score > 0:
        quality_score = weighted_score * 100
    
    # Determine quality label
    if quality_score >= 85:
        quality_label = "Excellent"
    elif quality_score >= 70:
        quality_label = "Good"
    elif quality_score >= 50:
        quality_label = "Average"
    else:
        quality_label = "Poor"
    
    return {
        "quality_score": round(quality_score, 2),
        "rating_count": total_ratings,
        "average_rating": round(average_rating, 2),
        "quality_label": quality_label,
        "category_scores": {
            "foodQuality": round(sum(category_ratings["foodQuality"]) / len(category_ratings["foodQuality"]), 2) if category_ratings["foodQuality"] else None,
            "packaging": round(sum(category_ratings["packaging"]) / len(category_ratings["packaging"]), 2) if category_ratings["packaging"] else None,
            "timeliness": round(sum(category_ratings["timeliness"]) / len(category_ratings["timeliness"]), 2) if category_ratings["timeliness"] else None,
            "communication": round(sum(category_ratings["communication"]) / len(category_ratings["communication"]), 2) if category_ratings["communication"] else None,
        }
    }


async def get_donor_quality_for_recommendation(
    donor_id: str,
    db: Prisma
) -> float:
    """
    Get donor quality score for use in recommendation algorithms.
    
    Returns a score from 0-1 for easy integration with other scoring functions.
    
    Args:
        donor_id: Donor database ID
        db: Prisma client instance
        
    Returns:
        Quality score (0-1)
    """
    quality_data = await compute_donor_quality_score(donor_id, db)
    
    if quality_data["quality_score"] is None:
        # New donors get neutral score
        return 0.5
    
    # Normalize to 0-1 range
    return quality_data["quality_score"] / 100.0


async def get_top_quality_donors(
    db: Prisma,
    limit: int = 10,
    min_ratings: int = 3
) -> list[Dict]:
    """
    Get top-rated donors for display/analytics.
    
    Args:
        db: Prisma client instance
        limit: Number of donors to return
        min_ratings: Minimum ratings required
        
    Returns:
        List of top donors with quality scores
    """
    # Get all donors with ratings
    donors = await db.donor.find_many(
        include={'ratings': True},
        order_by={'rating': 'desc'},
        take=limit * 2  # Get more to filter by min_ratings
    )
    
    top_donors = []
    for donor in donors:
        if len(donor.ratings) >= min_ratings:
            quality_data = await compute_donor_quality_score(donor.id, db, min_ratings)
            top_donors.append({
                "id": donor.id,
                "businessName": donor.businessName,
                "businessType": donor.businessType,
                "quality_score": quality_data["quality_score"],
                "rating_count": quality_data["rating_count"],
                "average_rating": quality_data["average_rating"],
                "quality_label": quality_data["quality_label"],
            })
            
            if len(top_donors) >= limit:
                break
    
    return top_donors


async def batch_compute_donor_quality(
    db: Prisma,
    donor_ids: Optional[list[str]] = None
) -> Dict[str, Dict]:
    """
    Compute quality scores for multiple donors.
    
    Args:
        db: Prisma client instance
        donor_ids: List of donor IDs (if None, computes for all)
        
    Returns:
        Dictionary mapping donor_id to quality data
    """
    # Get donors to compute
    if donor_ids:
        donors = await db.donor.find_many(
            where={'id': {'in': donor_ids}}
        )
    else:
        donors = await db.donor.find_many()
    
    results = {}
    for donor in donors:
        quality_data = await compute_donor_quality_score(donor.id, db)
        results[donor.id] = quality_data
    
    return results
