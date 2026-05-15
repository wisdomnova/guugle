# Guugle — Web3 Intelligence Platform

**Production-ready** platform for discovering, analyzing, and monitoring early-stage crypto projects with real-time risk scoring from blockchain, social, and development signals.

## 🚀 Overview

Guugle fetches **real data** from multiple sources to provide institutional-grade risk assessment:
- **🔗 On-Chain Signals**: Smart contract analysis, holder distribution, transaction patterns (Etherscan/Solscan)
- **🐦 Social Metrics**: Twitter engagement, community size, authenticity (Twitter API v2)
- **💻 Dev Activity**: Code quality, commit frequency, repository health (GitHub API)
- **💰 Market Data**: Token price, liquidity, exchange listings (CoinGecko)
- **📊 Scoring**: Multi-factor algorithm combining all signals into risk scores

## ✅ Production Features

✅ Real data integrations (not mock data)
✅ Institutional-grade risk scoring algorithm
✅ Background data sync jobs (automated daily updates)
✅ REST API for programmatic access
✅ Admin tools for project management
✅ Health monitoring and error tracking
✅ Rate limiting and API compliance
✅ Supabase PostgreSQL with RLS
✅ Next.js 16, React 19, TypeScript

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript 5
- **Styling**: Tailwind CSS v4, Framer Motion
- **Database**: Supabase PostgreSQL with Row-Level Security
- **APIs**: Etherscan, Twitter v2, GitHub, CoinGecko
- **Background Jobs**: Node.js (cron-based or queue system)

### Project Structure
```
guugle/
├── app/
│   ├── page.tsx                    # Main dashboard
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Design tokens & Tailwind
│   └── api/
│       ├── projects/               # CRUD endpoints
│       ├── search/                 # Full-text search
│       ├── admin/
│       │   ├── import-project/     # Manual project import
│       │   └── sync-data/          # Trigger background jobs
│       └── health/                 # Monitoring
├── components/
│   ├── ui/
│   │   ├── discovery-dashboard.tsx
│   │   ├── project-intelligence-card.tsx
│   │   ├── project-report-modal.tsx
│   │   └── design-tokens.ts
│   └── ...
├── lib/
│   ├── integrations/
│   │   ├── etherscan.ts           # On-chain data
│   │   ├── twitter.ts             # Social metrics
│   │   ├── github.ts              # Dev signals
│   │   └── coingecko.ts           # Market data
│   ├── scoring.ts                 # Risk scoring algorithm
│   ├── background-jobs.ts         # Data sync jobs
│   └── seed.ts                    # Project import/seeding
└── sql/
    └── intelligence-schema.sql    # Database schema
```

## 🧠 Scoring Algorithm

Guugle uses **real data** from multiple sources to calculate risk scores:

### Rug Risk Score (0-100, higher = riskier)
- Contract verification status
- Holder distribution and concentration
- Transaction patterns
- Deployer wallet history
- Lock duration and mechanisms

### Legitimacy Score (0-100)
- GitHub activity and contributor count (40%)
- Code quality and test coverage (25%)
- Twitter verification and engagement (20%)
- On-chain signals (15%)

### Innovation Score (0-100)
- Code complexity and uniqueness
- Development velocity
- Repository popularity (stars/forks)

### Survival Probability (0-100)
- Weighted combination of all factors
- Predicts likelihood of 12+ month survival

## 📡 API Endpoints

### Projects
```
GET  /api/projects                 # List all projects (paginated)
POST /api/projects                 # Create project
GET  /api/projects/:id             # Get project details
PATCH /api/projects/:id            # Update scores
DELETE /api/projects/:id           # Delete project
```

### Search & Filter
```
GET /api/search?q=uniswap          # Full-text search
GET /api/projects?category=DeFi&chain=Ethereum&sort=rug-risk
```

### Admin
```
POST /api/admin/import-project     # Import with real data scoring
POST /api/admin/sync-data          # Trigger background update
GET /api/health                    # Check system status
```

**See [API_REFERENCE.md](API_REFERENCE.md) for full documentation**

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+
- npm or pnpm
- Supabase account (https://supabase.com)
- API keys for data sources (see PRODUCTION.md)

### 2. Installation

```bash
# Clone and install
git clone <repo>
cd guugle
npm install

# Copy environment template
cp .env.local.example .env.local

# Edit .env.local with your API keys and Supabase credentials
# See PRODUCTION.md for detailed setup instructions
```

### 3. Run Locally

```bash
# Start dev server
npm run dev

# Open http://localhost:3000
```

### 4. Import First Project

```bash
# Get JOB_SECRET from .env.local
JOB_SECRET="..."

# Import a real project
curl -X POST http://localhost:3000/api/admin/import-project \
  -H "Authorization: Bearer $JOB_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Uniswap",
    "chain": "Ethereum",
    "category": "DeFi",
    "website": "https://uniswap.org",
    "description": "Decentralized exchange",
    "contractAddress": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    "twitterHandle": "Uniswap",
    "githubRepo": "Uniswap/v3-core",
    "coingeckoId": "uniswap"
  }'

# Projects will be scored with real data!
```

### 5. Trigger Data Sync

```bash
# Update all project scores
curl -X POST http://localhost:3000/api/admin/sync-data \
  -H "Authorization: Bearer $JOB_SECRET"
```
## 📚 Documentation

- **[PRODUCTION.md](PRODUCTION.md)** — Complete setup guide for production deployment
- **[API_REFERENCE.md](API_REFERENCE.md)** — API endpoints, examples, and integration guide
- **[.env.local.example](.env.local.example)** — Environment variables template

## 🔐 Production Setup Checklist

- [ ] Configure all API keys (see PRODUCTION.md)
- [ ] Set up Supabase project and credentials
- [ ] Configure environment variables in production
- [ ] Set up automated data sync cron job
- [ ] Configure error tracking (Sentry)
- [ ] Set up email alerts (SendGrid)
- [ ] Test health endpoint (`/api/health`)
- [ ] Import test projects with real data
- [ ] Verify scoring algorithm output
- [ ] Set up database backups
- [ ] Configure monitoring dashboard
- [ ] Deploy to production

## 🛠️ Development Commands

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run TypeScript check
npm run type-check       # Type checking

# Testing APIs locally
curl http://localhost:3000/api/health
curl http://localhost:3000/api/projects?limit=5
curl "http://localhost:3000/api/search?q=defi"
```

## 📊 Data Flow

```
Real Data Sources
  │
  ├─ Etherscan (On-chain)
  ├─ Twitter (Social)
  ├─ GitHub (Development)
  └─ CoinGecko (Market)
        │
        ▼
Background Job (Daily)
  • Fetch all data for each project
  • Run scoring algorithm
  • Calculate risk metrics
  • Store in database
        │
        ▼
API Layer
  • /api/projects (list/search)
  • /api/admin/* (admin ops)
  • /api/health (monitoring)
        │
        ▼
Frontend Dashboard
  • Display projects
  • Show risk scores
  • Filter and search
```

## ⚠️ Rate Limits

**Guugle respects all API rate limits:**

| Source | Limit |
|--------|-------|
| Etherscan | 5 calls/sec |
| Twitter | 300 calls/15 min |
| GitHub | 5,000 calls/hour |
| CoinGecko | 10-50 calls/min |

**Solution:** Background jobs process 1 project per second with rate limiting

## 🐛 Troubleshooting

**Problem:** "Unauthorized" on admin endpoints
- Solution: Check `Authorization: Bearer $JOB_SECRET` header is set
- Get secret from `.env.local`

**Problem:** Projects not updating
- Solution: Manually trigger sync:
  ```bash
  curl -X POST http://localhost:3000/api/admin/sync-data \
    -H "Authorization: Bearer $JOB_SECRET"
  ```

**Problem:** Health check shows services unhealthy
- Solution: Verify API keys are valid and configured
- Check Sentry dashboard for errors
- Review Supabase connection string

**See PRODUCTION.md for more troubleshooting**

## 📝 License

MIT
