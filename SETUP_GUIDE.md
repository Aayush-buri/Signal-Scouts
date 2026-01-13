# SignalTrail - Complete Setup & Testing Guide

## 🚨 Current System Status

**Python**: ❌ Not Installed  
**Node.js/npm**: ❌ Not Installed  
**Code Quality**: ✅ All syntax and logic issues resolved

---

## 📋 Pre-Installation Checklist

### Required Software
1. **Python 3.11+** - Backend runtime
2. **Node.js 20+ LTS** - Frontend runtime (includes npm)
3. **PostgreSQL 15+** - Database with PostGIS extension
4. **Redis 7+** - Caching layer
5. **Git** - Version control (optional)

---

## 🔧 Step 1: Install Python

### Option A: Official Installer (Recommended)
1. Download from [python.org/downloads](https://www.python.org/downloads/)
2. Run installer
3. ✅ **IMPORTANT**: Check "Add Python to PATH"
4. Click "Install Now"
5. Verify installation:
   ```powershell
   python --version
   # Should show: Python 3.11.x or higher
   ```

### Option B: Windows Store
```powershell
# Search "Python 3.11" in Microsoft Store
# Click "Get" to install
```

### Option C: Package Manager
```powershell
# Using Chocolatey (run as Administrator)
choco install python311

# Using Winget
winget install Python.Python.3.11
```

---

## 🔧 Step 2: Install Node.js

### Option A: Official Installer (Recommended)
1. Download LTS from [nodejs.org](https://nodejs.org/)
2. Run installer (includes npm automatically)
3. Accept defaults
4. Verify installation:
   ```powershell
   node --version
   npm --version
   # Should show: v20.x.x and 10.x.x
   ```

### Option B: Package Manager
```powershell
# Using Chocolatey
choco install nodejs-lts

# Using Winget
winget install OpenJS.NodeJS.LTS
```

---

## 🔧 Step 3: Install PostgreSQL + PostGIS

### Option A: Official Installer
1. Download from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)
2. Run installer
3. During installation:
   - Set password for postgres user (remember this!)
   - Port: 5432 (default)
   - Install Stack Builder
4. In Stack Builder:
   - Select PostgreSQL installation
   - Expand "Spatial Extensions"
   - Select **PostGIS**
   - Install

### Option B: Docker (Easier)
```powershell
docker run -d `
  --name signaltrail-db `
  -e POSTGRES_PASSWORD=yourpassword `
  -e POSTGRES_DB=signaltrail `
  -p 5432:5432 `
  postgis/postgis:15-3.3
```

---

## 🔧 Step 4: Install Redis

### Option A: Docker (Recommended for Windows)
```powershell
docker run -d `
  --name signaltrail-redis `
  -p 6379:6379 `
  redis:7-alpine
```

### Option B: WSL (Windows Subsystem for Linux)
```bash
# In WSL Ubuntu
sudo apt-get update
sudo apt-get install redis-server
redis-server
```

### Option C: Use Upstash (Cloud Redis - Free Tier)
- Visit [upstash.com](https://upstash.com)
- Create free Redis database
- Copy connection string for later

---

## 🚀 Step 5: Backend Setup

### 5.1 Navigate to Backend
```powershell
cd e:\SignalTrail\Signal-Scouts\backend
```

### 5.2 Create Virtual Environment
```powershell
python -m venv venv
.\venv\Scripts\activate
```

### 5.3 Install Dependencies
```powershell
pip install -r requirements.txt
```

**Expected Output**:
- Installing fastapi, uvicorn, sqlalchemy, asyncpg, geoalchemy2, h3, redis, etc.
- May take 2-3 minutes

### 5.4 Configure Environment
```powershell
# Copy template
cp .env.example .env

# Edit .env file with your values
```

**Required values in `.env`**:
```env
DATABASE_URL=postgresql+asyncpg://postgres:yourpassword@localhost:5432/signaltrail
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key-min-32-chars
H3_SALT_KEY=another-secret-key-for-hashing
CORS_ORIGINS=http://localhost:3000
```

**Generate secure keys**:
```powershell
# In Python
python -c "import secrets; print(secrets.token_hex(32))"
```

### 5.5 Initialize Database
```powershell
python -c "from db.database import init_db; import asyncio; asyncio.run(init_db())"
```

**Expected Output**:
```
CREATE EXTENSION IF NOT EXISTS postgis
CREATE EXTENSION IF NOT EXISTS pgcrypto
CREATE TABLE signal_readings...
CREATE TABLE signal_aggregates...
CREATE TABLE expenses...
```

### 5.6 Start Backend Server
```powershell
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output**:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

### 5.7 Test Backend
Open browser: `http://localhost:8000/docs`

Should see **FastAPI Swagger UI** with endpoints:
- POST /api/v1/ingest/
- GET /api/v1/navigate/vector
- GET /api/v1/navigate/heatmap
- GET/POST /api/v1/expenses/

---

## 🎨 Step 6: Frontend Setup

### 6.1 Navigate to Frontend
```powershell
cd e:\SignalTrail\Signal-Scouts\frontend
```

### 6.2 Install Dependencies
```powershell
npm install
```

**Expected Output**:
- Installing next, react, react-dom, maplibre-gl, framer-motion, etc.
- May take 3-5 minutes
- Creates `node_modules/` folder (800MB+)

### 6.3 Configure Environment
```powershell
# Copy template
cp .env.local.example .env.local

# Edit if needed (default should work)
```

**Default `.env.local`**:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 6.4 Start Frontend Server
```powershell
npm run dev
```

**Expected Output**:
```
- ready started server on 0.0.0.0:3000
- info Loaded env from .env.local
✓ Ready in 2.5s
```

### 6.5 Test Frontend
Open browser: `http://localhost:3000`

Should see **SignalTrail landing page** with:
- Hero section
- Feature cards
- Navigation links

---

## ✅ Step 7: Verification Tests

### 7.1 Backend Health Check
```powershell
curl http://localhost:8000/health
```

**Expected**:
```json
{"status":"healthy","service":"signaltrail-api"}
```

### 7.2 Test Signal Ingestion
```powershell
curl -X POST http://localhost:8000/api/v1/ingest/ `
  -H "Content-Type: application/json" `
  -d '{
    "readings": [{
      "latitude": 40.7128,
      "longitude": -74.0060,
      "signal_dbm": -65,
      "network_type": "5G",
      "device_id": "test_device_001",
      "timestamp": "2026-01-13T10:00:00Z"
    }]
  }'
```

**Expected**:
```json
{
  "accepted_count": 1,
  "rejected_count": 0,
  "message": "Successfully ingested 1 readings"
}
```

### 7.3 Test Navigation Endpoint
```powershell
curl "http://localhost:8000/api/v1/navigate/vector?lat=40.7128&lon=-74.0060&radius_meters=500"
```

**Expected** (after ingesting data):
```json
{
  "bearing_degrees": 45.5,
  "distance_meters": 250,
  "confidence_score": 0.85
}
```

Or (cold start):
```json
{
  "detail": "No signal data available in this area (Cold Start)."
}
```

### 7.4 Frontend Pages
Visit these URLs and verify:

✅ `http://localhost:3000` - Landing page loads  
✅ `http://localhost:3000/navigate` - Navigation UI (requests location)  
✅ `http://localhost:3000/admin` - Admin dashboard  
✅ `http://localhost:3000/expenses` - Expense tracker

---

## 🐛 Common Issues & Fixes

### Issue: "ModuleNotFoundError: No module named 'fastapi'"
**Fix**: Activate virtual environment first
```powershell
cd backend
.\venv\Scripts\activate
pip install -r requirements.txt
```

### Issue: "Error connecting to database"
**Fix**: Check PostgreSQL is running
```powershell
# Check if PostgreSQL service is running
Get-Service -Name postgresql*

# Start if stopped
Start-Service postgresql-x64-15
```

### Issue: "Redis connection failed"
**Fix**: Start Redis
```powershell
# If using Docker
docker start signaltrail-redis

# Check connection
redis-cli ping
# Should return: PONG
```

### Issue: TypeScript errors in frontend
**Fix**: Run npm install
```powershell
cd frontend
npm install
```

### Issue: "Port 8000 already in use"
**Fix**: Kill process or use different port
```powershell
# Find process
netstat -ano | findstr :8000

# Kill process (replace PID)
taskkill /PID <process_id> /F

# Or use different port
uvicorn main:app --port 8001
```

### Issue: CORS errors in browser
**Fix**: Check CORS_ORIGINS in .env
```env
CORS_ORIGINS=http://localhost:3000
```

---

## 📊 Testing Checklist

### Backend Tests
- [ ] Python syntax validation
- [ ] All imports resolve
- [ ] Database connection successful
- [ ] Redis connection successful
- [ ] API endpoints respond
- [ ] Signal ingestion works
- [ ] H3 aggregation runs
- [ ] Navigation vector calculates

### Frontend Tests
- [ ] npm install completes
- [ ] TypeScript compiles without errors
- [ ] Next.js builds successfully
- [ ] All pages load
- [ ] SignalCompass renders
- [ ] Map displays correctly
- [ ] API calls successful
- [ ] Environment variables work

### Integration Tests
- [ ] Frontend → Backend communication
- [ ] Geolocation permission works
- [ ] Device orientation (mobile only)
- [ ] Redis caching functions
- [ ] Database queries optimized

---

## 🎯 Next Steps After Setup

1. **Seed Test Data**: Use admin endpoint to populate areas
2. **Test Navigation**: Try different locations
3. **Monitor Performance**: Check Redis cache hit rate
4. **Review Logs**: Check for any warnings
5. **Deploy**: Follow DEPLOYMENT.md for production

---

## 📞 Support

If you encounter issues:
1. Check this guide's troubleshooting section
2. Review `ISSUE_RESOLUTION.md`
3. Check backend logs in terminal
4. Verify all services are running
5. Ensure environment variables are set

---

## ✨ Success Indicators

When everything is working:

✅ Backend terminal shows:
```
INFO: Application startup complete
✅ Database initialized
```

✅ Frontend terminal shows:
```
✓ Ready in 2.5s
○ Compiling / ...
```

✅ Browser console shows:
```
No errors (may have warnings about geolocation)
```

✅ API docs accessible at `http://localhost:8000/docs`  
✅ Frontend accessible at `http://localhost:3000`

---

**Your system is ready for SignalTrail development! 🚀**
