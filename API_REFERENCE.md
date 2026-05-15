# API Quick Reference

## Base URL
- Local: `http://localhost:3000`
- Production: `https://your-domain.com`

## Authentication
All admin endpoints require:
```
Authorization: Bearer {JOB_SECRET}
```

## Endpoints

### Projects

#### Get all projects
```
GET /api/projects?category=DeFi&chain=Ethereum&sort=rug-risk&limit=10&offset=0
Response: { projects: [...], total, limit, offset }
```

#### Search projects
```
GET /api/search?q=uniswap
Response: { projects: [...], count }
```

#### Get project details
```
GET /api/projects/{id}
Response: { project with founders, investors, signals, flags }
```

#### Create project (manual entry)
```
POST /api/projects
Body: { name, category, chain, stage, website, x_account, description }
```

#### Update project
```
PATCH /api/projects/{id}
Body: { rug_risk_score, legitimacy_score, innovation_score, ... }
```

#### Delete project
```
DELETE /api/projects/{id}
```

### Admin Operations

#### Import project with real data
```
POST /api/admin/import-project
Headers: Authorization: Bearer {JOB_SECRET}
Body: {
  name: string,
  chain: string,
  category: string,
  website: string,
  description: string,
  contractAddress?: string,
  twitterHandle?: string,
  githubRepo?: string,
  coingeckoId?: string
}
```

#### Trigger background data sync
```
POST /api/admin/sync-data
Headers: Authorization: Bearer {JOB_SECRET}
Response: { success, updated, failed, timestamp }
```

#### Health check
```
GET /api/health
Response: {
  status: "healthy|unhealthy",
  checks: {
    supabase: boolean,
    etherscan: boolean,
    twitter: boolean,
    github: boolean,
    coingecko: boolean
  }
}
```

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (invalid data) |
| 401 | Unauthorized (missing/invalid JOB_SECRET) |
| 404 | Not found |
| 429 | Rate limited |
| 500 | Server error |
| 503 | Service unavailable (critical service down) |

## Response Format

All responses are JSON:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "error": "Error message"
}
```

## Example Workflows

### Workflow 1: Import and Score a Project

```bash
# 1. Import new project (fetches real data)
curl -X POST http://localhost:3000/api/admin/import-project \
  -H "Authorization: Bearer your_secret" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Aave",
    "chain": "Ethereum",
    "category": "DeFi",
    "website": "https://aave.com",
    "description": "Lending protocol",
    "contractAddress": "0x7Fc66500c84A76Ad7e9c93437E434122A1f9AcDEd",
    "twitterHandle": "aaveaave",
    "githubRepo": "aave/aave-protocol-v2",
    "coingeckoId": "aave"
  }'

# Response:
# {
#   "success": true,
#   "projectId": "uuid-here",
#   "scores": {
#     "rugRiskScore": 15,
#     "legitimacyScore": 92,
#     "innovationScore": 88,
#     "survivalProbability": 89,
#     "redFlags": [...],
#     "positiveSignals": [...]
#   }
# }
```

### Workflow 2: Trigger Daily Data Update

```bash
# Run this as a cron job daily (2 AM UTC recommended)
curl -X POST http://your-domain.com/api/admin/sync-data \
  -H "Authorization: Bearer your_secret" \
  -H "Content-Type: application/json"

# Response:
# {
#   "success": true,
#   "updated": 45,
#   "failed": 2,
#   "timestamp": "2026-05-15T02:00:00Z"
# }
```

### Workflow 3: Search and Filter Projects

```bash
# Search across name, category, chain
curl "http://localhost:3000/api/search?q=defi"

# Filter by category and chain with sorting
curl "http://localhost:3000/api/projects?category=DeFi&chain=Ethereum&sort=rug-risk&limit=20"

# Sort options:
# - latest: newest projects first
# - rug-risk: highest risk first
# - legitimacy: most legitimate first
# - innovation: most innovative first
# - community: most community engagement first
```

### Workflow 4: Monitor System Health

```bash
# Check if all services are operational
curl http://localhost:3000/api/health

# If status is "unhealthy", check which service is down
# and act accordingly:
# - supabase: Check connection string and credentials
# - etherscan: Verify API key and rate limits
# - twitter: Check bearer token validity
# - github: Verify authentication token
```

## Data Scoring Explained

### Rug Pull Risk (0-100)
- **0-20:** Very safe (verified contract, good distribution)
- **20-40:** Safe (established, solid metrics)
- **40-60:** Medium risk (newer or limited data)
- **60-80:** High risk (concerning patterns)
- **80-100:** Very high risk (multiple red flags)

### Legitimacy (0-100)
- **80-100:** Strong signals (audited, active dev, large community)
- **60-79:** Good signals (documented, development activity)
- **40-59:** Fair signals (some concerns, limited history)
- **20-39:** Poor signals (minimal documentation)
- **0-19:** Suspicious (unverified, red flags)

### Innovation (0-100)
- **80-100:** Cutting-edge (novel architecture, advanced features)
- **60-79:** Strong (new features, active development)
- **40-59:** Moderate (iterating on existing ideas)
- **20-39:** Limited (minimal differentiation)
- **0-19:** Derivative (copies existing solutions)

### Survival Probability (0-100)
- Combines legitimacy, innovation, and rug risk
- Higher = more likely to survive 12+ months

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| GET /api/projects | 100 req/min |
| GET /api/search | 60 req/min |
| POST /api/admin/* | 10 req/min |
| POST /api/projects | 20 req/min |

## Integration Examples

### JavaScript/Node.js

```javascript
const response = await fetch('http://localhost:3000/api/projects?limit=10', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
});
const { projects, total } = await response.json();
console.log(`${projects.length} of ${total} projects loaded`);
```

### Python

```python
import requests

response = requests.get('http://localhost:3000/api/projects', 
  params={'category': 'DeFi', 'limit': 10})
data = response.json()
print(f"Found {data['total']} projects")
```

### cURL

```bash
# Set base URL
BASE_URL="http://localhost:3000"
SECRET="your_job_secret"

# List projects
curl "$BASE_URL/api/projects?limit=10"

# Import project
curl -X POST "$BASE_URL/api/admin/import-project" \
  -H "Authorization: Bearer $SECRET" \
  -H "Content-Type: application/json" \
  -d @project.json

# Trigger sync
curl -X POST "$BASE_URL/api/admin/sync-data" \
  -H "Authorization: Bearer $SECRET"
```

## Performance Tips

1. **Pagination:** Use `limit` and `offset` for large result sets
2. **Caching:** Results cached for 5 minutes, use `?nocache=true` to bypass
3. **Batch operations:** Admin endpoints batch 50 projects at a time
4. **Time windows:** Run heavy operations during off-peak hours (2-4 AM UTC)

## Support & Debugging

### Check logs
```bash
# Cloud deployment (Vercel)
vercel logs

# Local development
npm run dev 2>&1 | tee debug.log
```

### Monitor errors
- Check Sentry dashboard for exceptions
- Review database logs in Supabase
- Check background job execution

### Test connectivity
```bash
# Test database
curl http://localhost:3000/api/projects

# Test APIs
curl "https://api.etherscan.io/api?module=stats&action=ether" -H "Accept: application/json"
```
