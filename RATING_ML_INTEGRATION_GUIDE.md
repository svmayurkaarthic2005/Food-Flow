# Rating System ML Integration Guide

## Overview
This guide explains how to integrate the NGO donor rating system with ML models for improved recommendations and matching.

## Architecture

```
NGO Rates Donor
    ↓
DonorRating Created
    ↓
Donor Average Rating Updated
    ↓
ML Models Use Quality Score
    ├─ Recommender (NGO matching)
    ├─ Priority Scorer (listing priority)
    ├─ Demand Forecaster (quality predictions)
    └─ Trust Scorer (donor reliability)
```

## Components

### 1. Donor Quality Scorer (`backend/app/ml/services/donor_quality_scorer.py`)

**Main Functions:**

#### `compute_donor_quality_score(donor_id, db, min_ratings_required=3)`
Calculates comprehensive quality score for a donor.

```python
# Returns:
{
    "quality_score": 85.5,           # 0-100
    "rating_count": 12,              # Number of ratings
    "average_rating": 4.27,          # 1-5 stars
    "quality_label": "Good",         # Excellent/Good/Average/Poor/New Donor
    "category_scores": {
        "foodQuality": 4.5,
        "packaging": 4.2,
        "timeliness": 4.0,
        "communication": 4.1
    }
}
```

#### `get_donor_quality_for_recommendation(donor_id, db)`
Returns normalized quality score (0-1) for use in ML algorithms.

```python
quality_score = await get_donor_quality_for_recommendation("donor_123", db)
# Returns: 0.855 (normalized from 85.5)
```

#### `get_top_quality_donors(db, limit=10, min_ratings=3)`
Gets top-rated donors for display/analytics.

```python
top_donors = await get_top_quality_donors(db, limit=10)
# Returns list of top 10 donors with quality scores
```

### 2. Updated Recommender v2 (`backend/app/ml/services/recommender_v2.py`)

**Scoring Formula with Donor Quality:**
```
score = (0.4 × normalized_distance) + 
        (0.25 × capacity_score) + 
        (0.15 × acceptance_rate) +
        (0.2 × donor_quality_score)
```

**Weight Breakdown:**
- Distance: 40% (closer is better)
- Capacity: 25% (more available space is better)
- Acceptance Rate: 15% (higher acceptance is better)
- Donor Quality: 20% (higher quality is better)

**Usage:**
```python
from app.ml.services.recommender_v2 import recommend_ngos_for_listing_v2

recommendations = await recommend_ngos_for_listing_v2(
    listing_id="listing_123",
    db=db,
    top_n=3,
    use_donor_quality=True
)
```

## Integration Steps

### Step 1: Update Recommender Endpoint

In `backend/app/ml/router.py`, update the recommendations endpoint:

```python
@router.get("/recommendations/{listing_id}", response_model=List[NGOMatch])
async def get_recommendations(
    listing_id: str,
    top_n: int = Query(3, ge=1, le=10),
    use_donor_quality: bool = Query(True, description="Include donor quality in scoring"),
    db: Prisma = Depends(get_db)
):
    """Get NGO recommendations with optional donor quality scoring."""
    
    if use_donor_quality:
        # Use new recommender with donor quality
        from app.ml.services.recommender_v2 import recommend_ngos_for_listing_v2
        recommendations = await recommend_ngos_for_listing_v2(
            listing_id=listing_id,
            db=db,
            top_n=top_n,
            use_donor_quality=True
        )
    else:
        # Use original recommender
        from app.ml.services.recommender import recommend_ngos_for_listing
        recommendations = await recommend_ngos_for_listing(
            listing_id=listing_id,
            db=db,
            top_n=top_n
        )
    
    return recommendations
```

### Step 2: Update Priority Scorer

In `backend/app/ml/services/spoilage_scorer.py`, add donor quality consideration:

```python
async def auto_score_listing_priority_with_quality(
    expiry_time: datetime,
    category: str,
    storage_temp: Optional[float] = None,
    donor_quality_score: Optional[float] = None,
    db: Prisma = None
) -> Priority:
    """
    Score listing priority with donor quality consideration.
    
    High-quality donors' listings get priority boost.
    """
    # Get base priority from expiry and category
    hours = calculate_hours_until_expiry(expiry_time)
    base_priority = score_priority(hours, category, storage_temp)
    
    # Boost priority if donor has high quality
    if donor_quality_score and donor_quality_score >= 0.8:
        # Upgrade priority by one level
        priority_levels = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
        current_index = priority_levels.index(base_priority)
        upgraded_index = min(current_index + 1, len(priority_levels) - 1)
        return priority_levels[upgraded_index]
    
    return base_priority
```

### Step 3: Update Demand Forecaster

In demand forecasting, segment predictions by donor quality:

```python
async def forecast_demand_by_quality(
    district: str,
    category: str,
    db: Prisma
) -> Dict:
    """
    Forecast demand considering donor quality tiers.
    """
    # Get historical data segmented by donor quality
    high_quality_listings = await db.foodlisting.find_many(
        where={
            "donor": {
                "rating": {"gte": 4.0}
            },
            "category": category
        }
    )
    
    low_quality_listings = await db.foodlisting.find_many(
        where={
            "donor": {
                "rating": {"lt": 3.0}
            },
            "category": category
        }
    )
    
    # Calculate claim rates by quality tier
    high_quality_claims = sum(1 for l in high_quality_listings if l.status == "CLAIMED")
    low_quality_claims = sum(1 for l in low_quality_listings if l.status == "CLAIMED")
    
    high_quality_rate = high_quality_claims / len(high_quality_listings) if high_quality_listings else 0
    low_quality_rate = low_quality_claims / len(low_quality_listings) if low_quality_listings else 0
    
    return {
        "high_quality_claim_rate": high_quality_rate,
        "low_quality_claim_rate": low_quality_rate,
        "quality_impact": high_quality_rate - low_quality_rate
    }
```

## Testing

### Run Tests
```bash
cd backend
pytest tests/test_donor_ratings.py -v
```

### Test Coverage
- Rating validation
- Quality score calculation
- Category rating weights
- ML integration scenarios
- Edge cases (no ratings, single rating, extreme ratings)

## Performance Considerations

### Caching Strategy
```python
# Cache donor quality scores for 1 hour
DONOR_QUALITY_CACHE_TTL = 3600

# Cache recommendations for 5 minutes
RECOMMENDATIONS_CACHE_TTL = 300
```

### Database Indexes
```sql
-- Add indexes for faster queries
CREATE INDEX idx_donor_ratings_donor_id ON donor_ratings(donor_id);
CREATE INDEX idx_donor_ratings_ngo_id ON donor_ratings(ngo_id);
CREATE INDEX idx_donor_ratings_rating ON donor_ratings(rating);
CREATE INDEX idx_donor_ratings_created_at ON donor_ratings(created_at);
```

## Monitoring & Analytics

### Key Metrics to Track
1. **Average Donor Quality Score** - Overall platform quality
2. **Quality Distribution** - % of donors in each quality tier
3. **Recommendation Accuracy** - % of recommendations that result in claims
4. **Quality Impact** - How much donor quality affects claim rates

### Dashboard Queries
```python
# Get quality distribution
async def get_quality_distribution(db: Prisma):
    donors = await db.donor.find_many(include={'ratings': True})
    
    distribution = {
        "excellent": 0,  # >= 85
        "good": 0,       # 70-84
        "average": 0,    # 50-69
        "poor": 0,       # < 50
        "new": 0         # No ratings
    }
    
    for donor in donors:
        if not donor.ratings:
            distribution["new"] += 1
        else:
            avg_rating = sum(r.rating for r in donor.ratings) / len(donor.ratings)
            score = (avg_rating / 5.0) * 100
            
            if score >= 85:
                distribution["excellent"] += 1
            elif score >= 70:
                distribution["good"] += 1
            elif score >= 50:
                distribution["average"] += 1
            else:
                distribution["poor"] += 1
    
    return distribution
```

## Migration Path

### Phase 1: Deploy Rating System
- ✅ Database schema with DonorRating model
- ✅ Frontend rating UI
- ✅ Backend rating API
- ✅ NGO claimed page integration

### Phase 2: Integrate with ML (Current)
- ✅ Donor quality scorer
- ✅ Updated recommender v2
- ✅ Tests and validation
- ⏳ Deploy to production

### Phase 3: Optimize & Monitor
- Monitor quality metrics
- Adjust weights based on performance
- Add quality-based incentives
- Create donor quality badges

## API Examples

### Get Donor Quality Score
```bash
GET /api/ml/v1/donor/{donor_id}/quality
```

Response:
```json
{
  "quality_score": 85.5,
  "rating_count": 12,
  "average_rating": 4.27,
  "quality_label": "Good",
  "category_scores": {
    "foodQuality": 4.5,
    "packaging": 4.2,
    "timeliness": 4.0,
    "communication": 4.1
  }
}
```

### Get Recommendations with Quality
```bash
GET /api/ml/v1/recommendations/listing_123?use_donor_quality=true&top_n=5
```

Response:
```json
[
  {
    "ngo_id": 1,
    "name": "Food Bank A",
    "score": 92,
    "distance_km": 2.5,
    "trust_score": 85,
    "trust_label": "High"
  },
  {
    "ngo_id": 2,
    "name": "Food Bank B",
    "score": 88,
    "distance_km": 3.2,
    "trust_score": 75,
    "trust_label": "Medium"
  }
]
```

## Troubleshooting

### Issue: Quality scores not updating
**Solution:** Ensure Prisma migration ran successfully and DonorRating table exists.

### Issue: Recommendations not considering quality
**Solution:** Verify `use_donor_quality=true` parameter is passed to endpoint.

### Issue: Performance degradation
**Solution:** Implement caching for donor quality scores and recommendations.

## Future Enhancements

1. **Real-time Quality Updates** - Update scores immediately after rating
2. **Quality Trends** - Track quality changes over time
3. **Predictive Quality** - Predict donor quality based on patterns
4. **Quality Incentives** - Reward high-quality donors
5. **Quality Alerts** - Alert when donor quality drops
