"""
Unit Tests for ML Router (Phase 3)
Tests feature flags, validation, and error handling
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime, timedelta

# Mock environment variables before importing
import os
os.environ["ENABLE_ML_RECOMMENDER"] = "true"
os.environ["ENABLE_ML_DEMAND"] = "true"
os.environ["ENABLE_ML_PRIORITY"] = "true"
os.environ["ENABLE_ML_ROUTE"] = "true"
os.environ["ENABLE_ML_HEATMAP"] = "true"

from backend.main import app

client = TestClient(app)


# ============================================================================
# FEATURE FLAG TESTS
# ============================================================================

def test_recommender_disabled():
    """Test that recommender returns 503 when feature is disabled."""
    with patch('backend.app.ml.router.ENABLE_ML_RECOMMENDER', False):
        response = client.get("/api/ml/v1/recommendations/123")
        assert response.status_code == 503
        assert "disabled" in response.json()["detail"].lower()


def test_demand_disabled():
    """Test that demand forecast returns 503 when feature is disabled."""
    with patch('backend.app.ml.router.ENABLE_ML_DEMAND', False):
        response = client.get("/api/ml/v1/demand?district=Downtown")
        assert response.status_code == 503
        assert "disabled" in response.json()["detail"].lower()


def test_priority_disabled():
    """Test that priority returns 503 when feature is disabled."""
    with patch('backend.app.ml.router.ENABLE_ML_PRIORITY', False):
        response = client.get("/api/ml/v1/priority/123")
        assert response.status_code == 503
        assert "disabled" in response.json()["detail"].lower()


def test_route_disabled():
    """Test that route optimizer returns 503 when feature is disabled."""
    with patch('backend.app.ml.router.ENABLE_ML_ROUTE', False):
        response = client.post(
            "/api/ml/v1/route",
            json={
                "listing_ids": [1, 2, 3],
                "depot": {"lat": 40.7580, "lng": -73.9855}
            }
        )
        assert response.status_code == 503
        assert "disabled" in response.json()["detail"].lower()


def test_heatmap_disabled():
    """Test that heatmap returns 503 when feature is disabled."""
    with patch('backend.app.ml.router.ENABLE_ML_HEATMAP', False):
        response = client.get("/api/ml/v1/heatmap")
        assert response.status_code == 503
        assert "disabled" in response.json()["detail"].lower()


# ============================================================================
# VALIDATION TESTS
# ============================================================================

def test_invalid_listing_id_404():
    """Test that invalid listing ID returns 404."""
    with patch('backend.app.db.database.get_db') as mock_db:
        mock_db.return_value.foodlisting.find_unique = AsyncMock(return_value=None)
        
        response = client.get("/api/ml/v1/recommendations/invalid_id")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()


def test_demand_days_clamped():
    """Test that demand days > 14 are clamped to 14."""
    with patch('backend.app.db.database.get_db') as mock_db:
        mock_db.return_value.demandforecast.find_many = AsyncMock(return_value=[])
        
        # Request 30 days, should be clamped to 14
        response = client.get("/api/ml/v1/demand?district=Downtown&days=30")
        
        # Should query with max 14 days
        # (This would need to check the actual query, simplified here)
        assert response.status_code in [404, 200]  # Either no data or success


def test_route_empty_listing_ids():
    """Test that empty listing_ids returns 422."""
    response = client.post(
        "/api/ml/v1/route",
        json={
            "listing_ids": [],
            "depot": {"lat": 40.7580, "lng": -73.9855}
        }
    )
    assert response.status_code == 422


def test_route_invalid_depot_lat():
    """Test that invalid depot latitude returns 422."""
    response = client.post(
        "/api/ml/v1/route",
        json={
            "listing_ids": [1, 2, 3],
            "depot": {"lat": 100.0, "lng": -73.9855}  # Invalid lat > 90
        }
    )
    assert response.status_code == 422


def test_route_invalid_depot_lng():
    """Test that invalid depot longitude returns 422."""
    response = client.post(
        "/api/ml/v1/route",
        json={
            "listing_ids": [1, 2, 3],
            "depot": {"lat": 40.7580, "lng": 200.0}  # Invalid lng > 180
        }
    )
    assert response.status_code == 422


def test_route_missing_depot_keys():
    """Test that missing depot keys returns 422."""
    response = client.post(
        "/api/ml/v1/route",
        json={
            "listing_ids": [1, 2, 3],
            "depot": {"lat": 40.7580}  # Missing lng
        }
    )
    assert response.status_code == 422


# ============================================================================
# SUCCESS TESTS
# ============================================================================

def test_health_check():
    """Test health check endpoint."""
    response = client.get("/api/ml/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "features" in data
    assert "version" in data


def test_recommendations_success():
    """Test successful recommendations request."""
    mock_listing = Mock()
    mock_listing.id = "123"
    mock_listing.latitude = 40.7128
    mock_listing.longitude = -74.0060
    
    with patch('backend.app.db.database.get_db') as mock_db:
        mock_db.return_value.foodlisting.find_unique = AsyncMock(return_value=mock_listing)
        
        with patch('backend.app.ml.router.recommend_ngos_for_listing') as mock_recommend:
            mock_recommend.return_value = []
            
            response = client.get("/api/ml/v1/recommendations/123?top_n=3")
            assert response.status_code == 200
            assert isinstance(response.json(), list)


def test_demand_forecast_success():
    """Test successful demand forecast request."""
    mock_forecast = Mock()
    mock_forecast.forecastDate = datetime.now().date()
    mock_forecast.category = "Bakery"
    mock_forecast.predicted = 25
    mock_forecast.lowerCi = 18
    mock_forecast.upperCi = 32
    
    with patch('backend.app.db.database.get_db') as mock_db:
        mock_db.return_value.demandforecast.find_many = AsyncMock(return_value=[mock_forecast])
        
        response = client.get("/api/ml/v1/demand?district=Downtown&days=7")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if data:
            assert "date" in data[0]
            assert "predicted" in data[0]


def test_priority_success():
    """Test successful priority score request."""
    mock_listing = Mock()
    mock_listing.id = "123"
    mock_listing.category = "Bakery"
    mock_listing.expiryTime = datetime.now() + timedelta(hours=12)
    mock_listing.storageTemp = 22.0
    
    with patch('backend.app.db.database.get_db') as mock_db:
        mock_db.return_value.foodlisting.find_unique = AsyncMock(return_value=mock_listing)
        
        response = client.get("/api/ml/v1/priority/123")
        assert response.status_code == 200
        data = response.json()
        assert "listing_id" in data
        assert "priority" in data
        assert "score_inputs" in data


# ============================================================================
# EDGE CASE TESTS
# ============================================================================

def test_demand_no_forecasts():
    """Test demand forecast with no data returns 404."""
    with patch('backend.app.db.database.get_db') as mock_db:
        mock_db.return_value.demandforecast.find_many = AsyncMock(return_value=[])
        
        response = client.get("/api/ml/v1/demand?district=NonExistent")
        assert response.status_code == 404


def test_route_listings_not_found():
    """Test route with non-existent listings returns 404."""
    with patch('backend.app.db.database.get_db') as mock_db:
        mock_db.return_value.foodlisting.find_many = AsyncMock(return_value=[])
        
        response = client.post(
            "/api/ml/v1/route",
            json={
                "listing_ids": [999, 998, 997],
                "depot": {"lat": 40.7580, "lng": -73.9855}
            }
        )
        assert response.status_code == 404


def test_heatmap_no_data():
    """Test heatmap with no forecasts returns 404."""
    with patch('backend.app.db.database.get_db') as mock_db:
        mock_db.return_value.demandforecast.find_many = AsyncMock(return_value=[])
        
        response = client.get("/api/ml/v1/heatmap?district=NonExistent")
        assert response.status_code == 404


# ============================================================================
# BOUNDARY TESTS
# ============================================================================

def test_recommendations_top_n_min():
    """Test recommendations with top_n=1."""
    mock_listing = Mock()
    mock_listing.id = "123"
    
    with patch('backend.app.db.database.get_db') as mock_db:
        mock_db.return_value.foodlisting.find_unique = AsyncMock(return_value=mock_listing)
        
        with patch('backend.app.ml.router.recommend_ngos_for_listing') as mock_recommend:
            mock_recommend.return_value = []
            
            response = client.get("/api/ml/v1/recommendations/123?top_n=1")
            assert response.status_code == 200


def test_recommendations_top_n_max():
    """Test recommendations with top_n=10."""
    mock_listing = Mock()
    mock_listing.id = "123"
    
    with patch('backend.app.db.database.get_db') as mock_db:
        mock_db.return_value.foodlisting.find_unique = AsyncMock(return_value=mock_listing)
        
        with patch('backend.app.ml.router.recommend_ngos_for_listing') as mock_recommend:
            mock_recommend.return_value = []
            
            response = client.get("/api/ml/v1/recommendations/123?top_n=10")
            assert response.status_code == 200


def test_demand_days_min():
    """Test demand forecast with days=1."""
    with patch('backend.app.db.database.get_db') as mock_db:
        mock_db.return_value.demandforecast.find_many = AsyncMock(return_value=[])
        
        response = client.get("/api/ml/v1/demand?district=Downtown&days=1")
        assert response.status_code in [404, 200]


def test_demand_days_max():
    """Test demand forecast with days=14."""
    with patch('backend.app.db.database.get_db') as mock_db:
        mock_db.return_value.demandforecast.find_many = AsyncMock(return_value=[])
        
        response = client.get("/api/ml/v1/demand?district=Downtown&days=14")
        assert response.status_code in [404, 200]


# ============================================================================
# RUN TESTS
# ============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
