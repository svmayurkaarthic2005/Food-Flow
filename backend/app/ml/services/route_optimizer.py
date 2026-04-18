"""
Route Optimizer
Optimizes pickup routes for food collection using TSP solver
"""

import math
import os
from typing import List, Dict, Optional, Tuple
from datetime import datetime

import numpy as np

from app.ml.schemas.ml_schemas import RouteStop, RouteResponse


# Feature flag for Google Maps API
USE_GOOGLE_MAPS = os.getenv("USE_GOOGLE_MAPS_API", "false").lower() == "true"
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")

# Constants
AVERAGE_SPEED_KMH = 40.0  # Average driving speed in city
STOP_TIME_MINUTES = 10.0  # Time spent at each stop for pickup
MAX_ROUTE_TIME_MINUTES = 120.0  # Warning threshold


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on Earth.
    
    Args:
        lat1, lon1: Coordinates of first point
        lat2, lon2: Coordinates of second point
        
    Returns:
        Distance in kilometers
    """
    # Earth's radius in kilometers
    R = 6371.0
    
    # Convert to radians
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    # Haversine formula
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    distance = R * c
    return distance


def calculate_distance_matrix(
    stops: List[Dict[str, float]],
    depot: Dict[str, float]
) -> np.ndarray:
    """
    Calculate distance matrix between all points (depot + stops).
    
    Args:
        stops: List of stops with 'lat' and 'lng' keys
        depot: Depot location with 'lat' and 'lng' keys
        
    Returns:
        Distance matrix as numpy array (n+1 x n+1) where n = number of stops
    """
    # Combine depot and stops
    all_points = [depot] + stops
    n = len(all_points)
    
    # Initialize distance matrix
    distance_matrix = np.zeros((n, n))
    
    # Calculate distances
    for i in range(n):
        for j in range(n):
            if i != j:
                distance_matrix[i][j] = haversine_distance(
                    all_points[i]['lat'],
                    all_points[i]['lng'],
                    all_points[j]['lat'],
                    all_points[j]['lng']
                )
    
    return distance_matrix


def nearest_neighbor_tsp(distance_matrix: np.ndarray, start_index: int = 0) -> List[int]:
    """
    Solve TSP using nearest neighbor heuristic.
    
    Args:
        distance_matrix: Distance matrix (n x n)
        start_index: Starting point index (usually 0 for depot)
        
    Returns:
        List of indices representing the route order
    """
    n = len(distance_matrix)
    unvisited = set(range(n))
    route = [start_index]
    unvisited.remove(start_index)
    
    current = start_index
    
    while unvisited:
        # Find nearest unvisited neighbor
        nearest = min(unvisited, key=lambda x: distance_matrix[current][x])
        route.append(nearest)
        unvisited.remove(nearest)
        current = nearest
    
    # Return to depot
    route.append(start_index)
    
    return route


def calculate_route_time(
    distance_matrix: np.ndarray,
    route: List[int],
    average_speed_kmh: float = AVERAGE_SPEED_KMH,
    stop_time_minutes: float = STOP_TIME_MINUTES
) -> float:
    """
    Calculate total time for a route.
    
    Args:
        distance_matrix: Distance matrix
        route: Route as list of indices
        average_speed_kmh: Average driving speed
        stop_time_minutes: Time spent at each stop
        
    Returns:
        Total time in minutes
    """
    total_distance_km = 0.0
    
    # Calculate total distance
    for i in range(len(route) - 1):
        total_distance_km += distance_matrix[route[i]][route[i + 1]]
    
    # Calculate driving time
    driving_time_minutes = (total_distance_km / average_speed_kmh) * 60
    
    # Add stop time (excluding depot)
    num_stops = len(route) - 2  # Exclude start and end depot
    total_stop_time = num_stops * stop_time_minutes
    
    total_time = driving_time_minutes + total_stop_time
    
    return total_time


def optimize_route(
    stops: List[Dict],
    depot: Dict[str, float],
    average_speed_kmh: float = AVERAGE_SPEED_KMH,
    stop_time_minutes: float = STOP_TIME_MINUTES
) -> RouteResponse:
    """
    Optimize pickup route using TSP solver.
    
    Args:
        stops: List of stops with 'listing_id', 'lat', 'lng' keys
        depot: Depot location with 'lat' and 'lng' keys
        average_speed_kmh: Average driving speed
        stop_time_minutes: Time spent at each stop
        
    Returns:
        RouteResponse with optimized route
    """
    if not stops:
        return RouteResponse(
            stops=[],
            total_minutes=0.0,
            warning="No stops provided"
        )
    
    # Calculate distance matrix
    distance_matrix = calculate_distance_matrix(stops, depot)
    
    # Solve TSP (start from depot at index 0)
    route_indices = nearest_neighbor_tsp(distance_matrix, start_index=0)
    
    # Remove depot from route (first and last)
    stop_indices = route_indices[1:-1]
    
    # Build route with ETAs
    route_stops = []
    cumulative_time = 0.0
    current_index = 0  # Start at depot
    
    for stop_index in stop_indices:
        # Calculate travel time to this stop
        distance_km = distance_matrix[current_index][stop_index]
        travel_time_minutes = (distance_km / average_speed_kmh) * 60
        cumulative_time += travel_time_minutes
        
        # Create route stop
        stop_data = stops[stop_index - 1]  # -1 because depot is at index 0
        route_stops.append(RouteStop(
            listing_id=stop_data['listing_id'],
            lat=stop_data['lat'],
            lng=stop_data['lng'],
            eta_minutes=round(cumulative_time, 2)
        ))
        
        # Add stop time
        cumulative_time += stop_time_minutes
        current_index = stop_index
    
    # Calculate total route time (including return to depot)
    total_time = calculate_route_time(distance_matrix, route_indices, average_speed_kmh, stop_time_minutes)
    
    # Check for warning
    warning = None
    if total_time > MAX_ROUTE_TIME_MINUTES:
        warning = f"Route exceeds recommended time ({MAX_ROUTE_TIME_MINUTES} minutes). Consider splitting into multiple routes."
    
    return RouteResponse(
        stops=route_stops,
        total_minutes=round(total_time, 2),
        warning=warning
    )


async def optimize_route_with_google_maps(
    stops: List[Dict],
    depot: Dict[str, float]
) -> RouteResponse:
    """
    Optimize route using Google Maps Distance Matrix API.
    
    This is a placeholder for future implementation.
    Requires Google Maps API key and httpx for async requests.
    
    Args:
        stops: List of stops with 'listing_id', 'lat', 'lng' keys
        depot: Depot location with 'lat' and 'lng' keys
        
    Returns:
        RouteResponse with optimized route
    """
    if not USE_GOOGLE_MAPS or not GOOGLE_MAPS_API_KEY:
        # Fall back to haversine-based optimization
        return optimize_route(stops, depot)
    
    # TODO: Implement Google Maps Distance Matrix API integration
    # 1. Build origins and destinations lists
    # 2. Call Google Maps Distance Matrix API
    # 3. Parse response to get actual driving distances and times
    # 4. Build distance matrix from API response
    # 5. Solve TSP with actual distances
    # 6. Return optimized route
    
    # For now, fall back to haversine
    print("Google Maps API integration not yet implemented, using haversine distance")
    return optimize_route(stops, depot)


def calculate_route_statistics(route_response: RouteResponse) -> Dict:
    """
    Calculate statistics for a route.
    
    Args:
        route_response: RouteResponse object
        
    Returns:
        Dictionary with route statistics
    """
    if not route_response.stops:
        return {
            "num_stops": 0,
            "total_distance_km": 0.0,
            "total_time_minutes": 0.0,
            "avg_time_per_stop": 0.0
        }
    
    num_stops = len(route_response.stops)
    total_time = route_response.total_minutes
    
    # Estimate total distance (rough calculation)
    # Total time = driving time + stop time
    # driving time = total_time - (num_stops * STOP_TIME_MINUTES)
    driving_time = total_time - (num_stops * STOP_TIME_MINUTES)
    total_distance_km = (driving_time / 60) * AVERAGE_SPEED_KMH
    
    return {
        "num_stops": num_stops,
        "total_distance_km": round(total_distance_km, 2),
        "total_time_minutes": round(total_time, 2),
        "avg_time_per_stop": round(total_time / num_stops, 2) if num_stops > 0 else 0.0
    }
