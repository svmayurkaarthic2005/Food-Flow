"""
ML API Router - Phase 3
Production-grade ML endpoints with feature flags, validation, and error handling
"""

import os
import logging
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Query, Depends, Body, status
from pydantic import BaseModel, Field, validator
from prisma import Prisma

from app.db.database import get_db
from app.ml.schemas.ml_schemas import NGOMatch, RouteResponse, HeatmapPoint
from app.ml.services import (
    recommend_ngos_for_listing,
    optimize_route,
    auto_score_listing_priority,
    calculate_hours_until_expiry
)

# Configure logging
logger = logging.getLogger(__name__)

# Feature flags from environment
ENABLE_ML_RECOMMENDER = os.getenv("ENABLE_ML_RECOMMENDER", "true").lower() == "true"
ENABLE_ML_DEMAND = os.getenv("ENABLE_ML_DEMAND", "true").lower() == "true"
ENABLE_ML_PRIORITY = os.getenv("ENABLE_ML_PRIORITY", "true").lower() == "true"
ENABLE_ML_ROUTE = os.getenv("ENABLE_ML_ROUTE", "true").lower() == "true"
ENABLE_ML_HEATMAP = os.getenv("ENABLE_ML_HEATMAP", "true").lower() == "true"

# Create router
router = APIRouter(prefix="/api/ml/v1", tags=["ML"])


# ============================================================================
# PYDANTIC SCHEMAS
# ============================================================================

class RouteRequest(BaseModel):
    """Request schema for route optimization."""
    listing_ids: List[int] = Field(..., min_items=1, description="List of listing IDs to include in route")
    depot: dict = Field(..., description="Depot location with lat and lng")
    
    @validator('depot')
    def validate_depot(cls, v):
        if 'lat' not in v or 'lng' not in v:
            raise ValueError("Depot must contain 'lat' and 'lng' keys")
        
        lat = v['lat']
        lng = v['lng']
        
        if not isinstance(lat, (int, float)) or not isinstance(lng, (int, float)):
            raise ValueError("Depot lat and lng must be numbers")
        
        if not (-90 <= lat <= 90):
            raise ValueError("Depot latitude must be between -90 and 90")
        
        if not (-180 <= lng <= 180):
            raise ValueError("Depot longitude must be between -180 and 180")
        
        return v


class DemandForecastResponse(BaseModel):
    """Response schema for demand forecast."""
    date: str = Field(..., description="Forecast date (YYYY-MM-DD)")
    category: str = Field(..., description="Food category")
    predicted: int = Field(..., ge=0, description="Predicted demand")
    low: int = Field(..., ge=0, description="Lower confidence interval")
    high: int = Field(..., ge=0, description="Upper confidence interval")


class PriorityResponse(BaseModel):
    """Response schema for priority scoring."""
    listing_id: str = Field(..., description="Listing ID")
    priority: str = Field(..., description="Priority level (CRITICAL, HIGH, MEDIUM, LOW)")
    score_inputs: dict = Field(..., description="Inputs used for scoring")


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def check_feature_enabled(feature_name: str, enabled: bool):
    """Check if a feature is enabled, raise 503 if not."""
    if not enabled:
        logger.warning(f"ML feature '{feature_name}' is disabled")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"ML feature '{feature_name}' is currently disabled"
        )


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/recommendations/{listing_id}", response_model=List[NGOMatch])
async def get_recommendations(
    listing_id: str,
    top_n: int = Query(3, ge=1, le=10, description="Number of recommendations to return"),
    db: Prisma = Depends(get_db)
):
    """
    Get NGO recommendations for a food listing.
    
    Returns top N NGOs ranked by distance, capacity, and acceptance rate.
    
    **Feature Flag:** ENABLE_ML_RECOMMENDER
    
    **Errors:**
    - 404: Listing not found
    - 503: Feature disabled
    """
    check_feature_enabled("recommender", ENABLE_ML_RECOMMENDER)
    
    logger.info(f"Getting recommendations for listing {listing_id}, top_n={top_n}")
    
    try:
        # Check if listing exists
        listing = await db.foodlisting.find_unique(where={'id': listing_id})
        if not listing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Listing with ID '{listing_id}' not found"
            )
        
        # Get recommendations
        recommendations = await recommend_ngos_for_listing(
            listing_id=listing_id,
            db=db,
            top_n=top_n
        )
        
        logger.info(f"Found {len(recommendations)} recommendations for listing {listing_id}")
        return recommendations
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting recommendations: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get recommendations: {str(e)}"
        )


@router.get("/demand", response_model=List[DemandForecastResponse])
async def get_demand_forecast(
    district: str = Query(..., description="District name"),
    days: int = Query(7, ge=1, le=14, description="Number of days to forecast (max 14)"),
    db: Prisma = Depends(get_db)
):
    """
    Get demand forecast for a district.
    
    Reads from pre-computed demand_forecasts table (does NOT recompute ML).
    
    **Feature Flag:** ENABLE_ML_DEMAND
    
    **Query Parameters:**
    - district: District name (required)
    - days: Number of days to forecast (default: 7, max: 14)
    
    **Errors:**
    - 404: No forecasts found for district
    - 503: Feature disabled
    """
    check_feature_enabled("demand", ENABLE_ML_DEMAND)
    
    # Clamp days to max 14
    days = min(days, 14)
    
    logger.info(f"Getting demand forecast for district '{district}', days={days}")
    
    try:
        # Calculate date range
        today = datetime.now().date()
        end_date = today + timedelta(days=days)
        
        # Query demand forecasts from database
        forecasts = await db.demandforecast.find_many(
            where={
                'district': district,
                'forecastDate': {
                    'gte': today,
                    'lte': end_date
                }
            },
            order_by={'forecastDate': 'asc'}
        )
        
        if not forecasts:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No demand forecasts found for district '{district}'"
            )
        
        # Convert to response format
        response = [
            DemandForecastResponse(
                date=forecast.forecastDate.strftime('%Y-%m-%d'),
                category=forecast.category,
                predicted=forecast.predicted,
                low=forecast.lowerCi,
                high=forecast.upperCi
            )
            for forecast in forecasts
        ]
        
        logger.info(f"Found {len(response)} forecasts for district '{district}'")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting demand forecast: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get demand forecast: {str(e)}"
        )


@router.get("/priority/{listing_id}", response_model=PriorityResponse)
async def get_priority_score(
    listing_id: str,
    db: Prisma = Depends(get_db)
):
    """
    Get priority score for a listing (debug visibility).
    
    Returns the priority level and the inputs used for scoring.
    
    **Feature Flag:** ENABLE_ML_PRIORITY
    
    **Errors:**
    - 404: Listing not found
    - 503: Feature disabled
    """
    check_feature_enabled("priority", ENABLE_ML_PRIORITY)
    
    logger.info(f"Getting priority score for listing {listing_id}")
    
    try:
        # Fetch listing
        listing = await db.foodlisting.find_unique(where={'id': listing_id})
        if not listing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Listing with ID '{listing_id}' not found"
            )
        
        # Calculate hours until expiry
        hours_until_expiry = calculate_hours_until_expiry(listing.expiryTime)
        
        # Get storage temp (may be None)
        storage_temp = getattr(listing, 'storageTemp', None)
        
        # Calculate priority
        priority = auto_score_listing_priority(
            expiry_time=listing.expiryTime,
            category=listing.category,
            storage_temp=storage_temp
        )
        
        # Build response
        response = PriorityResponse(
            listing_id=listing_id,
            priority=priority,
            score_inputs={
                "hours_until_expiry": round(hours_until_expiry, 2),
                "category": listing.category,
                "storage_temp": storage_temp
            }
        )
        
        logger.info(f"Priority for listing {listing_id}: {priority}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting priority score: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get priority score: {str(e)}"
        )


@router.post("/route", response_model=RouteResponse)
async def optimize_pickup_route(
    request: RouteRequest = Body(...),
    db: Prisma = Depends(get_db)
):
    """
    Optimize pickup route for multiple listings.
    
    Fetches listings from database and computes optimal route using TSP solver.
    
    **Feature Flag:** ENABLE_ML_ROUTE
    
    **Request Body:**
    ```json
    {
        "listing_ids": [1, 2, 3],
        "depot": {"lat": 40.7580, "lng": -73.9855}
    }
    ```
    
    **Errors:**
    - 404: One or more listings not found
    - 422: Validation error (empty listing_ids, invalid lat/lng)
    - 503: Feature disabled
    """
    check_feature_enabled("route", ENABLE_ML_ROUTE)
    
    logger.info(f"Optimizing route for {len(request.listing_ids)} listings")
    
    try:
        # Fetch listings from database
        listings = await db.foodlisting.find_many(
            where={'id': {'in': [str(lid) for lid in request.listing_ids]}}
        )
        
        if not listings:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No listings found with provided IDs"
            )
        
        if len(listings) != len(request.listing_ids):
            found_ids = {listing.id for listing in listings}
            missing_ids = set(str(lid) for lid in request.listing_ids) - found_ids
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Listings not found: {', '.join(missing_ids)}"
            )
        
        # Build stops list
        stops = [
            {
                'listing_id': int(listing.id) if listing.id.isdigit() else hash(listing.id) % (10 ** 8),
                'lat': listing.latitude,
                'lng': listing.longitude
            }
            for listing in listings
        ]
        
        # Optimize route
        route = optimize_route(stops=stops, depot=request.depot)
        
        logger.info(f"Route optimized: {len(route.stops)} stops, {route.total_minutes:.2f} minutes")
        return route
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error optimizing route: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to optimize route: {str(e)}"
        )


@router.get("/heatmap", response_model=List[HeatmapPoint])
async def get_demand_heatmap(
    district: Optional[str] = Query(None, description="District name (optional)"),
    db: Prisma = Depends(get_db)
):
    """
    Get demand heatmap data.
    
    Reads from demand_forecasts table and computes intensity values.
    Intensity = predicted / max(predicted in district), normalized to 0-1.
    
    **Feature Flag:** ENABLE_ML_HEATMAP
    
    **Query Parameters:**
    - district: Filter by district (optional)
    
    **Errors:**
    - 404: No forecasts found
    - 503: Feature disabled
    """
    check_feature_enabled("heatmap", ENABLE_ML_HEATMAP)
    
    logger.info(f"Getting heatmap data for district: {district or 'all'}")
    
    try:
        # Build query
        where_clause = {}
        if district:
            where_clause['district'] = district
        
        # Get recent forecasts (today onwards)
        today = datetime.now().date()
        where_clause['forecastDate'] = {'gte': today}
        
        forecasts = await db.demandforecast.find_many(
            where=where_clause,
            order_by={'predicted': 'desc'}
        )
        
        if not forecasts:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No demand forecasts found{' for district ' + district if district else ''}"
            )
        
        # Get max predicted value for normalization
        max_predicted = max(f.predicted for f in forecasts) if forecasts else 1
        
        # For heatmap, we need to aggregate by location
        # Since demand_forecasts don't have lat/lng, we need to join with listings
        # Get unique districts and their representative locations
        district_locations = {}
        
        for forecast in forecasts:
            if forecast.district not in district_locations:
                # Get a representative listing from this district
                sample_listing = await db.foodlisting.find_first(
                    where={'district': forecast.district}
                )
                if sample_listing:
                    district_locations[forecast.district] = {
                        'lat': sample_listing.latitude,
                        'lng': sample_listing.longitude,
                        'total_predicted': 0
                    }
            
            if forecast.district in district_locations:
                district_locations[forecast.district]['total_predicted'] += forecast.predicted
        
        # Build heatmap points
        heatmap_points = []
        for district_name, data in district_locations.items():
            intensity = min(data['total_predicted'] / max_predicted, 1.0) if max_predicted > 0 else 0.0
            
            heatmap_points.append(HeatmapPoint(
                lat=data['lat'],
                lng=data['lng'],
                intensity=round(intensity, 3)
            ))
        
        logger.info(f"Generated {len(heatmap_points)} heatmap points")
        return heatmap_points
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating heatmap: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate heatmap: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """
    Health check endpoint for ML services.
    
    Returns status of all ML features and their enabled/disabled state.
    """
    return {
        "status": "healthy",
        "features": {
            "recommender": ENABLE_ML_RECOMMENDER,
            "demand": ENABLE_ML_DEMAND,
            "priority": ENABLE_ML_PRIORITY,
            "route": ENABLE_ML_ROUTE,
            "heatmap": ENABLE_ML_HEATMAP
        },
        "version": "v1"
    }


@router.post("/run-nightly")
async def trigger_nightly_job():
    """
    Manually trigger the nightly ML data refresh job.
    
    This endpoint allows manual execution of the nightly job without waiting
    for the scheduled time. Useful for testing or immediate data refresh.
    
    **Note:** This is a long-running operation (may take several minutes).
    
    **Returns:**
    - Job execution results with statistics
    """
    logger.info("Manual trigger of nightly job requested")
    
    try:
        from app.jobs.nightly import run_nightly_jobs
        
        # Run the nightly job
        result = await run_nightly_jobs()
        
        return {
            "message": "Nightly job executed successfully",
            "result": result
        }
        
    except Exception as e:
        logger.error(f"Manual nightly job failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to run nightly job: {str(e)}"
        )
