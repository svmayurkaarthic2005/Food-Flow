"""
Unit Tests for Spoilage Scorer
Tests priority scoring logic and boundary cases
"""

import pytest
from datetime import datetime, timedelta

from app.ml.services.spoilage_scorer import (
    score_priority,
    calculate_hours_until_expiry,
    auto_score_listing_priority,
    get_priority_color,
    get_priority_message
)


# ============================================================================
# BOUNDARY TESTS
# ============================================================================

def test_boundary_exactly_6_hours():
    """Case 1: Exactly 6 hours until expiry → HIGH."""
    priority = score_priority(
        hours_until_expiry=6.0,
        category='Bakery',
        storage_temp=None
    )
    
    assert priority == 'HIGH'


def test_boundary_just_under_6_hours():
    """Just under 6 hours → CRITICAL."""
    priority = score_priority(
        hours_until_expiry=5.99,
        category='Bakery',
        storage_temp=None
    )
    
    assert priority == 'CRITICAL'


def test_boundary_just_over_6_hours():
    """Just over 6 hours → HIGH."""
    priority = score_priority(
        hours_until_expiry=6.01,
        category='Bakery',
        storage_temp=None
    )
    
    assert priority == 'HIGH'


def test_boundary_exactly_24_hours():
    """Exactly 24 hours until expiry → MEDIUM."""
    priority = score_priority(
        hours_until_expiry=24.0,
        category='Bakery',
        storage_temp=None
    )
    
    assert priority == 'MEDIUM'


def test_boundary_just_under_24_hours():
    """Just under 24 hours → HIGH."""
    priority = score_priority(
        hours_until_expiry=23.99,
        category='Bakery',
        storage_temp=None
    )
    
    assert priority == 'HIGH'


def test_boundary_exactly_72_hours():
    """Exactly 72 hours until expiry → LOW."""
    priority = score_priority(
        hours_until_expiry=72.0,
        category='Bakery',
        storage_temp=None
    )
    
    assert priority == 'LOW'


def test_boundary_just_under_72_hours():
    """Just under 72 hours → MEDIUM."""
    priority = score_priority(
        hours_until_expiry=71.99,
        category='Bakery',
        storage_temp=None
    )
    
    assert priority == 'MEDIUM'


# ============================================================================
# PERISHABLE CATEGORY TESTS
# ============================================================================

def test_perishable_dairy_upgrade():
    """Case 2: 6 hours + 1 minute, perishable category → Still HIGH."""
    # 6 hours 1 minute = 6.0167 hours
    priority = score_priority(
        hours_until_expiry=6.0167,
        category='Dairy',
        storage_temp=None
    )
    
    # Base: HIGH (6-24 hours)
    # Perishable: upgrade by 1 level → CRITICAL
    assert priority == 'CRITICAL'


def test_perishable_cooked_food():
    """Cooked food is perishable → upgrade priority."""
    priority = score_priority(
        hours_until_expiry=30.0,  # Base: MEDIUM
        category='Cooked Food',
        storage_temp=None
    )
    
    # Base: MEDIUM (24-72 hours)
    # Perishable: upgrade by 1 level → HIGH
    assert priority == 'HIGH'


def test_perishable_meat():
    """Meat is perishable → upgrade priority."""
    priority = score_priority(
        hours_until_expiry=80.0,  # Base: LOW
        category='Meat',
        storage_temp=None
    )
    
    # Base: LOW (>72 hours)
    # Perishable: upgrade by 1 level → MEDIUM
    assert priority == 'MEDIUM'


def test_non_perishable_canned():
    """Case 3: Non-perishable canned goods → no upgrade."""
    priority = score_priority(
        hours_until_expiry=96.0,  # > 72 hours
        category='Canned Goods',
        storage_temp=None
    )
    
    # Base: LOW
    # Non-perishable: no upgrade
    assert priority == 'LOW'


def test_non_perishable_frozen():
    """Frozen food with long expiry → LOW."""
    priority = score_priority(
        hours_until_expiry=120.0,  # > 72 hours
        category='Frozen',
        storage_temp=-18.0  # Frozen temp
    )
    
    # Base: LOW
    # Even though temp is low (good), base priority is LOW
    assert priority == 'LOW'


# ============================================================================
# TEMPERATURE TESTS
# ============================================================================

def test_high_temperature_upgrade():
    """High storage temperature → upgrade priority."""
    priority = score_priority(
        hours_until_expiry=30.0,  # Base: MEDIUM
        category='Bakery',
        storage_temp=30.0  # High temp (> 25°C)
    )
    
    # Base: MEDIUM
    # High temp: upgrade by 1 level → HIGH
    assert priority == 'HIGH'


def test_very_high_temperature():
    """Very high temperature with perishable → double upgrade."""
    priority = score_priority(
        hours_until_expiry=50.0,  # Base: MEDIUM
        category='Dairy',  # Perishable
        storage_temp=35.0  # Very high temp
    )
    
    # Base: MEDIUM
    # Perishable: +1 → HIGH
    # High temp: +1 → CRITICAL
    assert priority == 'CRITICAL'


def test_normal_temperature_no_upgrade():
    """Normal temperature → no upgrade."""
    priority = score_priority(
        hours_until_expiry=30.0,  # Base: MEDIUM
        category='Bakery',
        storage_temp=22.0  # Normal temp
    )
    
    # Base: MEDIUM
    # Normal temp: no upgrade
    assert priority == 'MEDIUM'


def test_low_temperature_no_downgrade():
    """Low temperature doesn't downgrade priority."""
    priority = score_priority(
        hours_until_expiry=3.0,  # Base: CRITICAL
        category='Bakery',
        storage_temp=5.0  # Low temp (refrigerated)
    )
    
    # Base: CRITICAL
    # Low temp: no change (we don't downgrade)
    assert priority == 'CRITICAL'


# ============================================================================
# COMBINED FACTORS TESTS
# ============================================================================

def test_all_factors_worst_case():
    """Worst case: short time + perishable + high temp → CRITICAL."""
    priority = score_priority(
        hours_until_expiry=10.0,  # Base: HIGH
        category='Cooked Food',  # Perishable
        storage_temp=32.0  # High temp
    )
    
    # Base: HIGH
    # Perishable: +1 → CRITICAL
    # High temp: +1 → CRITICAL (already at max)
    assert priority == 'CRITICAL'


def test_all_factors_best_case():
    """Best case: long time + non-perishable + low temp → LOW."""
    priority = score_priority(
        hours_until_expiry=100.0,  # Base: LOW
        category='Canned Goods',  # Non-perishable
        storage_temp=15.0  # Low temp
    )
    
    # Base: LOW
    # Non-perishable: no change
    # Low temp: no change
    assert priority == 'LOW'


# ============================================================================
# CALCULATE HOURS TESTS
# ============================================================================

def test_calculate_hours_future():
    """Test calculating hours for future expiry."""
    future_time = datetime.now() + timedelta(hours=12)
    hours = calculate_hours_until_expiry(future_time)
    
    # Should be approximately 12 hours (allow small margin)
    assert 11.9 < hours < 12.1


def test_calculate_hours_past():
    """Test calculating hours for past expiry (negative)."""
    past_time = datetime.now() - timedelta(hours=5)
    hours = calculate_hours_until_expiry(past_time)
    
    # Should be negative
    assert hours < 0
    assert -5.1 < hours < -4.9


def test_calculate_hours_now():
    """Test calculating hours for current time."""
    now = datetime.now()
    hours = calculate_hours_until_expiry(now)
    
    # Should be very close to 0
    assert -0.1 < hours < 0.1


# ============================================================================
# AUTO SCORE TESTS
# ============================================================================

def test_auto_score_critical():
    """Test auto scoring for critical priority."""
    expiry_time = datetime.now() + timedelta(hours=3)
    priority = auto_score_listing_priority(
        expiry_time=expiry_time,
        category='Dairy',
        storage_temp=28.0
    )
    
    assert priority == 'CRITICAL'


def test_auto_score_high():
    """Test auto scoring for high priority."""
    expiry_time = datetime.now() + timedelta(hours=12)
    priority = auto_score_listing_priority(
        expiry_time=expiry_time,
        category='Bakery',
        storage_temp=22.0
    )
    
    assert priority == 'HIGH'


def test_auto_score_medium():
    """Test auto scoring for medium priority."""
    expiry_time = datetime.now() + timedelta(hours=48)
    priority = auto_score_listing_priority(
        expiry_time=expiry_time,
        category='Produce',
        storage_temp=20.0
    )
    
    assert priority == 'MEDIUM'


def test_auto_score_low():
    """Test auto scoring for low priority."""
    expiry_time = datetime.now() + timedelta(hours=96)
    priority = auto_score_listing_priority(
        expiry_time=expiry_time,
        category='Canned Goods',
        storage_temp=18.0
    )
    
    assert priority == 'LOW'


# ============================================================================
# HELPER FUNCTION TESTS
# ============================================================================

def test_get_priority_color_critical():
    """Test color for CRITICAL priority."""
    color = get_priority_color('CRITICAL')
    assert 'red' in color.lower()


def test_get_priority_color_high():
    """Test color for HIGH priority."""
    color = get_priority_color('HIGH')
    assert 'orange' in color.lower()


def test_get_priority_color_medium():
    """Test color for MEDIUM priority."""
    color = get_priority_color('MEDIUM')
    assert 'amber' in color.lower()


def test_get_priority_color_low():
    """Test color for LOW priority."""
    color = get_priority_color('LOW')
    assert 'green' in color.lower()


def test_get_priority_message_critical():
    """Test message for CRITICAL priority."""
    message = get_priority_message('CRITICAL')
    assert 'urgent' in message.lower() or 'immediate' in message.lower()


def test_get_priority_message_low():
    """Test message for LOW priority."""
    message = get_priority_message('LOW')
    assert 'convenience' in message.lower() or 'low' in message.lower()


# ============================================================================
# EDGE CASES
# ============================================================================

def test_zero_hours():
    """Test with exactly 0 hours until expiry."""
    priority = score_priority(
        hours_until_expiry=0.0,
        category='Bakery',
        storage_temp=None
    )
    
    assert priority == 'CRITICAL'


def test_negative_hours():
    """Test with negative hours (already expired)."""
    priority = score_priority(
        hours_until_expiry=-5.0,
        category='Bakery',
        storage_temp=None
    )
    
    # Should still return CRITICAL
    assert priority == 'CRITICAL'


def test_very_long_expiry():
    """Test with very long expiry (1000 hours)."""
    priority = score_priority(
        hours_until_expiry=1000.0,
        category='Bakery',
        storage_temp=None
    )
    
    assert priority == 'LOW'


def test_case_insensitive_category():
    """Test that category matching is case-insensitive."""
    priority1 = score_priority(
        hours_until_expiry=50.0,
        category='DAIRY',
        storage_temp=None
    )
    
    priority2 = score_priority(
        hours_until_expiry=50.0,
        category='dairy',
        storage_temp=None
    )
    
    priority3 = score_priority(
        hours_until_expiry=50.0,
        category='Dairy',
        storage_temp=None
    )
    
    # All should be the same
    assert priority1 == priority2 == priority3


def test_category_with_spaces():
    """Test category with leading/trailing spaces."""
    priority = score_priority(
        hours_until_expiry=50.0,
        category='  Cooked Food  ',
        storage_temp=None
    )
    
    # Should still recognize as perishable
    assert priority == 'HIGH'  # MEDIUM + perishable upgrade


def test_none_storage_temp():
    """Test with None storage temperature."""
    priority = score_priority(
        hours_until_expiry=30.0,
        category='Bakery',
        storage_temp=None
    )
    
    # Should work without temperature
    assert priority == 'MEDIUM'
