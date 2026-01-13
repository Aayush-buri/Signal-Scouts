from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict
from datetime import datetime
from enum import Enum


class NetworkType(str, Enum):
    """Supported network types"""
    FOUR_G = "4G"
    FIVE_G = "5G"
    LTE = "LTE"
    WIFI = "WiFi"


class SignalReadingInput(BaseModel):
    """Single signal reading from mobile device"""
    latitude: float = Field(..., ge=-90, le=90, description="GPS latitude")
    longitude: float = Field(..., ge=-180, le=180, description="GPS longitude")
    signal_dbm: int = Field(..., ge=-120, le=-20, description="Signal strength in dBm")
    network_type: NetworkType
    ssid: Optional[str] = Field(None, max_length=32, description="WiFi SSID (will be hashed)")
    gps_accuracy_meters: Optional[float] = Field(None, ge=0, le=1000)
    device_id: str = Field(..., max_length=64, description="Anonymized device ID")
    carrier: Optional[str] = Field(None, max_length=32, description="Carrier name")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    @validator('gps_accuracy_meters')
    def warn_low_accuracy(cls, v):
        """Warn if GPS accuracy is poor"""
        if v and v > 50:
            # In production, this could trigger a warning flag
            pass
        return v


class SignalBatchInput(BaseModel):
    """Batch of signal readings"""
    readings: List[SignalReadingInput] = Field(..., max_items=100)
    
    @validator('readings')
    def validate_batch_size(cls, v):
        if len(v) == 0:
            raise ValueError("Batch must contain at least one reading")
        return v


class SignalReadingResponse(BaseModel):
    """Response after ingesting signal data"""
    accepted_count: int
    rejected_count: int
    message: str


class NavigationVector(BaseModel):
    """Direction vector toward better signal"""
    bearing_degrees: float = Field(..., ge=0, lt=360, description="Compass bearing (0=North)")
    distance_meters: float = Field(..., ge=0, description="Distance to target")
    confidence_score: float = Field(..., ge=0, le=1, description="Data confidence (0-1)")
    target_signal_dbm: Optional[int] = Field(None, description="Expected signal at target")
    current_signal_dbm: Optional[int] = Field(None, description="Signal at current location")
    
    
class HeatmapCell(BaseModel):
    """Single cell in heatmap grid"""
    h3_index: str
    latitude: float
    longitude: float
    avg_signal_dbm: float
    confidence_score: float
    sample_count: int


class HeatmapResponse(BaseModel):
    """Heatmap data for visualization"""
    cells: List[HeatmapCell]
    bounds: Dict[str, float]  # {"min_lat": ..., "max_lat": ..., "min_lon": ..., "max_lon": ...}
