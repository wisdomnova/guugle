# Production Deployment Guide

## Overview

Guugle is now configured for production deployment with real data integrations from blockchain explorers, social media APIs, GitHub, and market data providers. This guide covers setup, configuration, and deployment.

## Architecture

```
┌─────────────────┐
│  Frontend (UI)  │ (Next.js App Router, React 19, Tailwind v4)
└────────┬────────┘
         │
┌────────▼────────────────────┐
│   API Layer (Next.js Routes)│
├──────────────────────────────┤
│ ├─ /api/projects             │ (CRUD, search, filter, sort)
│ ├─ /api/search               │ (Full-text search)
│ ├─ /api/admin/import-project │ (Real data import)
│ ├─ /api/admin/sync-data      │ (Trigger background jobs)
│ └─ /api/health               │ (Monitoring)
└────────┬────────────────────┘
         │
┌────────▼────────────────────────┐
│    Background Jobs Layer        │
├─────────────────────────────────┤
│ ├─ Data scoring (Real algorithm)│
│ ├─ API integrations            │
│ └─ Database updates            │
└────────┬────────────────────────┘
         │
┌────────▼────────────────────────┐
│    Supabase PostgreSQL + RLS    │
└────────────────────────────────┘
         │
┌────────▼────────────────────────┐
│    External Data Sources        │
├─────────────────────────────────┤
│ ├─ Etherscan/Solscan (On-chain) │
│ ├─ Twitter API (Social metrics) │
│ ├─ GitHub API (Dev signals)     │
│ └─ CoinGecko (Market data)      │
└─────────────────────────────────┘
```

## API Keys Setup

### 1. Blockchain Explorers

**Etherscan** (Ethereum)
- Sign up: https://etherscan.io/apis
- Get API key: https://etherscan.io/apis
- Free tier: 5 calls/second
- Add to `.env.local`: `ETHERSCAN_API_KEY=...`

**Solscan** (Solana)
- Sign up: https://solscan.io/api-documentation
- Free tier: Limited calls
- Add to `.env.local`: `SOLSCAN_API_KEY=...`

**PolyScan** (Polygon)
- Sign up: https://polygonscan.com/apis
- Add to `.env.local`: `POLYGONSCAN_API_KEY=...`

### 2. Twitter/X API v2

- Sign up: https://developer.twitter.com/
- Create app with "Read" permissions
- Get Bearer token from App Settings
- Add to `.env.local`: `TWITTER_BEARER_TOKEN=...`
- Rate limit: 300 requests / 15 minutes

### 3. GitHub API

- Generate token: https://github.com/settings/tokens
- Scopes needed: `public_repo`, `read:user`
- Add to `.env.local`: `GITHUB_TOKEN=...`
- Rate limit: 5,000 requests/hour (authenticated)

### 4. CoinGecko

- Free tier: No API key needed
- Pro tier: https://www.coingecko.com/api/documentation
- Add to `.env.local`: `COINGECKO_PRO_API_KEY=...` (optional)

### 5. Email Alerts (SendGrid)

- Sign up: https://sendgrid.com/
- Get API key from Settings → API Keys
- Add to `.env.local`: `SENDGRID_API_KEY=...`
- Configure sender: `ALERTS_EMAIL_FROM=alerts@yourdomain.com`

### 6. Error Tracking (Sentry)

- Sign up: https://sentry.io/
- Create Next.js project
- Get DSN and Auth Token
- Add to `.env.local`:
  - `NEXT_PUBLIC_SENTRY_DSN=...`
  - `SENTRY_AUTH_TOKEN=...`

### 7. Background Job Scheduling

- Random secret already generated in `.env.local`: `JOB_SECRET=...`
- Use with: `curl -H "Authorization: Bearer $JOB_SECRET"`
- Set up cron service to call `/api/admin/sync-data` daily

## Data Import Workflow

### Manual Project Import

```bash
# 1. Get JOB_SECRET from .env.local
JOB_SECRET="your_secret_here"

# 2. Import a project
curl -X POST http://localhost:3000/api/admin/import-project \
  -H "Authorization: Bearer $JOB_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Uniswap",
    "chain": "Ethereum",
    "category": "DeFi",
    "website": "https://uniswap.org",
    "description": "Decentralized exchange protocol",
    "contractAddress": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    "twitterHandle": "Uniswap",
    "githubRepo": "Uniswap/v3-core",
    "coingeckoId": "uniswap"
  }'
```

### Automated Daily Sync

Set up a cron job (using EasyCron, cron-job.org, or similar):

**Schedule:** Daily at 2 AM UTC (off-peak)

**Command:**
```bash
curl -X POST https://your-domain.com/api/admin/sync-data \
  -H "Authorization: Bearer YOUR_JOB_SECRET" \
  -H "Content-Type: application/json"
```

This will:
1. Fetch all projects from database
2. Call real APIs to get current data
3. Recalculate risk scores
4. Update red flags and positive signals
5. Log intelligence reports

## Scoring Algorithm

The risk scoring algorithm uses real data from multiple sources:

### Rug Risk Score (0-100, higher = more risky)
- Contract verification status (-20)
- Holder distribution (-35 if <50 holders)
- Transaction patterns (-25 if abnormal)
- Contract age (-30 if <24 hours)

### Legitimacy Score (0-100, higher = more legitimate)
- GitHub activity (40% weight)
- Code quality (25% weight)
- Twitter verification (20% weight)
- On-chain signals (15% weight)

### Innovation Score (0-100)
- Code complexity from GitHub
- Development velocity (commits/day)
- Repository stars and forks

### Survival Probability (0-100)
- Weighted combination of legitimacy, innovation, rug risk

## Rate Limiting & API Compliance

**Etherscan:** 5 calls/sec
**Twitter:** 300 calls/15min (60 per 3min)
**GitHub:** 5000 calls/hour
**CoinGecko:** 10-50 calls/min (free tier)

**Guugle's approach:**
- Background jobs process 1 project per second (1000ms delay)
- Batches of 50 projects per sync
- Full sync takes ~50 seconds with 50 projects

## Monitoring & Alerts

### Health Check Endpoint

```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "healthy",
  "checks": {
    "supabase": true,
    "etherscan": true,
    "twitter": true,
    "github": true,
    "coingecko": true
  }
}
```

### Error Tracking

- **Sentry** captures all unhandled errors
- **Server logs** in deployment platform
- **Supabase logs** for database issues

### Custom Alerts (Future)

Set up email alerts via SendGrid:
- Project rug risk increased significantly
- Project legitimacy dropped
- API rate limits hit
- Background job failures

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.local.example .env.local
# Edit .env.local with your API keys

# 3. Run dev server
npm run dev

# 4. Test API endpoints
curl http://localhost:3000/api/projects

# 5. Check health
curl http://localhost:3000/api/health

# 6. Import a test project
curl -X POST http://localhost:3000/api/admin/import-project \
  -H "Authorization: Bearer your_secret" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","chain":"Ethereum",...}'
```

## Deployment Checklist

- [ ] All API keys configured in production environment
- [ ] Supabase credentials are production (not development)
- [ ] RLS policies properly configured on database
- [ ] Background job scheduler set up (cron or similar)
- [ ] Error tracking (Sentry) configured
- [ ] Email notifications (SendGrid) tested
- [ ] SSL/TLS certificate configured
- [ ] Domain DNS pointing to deployment
- [ ] Rate limiting configured on CDN
- [ ] Backup strategy for database
- [ ] Monitoring dashboard set up
- [ ] Documentation accessible to team

## Scaling Considerations

**Current Capacity:**
- ~50 projects per sync cycle (50 seconds)
- ~150 projects/day with 3x daily syncs

**To handle 1000+ projects:**
1. Implement queue system (Bull/BullMQ)
2. Use Redis for caching API responses
3. Split scoring into microservices
4. Use cheaper alternative APIs
5. Implement intelligent retry logic
6. Cache results more aggressively

## Security Best Practices

1. **API Keys:** Never commit to git, use `.env.local` + environment variables
2. **RLS:** All database access controlled by row-level security policies
3. **Rate Limiting:** Implement on CDN level (Cloudflare, Vercel, etc.)
4. **Input Validation:** All API inputs validated before processing
5. **Error Messages:** Don't leak sensitive data in error responses
6. **CORS:** Configure properly for production domain
7. **Authentication:** Implement Supabase Auth for multi-user features

## Troubleshooting

**API returns 503 "Service Unavailable"**
- Check health endpoint: `/api/health`
- Verify Supabase credentials
- Check API key validity

**Projects not updating**
- Verify background job triggered manually:
  ```bash
  curl -X POST http://localhost:3000/api/admin/sync-data \
    -H "Authorization: Bearer $JOB_SECRET"
  ```
- Check Sentry for errors
- Verify API keys are valid

**Rate limits hit**
- Reduce frequency of syncs
- Use different API keys (rotate)
- Implement exponential backoff
- Cache responses more aggressively

## Next Steps for Production

1. Set up all API keys
2. Deploy to production environment
3. Configure automated daily syncs
4. Set up monitoring and alerting
5. Configure backup strategy
6. Implement user authentication
7. Add email alert system
8. Build admin dashboard for data management
9. Set up CI/CD pipeline
10. Monitor performance and scale as needed
