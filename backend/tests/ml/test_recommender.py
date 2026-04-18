"""
Unit Tests for NGO Recommender System
Tests recommendation logic, scoring, and edge cases
"""

import pytest
from unittest.mock import AsyncMock, patch
from datetime import datetime, timedelta

from app.ml.services.recommender import (
    recommend_ngos_for_listing,
    haversine_distance,
    calculate_ngo_metrics
)


# ============================================================================
# HAVERSINE DISTANCE TESTS
# ============================================================================

def test_haversine_distance_same_point():
    """Test distance between same point is 0."""
    distance = haversine_distance(40.7580, -73.9855, 40.7580, -73.9855)
    assert distance == 0.0


def test_haversine_distance_known_points():
    """Test distance between known points (NYC to LA ~3936 km)."""
    # NYC: 40.7128, -74.0060
    # LA: 34.0522, -118.2437
    distance = haversine_distance(40.7128, -74.0060, 34.0522, -118.2437)
    
    # Should be approximately 3936 km (allow 5% margin)
    assert 3700 < distance < 4100


def test_haversine_distance_short():
    """Test short distance calculation (< 1 km)."""
    # Two points very close together
    distance = haversine_distance(40.7580, -73.9855, 40.7585, -73.9860)
    
    # Should be less than 1 km
    assert distance < 1.0


# ============================================================================
# NGO METRICS TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_calculate_ngo_metrics_no_claims(mock_db, sample_ngo):
    """Test metrics calculation for NGO with no claims."""
    sample_ngo.claims = []
    mock_db.ngo.find_unique.return_value = sample_ngo
    
    capacity_score, acceptance_rate = await calculate_ngo_metrics('ngo-1', mock_db)
    
    # Capacity score should be based on available capacity
    # (1000 - 200) / 1000 = 0.8
    assert capacity_score == 0.8
    
    # Default acceptance rate for no claims
    assert acceptance_rate == 0.5


@pytest.mark.asyncio
async def test_calculate_ngo_metrics_with_claims(mock_db, ngo_with_perfect_record):
    """Test metrics calculation for NGO with claims."""
    mock_db.ngo.find_unique.return_value = ngo_with_perfect_record
    
    capacity_score, acceptance_rate = await calculate_ngo_metrics('ngo-perfect', mock_db)
    
    # All claims completed, so acceptance rate should be 1.0
    assert acceptance_rate == 1.0
    
    # Capacity score should be positive
    assert 0 <= capacity_score <= 1.0


@pytest.mark.asyncio
async def test_calculate_ngo_metrics_ngo_not_found(mock_db):
    """Test metrics calculation when NGO doesn't exist."""
    mock_db.ngo.find_unique.return_value = None
    
    capacity_score, acceptance_rate = await calculate_ngo_metrics('nonexistent', mock_db)
    
    assert capacity_score == 0.0
    assert acceptance_rate == 0.0


# ============================================================================
# RECOMMENDATION TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_recommend_exactly_3_results(mock_db, sample_listing, sample_ngos_by_distance):
    """Test 1: Returns exactly 3 results when 5 NGOs available."""
    mock_db.foodlisting.find_unique.return_value = sample_listing
    mock_db.ngo.find_many.return_value = sample_ngos_by_distance
    
    recommendations = await recommend_ngos_for_listing('listing-1', mock_db, top_n=3)
    
    assert len(recommendations) == 3


@pytest.mark.asyncio
async def test_recommend_score_decreases_with_distance(mock_db, sample_listing, sample_ngos_by_distance):
    """Test 2: Score decreases with distance (closer NGOs have higher scores)."""
    mock_db.foodlisting.find_unique.return_value = sample_listing
    mock_db.ngo.find_many.return_value = sample_ngos_by_distance
    
    recommendations = await recommend_ngos_for_listing('listing-1', mock_db, top_n=5)
    
    # Recommendations should be sorted by score (higher is better)
    # Closer NGOs should have higher scores
    assert len(recommendations) >= 2
    
    # First recommendation should have higher score than second
    assert recommendations[0].score >= recommendations[1].score
    
    # First recommendation should be closer than last
    assert recommendations[0].distance_km < recommendations[-1].distance_km


@pytest.mark.asyncio
async def test_recommend_degraded_mode_few_claims(mock_db, sample_listing):
    """Test 3: Degraded mode - NGOs with < 10 claims sorted by distance only."""
    # Create NGOs with few claims at different distances
    ngo_far = mock_db.ngo.find_unique.return_value = AsyncMock(
        id='ngo-far',
        organizationName='Far NGO',
        latitude=40.6782,
        longitude=-73.9442,
        storageCapacity=1000,
        currentStorage=200,
        trustScore=None,
        trustLabel='New NGO',
        claims=[AsyncMock() for _ in range(3)]  # Only 3 claims
    )
    
    ngo_close = AsyncMock(
        id='ngo-close',
        organizationName='Close NGO',
        latitude=40.7585,
        longitude=-73.9860,
        storageCapacity=1000,
        currentStorage=200,
        trustScore=None,
        trustLabel='New NGO',
        claims=[AsyncMock() for _ in range(2)]  # Only 2 claims
    )
    
    ngo_medium = AsyncMock(
        id='ngo-medium',
        organizationName='Medium NGO',
        latitude=40.7589,
        longitude=-73.9851,
        storageCapacity=1000,
        currentStorage=200,
        trustScore=None,
        trustLabel='New NGO',
        claims=[AsyncMock() for _ in range(4)]  # Only 4 claims
    )
    
    mock_db.foodlisting.find_unique.return_value = sample_listing
    mock_db.ngo.find_many.return_value = [ngo_far, ngo_close, ngo_medium]
    
    recommendations = await recommend_ngos_for_listing('listing-1', mock_db, top_n=3)
    
    # Should return all 3 NGOs
    assert len(recommendations) == 3
    
    # Should be ordered by distance (closest first)
    # Close NGO should be first
    assert recommendations[0].distance_km < recommendations[1].distance_km
    assert recommendations[1].distance_km < recommendations[2].distance_km


@pytest.mark.asyncio
async def test_recommend_no_ngos(mock_db, sample_listing):
    """Test recommendation when no NGOs are available."""
    mock_db.foodlisting.find_unique.return_value = sample_listing
    mock_db.ngo.find_many.return_value = []
    
    recommendations = await recommend_ngos_for_listing('listing-1', mock_db)
    
    assert recommendations == []


@pytest.mark.asyncio
async def test_recommend_listing_not_found(mock_db):
    """Test recommendation when listing doesn't exist."""
    mock_db.foodlisting.find_unique.return_value = None
    
    recommendations = await recommend_ngos_for_listing('nonexistent', mock_db)
    
    assert recommendations == []


@pytest.mark.asyncio
async def test_recommend_max_distance_filter(mock_db, sample_listing, sample_ngos_by_distance):
    """Test that NGOs beyond max_distance_km are filtered out."""
    mock_db.foodlisting.find_unique.return_value = sample_listing
    mock_db.ngo.find_many.return_value = sample_ngos_by_distance
    
    # Set max distance to 10 km (should filter out far NGOs)
    recommendations = await recommend_ngos_for_listing(
        'listing-1', 
        mock_db, 
        top_n=5,
        max_distance_km=10.0
    )
    
    # All recommendations should be within 10 km
    for rec in recommendations:
        assert rec.distance_km <= 10.0


@pytest.mark.asyncio
async def test_recommend_top_n_parameter(mock_db, sample_listing, sample_ngos_by_distance):
    """Test that top_n parameter limits results correctly."""
    mock_db.foodlisting.find_unique.return_value = sample_listing
    mock_db.ngo.find_many.return_value = sample_ngos_by_distance
    
    # Request only 1 recommendation
    recommendations = await recommend_ngos_for_listing('listing-1', mock_db, top_n=1)
    
    assert len(recommendations) == 1


@pytest.mark.asyncio
async def test_recommend_score_range(mock_db, sample_listing, sample_ngos_by_distance):
    """Test that scores are within valid range (0-100)."""
    mock_db.foodlisting.find_unique.return_value = sample_listing
    mock_db.ngo.find_many.return_value = sample_ngos_by_distance
    
    recommendations = await recommend_ngos_for_listing('listing-1', mock_db)
    
    for rec in recommendations:
        assert 0 <= rec.score <= 100


@pytest.mark.asyncio
async def test_recommend_includes_trust_data(mock_db, sample_listing, sample_ngos_by_distance):
    """Test that recommendations include trust score and label."""
    mock_db.foodlisting.find_unique.return_value = sample_listing
    mock_db.ngo.find_many.return_value = sample_ngos_by_distance
    
    recommendations = await recommend_ngos_for_listing('listing-1', mock_db)
    
    for rec in recommendations:
        # Trust score can be None for new NGOs
        assert rec.trust_score is None or isinstance(rec.trust_score, int)
        assert rec.trust_label is not None
        assert isinstance(rec.trust_label, str)


# ============================================================================
# EDGE CASE TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_recommend_zero_capacity_ngo(mock_db, sample_listing):
    """Test NGO with zero storage capacity."""
    ngo_zero_capacity = AsyncMock(
        id='ngo-zero',
        organizationName='Zero Capacity NGO',
        latitude=40.7585,
        longitude=-73.9860,
        storageCapacity=0,
        currentStorage=0,
        trustScore=75,
        trustLabel='Medium',
        claims=[]
    )
    
    mock_db.foodlisting.find_unique.return_value = sample_listing
    mock_db.ngo.find_many.return_value = [ngo_zero_capacity]
    
    recommendations = await recommend_ngos_for_listing('listing-1', mock_db)
    
    # Should still return the NGO but with low capacity score
    assert len(recommendations) == 1
    # Score should be lower due to zero capacity
    assert recommendations[0].score < 100


@pytest.mark.asyncio
async def test_recommend_full_capacity_ngo(mock_db, sample_listing):
    """Test NGO with full storage capacity."""
    ngo_full = AsyncMock(
        id='ngo-full',
        organizationName='Full NGO',
        latitude=40.7585,
        longitude=-73.9860,
        storageCapacity=1000,
        currentStorage=1000,  # Full
        trustScore=75,
        trustLabel='Medium',
        claims=[]
    )
    
    mock_db.foodlisting.find_unique.return_value = sample_listing
    mock_db.ngo.find_many.return_value = [ngo_full]
    
    recommendations = await recommend_ngos_for_listing('listing-1', mock_db)
    
    # Should still return the NGO
    assert len(recommendations) == 1
    # Score should be lower due to full capacity
    assert recommendations[0].score < 100
