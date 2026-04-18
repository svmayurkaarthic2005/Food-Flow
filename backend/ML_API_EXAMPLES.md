# ML API Examples - Request/Response Reference

## Base URL
```
http://localhost:8000/api/ml/v1
```

---

## 1. Recommendations

### Request
```bash
curl -X GET "http://localhost:8000/api/ml/v1/recommendations/123?top_n=3" \
  -H "Accept: application/json"
```

### Success Response (200)
```json
[
  {
    "ngo_id": 1,
    "name": "Food Bank Central",
    "score": 85,
    "distance_km": 5.2,
    "trust_score": 78,
    "trust_label": "High"
  },
  {
    "ngo_id": 2,
    "name": "Community Kitchen",
    "score": 72,
    "distance_km": 8.5,
    "trust_score": 65,
    "trust_label": "Medium"
  },
  {
    "ngo_id": 3,
    "name": "Helping Hands",
    "score": 68,
    "distance_km": 12.3,
    "trust_score": null,
    "trust_label": "New NGO"
  }
]
```

### Error Response - Not Found (404)
```json
{
  "detail": "Listing with ID '123' not found"
}
```

### Error Response - Feature Disabled (503)
```json
{
  "detail": "ML feature 'recommender' is currently disabled"
}
```

---

## 2. Demand Forecast

### Request
```bash
curl -X GET "http://localhost:8000/api/ml/v1/demand?district=Downtown&days=7" \
  -H "Accept: application/json"
```

### Success Response (200)
```json
[
  {
    "date": "2024-01-15",
    "category": "Bakery",
    "predicted": 25,
    "low": 18,
    "high": 32
  },
  {
    "date": "2024-01-16",
    "category": "Bakery",
    "predicted": 28,
    "low": 21,
    "high": 35
  },
  {
    "date": "2024-01-17",
    "category": "Dairy",
    "predicted": 15,
    "low": 10,
    "high": 20
  },
  {
    "date": "2024-01-18",
    "category": "Bakery",
    "predicted": 22,
    "low": 15,
    "high": 29
  },
  {
    "date": "2024-01-19",
    "category": "Dairy",
    "predicted": 18,
    "low": 12,
    "high": 24
  }
]
```

### Error Response - Not Found (404)
```json
{
  "detail": "No demand forecasts found for district 'NonExistent'"
}
```

### Error Response - Feature Disabled (503)
```json
{
  "detail": "ML feature 'demand' is currently disabled"
}
```

---

## 3. Priority Score

### Request
```bash
curl -X GET "http://localhost:8000/api/ml/v1/priority/123" \
  -H "Accept: application/json"
```

### Success Response (200)
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

### Example - Critical Priority
```json
{
  "listing_id": "456",
  "priority": "CRITICAL",
  "score_inputs": {
    "hours_until_expiry": 3.2,
    "category": "Cooked Food",
    "storage_temp": 30.0
  }
}
```

### Example - Low Priority
```json
{
  "listing_id": "789",
  "priority": "LOW",
  "score_inputs": {
    "hours_until_expiry": 96.0,
    "category": "Canned Goods",
    "storage_temp": 20.0
  }
}
```

### Error Response - Not Found (404)
```json
{
  "detail": "Listing with ID '123' not found"
}
```

---

## 4. Route Optimization

### Request
```bash
curl -X POST "http://localhost:8000/api/ml/v1/route" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "listing_ids": [1, 2, 3, 4],
    "depot": {
      "lat": 40.7580,
      "lng": -73.9855
    }
  }'
```

### Success Response (200)
```json
{
  "stops": [
    {
      "listing_id": 2,
      "lat": 40.7589,
      "lng": -73.9851,
      "eta_minutes": 5.2
    },
    {
      "listing_id": 4,
      "lat": 40.7614,
      "lng": -73.9776,
      "eta_minutes": 18.7
    },
    {
      "listing_id": 3,
      "lat": 40.7550,
      "lng": -73.9900,
      "eta_minutes": 32.4
    },
    {
      "listing_id": 1,
      "lat": 40.7128,
      "lng": -74.0060,
      "eta_minutes": 65.3
    }
  ],
  "total_minutes": 85.3,
  "warning": null
}
```

### Success Response with Warning
```json
{
  "stops": [...],
  "total_minutes": 145.8,
  "warning": "Route exceeds recommended time (120 minutes). Consider splitting into multiple routes."
}
```

### Error Response - Validation Error (422)
```json
{
  "detail": [
    {
      "loc": ["body", "listing_ids"],
      "msg": "ensure this value has at least 1 items",
      "type": "value_error.list.min_items"
    }
  ]
}
```

### Error Response - Invalid Depot (422)
```json
{
  "detail": [
    {
      "loc": ["body", "depot"],
      "msg": "Depot latitude must be between -90 and 90",
      "type": "value_error"
    }
  ]
}
```

### Error Response - Listings Not Found (404)
```json
{
  "detail": "Listings not found: 999, 998"
}
```

---

## 5. Heatmap

### Request - All Districts
```bash
curl -X GET "http://localhost:8000/api/ml/v1/heatmap" \
  -H "Accept: application/json"
```

### Request - Specific District
```bash
curl -X GET "http://localhost:8000/api/ml/v1/heatmap?district=Downtown" \
  -H "Accept: application/json"
```

### Success Response (200)
```json
[
  {
    "lat": 40.7128,
    "lng": -74.0060,
    "intensity": 0.95
  },
  {
    "lat": 40.7589,
    "lng": -73.9851,
    "intensity": 0.78
  },
  {
    "lat": 40.7614,
    "lng": -73.9776,
    "intensity": 0.62
  },
  {
    "lat": 40.7550,
    "lng": -73.9900,
    "intensity": 0.45
  },
  {
    "lat": 40.6782,
    "lng": -73.9442,
    "intensity": 0.23
  }
]
```

### Error Response - Not Found (404)
```json
{
  "detail": "No demand forecasts found for district 'NonExistent'"
}
```

---

## 6. Health Check

### Request
```bash
curl -X GET "http://localhost:8000/api/ml/v1/health" \
  -H "Accept: application/json"
```

### Success Response (200)
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

### Response with Disabled Features
```json
{
  "status": "healthy",
  "features": {
    "recommender": false,
    "demand": true,
    "priority": true,
    "route": true,
    "heatmap": false
  },
  "version": "v1"
}
```

---

## Python Client Examples

### Using httpx

```python
import httpx
import asyncio

async def get_recommendations(listing_id: str, top_n: int = 3):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"http://localhost:8000/api/ml/v1/recommendations/{listing_id}",
            params={"top_n": top_n}
        )
        response.raise_for_status()
        return response.json()

async def get_demand_forecast(district: str, days: int = 7):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "http://localhost:8000/api/ml/v1/demand",
            params={"district": district, "days": days}
        )
        response.raise_for_status()
        return response.json()

async def optimize_route(listing_ids: list, depot_lat: float, depot_lng: float):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/api/ml/v1/route",
            json={
                "listing_ids": listing_ids,
                "depot": {"lat": depot_lat, "lng": depot_lng}
            }
        )
        response.raise_for_status()
        return response.json()

# Usage
async def main():
    # Get recommendations
    recommendations = await get_recommendations("123", top_n=5)
    print(f"Found {len(recommendations)} recommendations")
    
    # Get demand forecast
    forecasts = await get_demand_forecast("Downtown", days=7)
    print(f"Found {len(forecasts)} forecasts")
    
    # Optimize route
    route = await optimize_route([1, 2, 3], 40.7580, -73.9855)
    print(f"Route has {len(route['stops'])} stops")

asyncio.run(main())
```

---

## JavaScript/TypeScript Client Examples

### Using fetch

```typescript
// Get recommendations
async function getRecommendations(listingId: string, topN: number = 3) {
  const response = await fetch(
    `http://localhost:8000/api/ml/v1/recommendations/${listingId}?top_n=${topN}`
  );
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  
  return response.json();
}

// Get demand forecast
async function getDemandForecast(district: string, days: number = 7) {
  const response = await fetch(
    `http://localhost:8000/api/ml/v1/demand?district=${district}&days=${days}`
  );
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  
  return response.json();
}

// Optimize route
async function optimizeRoute(listingIds: number[], depot: {lat: number, lng: number}) {
  const response = await fetch(
    'http://localhost:8000/api/ml/v1/route',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        listing_ids: listingIds,
        depot: depot
      })
    }
  );
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  
  return response.json();
}

// Usage
async function main() {
  try {
    // Get recommendations
    const recommendations = await getRecommendations('123', 5);
    console.log(`Found ${recommendations.length} recommendations`);
    
    // Get demand forecast
    const forecasts = await getDemandForecast('Downtown', 7);
    console.log(`Found ${forecasts.length} forecasts`);
    
    // Optimize route
    const route = await optimizeRoute([1, 2, 3], {lat: 40.7580, lng: -73.9855});
    console.log(`Route has ${route.stops.length} stops`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
```

---

## Error Handling Examples

### Python with httpx

```python
import httpx

async def safe_get_recommendations(listing_id: str):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"http://localhost:8000/api/ml/v1/recommendations/{listing_id}"
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                print(f"Listing {listing_id} not found")
            elif e.response.status_code == 503:
                print("Recommender service is disabled")
            else:
                print(f"HTTP error: {e.response.status_code}")
            return []
        except Exception as e:
            print(f"Error: {str(e)}")
            return []
```

### TypeScript with fetch

```typescript
async function safeGetRecommendations(listingId: string) {
  try {
    const response = await fetch(
      `http://localhost:8000/api/ml/v1/recommendations/${listingId}`
    );
    
    if (response.status === 404) {
      console.log(`Listing ${listingId} not found`);
      return [];
    }
    
    if (response.status === 503) {
      console.log('Recommender service is disabled');
      return [];
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}
```

---

## Testing with curl

### Test Feature Flag
```bash
# Disable feature
export ENABLE_ML_RECOMMENDER=false

# Restart server
python backend/main.py

# Test endpoint (should return 503)
curl http://localhost:8000/api/ml/v1/recommendations/123
```

### Test Validation
```bash
# Empty listing_ids (should return 422)
curl -X POST http://localhost:8000/api/ml/v1/route \
  -H "Content-Type: application/json" \
  -d '{"listing_ids": [], "depot": {"lat": 40, "lng": -74}}'

# Invalid latitude (should return 422)
curl -X POST http://localhost:8000/api/ml/v1/route \
  -H "Content-Type: application/json" \
  -d '{"listing_ids": [1], "depot": {"lat": 100, "lng": -74}}'
```

### Test Not Found
```bash
# Non-existent listing (should return 404)
curl http://localhost:8000/api/ml/v1/recommendations/nonexistent

# Non-existent district (should return 404)
curl "http://localhost:8000/api/ml/v1/demand?district=NonExistent"
```

---

## Summary

This document provides:
- ✅ Complete request/response examples
- ✅ Error response formats
- ✅ Python client code
- ✅ TypeScript client code
- ✅ Error handling examples
- ✅ Testing commands

Use these examples as a reference for integrating with the ML API! 🚀
