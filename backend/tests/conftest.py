"""
Pytest Configuration and Fixtures
Shared fixtures for ML tests
"""

import pytest
from datetime import datetime, timedelta
from typing import List, Dict, Any
from unittest.mock import Mock, AsyncMock


# ============================================================================
# DATABASE FIXTURES
# ============================================================================

@pytest.fixture
def mock_db():
    """Mock Prisma database client."""
    db = Mock()
    
    # Configure async methods
    db.foodlisting.find_unique = AsyncMock()
    db.foodlisting.find_many = AsyncMock()
    db.foodlisting.find_first = AsyncMock()
    db.ngo.find_unique = AsyncMock()
    db.ngo.find_many = AsyncMock()
    db.ngo.find_first = AsyncMock()
    db.ngo.update = AsyncMock()
    db.claim.find_many = AsyncMock()
    db.demandforecast.find_many = AsyncMock()
    
    return db


# ============================================================================
# NGO FIXTURES
# ============================================================================

@pytest.fixture
def sample_ngo():
    """Create a sample NGO."""
    return Mock(
        id='ngo-1',
        organizationName='Food Bank Central',
        latitude=40.7128,
        longitude=-74.0060,
        storageCapacity=1000,
        currentStorage=200,
        trustScore=78,
        trustLabel='High',
        claims=[]
    )


@pytest.fixture
def sample_ngos_by_distance():
    """Create NGOs at increasing distances from a reference point."""
    # Reference point: 40.7580, -73.9855 (NYC)
    
    ngos = []
    
    # NGO 1: Very close (0.5 km)
    ngo1 = Mock(
        id='ngo-1',
        organizationName='Nearby Food Bank',
        latitude=40.7585,
        longitude=-73.9860,
        storageCapacity=1000,
        currentStorage=200,
        trustScore=75,
        trustLabel='High',
        claims=[]
    )
    ngos.append(ngo1)
    
    # NGO 2: Medium distance (5 km)
    ngo2 = Mock(
        id='ngo-2',
        organizationName='Midtown Kitchen',
        latitude=40.7589,
        longitude=-73.9851,
        storageCapacity=800,
        currentStorage=300,
        trustScore=70,
        trustLabel='Medium',
        claims=[]
    )
    ngos.append(ngo2)
    
    # NGO 3: Far (15 km)
    ngo3 = Mock(
        id='ngo-3',
        organizationName='Downtown Shelter',
        latitude=40.7128,
        longitude=-74.0060,
        storageCapacity=1200,
        currentStorage=100,
        trustScore=80,
        trustLabel='High',
        claims=[]
    )
    ngos.append(ngo3)
    
    # NGO 4: Very far (30 km)
    ngo4 = Mock(
        id='ngo-4',
        organizationName='Suburban Center',
        latitude=40.6782,
        longitude=-73.9442,
        storageCapacity=900,
        currentStorage=400,
        trustScore=65,
        trustLabel='Medium',
        claims=[]
    )
    ngos.append(ngo4)
    
    # NGO 5: Extremely far (50 km)
    ngo5 = Mock(
        id='ngo-5',
        organizationName='Remote Outreach',
        latitude=40.6413,
        longitude=-74.0776,
        storageCapacity=600,
        currentStorage=500,
        trustScore=60,
        trustLabel='Low',
        claims=[]
    )
    ngos.append(ngo5)
    
    return ngos


@pytest.fixture
def ngo_with_few_claims():
    """NGO with less than 5 claims (New NGO)."""
    claims = [
        Mock(
            id=f'claim-{i}',
            status='COMPLETED',
            claimedAt=datetime.now() - timedelta(days=i),
            updatedAt=datetime.now() - timedelta(days=i) + timedelta(hours=2)
        )
        for i in range(3)
    ]
    
    return Mock(
        id='ngo-new',
        organizationName='New NGO',
        latitude=40.7580,
        longitude=-73.9855,
        storageCapacity=500,
        currentStorage=100,
        trustScore=None,
        trustLabel='New NGO',
        claims=claims
    )


@pytest.fixture
def ngo_with_perfect_record():
    """NGO with perfect performance (all claims completed quickly)."""
    claims = []
    for i in range(10):
        claim = Mock(
            id=f'claim-{i}',
            status='COMPLETED',
            claimedAt=datetime.now() - timedelta(days=i*2),
            updatedAt=datetime.now() - timedelta(days=i*2) + timedelta(hours=3),
            listing=Mock()
        )
        claims.append(claim)
    
    return Mock(
        id='ngo-perfect',
        organizationName='Perfect NGO',
        latitude=40.7580,
        longitude=-73.9855,
        storageCapacity=1000,
        currentStorage=100,
        trustScore=95,
        trustLabel='High',
        claims=claims
    )


@pytest.fixture
def ngo_with_poor_record():
    """NGO with poor performance (many cancelled claims)."""
    claims = []
    
    # 5 completed claims
    for i in range(5):
        claim = Mock(
            id=f'claim-completed-{i}',
            status='COMPLETED',
            claimedAt=datetime.now() - timedelta(days=i*2),
            updatedAt=datetime.now() - timedelta(days=i*2) + timedelta(hours=50),
            listing=Mock()
        )
        claims.append(claim)
    
    # 5 rejected claims
    for i in range(5):
        claim = Mock(
            id=f'claim-rejected-{i}',
            status='REJECTED',
            claimedAt=datetime.now() - timedelta(days=i*2+1),
            updatedAt=datetime.now() - timedelta(days=i*2+1) + timedelta(hours=1),
            listing=Mock()
        )
        claims.append(claim)
    
    return Mock(
        id='ngo-poor',
        organizationName='Poor NGO',
        latitude=40.7580,
        longitude=-73.9855,
        storageCapacity=800,
        currentStorage=600,
        trustScore=35,
        trustLabel='Low',
        claims=claims
    )


# ============================================================================
# LISTING FIXTURES
# ============================================================================

@pytest.fixture
def sample_listing():
    """Create a sample food listing."""
    return Mock(
        id='listing-1',
        category='Bakery',
        quantityKg=50,
        latitude=40.7580,
        longitude=-73.9855,
        expiryTime=datetime.now() + timedelta(hours=12),
        district='Downtown',
        storageTemp=22.0,
        priority='MEDIUM'
    )


@pytest.fixture
def critical_listing():
    """Listing expiring in < 6 hours."""
    return Mock(
        id='listing-critical',
        category='Dairy',
        quantityKg=30,
        latitude=40.7580,
        longitude=-73.9855,
        expiryTime=datetime.now() + timedelta(hours=3),
        district='Downtown',
        storageTemp=28.0,
        priority='CRITICAL'
    )


@pytest.fixture
def low_priority_listing():
    """Listing expiring in > 72 hours."""
    return Mock(
        id='listing-low',
        category='Canned Goods',
        quantityKg=100,
        latitude=40.7580,
        longitude=-73.9855,
        expiryTime=datetime.now() + timedelta(hours=96),
        district='Downtown',
        storageTemp=20.0,
        priority='LOW'
    )


# ============================================================================
# CLAIM FIXTURES
# ============================================================================

@pytest.fixture
def sample_claims():
    """Create sample claims for testing."""
    claims = []
    
    # Recent completed claim (fast pickup)
    claim1 = Mock(
        id='claim-1',
        status='COMPLETED',
        claimedAt=datetime.now() - timedelta(days=1),
        updatedAt=datetime.now() - timedelta(days=1) + timedelta(hours=4),
        listing=Mock(district='Downtown', category='Bakery')
    )
    claims.append(claim1)
    
    # Older completed claim (slow pickup)
    claim2 = Mock(
        id='claim-2',
        status='COMPLETED',
        claimedAt=datetime.now() - timedelta(days=5),
        updatedAt=datetime.now() - timedelta(days=5) + timedelta(hours=30),
        listing=Mock(district='Downtown', category='Dairy')
    )
    claims.append(claim2)
    
    # Rejected claim
    claim3 = Mock(
        id='claim-3',
        status='REJECTED',
        claimedAt=datetime.now() - timedelta(days=3),
        updatedAt=datetime.now() - timedelta(days=3) + timedelta(hours=1),
        listing=Mock(district='Uptown', category='Produce')
    )
    claims.append(claim3)
    
    return claims


# ============================================================================
# DEMAND FORECAST FIXTURES
# ============================================================================

@pytest.fixture
def sample_forecasts():
    """Create sample demand forecasts."""
    forecasts = []
    today = datetime.now().date()
    
    for i in range(7):
        forecast = Mock(
            id=f'forecast-{i}',
            district='Downtown',
            category='Bakery',
            forecastDate=today + timedelta(days=i),
            predicted=25 + i*2,
            lowerCi=18 + i,
            upperCi=32 + i*3,
            generatedAt=datetime.now()
        )
        forecasts.append(forecast)
    
    return forecasts


# ============================================================================
# FACTORY FUNCTIONS
# ============================================================================

def create_ngo(
    ngo_id: str,
    name: str,
    lat: float,
    lng: float,
    capacity: int = 1000,
    current: int = 200,
    trust_score: int = 75,
    trust_label: str = 'Medium',
    num_claims: int = 0
) -> Mock:
    """Factory function to create NGO mocks."""
    claims = []
    for i in range(num_claims):
        claim = Mock(
            id=f'claim-{ngo_id}-{i}',
            status='COMPLETED',
            claimedAt=datetime.now() - timedelta(days=i),
            updatedAt=datetime.now() - timedelta(days=i) + timedelta(hours=5)
        )
        claims.append(claim)
    
    return Mock(
        id=ngo_id,
        organizationName=name,
        latitude=lat,
        longitude=lng,
        storageCapacity=capacity,
        currentStorage=current,
        trustScore=trust_score,
        trustLabel=trust_label,
        claims=claims
    )


def create_listing(
    listing_id: str,
    category: str,
    lat: float,
    lng: float,
    hours_until_expiry: float,
    storage_temp: float = 22.0
) -> Mock:
    """Factory function to create listing mocks."""
    return Mock(
        id=listing_id,
        category=category,
        quantityKg=50,
        latitude=lat,
        longitude=lng,
        expiryTime=datetime.now() + timedelta(hours=hours_until_expiry),
        district='Downtown',
        storageTemp=storage_temp,
        priority='MEDIUM'
    )
