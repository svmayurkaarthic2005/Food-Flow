"""
ML Schemas for FoodFlow ML Module
Pydantic v2 models for ML API responses
"""

from datetime import date
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class NGOMatch(BaseModel):
    """Schema for NGO matching results."""
    
    model_config = ConfigDict(from_attributes=True)
    
    ngo_id: int = Field(..., description="NGO database ID")
    name: str = Field(..., description="NGO organization name")
    score: int = Field(..., ge=0, le=100, description="Match score (0-100)")
    distance_km: float = Field(..., ge=0, description="Distance in kilometers")
    trust_score: Optional[int] = Field(None, ge=0, le=100, description="Trust score (0-100)")
    trust_label: Optional[str] = Field(None, description="Trust label (e.g., 'New NGO', 'Trusted')")


class DemandForecast(BaseModel):
    """Schema for demand forecast data."""
    
    model_config = ConfigDict(from_attributes=True)
    
    date: date = Field(..., description="Forecast date")
    category: str = Field(..., description="Food category")
    predicted: int = Field(..., ge=0, description="Predicted demand")
    low: int = Field(..., ge=0, description="Lower confidence interval")
    high: int = Field(..., ge=0, description="Upper confidence interval")


class RouteStop(BaseModel):
    """Schema for a single route stop."""
    
    model_config = ConfigDict(from_attributes=True)
    
    listing_id: int = Field(..., description="Food listing ID")
    lat: float = Field(..., ge=-90, le=90, description="Latitude")
    lng: float = Field(..., ge=-180, le=180, description="Longitude")
    eta_minutes: float = Field(..., ge=0, description="Estimated time of arrival in minutes")


class RouteResponse(BaseModel):
    """Schema for optimized route response."""
    
    model_config = ConfigDict(from_attributes=True)
    
    stops: list[RouteStop] = Field(..., description="List of route stops in order")
    total_minutes: float = Field(..., ge=0, description="Total route duration in minutes")
    warning: Optional[str] = Field(None, description="Warning message if any")


class HeatmapPoint(BaseModel):
    """Schema for heatmap data point."""
    
    model_config = ConfigDict(from_attributes=True)
    
    lat: float = Field(..., ge=-90, le=90, description="Latitude")
    lng: float = Field(..., ge=-180, le=180, description="Longitude")
    intensity: float = Field(..., ge=0, le=1, description="Intensity value (0-1)")
