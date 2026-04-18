"""
Spoilage Priority Scorer
Rule-based system to determine food listing priority based on expiry time and conditions
"""

from typing import Literal, Optional
from datetime import datetime, timedelta


# Priority levels
Priority = Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"]

# Perishable categories that spoil faster
PERISHABLE_CATEGORIES = {
    "dairy", "milk", "yogurt", "cheese",
    "cooked food", "prepared food", "meat", "fish", "seafood",
    "salad", "sandwich", "sushi"
}

# Temperature thresholds (Celsius)
HIGH_TEMP_THRESHOLD = 25.0  # Above this is considered high risk


def score_priority(
    hours_until_expiry: float,
    category: str,
    storage_temp: Optional[float] = None
) -> Priority:
    """
    Calculate priority level for a food listing based on spoilage risk.
    
    Rules:
        Base:
            < 6 hrs → CRITICAL
            6-24 hrs → HIGH
            24-72 hrs → MEDIUM
            > 72 hrs → LOW
        
        Adjustments:
            - Perishable categories increase urgency (upgrade by 1 level)
            - High storage temp increases urgency (upgrade by 1 level)
    
    Args:
        hours_until_expiry: Hours until food expires
        category: Food category (e.g., "Bakery", "Dairy", "Prepared Food")
        storage_temp: Storage temperature in Celsius (optional)
        
    Returns:
        Priority level: "CRITICAL", "HIGH", "MEDIUM", or "LOW"
    """
    # Normalize category for comparison
    category_lower = category.lower().strip()
    
    # Determine base priority
    if hours_until_expiry < 6:
        base_priority = "CRITICAL"
    elif hours_until_expiry < 24:
        base_priority = "HIGH"
    elif hours_until_expiry < 72:
        base_priority = "MEDIUM"
    else:
        base_priority = "LOW"
    
    # Check if category is perishable
    is_perishable = any(
        perishable in category_lower 
        for perishable in PERISHABLE_CATEGORIES
    )
    
    # Check if storage temp is high
    is_high_temp = storage_temp is not None and storage_temp > HIGH_TEMP_THRESHOLD
    
    # Calculate urgency upgrades
    urgency_upgrades = 0
    if is_perishable:
        urgency_upgrades += 1
    if is_high_temp:
        urgency_upgrades += 1
    
    # Apply upgrades
    priority_levels = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    current_index = priority_levels.index(base_priority)
    
    # Upgrade priority (move towards CRITICAL)
    upgraded_index = min(current_index + urgency_upgrades, len(priority_levels) - 1)
    
    return priority_levels[upgraded_index]  # type: ignore


def calculate_hours_until_expiry(expiry_time: datetime) -> float:
    """
    Calculate hours until expiry from current time.
    
    Args:
        expiry_time: Expiry datetime
        
    Returns:
        Hours until expiry (can be negative if already expired)
    """
    now = datetime.now()
    if expiry_time.tzinfo is not None:
        # Make now timezone-aware if expiry_time is
        from datetime import timezone
        now = datetime.now(timezone.utc)
    
    time_diff = expiry_time - now
    hours = time_diff.total_seconds() / 3600
    return hours


def auto_score_listing_priority(
    expiry_time: datetime,
    category: str,
    storage_temp: Optional[float] = None
) -> Priority:
    """
    Automatically score listing priority (convenience wrapper).
    
    Args:
        expiry_time: When the food expires
        category: Food category
        storage_temp: Storage temperature in Celsius (optional)
        
    Returns:
        Priority level
    """
    hours = calculate_hours_until_expiry(expiry_time)
    return score_priority(hours, category, storage_temp)


def get_priority_color(priority: Priority) -> str:
    """
    Get color code for priority level (for UI).
    
    Args:
        priority: Priority level
        
    Returns:
        Color name or hex code
    """
    colors = {
        "CRITICAL": "#DC2626",  # Red
        "HIGH": "#F59E0B",      # Orange
        "MEDIUM": "#FCD34D",    # Yellow
        "LOW": "#10B981"        # Green
    }
    return colors.get(priority, "#6B7280")  # Gray as default


def get_priority_message(priority: Priority) -> str:
    """
    Get human-readable message for priority level.
    
    Args:
        priority: Priority level
        
    Returns:
        Message string
    """
    messages = {
        "CRITICAL": "Urgent! Expires very soon - immediate pickup needed",
        "HIGH": "High priority - pickup within 24 hours recommended",
        "MEDIUM": "Medium priority - pickup within 2-3 days",
        "LOW": "Low priority - pickup at convenience"
    }
    return messages.get(priority, "Priority not determined")
