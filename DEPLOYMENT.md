# Deployment & Operations Guide

## Production Deployment

### Prerequisites
- Node.js 18+ (LTS recommended)
- pnpm
- Environment configured for Next.js 16

### Build Optimization

```bash
# Install dependencies with frozen lockfile (CI/CD)
pnpm install --frozen-lockfile

# Build for production
pnpm build

# Verify build output
ls -la .next/
```

### Environment Variables

Create `.env.production`:
```bash
# API Configuration (when integrated)
NEXT_PUBLIC_API_URL=https://api.guugle.xyz
NEXT_PUBLIC_RPC_ENDPOINTS=https://rpc.solana.com,https://mainnet.base.org

# Analytics (optional)
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
```

### Deployment Options

#### **Vercel (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### **Docker Deployment**
```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY . .
RUN pnpm install --frozen-lockfile

ENV NODE_ENV production
RUN pnpm build

EXPOSE 3000
CMD ["pnpm", "start"]
```

Build and run:
```bash
docker build -t guugle-intel .
docker run -p 3000:3000 guugle-intel
```

#### **AWS EC2**
```bash
# SSH into instance
ssh -i key.pem ec2-user@instance-ip

# Clone repository
git clone <repo-url>
cd guugle

# Install Node & pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -
nvm install 20

# Build and start with PM2
pnpm install --frozen-lockfile
pnpm build
npm install -g pm2
pm2 start "pnpm start" --name "guugle-intel"
pm2 save
pm2 startup
```

#### **Railway / Render**
1. Connect GitHub repository
2. Set build command: `pnpm build`
3. Set start command: `pnpm start`
4. Deploy

### Performance Optimization

**Next.js Image Optimization:**
```bash
# Enable automatic image optimization
NEXT_PUBLIC_IMAGE_OPTIMIZATION=true
```

**Static Generation:**
- Landing page pre-rendered at build time
- Intelligence feed cached with ISR (Incremental Static Regeneration)

**Bundle Analysis:**
```bash
npm install --save-dev @next/bundle-analyzer

# next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})
module.exports = withBundleAnalyzer(nextConfig)

# Analyze
ANALYZE=true pnpm build
```

### Monitoring & Observability

**Setup Sentry for Error Tracking:**
```bash
pnpm add @sentry/nextjs
```

**Configure in `next.config.ts`:**
```typescript
import { withSentryConfig } from "@sentry/nextjs";

export default withSentryConfig(nextConfig, {
  org: "your-org",
  project: "guugle-intel",
  authToken: process.env.SENTRY_AUTH_TOKEN,
});
```

**Application Metrics:**
- Core Web Vitals (LCP, FID, CLS)
- Time to Interactive (TTI)
- Build times
- Bundle sizes

### Security Checklist

- [ ] Enable HSTS header
- [ ] Set CSP (Content Security Policy)
- [ ] Enable X-Frame-Options
- [ ] Verify CORS configuration
- [ ] Audit dependencies: `pnpm audit`
- [ ] Enable security headers via Next.js middleware
- [ ] Rate limit API endpoints
- [ ] Sanitize user inputs (search queries)

**Security Headers Configuration:**
```typescript
// next.config.ts
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
      ],
    },
  ];
}
```

### Scaling Considerations

**For 10k+ concurrent users:**
1. Use CDN (Cloudflare / AWS CloudFront)
2. Implement Redis caching for project data
3. Database read replicas for analytics
4. Separate API server from UI
5. Load balancing (AWS ELB / Nginx)

**Database Integration:**
```typescript
// Example: Caching project data
import redis from 'redis';

const client = redis.createClient();

export async function getProjectsWithCache(query: string) {
  const cacheKey = `projects:${query}`;
  const cached = await client.get(cacheKey);
  
  if (cached) return JSON.parse(cached);
  
  const projects = await discoverProjects(query);
  await client.setEx(cacheKey, 3600, JSON.stringify(projects));
  
  return projects;
}
```

### Rollback Strategy

```bash
# Tag releases
git tag -a v1.0.0 -m "Production release"
git push origin v1.0.0

# Rollback to previous version
git checkout v0.9.0
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

## Maintenance

### Dependency Updates
```bash
# Check outdated packages
pnpm outdated

# Update minor versions (safe)
pnpm up

# Update major versions (review breaking changes)
pnpm up -R
```

### Log Rotation
```bash
# PM2 log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Database Backups
```bash
# Daily backup schedule
0 2 * * * pnpm run backup:db

# Store in S3
aws s3 cp backup.sql s3://guugle-backups/$(date +%Y%m%d).sql
```

## CI/CD Pipeline (GitHub Actions)

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: pnpm/action-setup@v2
        with:
          version: latest
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      
      - run: pnpm run lint
      - run: pnpm run build
      - run: pnpm run test
      
      - name: Deploy to Vercel
        run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

---

**For questions, contact:** devops@guugle.xyz
