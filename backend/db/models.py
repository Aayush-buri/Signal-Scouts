from sqlalchemy import Column, String, Integer, DECIMAL, CheckConstraint, Index, TIMESTAMP, Date, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from geoalchemy2 import Geography
from datetime import datetime
import uuid
from db.database import Base


class SignalReading(Base):
    """Raw signal readings from mobile devices"""
    __tablename__ = "signal_readings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    location = Column(Geography(geometry_type='POINT', srid=4326), nullable=False)
    signal_dbm = Column(Integer, CheckConstraint('signal_dbm BETWEEN -120 AND -20'), nullable=False)
    network_type = Column(String(10), CheckConstraint("network_type IN ('4G', '5G', 'LTE', 'WiFi')"), nullable=False)
    ssid_hash = Column(String(64), nullable=True)  # SHA256 hash for WiFi
    gps_accuracy_meters = Column(DECIMAL(8, 2), nullable=True)
    device_id_hash = Column(String(64), nullable=False)
    carrier_hash = Column(String(64), nullable=True)
    timestamp = Column(TIMESTAMP(timezone=True), nullable=False, default=datetime.utcnow)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, default=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_signal_readings_location', 'location', postgresql_using='gist'),
        Index('idx_signal_readings_timestamp', 'timestamp', postgresql_ops={'timestamp': 'DESC'}),
        Index('idx_signal_readings_network_type', 'network_type'),
    )


class SignalAggregate(Base):
    """Aggregated signal data using H3 hexagonal grid"""
    __tablename__ = "signal_aggregates"
    
    h3_index = Column(String(15), primary_key=True)
    center_location = Column(Geography(geometry_type='POINT', srid=4326), nullable=False)
    avg_signal_dbm = Column(DECIMAL(5, 2), nullable=True)
    max_signal_dbm = Column(Integer, nullable=True)
    min_signal_dbm = Column(Integer, nullable=True)
    sample_count = Column(Integer, default=0)
    network_type_distribution = Column(JSONB, nullable=True)  # {"4G": 20, "5G": 80}
    confidence_score = Column(DECIMAL(3, 2), nullable=True)  # 0.00 to 1.00
    last_updated = Column(TIMESTAMP(timezone=True), nullable=True)
    data_freshness_hours = Column(Integer, nullable=True)
    
    __table_args__ = (
        Index('idx_signal_aggregates_location', 'center_location', postgresql_using='gist'),
        Index('idx_signal_aggregates_confidence', 'confidence_score', postgresql_ops={'confidence_score': 'DESC'}),
    )


class Expense(Base):
    """Personal expense tracking (isolated from signal data)"""
    __tablename__ = "expenses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(255), nullable=False)  # From auth system
    amount = Column(DECIMAL(10, 2), nullable=False)
    category = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    expense_date = Column(Date, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, default=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_expenses_user_id', 'user_id'),
        Index('idx_expenses_date', 'expense_date', postgresql_ops={'expense_date': 'DESC'}),
    )
