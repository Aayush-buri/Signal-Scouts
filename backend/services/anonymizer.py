import hashlib
from config import settings


class Anonymizer:
    """Handles anonymization of sensitive data"""
    
    @staticmethod
    def hash_ssid(ssid: str) -> str:
        """
        Hash WiFi SSID with app-level salt
        
        Args:
            ssid: Raw SSID string
            
        Returns:
            SHA256 hash
        """
        if not ssid:
            return None
        
        salted = f"{ssid}{settings.h3_salt_key}"
        return hashlib.sha256(salted.encode()).hexdigest()
    
    @staticmethod
    def hash_device_id(device_id: str) -> str:
        """
        Hash device identifier
        
        Args:
            device_id: Raw device ID
            
        Returns:
            SHA256 hash
        """
        salted = f"{device_id}{settings.h3_salt_key}"
        return hashlib.sha256(salted.encode()).hexdigest()
    
    @staticmethod
    def hash_carrier(carrier: str) -> str:
        """
        Hash carrier/provider name
        
        Args:
            carrier: Raw carrier name
            
        Returns:
            SHA256 hash
        """
        if not carrier:
            return None
        
        salted = f"{carrier}{settings.h3_salt_key}"
        return hashlib.sha256(salted.encode()).hexdigest()
    
    @staticmethod
    def truncate_coordinates(lat: float, lon: float, precision: int = 5) -> tuple:
        """
        Truncate GPS coordinates for privacy
        
        Args:
            lat: Latitude
            lon: Longitude
            precision: Decimal places (5 = ~1.1m accuracy)
            
        Returns:
            Tuple of (truncated_lat, truncated_lon)
        """
        return (
            round(lat, precision),
            round(lon, precision)
        )
