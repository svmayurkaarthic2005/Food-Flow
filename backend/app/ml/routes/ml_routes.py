"""
ML API Routes
Endpoints for ML services: recommendations, demand forecasting, route optimization
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Depends
from prisma import Prisma

from app.db.database import get_db
from app.ml.schemas.ml_schemas import NGOMatch, DemandForecast, RouteResponse
from app.ml.services import (
    recommend_ngos_for_listing,
    predict_demand,
    optimize_route,
    retrain_model,
    update_ngo_trust_score,
    batch_update_trust_scores
)


router = APIRouter(prefix="/ml", tags=["ML Services"])


@router.get("/recommendations/{listing_id}", response_model=List[NGOMatch])
async def get_ngo_recommendations(
    listing_id: str,
    top_n: int = Query(3, ge=1, le=10, description="Number of recommendations"),
    db: Prisma = Depends(get_db)
):
    """
    Get NGO recommendations for a food listing.
    
    Returns top N NGOs ranked by distance, capacity, and acceptance rate.
    """
    try:
        recommendations = await recommend_ngos_for_listing(
            listing_id=listing_id,
            db=db,
            top_n=top_n
        )
        return recommendations
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}")


@router.get("/demand/forecast", response_model=List[DemandForecast])
async def get_demand_forecast(
    district: str = Query(..., description="District name"),
    category: str = Query(..., description="Food category"),
    days_ahead: int = Query(7, ge=1, le=30, description="Number of days to forecast"),
    db: Prisma = Depends(get_db)
):
    """
    Get demand forecast for a district and category.
    
    Returns predicted demand with confidence intervals for the next N days.
    """
    try:
        forecasts = await predict_demand(
            district=district,
            category=category,
            db=db,
            days_ahead=days_ahead
        )
        
        if not forecasts:
            raise HTTPException(
                status_code=404,
                detail="Insufficient historical data for prediction"
            )
        
        return forecasts
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to predict demand: {str(e)}")


@router.post("/demand/retrain")
async def retrain_demand_model(
    db: Prisma = Depends(get_db)
):
    """
    Force retrain the demand prediction model.
    
    Use this endpoint to update the model with latest data.
    """
    try:
        result = await retrain_model(db)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrain model: {str(e)}")


@router.post("/route/optimize", response_model=RouteResponse)
async def optimize_pickup_route(
    stops: List[dict],
    depot_lat: float = Query(..., ge=-90, le=90, description="Depot latitude"),
    depot_lng: float = Query(..., ge=-180, le=180, description="Depot longitude")
):
    """
    Optimize pickup route for multiple listings.
    
    Request body should contain list of stops with:
    - listing_id: int
    - lat: float
    - lng: float
    
    Returns optimized route with ETAs and total time.
    """
    try:
        # Validate stops
        if not stops:
            raise HTTPException(status_code=400, detail="No stops provided")
        
        for stop in stops:
            if not all(k in stop for k in ['listing_id', 'lat', 'lng']):
                raise HTTPException(
                    status_code=400,
                    detail="Each stop must have listing_id, lat, and lng"
                )
        
        depot = {'lat': depot_lat, 'lng': depot_lng}
        
        route = optimize_route(stops=stops, depot=depot)
        return route
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to optimize route: {str(e)}")


@router.post("/trust/update/{ngo_id}")
async def update_trust_score(
    ngo_id: str,
    db: Prisma = Depends(get_db)
):
    """
    Update trust score for a specific NGO.
    
    Recalculates trust score based on latest claim history.
    """
    try:
        result = await update_ngo_trust_score(ngo_id, db)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update trust score: {str(e)}")


@router.post("/trust/batch-update")
async def batch_update_trust(
    ngo_ids: Optional[List[str]] = None,
    db: Prisma = Depends(get_db)
):
    """
    Batch update trust scores for multiple NGOs.
    
    If ngo_ids is not provided, updates all NGOs.
    """
    try:
        result = await batch_update_trust_scores(db, ngo_ids)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to batch update trust scores: {str(e)}")


@router.get("/health")
async def ml_health_check():
    """
    Health check endpoint for ML services.
    """
    return {
        "status": "healthy",
        "services": [
            "recommender",
            "demand_predictor",
            "route_optimizer",
            "trust_scorer",
            "spoilage_scorer"
        ]
    }
