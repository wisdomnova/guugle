# Architecture & System Design

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Web3 Intelligence Layer                   │
└─────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
            ┌───────▼────┐  ┌────▼────┐  ┌───▼────────┐
            │  UI Layer  │  │  Engine │  │   Cache    │
            │ (Next.js)  │  │ (Node)  │  │   (Redis)  │
            └────────────┘  └────┬────┘  └────────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
              ┌─────▼──┐  ┌──────▼───┐  ┌───▼──────┐
              │  Data  │  │ Scoring  │  │ On-Chain │
              │Sources │  │  Engine  │  │  Signals │
              └────────┘  └──────────┘  └──────────┘
```

## Technology Stack

### Frontend Layer
- **Framework**: Next.js 16 with App Router
- **Rendering**: Server Components + Client Components hybrid
- **Styling**: Tailwind CSS v4 + CSS Grid/Flexbox
- **State**: React 19 hooks (client-side)
- **Animations**: Framer Motion 12
- **UI Kit**: Tabler Icons 3.44

### Backend Layer (Future)
- **Runtime**: Node.js 20 LTS
- **Framework**: Express / Fastify
- **Database**: PostgreSQL (projects, metrics, history)
- **Cache**: Redis (real-time signals, scoring cache)
- **Job Queue**: Bull / RabbitMQ (discovery, scoring jobs)

### Data Integration
- **X API**: Tweet parsing, engagement tracking
- **GitHub API**: Repository analysis, commit history
- **Blockchain RPC**: Solana, Base, Ethereum, Arbitrum
- **Dune Analytics**: Historical on-chain data

## Component Architecture

### Core Components

```typescript
// UI Layer
Page
├── Navigation (header)
├── Hero Section
│   ├── Badge (status indicator)
│   ├── Search Input
├── Intelligence Feed
│   └── IntelligenceCard[]
│       ├── Metrics Grid
│       ├── Signal Analysis
│       ├── Risk Assessment
│       └── Action Buttons
├── Analytics Section
└── Footer

// Business Logic
DiscoveryEngine
├── Social Signals (X, Telegram, Discord)
├── Developer Signals (GitHub activity)
├── On-Chain Signals (wallet clustering)
├── Community Signals (engagement, growth)
└── Scoring Engine
    ├── Team Score
    ├── Tokenomics Score
    ├── Technical Score
    ├── Community Score
    └── Rug Risk Score
```

## Data Flow

### Discovery Pipeline

```
1. SIGNAL COLLECTION
   ├─ X/Twitter Streaming API
   ├─ GitHub Webhooks
   ├─ Blockchain Event Logs
   └─ Community APIs

2. DATA AGGREGATION
   ├─ Normalize across sources
   ├─ Deduplicate projects
   ├─ Attach metadata
   └─ Create unified project record

3. ANALYSIS ENGINE
   ├─ Team Verification
   ├─ Tokenomics Parsing
   ├─ Smart Contract Analysis
   ├─ On-Chain Clustering
   └─ Community Sentiment

4. SCORING
   ├─ Calculate sub-scores (5 dimensions)
   ├─ Weight by confidence
   ├─ Generate risk flags
   ├─ Produce institutional summary
   └─ Output ProjectReport

5. CACHING & SERVING
   ├─ Cache in Redis (1h TTL)
   ├─ Store in PostgreSQL
   ├─ Publish to UI
   └─ Archive to S3
```

## API Contracts

### ProjectReport Schema

```typescript
{
  id: "UUID",
  name: "Project Name",
  category: "Category String",
  chain: "Solana|Base|Ethereum",
  stage: "Stealth|Early|Launched|Scaling",
  
  // Team & Funding
  founders: ["Name1", "Name2"],
  funding: "$2.5M Series A",
  investors: ["Variant", "Sequoia"],
  
  // Product & Token
  productStatus: "Beta|Launch|Live",
  tokenStatus: "Unlaunched|Presale|Live",
  
  // Signals
  communitySize: "1.2k followers",
  githubActivity: "High (45 stars, daily commits)",
  onchainSignals: ["Signal1", "Signal2"],
  smartMoneyInterest: "High",
  
  // Analysis
  redFlags: ["Flag1", "Flag2"],
  positiveSignals: ["Signal1", "Signal2"],
  assessment: "Institutional summary...",
  
  // Scoring
  rugRiskScore: 12,  // 0-100
  survivalProbability: "High",
  confidenceLevel: "Medium",
  
  // Dimensional Scores
  metrics: {
    legitimacy: 92,
    innovation: 88,
    sustainability: 75,
    community: 40,
    technical: 95
  }
}
```

## Scoring Algorithm

### Five-Factor Model

```
FINAL SCORE = (
    Team_Score × 0.25 +
    Funding_Score × 0.20 +
    Tokenomics_Score × 0.20 +
    OnChain_Score × 0.20 +
    Social_Score × 0.15
)

Each sub-score normalized 0-100
Final score determines rug risk category
```

### Team Score Calculation
```
Base: 50

+ Founder verification (0-30)
  ├─ Verified identity: +20
  ├─ Public social presence: +5
  ├─ Past successful projects: +5
  
- Red flags (0-30)
  ├─ Linked to past scam: -25
  ├─ Anonymous unverifiable: -15
  ├─ Contradictory info: -10
```

### Tokenomics Score
```
Base: 50

+ Positive indicators (0-35)
  ├─ Long vesting cliff (>1yr): +15
  ├─ Locked liquidity: +10
  ├─ <10% insider allocation: +10
  
- Red flags (0-35)
  ├─ Unlocked liquidity: -25
  ├─ >30% insider allocation: -15
  ├─ Mint function exposed: -20
```

## Scalability Architecture

### For 100k Projects & 10k Concurrent Users

**Horizontal Scaling:**
```
Load Balancer (AWS ELB)
│
├── API Server 1 (Node.js)
├── API Server 2 (Node.js)
├── API Server 3 (Node.js)
│
└── Shared Services
    ├── PostgreSQL Read Replicas
    ├── Redis Cluster
    ├── S3 (Archive)
    └── CDN (Cloudflare)
```

**Database Strategy:**
- Main: PostgreSQL (primary writes)
- Read Replicas: 3x (distributed reads)
- Cache: Redis (hot data, 1h TTL)
- Archive: S3 (historical data, Glacier after 6mo)

**Job Queue:**
```
Discovery Jobs (50/sec capacity)
├─ Trending projects (prioritized)
├─ New projects (batch)
├─ Score updates (async)
└─ Community analysis (background)

Retry Strategy:
├─ Exponential backoff (1s → 5min)
├─ Max 3 retries
└─ DLQ for permanent failures
```

## Deployment Topology

### Development
```
Localhost:3001
├─ Next.js Dev Server
├─ Hot Module Reload
└─ In-Memory Discovery Engine
```

### Staging
```
Staging.guugle.xyz
├─ Next.js on AWS EC2
├─ RDS PostgreSQL
├─ ElastiCache Redis
└─ Full feature parity with prod
```

### Production
```
guugle.xyz (Vercel/AWS)
├─ Edge Network (Cloudflare CDN)
├─ Next.js (Serverless Functions)
├─ RDS PostgreSQL (Multi-AZ)
├─ ElastiCache Redis (Cluster)
├─ SQS (Discovery Queue)
└─ S3 (Historical Archive)
```

## Performance Metrics

### Target KPIs
- **Page Load**: <2 seconds (LCP)
- **Time to Interactive**: <3 seconds (TTI)
- **API Response**: <200ms (p95)
- **Scoring Engine**: <5 seconds per project
- **Discovery Rate**: 50 new projects/day

### Optimization Strategies
1. **Code Splitting**: Route-based + component-based
2. **Image Optimization**: Next.js Image with AVIF format
3. **Caching Layers**: Browser → CDN → Redis → DB
4. **Query Optimization**: Indexed searches, denormalized analytics
5. **Background Jobs**: Async scoring, non-blocking discovery

## Security Architecture

### Defense Layers

```
┌─ Input Validation
├─ Authentication (OAuth2/JWT)
├─ Authorization (Role-based)
├─ Rate Limiting (100 req/min per IP)
├─ DDoS Protection (Cloudflare)
├─ SQL Injection Prevention (Prepared Statements)
├─ XSS Prevention (CSP Headers)
├─ CSRF Protection (SameSite Cookies)
└─ Data Encryption (TLS 1.3, at-rest AES-256)
```

### API Security
```typescript
// Rate limit middleware
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  handler: (req, res) => res.status(429).json({ error: 'Too many requests' })
}));

// Input validation
app.post('/api/projects', validate({
  query: Joi.string().max(100).required(),
  filters: Joi.object().optional()
}));

// CORS
app.use(cors({
  origin: ['https://guugle.xyz', 'https://staging.guugle.xyz'],
  credentials: true
}));
```

## Monitoring & Alerting

### Key Metrics
- **Uptime**: Target 99.95%
- **Error Rate**: Alert if >1%
- **Discovery Lag**: Alert if >30min behind trending
- **Scoring Accuracy**: Validate against manual reviews
- **API Latency**: Alert if p95 >500ms

### Logging Strategy
```
ELK Stack (Elasticsearch, Logstash, Kibana)
├─ Access logs (JSON structured)
├─ Error traces (Full stack)
├─ Performance metrics (Request/response times)
├─ Audit trail (User actions)
└─ Alert thresholds
```

## Future Architecture

### Phase 2: Real-Time Engine
- WebSocket subscriptions for live signals
- Event streaming via Kafka
- Sub-second scoring updates

### Phase 3: ML-Powered Analysis
- NLP for sentiment analysis
- Pattern recognition for rug detection
- Founder network graph analysis

### Phase 4: Multi-Agent System
- Independent agents for each chain
- Cross-chain signal aggregation
- Decentralized discovery network

---

**For architecture questions, contact:** arch@guugle.xyz
