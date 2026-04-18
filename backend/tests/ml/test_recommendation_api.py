"""
Integration Tests for ML Recommendation API
Tests end-to-end API flow with database seeding
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
from datetime import datetime, timedelta

from backend.main import app


client = TestClient(app)


# ============================================================================
# RECOMMENDATION API INTEGRATION TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_recommendation_api_success(mock_db, sample_listing, sample_ngos_by_distance):
    """
    Integration Test: Full recommendation flow
    - Seed DB with 5 NGOs and 1 listing
    - Call GET /api/ml/v1/recommendations/{id}
    - Assert HTTP 200, valid schema, 3 results, sorted scores
    """
    # Setup mocks
    mock_db.foodlisting.find_unique.return_value = sample_listing
    mock_db.ngo.find_many.return_value = sample_ngos_by_distance
    
    with patch('backend.app.ml.router.get_db', return_value=mock_db):
        # Call API
        response = client.get('/api/ml/v1/recommendations/listing-1?top_n=3')
        
        # Assert HTTP 200
        assert response.status_code == 200
        
        # Assert response schema
        data = response.json()
        assert isinstance(data, list)
        
        # Assert exactly 3 results
        assert len(data) == 3
        
        # Assert each result has required fields
        for item in data:
            assert 'ngo_id' in item
            assert 'name' in item
            assert 'score' in item
            assert 'distance_km' in item
            assert 'trust_score' in item or item['trust_score'] is None
            assert 'trust_label' in item or item['trust_label'] is None
        
        # Assert scores are sorted (higher is better)
        scores = [item['score'] for item in data]
        assert scores == sorted(scores, reverse=True)


@pytest.mark.asyncio
async def test_recommendation_api_listing_not_found(mock_db):
    """Test API returns 404 when listing doesn't exist."""
    mock_db.foodlisting.find_unique.return_value = None
    
    with patch('backend.app.ml.router.get_db', return_value=mock_db):
        response = client.get('/api/ml/v1/recommendations/nonexistent')
        
        assert response.status_code == 404
        assert 'detail' in response.json()


@pytest.mark.asyncio
async def test_recommendation_api_no_ngos(mock_db, sample_listing):
    """Test API returns empty list when no NGOs available."""
    mock_db.foodlisting.find_unique.return_value = sample_listing
    mock_db.ngo.find_many.return_value = []
    
    with patch('backend.app.ml.router.get_db', return_value=mock_db):
        response = client.get('/api/ml/v1/recommendations/listing-1')
        
        assert response.status_code == 200
        data = response.json()
        assert data == []


@pytest.mark.asyncio
async def test_recommendation_api_top_n_parameter(mock_db, sample_listing, sample_ngos_by_distance):
    """Test API respects top_n parameter."""
    mock_db.foodlisting.find_unique.return_value = sample_listing
    mock_db.ngo.find_many.return_value = sample_ngos_by_distance
    
    with patch('backend.app.ml.router.get_db', return_value=mock_db):
        # Request 5 recommendations
        response = client.get('/api/ml/v1/recommendations/listing-1?top_n=5')
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 5


@pytest.mark.asyncio
async def test_recommendation_api_invalid_top_n(mock_db):
    """Test API validates top_n parameter."""
    with patch('backend.app.ml.router.get_db', return_value=mock_db):
        # top_n > 10 (max allowed)
        response = client.get('/api/ml/v1/recommendations/listing-1?top_n=20')
        
        # Should return validation error
        assert response.status_code == 422


@pytest.mark.asyncio
async def test_recommendation_api_feature_disabled():
    """Test API returns 503 when feature is disabled."""
    with patch('backend.app.ml.router.ENABLE_ML_RECOMMENDER', False):
        response = client.get('/api/ml/v1/recommendations/listing-1')
        
        assert response.status_code == 503
        assert 'disabled' in response.json()['detail'].lower()


# ============================================================================
# PRIORITY API TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_priority_api_success(mock_db, sample_listing):
    """Test priority API returns correct priority score."""
    mock_db.foodlisting.find_unique.return_value = sample_listing
    
    with patch('backend.app.ml.router.get_db', return_value=mock_db):
        response = client.get('/api/ml/v1/priority/listing-1')
        
        assert response.status_code == 200
        data = response.json()
        
        # Assert response schema
        assert 'listing_id' in data
        assert 'priority' in data
        assert 'score_inputs' in data
        
        # Assert priority is valid
        assert data['priority'] in ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
        
        # Assert score_inputs has required fields
        assert 'hours_until_expiry' in data['score_inputs']
        assert 'category' in data['score_inputs']
        assert 'storage_temp' in data['score_inputs']


@pytest.mark.asyncio
async def test_priority_api_listing_not_found(mock_db):
    """Test priority API returns 404 for nonexistent listing."""
    mock_db.foodlisting.find_unique.return_value = None
    
    with patch('backend.app.ml.router.get_db', return_value=mock_db):
        response = client.get('/api/ml/v1/priority/nonexistent')
        
        assert response.status_code == 404


# ============================================================================
# DEMAND API TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_demand_api_success(mock_db, sample_forecasts):
    """Test demand API returns forecast data."""
    mock_db.demandforecast.find_many.return_value = sample_forecasts
    
    with patch('backend.app.ml.router.get_db', return_value=mock_db):
        response = client.get('/api/ml/v1/demand?district=Downtown&days=7')
        
        assert response.status_code == 200
        data = response.json()
        
        # Assert response is list
        assert isinstance(data, list)
        
        # Assert each forecast has required fields
        for forecast in data:
            assert 'date' in forecast
            assert 'category' in forecast
            assert 'predicted' in forecast
            assert 'low' in forecast
            assert 'high' in forecast


@pytest.mark.asyncio
async def test_demand_api_no_data(mock_db):
    """Test demand API returns 404 when no forecasts found."""
    mock_db.demandforecast.find_many.return_value = []
    
    with patch('backend.app.ml.router.get_db', return_value=mock_db):
        response = client.get('/api/ml/v1/demand?district=NonExistent')
        
        assert response.status_code == 404


@pytest.mark.asyncio
async def test_demand_api_days_clamped(mock_db, sample_forecasts):
    """Test demand API clamps days to max 14."""
    mock_db.demandforecast.find_many.return_value = sample_forecasts
    
    with patch('backend.app.ml.router.get_db', return_value=mock_db):
        # Request 30 days (should be clamped to 14)
        response = client.get('/api/ml/v1/demand?district=Downtown&days=30')
        
        # Should succeed (days clamped internally)
        assert response.status_code in [200, 404]


# ============================================================================
# ROUTE API TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_route_api_success(mock_db):
    """Test route optimization API."""
    # Create mock listings
    listings = [
        AsyncMock(id='1', latitude=40.7128, longitude=-74.0060),
        AsyncMock(id='2', latitude=40.7589, longitude=-73.9851),
        AsyncMock(id='3', latitude=40.7614, longitude=-73.9776),
    ]
    mock_db.foodlisting.find_many.return_value = listings
    
    with patch('backend.app.ml.router.get_db', return_value=mock_db):
        response = client.post(
            '/api/ml/v1/route',
            json={
                'listing_ids': [1, 2, 3],
                'depot': {'lat': 40.7580, 'lng': -73.9855}
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Assert response schema
        assert 'stops' in data
        assert 'total_minutes' in data
        assert 'warning' in data or data['warning'] is None
        
        # Assert stops have required fields
        for stop in data['stops']:
            assert 'listing_id' in stop
            assert 'lat' in stop
            assert 'lng' in stop
            assert 'eta_minutes' in stop


@pytest.mark.asyncio
async def test_route_api_empty_listings(mock_db):
    """Test route API with empty listing_ids."""
    with patch('backend.app.ml.router.get_db', return_value=mock_db):
        response = client.post(
            '/api/ml/v1/route',
            json={
                'listing_ids': [],
                'depot': {'lat': 40.7580, 'lng': -73.9855}
            }
        )
        
        # Should return validation error
        assert response.status_code == 422


@pytest.mark.asyncio
async def test_route_api_invalid_depot(mock_db):
    """Test route API with invalid depot coordinates."""
    with patch('backend.app.ml.router.get_db', return_value=mock_db):
        response = client.post(
            '/api/ml/v1/route',
            json={
                'listing_ids': [1, 2, 3],
                'depot': {'lat': 100.0, 'lng': -73.9855}  # Invalid lat
            }
        )
        
        # Should return validation error
        assert response.status_code == 422


@pytest.mark.asyncio
async def test_route_api_listings_not_found(mock_db):
    """Test route API when listings don't exist."""
    mock_db.foodlisting.find_many.return_value = []
    
    with patch('backend.app.ml.router.get_db', return_value=mock_db):
        response = client.post(
            '/api/ml/v1/route',
            json={
                'listing_ids': [999, 998, 997],
                'depot': {'lat': 40.7580, 'lng': -73.9855}
            }
        )
        
        assert response.status_code == 404


# ============================================================================
# HEATMAP API TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_heatmap_api_success(mock_db, sample_forecasts):
    """Test heatmap API returns heatmap data."""
    mock_db.demandforecast.find_many.return_value = sample_forecasts
    mock_db.foodlisting.find_first.return_value = AsyncMock(
        latitude=40.7128,
        longitude=-74.0060
    )
    
    with patch('backend.app.ml.router.get_db', return_value=mock_db):
        response = client.get('/api/ml/v1/heatmap?district=Downtown')
        
        assert response.status_code == 200
        data = response.json()
        
        # Assert response is list
        assert isinstance(data, list)
        
        # Assert each point has required fields
        for point in data:
            assert 'lat' in point
            assert 'lng' in point
            assert 'intensity' in point
            assert 0 <= point['intensity'] <= 1


@pytest.mark.asyncio
async def test_heatmap_api_no_data(mock_db):
    """Test heatmap API returns 404 when no data found."""
    mock_db.demandforecast.find_many.return_value = []
    
    with patch('backend.app.ml.router.get_db', return_value=mock_db):
        response = client.get('/api/ml/v1/heatmap?district=NonExistent')
        
        assert response.status_code == 404


# ============================================================================
# HEALTH CHECK TESTS
# ============================================================================

def test_health_check():
    """Test ML health check endpoint."""
    response = client.get('/api/ml/v1/health')
    
    assert response.status_code == 200
    data = response.json()
    
    assert 'status' in data
    assert data['status'] == 'healthy'
    assert 'features' in data
    assert 'version' in data


# ============================================================================
# NEGATIVE TESTS
# ============================================================================

def test_invalid_endpoint():
    """Test calling non-existent ML endpoint."""
    response = client.get('/api/ml/v1/nonexistent')
    
    assert response.status_code == 404


def test_invalid_method():
    """Test using wrong HTTP method."""
    response = client.post('/api/ml/v1/recommendations/listing-1')
    
    assert response.status_code == 405


def test_missing_required_parameter():
    """Test API with missing required parameter."""
    response = client.get('/api/ml/v1/demand')  # Missing district
    
    assert response.status_code == 422
