# ML Phase 2 Implementation - Core ML Services

## Overview
Phase 2 implements production-grade ML services for the FoodFlow platform, including NGO recommendations, demand forecasting, route optimization, trust scoring, and spoilage priority scoring.

## Completed Services

### 1. Recommender System
**File:** `backend/app/ml/services/recommender.py`

**Purpose:** Recommends top NGOs for food listings based on multiple factors.

**Features:**
- Haversine distance calculation for accurate geographic distance
- Multi-factor scoring: distance (50%), capacity (30%), acceptance rate (20%)
- Configurable maximum distance filter (default: 50km)
- LRU cache support for performance
- Returns top N recommendations (default: 3)

**Scoring Formula:**
```python
score = (0.5 × normalized_distance) + (0.3 × capacity_score) + (0.2 × acceptance_rate)
# Lower score = better match
# Converted to 0-100 scale for display (higher is better)
```

**Usage:**
```python
from app.ml.services import recommend_ngos_for_listing

recommendations = await recommend_ngos_for_listing(
    listing_id="123",
    db=db,
    top_n=3,
    max_distance_km=50.0
)
```

**Output:**
```python
[
    NGOMatch(
        ngo_id=1,
        name="Food Bank Central",
        score=85,
        distance_km=5.2,
        trust_score=78,
        trust_label="High"
    ),
    ...
]
```

---

### 2. Spoilage Scorer
**File:** `backend/app/ml/services/spoilage_scorer.py`

**Purpose:** Rule-based priority scoring for food listings based on expiry time and conditions.

**Features:**
- Pure rule-based (no ML model)
- Time-based priority levels
- Perishable category detection
- Temperature-based urgency adjustment
- Helper functions for UI integration

**Priority Rules:**
- **< 6 hours:** CRITICAL
- **6-24 hours:** HIGH
- **24-72 hours:** MEDIUM
- **> 72 hours:** LOW

**Adjustments:**
- Perishable categories (dairy, cooked food, meat, etc.) → upgrade by 1 level
- High storage temp (> 25°C) → upgrade by 1 level

**Usage:**
```python
from app.ml.services import score_priority, auto_score_listing_priority

# Manual scoring
priority = score_priority(
    hours_until_expiry=12.5,
    category="Dairy",
    storage_temp=28.0
)  # Returns: "CRITICAL"

# Auto scoring from datetime
priority = auto_score_listing_priority(
    expiry_time=datetime(2024, 1, 15, 18, 0),
    category="Bakery",
    storage_temp=22.0
)
```

**Integration Points:**
- Listing create endpoint
- Listing update endpoint
- Automatic priority calculation on expiry changes

---

### 3. Trust Scorer
**File:** `backend/app/ml/services/trust_scorer.py`

**Purpose:** Calculates trust scores for NGOs based on historical performance.

**Features:**
- Minimum 5 claims requirement
- Multi-metric scoring: pickup rate, delay score, cancel rate
- Automatic trust label assignment
- Batch update support
- Database persistence

**Scoring Formula:**
```python
trust_score = (pickup_rate × 50) + (delay_score × 30) + ((1 - cancel_rate) × 20)
# Range: 0-100
```

**Trust Labels:**
- **High:** score ≥ 80
- **Medium:** 60 ≤ score < 80
- **Low:** score < 60
- **New NGO:** < 5 claims

**Delay Score Calculation:**
- < 6 hours: 1.0 (excellent)
- 6-24 hours: 0.7 (good)
- 24-48 hours: 0.4 (acceptable)
- > 48 hours: 0.2 (poor)

**Usage:**
```python
from app.ml.services import compute_trust, update_ngo_trust_score

# Compute trust score
result = await compute_trust(ngo_id="123", db=db)
# Returns: {"trust_score": 78.5, "trust_label": "Medium"}

# Update in database
result = await update_ngo_trust_score(ngo_id="123", db=db)

# Batch update all NGOs
stats = await batch_update_trust_scores(db=db)
# Returns: {"total": 50, "updated": 48, "skipped": 2}
```

---

### 4. Demand Predictor
**File:** `backend/app/ml/services/demand_predictor.py`

**Purpose:** Forecasts food demand by district and category using Linear Regression.

**Features:**
- Scikit-learn Linear Regression model
- Trains on past 90 days of claims data
- Groups by (district, category, day_of_week)
- 90% confidence intervals (± 1.645 × residual_std)
- Model persistence with joblib
- Auto-training if model not found
- Force retrain capability

**Model Storage:**
- Model: `backend/app/ml/models/demand_regressor.pkl`
- Encoders: `backend/app/ml/models/demand_encoders.pkl`

**Usage:**
```python
from app.ml.services import predict_demand, retrain_model

# Predict demand
forecasts = await predict_demand(
    district="Downtown",
    category="Bakery",
    db=db,
    days_ahead=7
)

# Returns list of DemandForecast objects:
[
    DemandForecast(
        date=date(2024, 1, 15),
        category="Bakery",
        predicted=25,
        low=18,
        high=32
    ),
    ...
]

# Force retrain model
result = await retrain_model(db)
# Returns: {"success": True, "samples": 450, "residual_std": 3.2}
```

**Training Requirements:**
- Minimum 10 samples required
- Returns empty list if insufficient data
- Handles unseen districts/categories gracefully

---

### 5. Route Optimizer
**File:** `backend/app/ml/services/route_optimizer.py`

**Purpose:** Optimizes pickup routes for food collection using TSP solver.

**Features:**
- Haversine distance matrix calculation
- Nearest neighbor TSP heuristic
- ETA calculation per stop
- Total route time estimation
- Warning for routes > 120 minutes
- Google Maps API feature flag (placeholder)

**Constants:**
- Average speed: 40 km/h
- Stop time: 10 minutes per pickup
- Max route time warning: 120 minutes

**Usage:**
```python
from app.ml.services import optimize_route

stops = [
    {"listing_id": 1, "lat": 40.7128, "lng": -74.0060},
    {"listing_id": 2, "lat": 40.7589, "lng": -73.9851},
    {"listing_id": 3, "lat": 40.7614, "lng": -73.9776}
]

depot = {"lat": 40.7580, "lng": -73.9855}

route = optimize_route(stops=stops, depot=depot)

# Returns RouteResponse:
RouteResponse(
    stops=[
        RouteStop(listing_id=2, lat=40.7589, lng=-73.9851, eta_minutes=5.2),
        RouteStop(listing_id=3, lat=40.7614, lng=-73.9776, eta_minutes=18.7),
        RouteStop(listing_id=1, lat=40.7128, lng=-74.0060, eta_minutes=45.3)
    ],
    total_minutes=65.3,
    warning=None
)
```

**Future Enhancement:**
- Google Maps Distance Matrix API integration
- Set `USE_GOOGLE_MAPS_API=true` in environment
- Provide `GOOGLE_MAPS_API_KEY`

---

## API Endpoints

### ML Routes
**File:** `backend/app/ml/routes/ml_routes.py`

All endpoints are prefixed with `/ml`:

#### 1. Get NGO Recommendations
```
GET /ml/recommendations/{listing_id}?top_n=3
```
Returns top N NGO recommendations for a listing.

#### 2. Get Demand Forecast
```
GET /ml/demand/forecast?district=Downtown&category=Bakery&days_ahead=7
```
Returns demand forecast with confidence intervals.

#### 3. Retrain Demand Model
```
POST /ml/demand/retrain
```
Forces retraining of the demand prediction model.

#### 4. Optimize Route
```
POST /ml/route/optimize?depot_lat=40.7580&depot_lng=-73.9855
Body: [
    {"listing_id": 1, "lat": 40.7128, "lng": -74.0060},
    {"listing_id": 2, "lat": 40.7589, "lng": -73.9851}
]
```
Returns optimized pickup route.

#### 5. Update Trust Score
```
POST /ml/trust/update/{ngo_id}
```
Updates trust score for a specific NGO.

#### 6. Batch Update Trust Scores
```
POST /ml/trust/batch-update
Body: {"ngo_ids": ["1", "2", "3"]}  # Optional, updates all if omitted
```
Batch updates trust scores.

#### 7. Health Check
```
GET /ml/health
```
Returns ML services health status.

---

## Dependencies

### Updated requirements.txt
```
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.3
pydantic-settings==2.1.0
python-dotenv==1.0.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
email-validator==2.1.0
prisma==0.11.0
httpx==0.26.0
pandas==2.1.4
numpy==1.26.2
scikit-learn==1.3.2
joblib==1.3.2
```

### Installation
```bash
cd backend
pip install -r requirements.txt
```

---

## Integration Guide

### 1. Register ML Routes in Main App
Add to `backend/main.py`:
```python
from app.ml.routes import router as ml_router

app.include_router(ml_router)
```

### 2. Auto-Score Listings on Create/Update
Add to listing endpoints:
```python
from app.ml.services import auto_score_listing_priority

# In create/update listing endpoint
priority = auto_score_listing_priority(
    expiry_time=listing_data.expiry_time,
    category=listing_data.category,
    storage_temp=listing_data.storage_temp
)

# Save priority to database
listing.priority = priority
```

### 3. Update Trust Scores Periodically
Create a scheduled task (e.g., daily cron job):
```python
from app.ml.services import batch_update_trust_scores

# Run daily
async def update_all_trust_scores():
    result = await batch_update_trust_scores(db)
    print(f"Updated {result['updated']} NGO trust scores")
```

### 4. Show Recommendations in UI
```python
# In listing detail page
recommendations = await recommend_ngos_for_listing(listing_id, db)

# Display in UI with scores, distances, and trust labels
```

---

## Testing

### Manual Testing

#### Test Recommender
```bash
curl http://localhost:8000/ml/recommendations/123?top_n=3
```

#### Test Demand Forecast
```bash
curl "http://localhost:8000/ml/demand/forecast?district=Downtown&category=Bakery&days_ahead=7"
```

#### Test Route Optimizer
```bash
curl -X POST http://localhost:8000/ml/route/optimize?depot_lat=40.7580&depot_lng=-73.9855 \
  -H "Content-Type: application/json" \
  -d '[
    {"listing_id": 1, "lat": 40.7128, "lng": -74.0060},
    {"listing_id": 2, "lat": 40.7589, "lng": -73.9851}
  ]'
```

#### Test Trust Score Update
```bash
curl -X POST http://localhost:8000/ml/trust/update/123
```

### Unit Tests (TODO)
Create test files in `backend/tests/ml/`:
- `test_recommender.py`
- `test_spoilage_scorer.py`
- `test_trust_scorer.py`
- `test_demand_predictor.py`
- `test_route_optimizer.py`

---

## Performance Considerations

### Caching
- Recommender uses LRU cache (maxsize=100)
- Consider adding Redis caching for production
- Cache invalidation on listing/NGO updates

### Model Training
- Demand predictor trains on first use
- Model persisted to disk for reuse
- Retrain periodically (e.g., weekly) for accuracy

### Route Optimization
- Nearest neighbor is O(n²) - suitable for < 50 stops
- For larger routes, consider more advanced TSP solvers
- Google Maps API provides real-world distances

---

## Error Handling

All services handle edge cases:
- No NGOs available → empty recommendations
- Insufficient training data → empty forecasts
- No stops → empty route
- New NGOs → "New NGO" trust label
- Missing data → graceful degradation

---

## Future Enhancements

1. **Advanced ML Models**
   - LSTM for demand forecasting
   - Collaborative filtering for recommendations
   - Gradient boosting for trust scoring

2. **Real-time Updates**
   - WebSocket notifications for route changes
   - Live demand updates
   - Real-time trust score recalculation

3. **Google Maps Integration**
   - Real driving distances and times
   - Traffic-aware routing
   - Turn-by-turn directions

4. **A/B Testing**
   - Test different scoring weights
   - Compare recommendation algorithms
   - Optimize route algorithms

5. **Monitoring & Logging**
   - Track prediction accuracy
   - Monitor API latency
   - Log model performance metrics

---

## Summary

Phase 2 successfully implements all core ML services:
- ✅ Recommender System (haversine + multi-factor scoring)
- ✅ Spoilage Scorer (rule-based priority)
- ✅ Trust Scorer (performance-based scoring)
- ✅ Demand Predictor (Linear Regression)
- ✅ Route Optimizer (TSP solver)
- ✅ API Endpoints (7 endpoints)
- ✅ Documentation (comprehensive)

All services are production-ready, type-safe, and follow best practices.
