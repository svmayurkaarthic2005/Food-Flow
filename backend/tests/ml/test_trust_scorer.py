"""
Unit Tests for Trust Scorer
Tests trust score calculation and NGO performance metrics
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock

from app.ml.services.trust_scorer import (
    compute_trust,
    update_ngo_trust_score,
    batch_update_trust_scores,
    get_trust_badge_color,
    get_trust_description
)


# ============================================================================
# NEW NGO TESTS (< 5 CLAIMS)
# ============================================================================

@pytest.mark.asyncio
async def test_new_ngo_no_claims(mock_db):
    """Case 1: NGO with 0 claims → New NGO."""
    ngo = AsyncMock(
        id='ngo-new',
        organizationName='New NGO',
        claims=[]
    )
    mock_db.ngo.find_unique.return_value = ngo
    
    result = await compute_trust('ngo-new', mock_db)
    
    assert result['trust_score'] is None
    assert result['trust_label'] == 'New NGO'


@pytest.mark.asyncio
async def test_new_ngo_few_claims(mock_db, ngo_with_few_claims):
    """Case 1: NGO with < 5 claims → New NGO."""
    mock_db.ngo.find_unique.return_value = ngo_with_few_claims
    
    result = await compute_trust('ngo-new', mock_db, min_claims_required=5)
    
    assert result['trust_score'] is None
    assert result['trust_label'] == 'New NGO'


@pytest.mark.asyncio
async def test_new_ngo_exactly_4_claims(mock_db):
    """NGO with exactly 4 claims (just below threshold) → New NGO."""
    claims = [
        AsyncMock(
            id=f'claim-{i}',
            status='COMPLETED',
            claimedAt=datetime.now() - timedelta(days=i),
            updatedAt=datetime.now() - timedelta(days=i) + timedelta(hours=5)
        )
        for i in range(4)
    ]
    
    ngo = AsyncMock(
        id='ngo-4-claims',
        organizationName='NGO with 4 Claims',
        claims=claims
    )
    mock_db.ngo.find_unique.return_value = ngo
    
    result = await compute_trust('ngo-4-claims', mock_db, min_claims_required=5)
    
    assert result['trust_score'] is None
    assert result['trust_label'] == 'New NGO'


@pytest.mark.asyncio
async def test_ngo_exactly_5_claims(mock_db):
    """NGO with exactly 5 claims (meets threshold) → Calculate score."""
    claims = [
        AsyncMock(
            id=f'claim-{i}',
            status='COMPLETED',
            claimedAt=datetime.now() - timedelta(days=i),
            updatedAt=datetime.now() - timedelta(days=i) + timedelta(hours=5)
        )
        for i in range(5)
    ]
    
    ngo = AsyncMock(
        id='ngo-5-claims',
        organizationName='NGO with 5 Claims',
        claims=claims
    )
    mock_db.ngo.find_unique.return_value = ngo
    
    result = await compute_trust('ngo-5-claims', mock_db, min_claims_required=5)
    
    # Should calculate score
    assert result['trust_score'] is not None
    assert isinstance(result['trust_score'], float)
    assert result['trust_label'] != 'New NGO'


# ============================================================================
# PERFECT NGO TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_perfect_ngo(mock_db, ngo_with_perfect_record):
    """Case 2: Perfect NGO → High trust score."""
    mock_db.ngo.find_unique.return_value = ngo_with_perfect_record
    
    result = await compute_trust('ngo-perfect', mock_db)
    
    # Perfect NGO should have high score
    assert result['trust_score'] is not None
    assert result['trust_score'] >= 85
    assert result['trust_label'] == 'High'


@pytest.mark.asyncio
async def test_perfect_pickup_rate(mock_db):
    """NGO with 100% pickup rate → High score."""
    claims = [
        AsyncMock(
            id=f'claim-{i}',
            status='COMPLETED',
            claimedAt=datetime.now() - timedelta(days=i),
            updatedAt=datetime.now() - timedelta(days=i) + timedelta(hours=3)
        )
        for i in range(10)
    ]
    
    ngo = AsyncMock(
        id='ngo-perfect-pickup',
        organizationName='Perfect Pickup NGO',
        claims=claims
    )
    mock_db.ngo.find_unique.return_value = ngo
    
    result = await compute_trust('ngo-perfect-pickup', mock_db)
    
    # 100% pickup rate should contribute 50 points
    assert result['trust_score'] >= 80
    assert result['trust_label'] == 'High'


@pytest.mark.asyncio
async def test_fast_completion(mock_db):
    """NGO with fast completion times → High delay score."""
    # All claims completed in < 6 hours
    claims = [
        AsyncMock(
            id=f'claim-{i}',
            status='COMPLETED',
            claimedAt=datetime.now() - timedelta(days=i),
            updatedAt=datetime.now() - timedelta(days=i) + timedelta(hours=4)
        )
        for i in range(10)
    ]
    
    ngo = AsyncMock(
        id='ngo-fast',
        organizationName='Fast NGO',
        claims=claims
    )
    mock_db.ngo.find_unique.return_value = ngo
    
    result = await compute_trust('ngo-fast', mock_db)
    
    # Fast completion should result in high score
    assert result['trust_score'] >= 80


# ============================================================================
# POOR NGO TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_poor_ngo(mock_db, ngo_with_poor_record):
    """NGO with poor performance → Low trust score."""
    mock_db.ngo.find_unique.return_value = ngo_with_poor_record
    
    result = await compute_trust('ngo-poor', mock_db)
    
    # Poor NGO should have low score
    assert result['trust_score'] is not None
    assert result['trust_score'] < 60
    assert result['trust_label'] == 'Low'


@pytest.mark.asyncio
async def test_high_cancel_rate(mock_db):
    """NGO with high cancel rate → Low score."""
    claims = []
    
    # 3 completed claims
    for i in range(3):
        claims.append(AsyncMock(
            id=f'claim-completed-{i}',
            status='COMPLETED',
            claimedAt=datetime.now() - timedelta(days=i),
            updatedAt=datetime.now() - timedelta(days=i) + timedelta(hours=5)
        ))
    
    # 7 rejected claims (70% cancel rate)
    for i in range(7):
        claims.append(AsyncMock(
            id=f'claim-rejected-{i}',
            status='REJECTED',
            claimedAt=datetime.now() - timedelta(days=i+3),
            updatedAt=datetime.now() - timedelta(days=i+3) + timedelta(hours=1)
        ))
    
    ngo = AsyncMock(
        id='ngo-high-cancel',
        organizationName='High Cancel NGO',
        claims=claims
    )
    mock_db.ngo.find_unique.return_value = ngo
    
    result = await compute_trust('ngo-high-cancel', mock_db)
    
    # High cancel rate should result in low score
    assert result['trust_score'] < 50


@pytest.mark.asyncio
async def test_slow_completion(mock_db):
    """NGO with slow completion times → Lower delay score."""
    # All claims completed in > 48 hours
    claims = [
        AsyncMock(
            id=f'claim-{i}',
            status='COMPLETED',
            claimedAt=datetime.now() - timedelta(days=i),
            updatedAt=datetime.now() - timedelta(days=i) + timedelta(hours=60)
        )
        for i in range(10)
    ]
    
    ngo = AsyncMock(
        id='ngo-slow',
        organizationName='Slow NGO',
        claims=claims
    )
    mock_db.ngo.find_unique.return_value = ngo
    
    result = await compute_trust('ngo-slow', mock_db)
    
    # Slow completion should result in lower score
    assert result['trust_score'] < 70


# ============================================================================
# TRUST LABEL TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_trust_label_high(mock_db):
    """Score >= 80 → High label."""
    # Create NGO with score that should be >= 80
    claims = [
        AsyncMock(
            id=f'claim-{i}',
            status='COMPLETED',
            claimedAt=datetime.now() - timedelta(days=i),
            updatedAt=datetime.now() - timedelta(days=i) + timedelta(hours=4)
        )
        for i in range(10)
    ]
    
    ngo = AsyncMock(
        id='ngo-high',
        organizationName='High Trust NGO',
        claims=claims
    )
    mock_db.ngo.find_unique.return_value = ngo
    
    result = await compute_trust('ngo-high', mock_db)
    
    if result['trust_score'] >= 80:
        assert result['trust_label'] == 'High'


@pytest.mark.asyncio
async def test_trust_label_medium(mock_db):
    """60 <= Score < 80 → Medium label."""
    claims = []
    
    # 7 completed (70% pickup rate)
    for i in range(7):
        claims.append(AsyncMock(
            id=f'claim-completed-{i}',
            status='COMPLETED',
            claimedAt=datetime.now() - timedelta(days=i),
            updatedAt=datetime.now() - timedelta(days=i) + timedelta(hours=20)
        ))
    
    # 3 rejected (30% cancel rate)
    for i in range(3):
        claims.append(AsyncMock(
            id=f'claim-rejected-{i}',
            status='REJECTED',
            claimedAt=datetime.now() - timedelta(days=i+7),
            updatedAt=datetime.now() - timedelta(days=i+7) + timedelta(hours=1)
        ))
    
    ngo = AsyncMock(
        id='ngo-medium',
        organizationName='Medium Trust NGO',
        claims=claims
    )
    mock_db.ngo.find_unique.return_value = ngo
    
    result = await compute_trust('ngo-medium', mock_db)
    
    if 60 <= result['trust_score'] < 80:
        assert result['trust_label'] == 'Medium'


# ============================================================================
# UPDATE TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_update_ngo_trust_score(mock_db, ngo_with_perfect_record):
    """Test updating NGO trust score in database."""
    mock_db.ngo.find_unique.return_value = ngo_with_perfect_record
    mock_db.ngo.update.return_value = ngo_with_perfect_record
    
    result = await update_ngo_trust_score('ngo-perfect', mock_db)
    
    # Should call update
    mock_db.ngo.update.assert_called_once()
    
    # Should return trust data
    assert result['trust_score'] is not None
    assert result['trust_label'] is not None


@pytest.mark.asyncio
async def test_batch_update_trust_scores(mock_db):
    """Test batch updating trust scores."""
    ngos = [
        AsyncMock(id='ngo-1', claims=[AsyncMock() for _ in range(10)]),
        AsyncMock(id='ngo-2', claims=[AsyncMock() for _ in range(8)]),
        AsyncMock(id='ngo-3', claims=[AsyncMock() for _ in range(6)]),
    ]
    
    mock_db.ngo.find_many.return_value = ngos
    mock_db.ngo.find_unique.side_effect = ngos
    mock_db.ngo.update.return_value = AsyncMock()
    
    result = await batch_update_trust_scores(mock_db)
    
    assert result['total'] == 3
    assert result['updated'] >= 0
    assert result['skipped'] >= 0


# ============================================================================
# HELPER FUNCTION TESTS
# ============================================================================

def test_get_trust_badge_color_high():
    """Test badge color for High trust."""
    color = get_trust_badge_color('High')
    assert '#10B981' in color  # Green


def test_get_trust_badge_color_medium():
    """Test badge color for Medium trust."""
    color = get_trust_badge_color('Medium')
    assert '#F59E0B' in color  # Orange


def test_get_trust_badge_color_low():
    """Test badge color for Low trust."""
    color = get_trust_badge_color('Low')
    assert '#EF4444' in color  # Red


def test_get_trust_badge_color_new():
    """Test badge color for New NGO."""
    color = get_trust_badge_color('New NGO')
    assert '#6B7280' in color  # Gray


def test_get_trust_description_high():
    """Test description for High trust."""
    desc = get_trust_description('High')
    assert 'reliable' in desc.lower() or 'excellent' in desc.lower()


def test_get_trust_description_new():
    """Test description for New NGO."""
    desc = get_trust_description('New NGO')
    assert 'new' in desc.lower() or 'building' in desc.lower()


# ============================================================================
# EDGE CASES
# ============================================================================

@pytest.mark.asyncio
async def test_ngo_not_found(mock_db):
    """Test trust calculation when NGO doesn't exist."""
    mock_db.ngo.find_unique.return_value = None
    
    result = await compute_trust('nonexistent', mock_db)
    
    assert result['trust_score'] is None
    assert result['trust_label'] == 'New NGO'


@pytest.mark.asyncio
async def test_claims_without_timestamps(mock_db):
    """Test handling claims with missing timestamps."""
    claims = [
        AsyncMock(
            id=f'claim-{i}',
            status='COMPLETED',
            claimedAt=None,  # Missing timestamp
            updatedAt=None
        )
        for i in range(10)
    ]
    
    ngo = AsyncMock(
        id='ngo-no-timestamps',
        organizationName='No Timestamps NGO',
        claims=claims
    )
    mock_db.ngo.find_unique.return_value = ngo
    
    # Should handle gracefully
    result = await compute_trust('ngo-no-timestamps', mock_db)
    
    # Should still calculate score (with default delay score)
    assert result['trust_score'] is not None


@pytest.mark.asyncio
async def test_mixed_claim_statuses(mock_db):
    """Test NGO with various claim statuses."""
    claims = [
        AsyncMock(id='claim-1', status='COMPLETED', claimedAt=datetime.now(), updatedAt=datetime.now()),
        AsyncMock(id='claim-2', status='REJECTED', claimedAt=datetime.now(), updatedAt=datetime.now()),
        AsyncMock(id='claim-3', status='PENDING', claimedAt=datetime.now(), updatedAt=datetime.now()),
        AsyncMock(id='claim-4', status='ACCEPTED', claimedAt=datetime.now(), updatedAt=datetime.now()),
        AsyncMock(id='claim-5', status='COMPLETED', claimedAt=datetime.now(), updatedAt=datetime.now()),
        AsyncMock(id='claim-6', status='COMPLETED', claimedAt=datetime.now(), updatedAt=datetime.now()),
    ]
    
    ngo = AsyncMock(
        id='ngo-mixed',
        organizationName='Mixed Status NGO',
        claims=claims
    )
    mock_db.ngo.find_unique.return_value = ngo
    
    result = await compute_trust('ngo-mixed', mock_db)
    
    # Should calculate score based on completed and rejected
    assert result['trust_score'] is not None
    assert 0 <= result['trust_score'] <= 100
