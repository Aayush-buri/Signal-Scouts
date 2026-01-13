from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from db.database import get_db, get_redis
from schemas.signal import NavigationVector, HeatmapResponse, HeatmapCell
from services.aggregator import SignalAggregator
from services.geospatial import GeospatialService
from sqlalchemy import select
from db.models import SignalAggregate
import json

router = APIRouter(prefix="/api/v1/navigate", tags=["Navigation"])


@router.get("/vector", response_model=NavigationVector)
async def get_navigation_vector(
    lat: float = Query(..., ge=-90, le=90, description="Current latitude"),
    lon: float = Query(..., ge=-180, le=180, description="Current longitude"),
    radius_meters: int = Query(500, ge=100, le=2000, description="Search radius"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get navigation vector pointing toward better signal
    
    Returns bearing (compass direction) and distance to move for improved connectivity.
    Includes confidence score based on data freshness and sample size.
    """
    # Check Redis cache first
    redis = await get_redis()
    cache_key = f"nav:{lat:.5f}:{lon:.5f}:{radius_meters}"
    
    cached_result = await redis.get(cache_key)
    if cached_result:
        return NavigationVector(**json.loads(cached_result))
    
    # Calculate navigation vector
    aggregator = SignalAggregator(db)
    result = await aggregator.get_best_signal_in_area(lat, lon, radius_meters)
    
    if not result:
        raise HTTPException(
            status_code=404,
            detail="No signal data available in this area (Cold Start). Please contribute data via mobile app."
        )
    
    navigation_vector = NavigationVector(**result)
    
    # Cache result for 2 minutes
    await redis.setex(
        cache_key,
        120,
        navigation_vector.model_dump_json()
    )
    
    return navigation_vector


@router.get("/heatmap", response_model=HeatmapResponse)
async def get_heatmap(
    lat: float = Query(..., ge=-90, le=90, description="Center latitude"),
    lon: float = Query(..., ge=-180, le=180, description="Center longitude"),
    radius_meters: int = Query(1000, ge=500, le=5000, description="Area radius"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get heatmap data for visualization
    
    Returns aggregated signal strength data for all H3 cells in the specified area.
    """
    # Check cache
    redis = await get_redis()
    cache_key = f"heatmap:{lat:.5f}:{lon:.5f}:{radius_meters}"
    
    cached_result = await redis.get(cache_key)
    if cached_result:
        return HeatmapResponse(**json.loads(cached_result))
    
    # Get H3 cells in radius
    geo_service = GeospatialService()
    h3_cells = geo_service.get_cells_in_radius(lat, lon, radius_meters)
    
    # Query aggregates
    query = select(SignalAggregate).where(
        SignalAggregate.h3_index.in_(h3_cells),
        SignalAggregate.confidence_score >= 0.2
    )
    
    result = await db.execute(query)
    aggregates = result.scalars().all()
    
    if not aggregates:
        raise HTTPException(
            status_code=404,
            detail="No heatmap data available in this area"
        )
    
    # Convert to response format
    cells = []
    min_lat, max_lat = 90, -90
    min_lon, max_lon = 180, -180
    
    for agg in aggregates:
        cell_lat, cell_lon = geo_service.h3_to_lat_lon(agg.h3_index)
        
        cells.append(HeatmapCell(
            h3_index=agg.h3_index,
            latitude=cell_lat,
            longitude=cell_lon,
            avg_signal_dbm=float(agg.avg_signal_dbm),
            confidence_score=float(agg.confidence_score),
            sample_count=agg.sample_count
        ))
        
        # Track bounds
        min_lat = min(min_lat, cell_lat)
        max_lat = max(max_lat, cell_lat)
        min_lon = min(min_lon, cell_lon)
        max_lon = max(max_lon, cell_lon)
    
    response = HeatmapResponse(
        cells=cells,
        bounds={
            "min_lat": min_lat,
            "max_lat": max_lat,
            "min_lon": min_lon,
            "max_lon": max_lon
        }
    )
    
    # Cache for 5 minutes
    await redis.setex(
        cache_key,
        300,
        response.model_dump_json()
    )
    
    return response


@router.post("/aggregate-area")
async def trigger_area_aggregation(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    radius_meters: int = Query(1000, ge=500, le=5000),
    db: AsyncSession = Depends(get_db)
):
    """
    Manually trigger aggregation for an area (admin only in production)
    
    Useful for initial data seeding or refreshing stale areas.
    """
    aggregator = SignalAggregator(db)
    cells_aggregated = await aggregator.aggregate_area(lat, lon, radius_meters)
    
    return {
        "message": f"Successfully aggregated {cells_aggregated} cells",
        "center": {"lat": lat, "lon": lon},
        "radius_meters": radius_meters
    }
