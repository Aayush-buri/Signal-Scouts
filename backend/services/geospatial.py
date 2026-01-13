import h3
import math
from typing import List, Tuple, Dict
from datetime import datetime, timedelta


class GeospatialService:
    """Handles geospatial operations using H3"""
    
    # H3 Resolution 10 = ~15m hexagon edge length
    DEFAULT_RESOLUTION = 10
    
    @staticmethod
    def lat_lon_to_h3(lat: float, lon: float, resolution: int = DEFAULT_RESOLUTION) -> str:
        """
        Convert lat/lon to H3 index
        
        Args:
            lat: Latitude
            lon: Longitude
            resolution: H3 resolution (default 10)
            
        Returns:
            H3 index string
        """
        return h3.geo_to_h3(lat, lon, resolution)
    
    @staticmethod
    def h3_to_lat_lon(h3_index: str) -> Tuple[float, float]:
        """
        Convert H3 index to center lat/lon
        
        Args:
            h3_index: H3 index string
            
        Returns:
            Tuple of (lat, lon)
        """
        return h3.h3_to_geo(h3_index)
    
    @staticmethod
    def get_neighbors(h3_index: str, k_rings: int = 1) -> List[str]:
        """
        Get neighboring H3 cells
        
        Args:
            h3_index: Center H3 index
            k_rings: Number of rings (1 = immediate neighbors)
            
        Returns:
            List of H3 indices
        """
        return list(h3.k_ring(h3_index, k_rings))
    
    @staticmethod
    def calculate_bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate bearing from point 1 to point 2
        
        Args:
            lat1, lon1: Start point
            lat2, lon2: End point
            
        Returns:
            Bearing in degrees (0-360, 0=North)
        """
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lon = math.radians(lon2 - lon1)
        
        x = math.sin(delta_lon) * math.cos(lat2_rad)
        y = math.cos(lat1_rad) * math.sin(lat2_rad) - \
            math.sin(lat1_rad) * math.cos(lat2_rad) * math.cos(delta_lon)
        
        bearing = math.atan2(x, y)
        bearing_degrees = (math.degrees(bearing) + 360) % 360
        
        return bearing_degrees
    
    @staticmethod
    def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate great circle distance using Haversine formula
        
        Args:
            lat1, lon1: Start point
            lat2, lon2: End point
            
        Returns:
            Distance in meters
        """
        R = 6371000  # Earth radius in meters
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = math.sin(delta_lat / 2) ** 2 + \
            math.cos(lat1_rad) * math.cos(lat2_rad) * \
            math.sin(delta_lon / 2) ** 2
        
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c
    
    @staticmethod
    def calculate_confidence(
        sample_count: int,
        data_age_hours: float,
        gps_accuracy: float = None
    ) -> float:
        """
        Calculate confidence score for signal data
        
        Args:
            sample_count: Number of samples in cell
            data_age_hours: Hours since last update
            gps_accuracy: GPS accuracy in meters
            
        Returns:
            Confidence score (0.0 to 1.0)
        """
        # Sample count factor (0-1)
        sample_factor = min(sample_count / 50, 1.0)
        
        # Freshness factor (0-1, decays over 48 hours)
        freshness_factor = max(1.0 - (data_age_hours / 48.0), 0.0)
        
        # GPS accuracy factor (0-1, penalize poor accuracy)
        accuracy_factor = 1.0
        if gps_accuracy:
            accuracy_factor = max(1.0 - (gps_accuracy / 100.0), 0.3)
        
        # Weighted combination
        confidence = (
            sample_factor * 0.4 +
            freshness_factor * 0.5 +
            accuracy_factor * 0.1
        )
        
        return round(confidence, 2)
    
    @staticmethod
    def get_cells_in_radius(
        lat: float,
        lon: float,
        radius_meters: int,
        resolution: int = DEFAULT_RESOLUTION
    ) -> List[str]:
        """
        Get all H3 cells within radius
        
        Args:
            lat: Center latitude
            lon: Center longitude
            radius_meters: Radius in meters
            resolution: H3 resolution
            
        Returns:
            List of H3 indices
        """
        # Convert radius to k-rings approximation
        # Each ring adds ~15m at resolution 10
        cell_edge_meters = h3.edge_length(resolution, unit='m')
        k_rings = math.ceil(radius_meters / cell_edge_meters)
        
        center_h3 = h3.geo_to_h3(lat, lon, resolution)
        return list(h3.k_ring(center_h3, k_rings))
