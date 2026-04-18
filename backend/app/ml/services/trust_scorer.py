"""
NGO Trust Scorer
Calculates trust scores for NGOs based on their claim history and performance
"""

from typing import Dict, Literal, Optional
from datetime import datetime, timedelta

from prisma import Prisma


TrustLabel = Literal["High", "Medium", "Low", "New NGO"]


async def compute_trust(
    ngo_id: str,
    db: Prisma,
    min_claims_required: int = 5
) -> Dict[str, Optional[float] | Optional[str]]:
    """
    Compute trust score for an NGO based on historical performance.
    
    Formula:
        trust_score = (pickup_rate × 50) + (delay_score × 30) + ((1 - cancel_rate) × 20)
    
    Requirements:
        - Minimum 5 claims required
        - If not met: return {"trust_score": None, "trust_label": "New NGO"}
    
    Args:
        ngo_id: NGO database ID
        db: Prisma client instance
        min_claims_required: Minimum number of claims needed for scoring
        
    Returns:
        Dictionary with:
            - trust_score: float (0-100) or None
            - trust_label: "High" | "Medium" | "Low" | "New NGO"
    """
    # Get NGO with claims
    ngo = await db.ngo.find_unique(
        where={'id': ngo_id},
        include={
            'claims': {
                'include': {
                    'listing': True
                }
            }
        }
    )
    
    if not ngo or not ngo.claims:
        return {
            "trust_score": None,
            "trust_label": "New NGO"
        }
    
    # Check minimum claims requirement
    total_claims = len(ngo.claims)
    if total_claims < min_claims_required:
        return {
            "trust_score": None,
            "trust_label": "New NGO"
        }
    
    # Calculate metrics
    completed_claims = [c for c in ngo.claims if c.status == 'COMPLETED']
    cancelled_claims = [c for c in ngo.claims if c.status == 'REJECTED']
    
    # 1. Pickup Rate (completed / total)
    pickup_rate = len(completed_claims) / total_claims if total_claims > 0 else 0
    
    # 2. Cancel Rate (cancelled / total)
    cancel_rate = len(cancelled_claims) / total_claims if total_claims > 0 else 0
    
    # 3. Delay Score (based on time between claim and completion)
    delay_scores = []
    for claim in completed_claims:
        if claim.updatedAt and claim.claimedAt:
            # Calculate hours between claim and completion
            time_diff = claim.updatedAt - claim.claimedAt
            hours_to_complete = time_diff.total_seconds() / 3600
            
            # Score based on completion time
            # < 6 hours: 1.0 (excellent)
            # 6-24 hours: 0.7 (good)
            # 24-48 hours: 0.4 (acceptable)
            # > 48 hours: 0.2 (poor)
            if hours_to_complete < 6:
                delay_scores.append(1.0)
            elif hours_to_complete < 24:
                delay_scores.append(0.7)
            elif hours_to_complete < 48:
                delay_scores.append(0.4)
            else:
                delay_scores.append(0.2)
    
    # Average delay score
    avg_delay_score = sum(delay_scores) / len(delay_scores) if delay_scores else 0.5
    
    # Calculate final trust score (0-100)
    trust_score = (
        pickup_rate * 50 +
        avg_delay_score * 30 +
        (1 - cancel_rate) * 20
    )
    
    # Round to 2 decimal places
    trust_score = round(trust_score, 2)
    
    # Determine trust label
    if trust_score >= 80:
        trust_label = "High"
    elif trust_score >= 60:
        trust_label = "Medium"
    else:
        trust_label = "Low"
    
    return {
        "trust_score": trust_score,
        "trust_label": trust_label
    }


async def update_ngo_trust_score(
    ngo_id: str,
    db: Prisma
) -> Dict[str, Optional[float] | Optional[str]]:
    """
    Compute and update NGO trust score in database.
    
    Args:
        ngo_id: NGO database ID
        db: Prisma client instance
        
    Returns:
        Dictionary with trust_score and trust_label
    """
    # Compute trust score
    trust_data = await compute_trust(ngo_id, db)
    
    # Update NGO record
    await db.ngo.update(
        where={'id': ngo_id},
        data={
            'trustScore': int(trust_data['trust_score']) if trust_data['trust_score'] is not None else None,
            'trustLabel': trust_data['trust_label']
        }
    )
    
    return trust_data


async def batch_update_trust_scores(
    db: Prisma,
    ngo_ids: Optional[list[str]] = None
) -> Dict[str, int]:
    """
    Update trust scores for multiple NGOs.
    
    Args:
        db: Prisma client instance
        ngo_ids: List of NGO IDs to update (if None, updates all)
        
    Returns:
        Dictionary with update statistics
    """
    # Get NGOs to update
    if ngo_ids:
        ngos = await db.ngo.find_many(
            where={'id': {'in': ngo_ids}}
        )
    else:
        ngos = await db.ngo.find_many()
    
    updated_count = 0
    skipped_count = 0
    
    for ngo in ngos:
        try:
            await update_ngo_trust_score(ngo.id, db)
            updated_count += 1
        except Exception as e:
            print(f"Error updating trust score for NGO {ngo.id}: {e}")
            skipped_count += 1
    
    return {
        "total": len(ngos),
        "updated": updated_count,
        "skipped": skipped_count
    }


def get_trust_badge_color(trust_label: TrustLabel) -> str:
    """
    Get color code for trust badge (for UI).
    
    Args:
        trust_label: Trust label
        
    Returns:
        Color hex code
    """
    colors = {
        "High": "#10B981",      # Green
        "Medium": "#F59E0B",    # Orange
        "Low": "#EF4444",       # Red
        "New NGO": "#6B7280"    # Gray
    }
    return colors.get(trust_label, "#6B7280")


def get_trust_description(trust_label: TrustLabel) -> str:
    """
    Get human-readable description for trust level.
    
    Args:
        trust_label: Trust label
        
    Returns:
        Description string
    """
    descriptions = {
        "High": "Highly reliable - excellent pickup and completion record",
        "Medium": "Reliable - good performance with room for improvement",
        "Low": "Needs improvement - inconsistent pickup or completion history",
        "New NGO": "New organization - building track record"
    }
    return descriptions.get(trust_label, "Trust level not determined")
