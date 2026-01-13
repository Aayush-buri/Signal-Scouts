# SignalTrail - Internet Strength Navigator

<div align="center">

![SignalTrail Logo](https://img.shields.io/badge/SignalTrail-Navigate_to_Better_Signal-0ea5e9?style=for-the-badge)

**A production-grade crowd-sourced signal navigation platform**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15.1-black?logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-PostGIS-336791?logo=postgresql)](https://postgis.net/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)

</div>

---

## 🎯 What is SignalTrail?

SignalTrail is **NOT** a simple speed test. It's a **crowd-sourced signal navigation platform** that tells users *which direction to walk* to achieve better connectivity (Mobile Data/Wi-Fi).

### Core Value Proposition
- 📍 **Real-Time Navigation**: Compass-based directions to stronger signal zones
- 🗺️ **Heatmap Visualization**: See signal coverage across your area
- 🔒 **Privacy First**: All data anonymized, SSIDs hashed, no personal tracking
- 📊 **Crowd-Sourced**: Powered by real signal readings from mobile devices

---

## 🏗️ Architecture

```
Mobile Apps (Android/iOS)
        ↓
    [Ingestion API]
        ↓
┌───────────────────────────┐
│  FastAPI Backend          │
│  - Signal Ingestion       │
│  - H3 Aggregation         │
│  - Navigation Vectors     │
└───────────────────────────┘
        ↓
┌───────────────────────────┐
│  Data Layer               │
│  - PostgreSQL + PostGIS   │
│  - Redis Cache            │
└───────────────────────────┘
        ↓
┌───────────────────────────┐
│  Next.js Frontend         │
│  - SignalCompass UI       │
│  - Heatmap Visualization  │
│  - Admin Dashboard        │
└───────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL 15+ with PostGIS extension
- Redis 7+

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Run migrations (create tables)
python -c "from db.database import init_db; import asyncio; asyncio.run(init_db())"

# Start API server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API will be available at `http://localhost:8000`
Interactive docs at `http://localhost:8000/docs`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start development server
npm run dev
```

Frontend will be available at `http://localhost:3000`

---

## 📡 API Endpoints

### Signal Ingestion
```http
POST /api/v1/ingest/
Content-Type: application/json

{
  "readings": [
    {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "signal_dbm": -65,
      "network_type": "5G",
      "ssid": "MyWiFi",
      "gps_accuracy_meters": 10,
      "device_id": "device_abc123",
      "timestamp": "2026-01-13T10:00:00Z"
    }
  ]
}
```

### Navigation Vector
```http
GET /api/v1/navigate/vector?lat=40.7128&lon=-74.0060&radius_meters=500

Response:
{
  "bearing_degrees": 45.5,
  "distance_meters": 250,
  "confidence_score": 0.85,
  "target_signal_dbm": -55,
  "current_signal_dbm": -72
}
```

### Heatmap Data
```http
GET /api/v1/navigate/heatmap?lat=40.7128&lon=-74.0060&radius_meters=1000

Response:
{
  "cells": [
    {
      "h3_index": "8a2a1072b59ffff",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "avg_signal_dbm": -65.5,
      "confidence_score": 0.78,
      "sample_count": 45
    }
  ],
  "bounds": { "min_lat": 40.710, "max_lat": 40.715, ... }
}
```

---

## 🔐 Privacy & Security

### Data Anonymization
- **SSIDs**: Hashed with SHA256 + salt before storage
- **Device IDs**: Anonymized, rotated every 30 days
- **GPS Coordinates**: Truncated to 5 decimal places (~1.1m accuracy)
- **Carrier Info**: Hashed to prevent identification

### Geospatial Privacy
- Data aggregated at H3 resolution 10 (~15m hexagons)
- Individual readings never displayed on public maps
- Minimum confidence threshold enforced

---

## 🎨 Frontend Features

### SignalCompass Component
- Animated compass arrow pointing to better signal
- Real-time bearing calculation
- Confidence score visualization
- Distance estimation
- Signal strength indicators

### HeatmapView Component
- MapLibre GL JS integration
- Signal strength color gradients
- Interactive zoom controls
- Legend overlay

### Admin Dashboard
- Real-time ingestion metrics
- Network type distribution
- System health monitoring
- Cost tracking

### Expense Module (Isolated)
- Personal finance tracking
- Category-based analysis
- Complete data separation from signal data
- Shared authentication

---

## 🗄️ Database Schema

### signal_readings (Raw Data)
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| location | GEOGRAPHY | GPS coordinates (PostGIS) |
| signal_dbm | INTEGER | Signal strength (-120 to -20) |
| network_type | VARCHAR | 4G, 5G, LTE, WiFi |
| ssid_hash | VARCHAR(64) | SHA256 hash of SSID |
| gps_accuracy_meters | DECIMAL | GPS accuracy |
| device_id_hash | VARCHAR(64) | Anonymized device ID |
| timestamp | TIMESTAMPTZ | Reading timestamp |

### signal_aggregates (H3 Grid)
| Column | Type | Description |
|--------|------|-------------|
| h3_index | VARCHAR(15) | H3 cell identifier (PK) |
| center_location | GEOGRAPHY | Cell center |
| avg_signal_dbm | DECIMAL | Average signal |
| confidence_score | DECIMAL | Data quality (0-1) |
| sample_count | INTEGER | Number of readings |
| network_type_distribution | JSONB | Network distribution |
| last_updated | TIMESTAMPTZ | Last refresh time |

---

## 🌍 Geospatial Strategy

### H3 Hexagonal Indexing
- **Resolution 10**: ~15m hexagons for aggregation
- **Resolution 7**: ~1.2km cells for city-level caching
- Benefits: Uniform cell sizes, efficient neighbor lookups

### PostGIS Optimizations
- GIST spatial indexes on location columns
- Table partitioning by timestamp
- Clustering for spatial locality
- Distance-based queries optimized

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/ --cov=api --cov-report=html
```

### Frontend Tests
```bash
cd frontend
npm run test
```

---

## 🚢 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Recommended Stack
- **API**: Railway / Render (Docker)
- **Database**: Supabase (Managed PostgreSQL + PostGIS)
- **Redis**: Upstash (Serverless)
- **Frontend**: Vercel (Next.js native)

---

## 📝 Project Structure

```
Signal-Scouts/
├── backend/
│   ├── api/              # API route handlers
│   ├── db/               # Database models & connection
│   ├── middleware/       # Auth & rate limiting
│   ├── schemas/          # Pydantic validation schemas
│   ├── services/         # Business logic
│   ├── config.py         # Configuration
│   └── main.py           # FastAPI app
│
├── frontend/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── public/           # Static assets
│   └── package.json
│
└── README.md
```

---

## 🤝 Contributing

This is a production-grade system. Contributions should:
- Include comprehensive tests
- Follow existing code style
- Update documentation
- Consider privacy implications

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🔗 Links

- **Documentation**: [Full API Docs](http://localhost:8000/docs)
- **Issues**: Report bugs or request features
- **Discussions**: Community support

---

<div align="center">

**Built with ❤️ using FastAPI, Next.js, and PostGIS**

[Get Started](#-quick-start) • [Documentation](#-api-endpoints) • [Deploy](#-deployment)

</div>
