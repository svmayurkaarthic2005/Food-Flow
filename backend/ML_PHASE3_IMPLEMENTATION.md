# ML Phase 3 Implementation - Production-Grade API Routes

## Overview
Phase 3 implements production-grade ML API routes with feature flags, comprehensive validation, error handling, and logging.

---

## Key Features

### 1. Feature Flag Gating
All ML endpoints are protected by environment-based feature flags:
- `ENABLE_ML_RECOMMENDER` - NGO recommendations
- `ENABLE_ML_DEMAND` - Demand forecasting
- `ENABLE_ML_PRIORITY` - Priority scoring
- `ENABLE_ML_ROUTE` - Route optimization
- `ENABLE_ML_HEATMAP` - Demand heatmap

**Behavior:** When a feature is disabled, the endpoint returns HTTP 503 (Service Unavailable).

### 2. Clean Architecture
- Pydantic schemas for request/response validation
- Dependency injection for database sessions
- Proper error handling with HTTPException
- Comprehensive logging

### 3. Production-Ready Error Handling
- **404:** Resource not found
- **422:** Validation error
- **500:** Internal server error
- **503:** Feature disabled

---

## API Endpoints

### Base URL
```
/api/ml/v1
```

---

### 1. GET /recommendations/{listing_id}

Get NGO recommendations for a food listing.

**Feature Flag:** `ENABLE_ML_RECOMMENDER`

**Parameters:**
- `listing_id` (path): Listing ID
- `top_n` (query): Number of recommendations (1-10, default: 3)

**Response:** `List[NGOMatch]`
```json
[
  {
    "ngo_id": 1,
    "name": "Food Bank Central",
    "score": 85,
    "distance_km": 5.2,
    "trust_score": 78,
    "trust_label": "High"
  }
]
```

**Errors:**
- `404`: Listing not found
- `503`: Feature disabled

**Example:**
```bash
curl http://localhost:8000/api/ml/v1/recommendations/123?top_n=3
```

---

### 2. GET /demand

Get demand forecast for a district.

**Feature Flag:** `ENABLE_ML_DEMAND`

**Important:** This endpoint reads from pre-computed `demand_forecasts` table. It does NOT recompute ML predictions.

**Parameters:**
- `district` (query, required): District name
- `days` (query): Number of days to forecast (1-14, default: 7)

**Response:** `List[DemandForecastResponse]`
```json
[
  {
    "date": "2024-01-15",
    "category": "Bakery",
    "predicted": 25,
    "low": 18,
    "high": 32
  }
]
```

**Validation:**
- Days are clamped to max 14

**Errors:**
- `404`: No forecasts found for district
- `503`: Feature disabled

**Example:**
```bash
curl "http://localhost:8000/api/ml/v1/demand?district=Downtown&days=7"
```

---

### 3. GET /priority/{listing_id}

Get priority score for a listing (debug visibility).

**Feature Flag:** `ENABLE_ML_PRIORITY`

**Parameters:**
- `listing_id` (path): Listing ID

**Response:** `PriorityResponse`
```json
{
  "listing_id": "123",
  "priority": "HIGH",
  "score_inputs": {
    "hours_until_expiry": 12.5,
    "category": "Dairy",
    "storage_temp": 28.0
  }
}
```

**Purpose:** Debug visibility into priority scoring logic.

**Errors:**
- `404`: Listing not found
- `503`: Feature disabled

**Example:**
```bash
curl http://localhost:8000/api/ml/v1/priority/123
```

---

### 4. POST /route

Optimize pickup route for multiple listings.

**Feature Flag:** `ENABLE_ML_ROUTE`

**Request Body:** `RouteRequest`
```json
{
  "listing_ids": [1, 2, 3],
  "depot": {
    "lat": 40.7580,
    "lng": -73.9855
  }
}
```

**Validation:**
- `listing_ids` must not be empty
- `depot.lat` must be between -90 and 90
- `depot.lng` must be between -180 and 180

**Response:** `RouteResponse`
```json
{
  "stops": [
    {
      "listing_id": 2,
      "lat": 40.7589,
      "lng": -73.9851,
      "eta_minutes": 5.2
    }
  ],
  "total_minutes": 65.3,
  "warning": null
}
```

**Behavior:**
1. Fetches listings from database
2. Validates all listings exist
3. Calls route optimizer
4. Returns optimized route

**Errors:**
- `404`: One or more listings not found
- `422`: Validation error (empty listing_ids, invalid lat/lng)
- `503`: Feature disabled

**Example:**
```bash
curl -X POST http://localhost:8000/api/ml/v1/route \
  -H "Content-Type: application/json" \
  -d '{
    "listing_ids": [1, 2, 3],
    "depot": {"lat": 40.7580, "lng": -73.9855}
  }'
```

---

### 5. GET /heatmap

Get demand heatmap data.

**Feature Flag:** `ENABLE_ML_HEATMAP`

**Parameters:**
- `district` (query, optional): Filter by district

**Response:** `List[HeatmapPoint]`
```json
[
  {
    "lat": 40.7128,
    "lng": -74.0060,
    "intensity": 0.85
  }
]
```

**Behavior:**
1. Reads from `demand_forecasts` table
2. Aggregates by district
3. Computes intensity: `predicted / max(predicted in district)`
4. Normalizes to 0-1 range

**Errors:**
- `404`: No forecasts found
- `503`: Feature disabled

**Example:**
```bash
curl "http://localhost:8000/api/ml/v1/heatmap?district=Downtown"
```

---

### 6. GET /health

Health check endpoint for ML services.

**Response:**
```json
{
  "status": "healthy",
  "features": {
    "recommender": true,
    "demand": true,
    "priority": true,
    "route": true,
    "heatmap": true
  },
  "version": "v1"
}
```

**Example:**
```bash
curl http://localhost:8000/api/ml/v1/health
```

---

## Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```bash
# ML Feature Flags (default: true)
ENABLE_ML_RECOMMENDER=true
ENABLE_ML_DEMAND=true
ENABLE_ML_PRIORITY=true
ENABLE_ML_ROUTE=true
ENABLE_ML_HEATMAP=true
```

### Disabling Features

To disable a feature, set its flag to `false`:

```bash
ENABLE_ML_RECOMMENDER=false
```

When disabled, the endpoint will return:
```json
{
  "detail": "ML feature 'recommender' is currently disabled"
}
```
Status code: `503 Service Unavailable`

---

## Pydantic Schemas

### RouteRequest
```python
class RouteRequest(BaseModel):
    listing_ids: List[int] = Field(..., min_items=1)
    depot: dict = Field(...)
    
    @validator('depot')
    def validate_depot(cls, v):
        # Validates lat/lng presence and ranges
        ...
```

### DemandForecastResponse
```python
class DemandForecastResponse(BaseModel):
    date: str
    category: str
    predicted: int
    low: int
    high: int
```

### PriorityResponse
```python
class PriorityResponse(BaseModel):
    listing_id: str
    priority: str
    score_inputs: dict
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | Success | Request completed successfully |
| 404 | Not Found | Resource (listing, forecast) not found |
| 422 | Validation Error | Invalid request parameters |
| 500 | Internal Server Error | Unexpected error |
| 503 | Service Unavailable | Feature disabled |

### Error Response Format

```json
{
  "detail": "Error message here"
}
```

---

## Logging

All endpoints log:
- Request parameters
- Feature flag checks
- Success/failure status
- Error details (with stack traces)

**Example logs:**
```
INFO: Getting recommendations for listing 123, top_n=3
INFO: Found 3 recommendations for listing 123
WARNING: ML feature 'recommender' is disabled
ERROR: Error getting recommendations: Listing not found
```

---

## Validation Rules

### Recommendations
- `top_n`: 1-10 (enforced by Query validator)
- `listing_id`: Must exist in database

### Demand Forecast
- `district`: Required
- `days`: 1-14 (clamped to 14 if > 14)

### Priority
- `listing_id`: Must exist in database

### Route
- `listing_ids`: Must not be empty
- `depot.lat`: -90 to 90
- `depot.lng`: -180 to 180
- All listing IDs must exist in database

### Heatmap
- `district`: Optional

---

## Testing

### Unit Tests

Run tests:
```bash
cd backend
pytest tests/test_ml_router.py -v
```

### Test Coverage

Tests include:
- ✅ Feature flag OFF → 503
- ✅ Invalid listing_id → 404
- ✅ Empty route input → 422
- ✅ Demand days > 14 → clamped
- ✅ Invalid depot lat/lng → 422
- ✅ Missing depot keys → 422
- ✅ Success cases for all endpoints
- ✅ Edge cases (no data, not found)
- ✅ Boundary tests (min/max values)

### Manual Testing

```bash
# Test health check
curl http://localhost:8000/api/ml/v1/health

# Test with feature disabled
export ENABLE_ML_RECOMMENDER=false
curl http://localhost:8000/api/ml/v1/recommendations/123
# Should return 503

# Test validation error
curl -X POST http://localhost:8000/api/ml/v1/route \
  -H "Content-Type: application/json" \
  -d '{"listing_ids": [], "depot": {"lat": 40, "lng": -74}}'
# Should return 422

# Test not found
curl http://localhost:8000/api/ml/v1/recommendations/nonexistent
# Should return 404
```

---

## Integration

### Register Router

The router is registered in `backend/main.py`:

```python
from app.ml.router import router as ml_router_v1

app.include_router(ml_router_v1, tags=["ML v1"])
```

### Backward Compatibility

The legacy ML router (`/api/ml/*`) is still available for backward compatibility:

```python
from app.ml.routes import router as ml_router_legacy

app.include_router(ml_router_legacy, prefix="/api", tags=["ML Legacy"])
```

**Migration Path:**
1. New clients use `/api/ml/v1/*`
2. Old clients continue using `/api/ml/*`
3. Deprecate legacy routes in future version

---

## Performance Considerations

### Caching (Bonus)

For production, consider adding Redis caching:

```python
from redis import Redis
from functools import wraps

redis_client = Redis(host='localhost', port=6379, db=0)

def cache_response(ttl=300):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cache_key = f"{func.__name__}:{args}:{kwargs}"
            
            # Try cache
            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
            
            # Compute
            result = await func(*args, **kwargs)
            
            # Cache
            redis_client.setex(cache_key, ttl, json.dumps(result))
            
            return result
        return wrapper
    return decorator

@router.get("/recommendations/{listing_id}")
@cache_response(ttl=300)  # Cache for 5 minutes
async def get_recommendations(...):
    ...
```

### Response Time Logging

Add middleware to log response times:

```python
import time
from fastapi import Request

@app.middleware("http")
async def log_response_time(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    
    logger.info(f"{request.method} {request.url.path} - {duration:.3f}s")
    
    return response
```

---

## Best Practices

### 1. Feature Flags
- Use environment variables for easy toggling
- Log when features are disabled
- Return 503 (not 404) for disabled features

### 2. Validation
- Use Pydantic for request validation
- Validate at multiple levels (schema, business logic)
- Return clear error messages

### 3. Error Handling
- Use appropriate HTTP status codes
- Log errors with stack traces
- Don't expose internal errors to clients

### 4. Logging
- Log all requests
- Log feature flag checks
- Log errors with context

### 5. Documentation
- Use FastAPI's automatic docs
- Add clear docstrings
- Provide examples

---

## Migration Guide

### From Legacy to v1

**Old endpoint:**
```bash
curl http://localhost:8000/api/ml/recommendations/123
```

**New endpoint:**
```bash
curl http://localhost:8000/api/ml/v1/recommendations/123
```

**Changes:**
1. URL prefix changed from `/api/ml` to `/api/ml/v1`
2. Feature flags added (check `/health` for status)
3. Better error messages
4. Validation improvements

**Breaking Changes:**
- None (legacy endpoints still work)

---

## Troubleshooting

### Feature Returns 503
**Cause:** Feature flag is disabled

**Solution:** Enable in `.env`:
```bash
ENABLE_ML_RECOMMENDER=true
```

### Validation Error 422
**Cause:** Invalid request parameters

**Solution:** Check request format and parameter ranges

### Not Found 404
**Cause:** Resource doesn't exist in database

**Solution:** Verify listing/district exists

### Internal Error 500
**Cause:** Unexpected error

**Solution:** Check logs for details

---

## Summary

Phase 3 delivers:
- ✅ 6 production-grade ML endpoints
- ✅ Feature flag gating
- ✅ Comprehensive validation
- ✅ Proper error handling
- ✅ Logging
- ✅ Unit tests
- ✅ Documentation
- ✅ Backward compatibility

All endpoints are production-ready and follow FastAPI best practices! 🚀
