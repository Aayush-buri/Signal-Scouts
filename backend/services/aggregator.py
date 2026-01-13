from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from db.models import SignalReading, SignalAggregate
from services.geospatial import GeospatialService
from datetime import datetime, timedelta
from typing import List, Dict
import json


class SignalAggregator:
    """Aggregates raw signal readings into H3 cells"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.geo_service = GeospatialService()
    
    async def aggregate_cell(self, h3_index: str) -> None:
        """
        Aggregate all readings for a single H3 cell
        
        Args:
            h3_index: H3 cell identifier
        """
        center_lat, center_lon = self.geo_service.h3_to_lat_lon(h3_index)
        
        # Query all readings in this cell (within last 7 days)
        cutoff_date = datetime.utcnow() - timedelta(days=7)
        
        # Use PostGIS to find readings within cell polygon
        # For simplicity, we use a radius approximation (~15m for resolution 10)
        radius_meters = 20
        
        query = text("""
            SELECT 
                AVG(signal_dbm) as avg_signal,
                MAX(signal_dbm) as max_signal,
                MIN(signal_dbm) as min_signal,
                COUNT(*) as sample_count,
                network_type,
                COUNT(network_type) as type_count,
                MAX(timestamp) as last_updated
            FROM signal_readings
            WHERE 
                ST_DWithin(
                    location::geography,
                    ST_MakePoint(:lon, :lat)::geography,
                    :radius
                )
                AND timestamp >= :cutoff_date
            GROUP BY network_type
        """)
        
        result = await self.db.execute(
            query,
            {
                "lat": center_lat,
                "lon": center_lon,
                "radius": radius_meters,
                "cutoff_date": cutoff_date
            }
        )
        
        rows = result.fetchall()
        
        if not rows:
            # No data for this cell, skip or mark as low confidence
            return
        
        # Aggregate across network types
        total_samples = sum(row.sample_count for row in rows)
        weighted_avg = sum(row.avg_signal * row.sample_count for row in rows) / total_samples
        max_signal = max(row.max_signal for row in rows)
        min_signal = min(row.min_signal for row in rows)
        last_updated = max(row.last_updated for row in rows)
        
        # Network type distribution
        network_dist = {row.network_type: row.type_count for row in rows}
        
        # Calculate data freshness
        data_age = (datetime.utcnow() - last_updated).total_seconds() / 3600
        
        # Calculate confidence score
        confidence = self.geo_service.calculate_confidence(
            sample_count=total_samples,
            data_age_hours=data_age
        )
        
        # Upsert aggregate
        aggregate = SignalAggregate(
            h3_index=h3_index,
            center_location=f"SRID=4326;POINT({center_lon} {center_lat})",
            avg_signal_dbm=round(weighted_avg, 2),
            max_signal_dbm=max_signal,
            min_signal_dbm=min_signal,
            sample_count=total_samples,
            network_type_distribution=network_dist,
            confidence_score=confidence,
            last_updated=last_updated,
            data_freshness_hours=int(data_age)
        )
        
        # Merge (upsert)
        await self.db.merge(aggregate)
        await self.db.commit()
    
    async def aggregate_area(
        self,
        lat: float,
        lon: float,
        radius_meters: int = 1000
    ) -> int:
        """
        Aggregate all cells within an area
        
        Args:
            lat: Center latitude
            lon: Center longitude
            radius_meters: Radius to aggregate
            
        Returns:
            Number of cells aggregated
        """
        # Get all H3 cells in radius
        h3_cells = self.geo_service.get_cells_in_radius(lat, lon, radius_meters)
        
        # Aggregate each cell
        for h3_index in h3_cells:
            await self.aggregate_cell(h3_index)
        
        return len(h3_cells)
    
    async def get_best_signal_in_area(
        self,
        lat: float,
        lon: float,
        radius_meters: int = 500
    ) -> Dict:
        """
        Find the cell with best signal in area
        
        Args:
            lat: Current latitude
            lon: Current longitude
            radius_meters: Search radius
            
        Returns:
            Dict with bearing, distance, and signal info
        """
        # Get H3 cells in radius
        h3_cells = self.geo_service.get_cells_in_radius(lat, lon, radius_meters)
        
        # Query aggregates for these cells
        query = select(SignalAggregate).where(
            SignalAggregate.h3_index.in_(h3_cells),
            SignalAggregate.confidence_score >= 0.3  # Minimum confidence threshold
        ).order_by(SignalAggregate.avg_signal_dbm.desc())
        
        result = await self.db.execute(query)
        best_cell = result.scalars().first()
        
        if not best_cell:
            return None
        
        # Get center coordinates of best cell
        target_lat, target_lon = self.geo_service.h3_to_lat_lon(best_cell.h3_index)
        
        # Calculate bearing and distance
        bearing = self.geo_service.calculate_bearing(lat, lon, target_lat, target_lon)
        distance = self.geo_service.calculate_distance(lat, lon, target_lat, target_lon)
        
        # Get current location signal
        current_h3 = self.geo_service.lat_lon_to_h3(lat, lon)
        current_query = select(SignalAggregate).where(
            SignalAggregate.h3_index == current_h3
        )
        current_result = await self.db.execute(current_query)
        current_cell = current_result.scalars().first()
        
        return {
            "bearing_degrees": bearing,
            "distance_meters": distance,
            "confidence_score": float(best_cell.confidence_score),
            "target_signal_dbm": int(best_cell.avg_signal_dbm),
            "current_signal_dbm": int(current_cell.avg_signal_dbm) if current_cell else None
        }
