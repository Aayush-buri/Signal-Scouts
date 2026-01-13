# SignalTrail Deployment Guide

This guide covers deploying SignalTrail to production using modern cloud platforms.

---

## 🎯 Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   PRODUCTION STACK                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Frontend (Vercel)                                      │
│  └─ Next.js App                                         │
│     └─ Automatic HTTPS, CDN, Edge Functions            │
│                                                          │
│  Backend (Railway/Render)                               │
│  └─ FastAPI Docker Container                           │
│     └─ Auto-scaling, Health checks                     │
│                                                          │
│  Database (Supabase)                                    │
│  └─ PostgreSQL 15 + PostGIS                            │
│     └─ Automatic backups, Connection pooling           │
│                                                          │
│  Cache (Upstash Redis)                                  │
│  └─ Serverless Redis                                   │
│     └─ Global replication, Low latency                 │
│                                                          │
│  Monitoring (Sentry + Grafana Cloud)                    │
│  └─ Error tracking, Performance monitoring             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Setup (Supabase)

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Wait for provisioning (~2 minutes)

### 2. Enable PostGIS Extension

```sql
-- In Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### 3. Run Migrations

Copy the schema from `backend/db/models.py` or use Alembic:

```bash
# In backend directory
alembic init migrations
alembic revision --autogenerate -m "Initial schema"
alembic upgrade head
```

### 4. Get Connection String

From Supabase dashboard → Settings → Database:
```
postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

---

## 🚀 Backend Deployment (Railway)

### 1. Create Dockerfile

Already provided in `backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for PostGIS
RUN apt-get update && apt-get install -y \
    gdal-bin \
    libgdal-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 2. Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

### 3. Set Environment Variables

In Railway dashboard, add:
```
DATABASE_URL=your_supabase_connection_string
REDIS_URL=your_upstash_redis_url
SECRET_KEY=generate_a_secure_key_here
H3_SALT_KEY=another_secure_key_for_hashing
CORS_ORIGINS=https://your-frontend-domain.vercel.app
```

### 4. Configure Health Checks

Railway automatically uses `/health` endpoint.

---

## 🌐 Frontend Deployment (Vercel)

### 1. Connect GitHub Repository

1. Go to [vercel.com](https://vercel.com)
2. Import Git Repository
3. Select the `frontend` directory as root

### 2. Configure Build Settings

Framework Preset: **Next.js**
Build Command: `npm run build`
Output Directory: `.next`

### 3. Environment Variables

Add in Vercel dashboard:
```
NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=generate_secure_secret
```

### 4. Deploy

```bash
# Install Vercel CLI (optional)
npm install -g vercel

# Deploy
vercel --prod
```

---

## 🔴 Redis Setup (Upstash)

### 1. Create Upstash Database

1. Go to [upstash.com](https://upstash.com)
2. Create new Redis database
3. Select region closest to your API server
4. Enable TLS

### 2. Get Connection URL

Copy the connection string:
```
rediss://default:[password]@[endpoint]:6379
```

### 3. Test Connection

```bash
# In backend
python -c "import redis; r = redis.from_url('your_redis_url'); print(r.ping())"
```

---

## 📊 Monitoring Setup

### Sentry (Error Tracking)

```bash
# Install Sentry SDK
pip install sentry-sdk[fastapi]
```

Add to `backend/main.py`:
```python
import sentry_sdk

sentry_sdk.init(
    dsn="your_sentry_dsn",
    traces_sample_rate=0.1,
)
```

### Grafana Cloud (Metrics)

1. Create Grafana Cloud account
2. Setup Prometheus integration
3. Install Grafana Agent on Railway

---

## 🔒 Security Checklist

- [ ] All environment variables are set and secure
- [ ] Database uses connection pooling
- [ ] API rate limiting is enabled
- [ ] CORS is configured with specific origins
- [ ] HTTPS is enforced everywhere
- [ ] SSIDs and device IDs are hashed
- [ ] SQL injection prevention (SQLAlchemy ORM)
- [ ] Input validation on all endpoints (Pydantic)

---

## 🧪 Production Testing

### 1. Test Ingestion Endpoint

```bash
curl -X POST https://your-api.railway.app/api/v1/ingest/ \
  -H "Content-Type: application/json" \
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

### 2. Test Navigation Endpoint

```bash
curl "https://your-api.railway.app/api/v1/navigate/vector?lat=40.7128&lon=-74.0060&radius_meters=500"
```

### 3. Test Frontend

Visit `https://your-app.vercel.app/navigate` and verify:
- Geolocation works
- Compass renders
- API calls succeed
- Map loads correctly

---

## 📈 Scaling Considerations

### Database
- Enable read replicas for high traffic
- Partition `signal_readings` table by month
- Setup automated backups

### API
- Horizontal scaling with Railway (auto-configured)
- Add load balancer if using multiple instances
- Increase Redis cache TTL for hot zones

### Frontend
- Vercel automatically handles CDN and edge caching
- Use ISR (Incremental Static Regeneration) for static pages
- Optimize images with Next.js Image component

---

## 💰 Cost Estimation

### Monthly Costs (Moderate Traffic)
- **Supabase Free Tier**: $0 (up to 500MB)
- **Railway Hobby**: $5-20 (depending on usage)
- **Upstash Free Tier**: $0 (10K commands/day)
- **Vercel Hobby**: $0 (Free tier sufficient)

**Total: ~$5-20/month** for MVP

### Scaling Costs (10K+ users)
- **Supabase Pro**: $25/month
- **Railway**: $50-100/month
- **Upstash Pay-as-you-go**: $10-30/month
- **Vercel Pro**: $20/month

**Total: ~$105-175/month**

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: |
          cd backend
          pip install -r requirements.txt
          pytest

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## 🆘 Troubleshooting

### Database Connection Issues
```bash
# Test connection
psql $DATABASE_URL
# Check PostGIS
SELECT PostGIS_version();
```

### API Not Responding
- Check Railway logs: `railway logs`
- Verify environment variables are set
- Check `/health` endpoint

### Frontend Build Failures
- Clear Vercel build cache
- Check Next.js version compatibility
- Verify all dependencies are in package.json

---

## 📞 Support

- **Documentation**: Check README.md
- **Issues**: GitHub Issues
- **Emergency**: Check monitoring dashboards

---

**Ready for Production! 🚀**
