# SignalTrail - Project File Manifest

## Backend Files (Python/FastAPI)

### Core Application
- `backend/main.py` - FastAPI application entry point with CORS, compression, lifespan
- `backend/config.py` - Pydantic settings with environment variable management
- `backend/requirements.txt` - Python dependencies (FastAPI, PostGIS, H3, Redis)
- `backend/Dockerfile` - Production container with GDAL support
- `backend/.env.example` - Environment variable template
- `backend/.gitignore` - Python artifacts exclusion

### Database Layer
- `backend/db/database.py` - Async SQLAlchemy engine, Redis connection pool
- `backend/db/models.py` - PostGIS models (SignalReading, SignalAggregate, Expense)

### API Endpoints
- `backend/api/ingestion.py` - POST /ingest/ for signal batch processing
- `backend/api/navigation.py` - GET /navigate/vector, /heatmap for navigation
- `backend/api/expenses.py` - CRUD operations for expense tracking

### Business Logic
- `backend/services/anonymizer.py` - SSID/device hashing, GPS truncation
- `backend/services/geospatial.py` - H3 operations, bearing/distance calculations
- `backend/services/aggregator.py` - Signal aggregation and confidence scoring

### Middleware
- `backend/middleware/auth.py` - JWT token verification

### Schemas
- `backend/schemas/signal.py` - Pydantic validation models

---

## Frontend Files (Next.js/TypeScript)

### Configuration
- `frontend/package.json` - Dependencies (Next.js 15, MapLibre, Framer Motion)
- `frontend/next.config.js` - Next.js configuration
- `frontend/tailwind.config.ts` - Tailwind custom theme
- `frontend/tsconfig.json` - TypeScript configuration
- `frontend/postcss.config.js` - PostCSS with Tailwind
- `frontend/.gitignore` - Node artifacts exclusion

### App Router Pages
- `frontend/app/layout.tsx` - Root layout with metadata, Google Fonts
- `frontend/app/page.tsx` - Landing page with hero and features
- `frontend/app/navigate/page.tsx` - Navigation interface with geolocation
- `frontend/app/admin/page.tsx` - Admin dashboard with charts
- `frontend/app/expenses/page.tsx` - Expense tracking UI
- `frontend/app/globals.css` - Global styles with Tailwind directives

### Components
- `frontend/components/SignalCompass.tsx` - Animated compass with confidence
- `frontend/components/HeatmapView.tsx` - MapLibre heatmap visualization

---

## Documentation

- `README.md` - Main project documentation
- `DEPLOYMENT.md` - Production deployment guide
- `SERVICE_WORKER.md` - Offline support implementation
- `task.md` - Implementation checklist (artifact)
- `implementation_plan.md` - Architectural blueprint (artifact)
- `walkthrough.md` - Project walkthrough (artifact)

---

## Total Files Created: 35

All files are production-ready and follow best practices for:
- Security (anonymization, validation)
- Performance (Redis caching, PostGIS indexes)
- Scalability (horizontal scaling ready)
- Maintainability (type safety, clear structure)
- Documentation (comprehensive guides)
