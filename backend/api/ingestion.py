from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from db.database import get_db
from db.models import SignalReading
from schemas.signal import SignalBatchInput, SignalReadingResponse
from services.anonymizer import Anonymizer
from services.geospatial import GeospatialService
from services.aggregator import SignalAggregator
from datetime import datetime

router = APIRouter(prefix="/api/v1/ingest", tags=["Ingestion"])


@router.post("/", response_model=SignalReadingResponse)
async def ingest_signal_batch(
    batch: SignalBatchInput,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Ingest a batch of signal readings from mobile devices
    
    - Validates input data
    - Anonymizes sensitive information (SSID, device ID, carrier)
    - Stores in PostGIS database
    - Triggers background aggregation for affected H3 cells
    """
    accepted_count = 0
    rejected_count = 0
    affected_h3_cells = set()
    
    try:
        for reading in batch.readings:
            # Truncate coordinates for privacy
            lat, lon = Anonymizer.truncate_coordinates(
                reading.latitude,
                reading.longitude
            )
            
            # Hash sensitive data
            ssid_hash = Anonymizer.hash_ssid(reading.ssid) if reading.ssid else None
            device_hash = Anonymizer.hash_device_id(reading.device_id)
            carrier_hash = Anonymizer.hash_carrier(reading.carrier) if reading.carrier else None
            
            # Create signal reading
            signal_reading = SignalReading(
                location=f"SRID=4326;POINT({lon} {lat})",
                signal_dbm=reading.signal_dbm,
                network_type=reading.network_type.value,
                ssid_hash=ssid_hash,
                gps_accuracy_meters=reading.gps_accuracy_meters,
                device_id_hash=device_hash,
                carrier_hash=carrier_hash,
                timestamp=reading.timestamp
            )
            
            # Add to session
            db.add(signal_reading)
            accepted_count += 1
            
            # Track H3 cell for aggregation
            geo_service = GeospatialService()
            h3_index = geo_service.lat_lon_to_h3(lat, lon)
            affected_h3_cells.add(h3_index)
        
        # Commit all readings
        await db.commit()
        
        # Trigger background aggregation for affected cells
        for h3_index in affected_h3_cells:
            background_tasks.add_task(
                aggregate_cell_background,
                h3_index,
                db
            )
        
        return SignalReadingResponse(
            accepted_count=accepted_count,
            rejected_count=rejected_count,
            message=f"Successfully ingested {accepted_count} readings"
        )
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")


async def aggregate_cell_background(h3_index: str, db: AsyncSession):
    """Background task to aggregate signal data for a cell"""
    try:
        aggregator = SignalAggregator(db)
        await aggregator.aggregate_cell(h3_index)
    except Exception as e:
        # Log error but don't fail the request
        print(f"Background aggregation failed for {h3_index}: {e}")


@router.get("/health")
async def ingestion_health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "signal_ingestion",
        "timestamp": datetime.utcnow().isoformat()
    }
