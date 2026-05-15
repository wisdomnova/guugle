# Web3 Intelligence Platform - Setup Guide

## Overview

This is a production-grade Web3 intelligence and risk-analysis platform built on Next.js, Tailwind CSS, Framer Motion, and Supabase. It discovers early-stage crypto projects and provides institutional-grade risk analysis with comprehensive scoring models.

## Design System

The UI follows the **claude ui** design system with:
- **Light mode** professional palette
- **Inter** sans-serif + **JetBrains Mono** for data
- **8px spacing scale** for consistency
- **Indigo accent** (#4f46e5) for trust
- **Ease-out-expo** easing for smooth animations

## Architecture

### Frontend Components
- `DiscoveryDashboard` - Main exploration interface with search/filter
- `ProjectIntelligenceCard` - Project overview with risk scoring
- `ProjectReportModal` - Detailed institutional analysis report
- `RiskScoreCircle` - Animated risk visualization

### Backend
- **Supabase** for data persistence
- PostgreSQL schema with 8 interconnected tables
- REST API routes for CRUD operations
- Row-Level Security (RLS) enabled for production safety

### API Endpoints

#### Projects
```
GET  /api/projects              # List all projects with filtering
POST /api/projects              # Create new project
GET  /api/projects/[id]         # Get project details
PATCH /api/projects/[id]        # Update scores
DELETE /api/projects/[id]       # Remove project
```

#### Search
```
GET /api/search?q=query         # Full-text search
```

#### Admin
```
POST /api/admin/seed            # Seed database (protected)
```

## Quick Start

### 1. Install Dependencies
```bash
cd /Users/user/guugle
pnpm install
```

### 2. Set Up Supabase

#### Create a new Supabase project
- Go to https://supabase.com
- Create new project
- Copy your API URL and keys

#### Add to `.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# For seeding
SEED_SECRET=your_seed_secret_here
```

#### Run SQL Schema
In Supabase dashboard SQL editor, run the contents of:
```
/sql/intelligence-schema.sql
```

This creates:
- `projects` - Main project table
- `project_founders` - Founder information
- `project_red_flags` - Risk indicators
- `project_positive_signals` - Positive factors
- `project_investors` - Funding sources
- `intelligence_reports` - Audit trail
- `onchain_signals` - Blockchain data
- `social_metrics` - Community metrics

### 3. Seed Sample Data

```bash
# Option A: Via API
curl -X POST http://localhost:3000/api/admin/seed \
  -H "Authorization: Bearer your_seed_secret_here"

# Option B: Via TypeScript
node -r esbuild-register lib/seed.ts
```

### 4. Start Development Server
```bash
pnpm dev
```

Visit http://localhost:3000

## Features

### 🔍 Discovery Engine
- Search across projects, founders, categories
- Filter by category, blockchain, stage
- Sort by rug risk, legitimacy, innovation, community
- Real-time filtering with sticky header

### 📊 Risk Analysis
- **Rug Risk Score** (0-100): Probability of rug pull
- **Legitimacy Score**: Team credibility, transparency
- **Innovation Score**: Technical novelty, feature depth
- **Survival Probability**: Low/Medium/High estimate

### 📈 Project Intelligence
- Team member verification
- Founder history analysis
- Investor tracking
- On-chain signal detection
- Social media metrics
- Red flags & positive signals

### 📋 Institutional Reports
- Full project analysis with all scoring breakdown
- Red flags and positive signals with evidence
- Team & funding details
- External resources (website, X)
- Survival probability assessment
- Print & share capabilities

## Data Model

### Project Record
```typescript
interface ProjectIntelligence {
  id: string;
  name: string;
  category: string;
  chain: string;
  stage: 'ideation' | 'alpha' | 'beta' | 'launched' | 'mature';
  website?: string;
  xAccount?: string;
  founders?: string[];
  productStatus: string;
  tokenStatus: string;
  communitySize: number;
  githubActivity: number;
  rugRiskScore: number;
  legitimacyScore: number;
  innovationScore: number;
  survivalProbability: 'low' | 'medium' | 'high';
  redFlags: string[];
  positiveSignals: string[];
  fundingAmount?: number;
  investors?: string[];
  lastUpdated: string;
}
```

## API Examples

### Get Projects
```bash
curl 'http://localhost:3000/api/projects?category=ai-crypto&chain=solana&sort=rug-risk'
```

### Get Project Details
```bash
curl 'http://localhost:3000/api/projects/[project-id]'
```

### Search
```bash
curl 'http://localhost:3000/api/search?q=tensor'
```

### Update Project Scores
```bash
curl -X PATCH 'http://localhost:3000/api/projects/[project-id]' \
  -H 'Content-Type: application/json' \
  -d '{
    "rugRiskScore": 35,
    "legitimacyScore": 72,
    "innovationScore": 78,
    "survivalProbability": "high"
  }'
```

## Scoring Methodology

### Rug Risk Score (0-100)
**Risk Factors:**
- Team anonymity (-15)
- Unlocked liquidity (-20)
- Insider allocation >40% (-25)
- No audited contracts (-15)
- Copy-pasted code (-10)
- Hidden mint function (-25)

**Mitigating Factors:**
- Multi-sig governance (+15)
- Locked liquidity (+20)
- Audited contracts (+20)
- Transparent vesting (+10)
- Reputable VCs (+15)

### Legitimacy Score (0-100)
- Founder verification (0-20)
- Team track record (0-20)
- Funding quality (0-15)
- Transparency level (0-15)
- Documentation quality (0-15)
- Community authenticity (0-15)

### Innovation Score (0-100)
- Technical depth (0-30)
- Novel approach (0-20)
- Code quality (0-15)
- Research backing (0-15)
- Market opportunity (0-20)

## Production Deployment

### Environment Variables
```env
# Required
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Optional
SEED_SECRET=
NODE_ENV=production
```

### Build
```bash
pnpm build
pnpm start
```

### Vercel Deployment
```bash
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel deploy --prod
```

## Customization

### Change Color Scheme
Edit `/app/globals.css` in the `@theme` block:
```css
--color-accent: #your-color;
--color-signal-danger: #your-color;
```

### Update Project Categories
Modify seed data in `/lib/seed.ts` and update API validation

### Add New Metrics
1. Add fields to `projects` table
2. Update `ProjectIntelligence` type
3. Update API routes
4. Add UI components

## Troubleshooting

### "Missing Supabase environment variables"
- Check `.env.local` exists
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

### Database connection errors
- Verify Supabase project is active
- Check API keys are correct
- Ensure schema is created

### No projects appearing
- Run the seed API: `POST /api/admin/seed`
- Check database tables have data via Supabase dashboard

## Performance Tips

- Projects list pagination handled server-side
- Images optimized with `next/image`
- Animations respect `prefers-reduced-motion`
- CSS-in-JS minimized with design tokens
- Supabase queries indexed on main fields

## Security

### RLS Policies
- All tables read-only for public (default)
- Update/delete only via authenticated admin routes
- Service role key never exposed to client

### Environment Secrets
- Service role key only in `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- Anon key safe to expose as `NEXT_PUBLIC_*`
- Seed secret protected via Authorization header

## File Structure

```
guugle/
├── app/
│   ├── api/
│   │   ├── projects/              # Projects CRUD
│   │   ├── search/                # Search endpoint
│   │   └── admin/seed/            # Database seeding
│   ├── globals.css                # Design tokens & styles
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Main dashboard
├── components/ui/
│   ├── design-tokens.ts           # Design system constants
│   ├── discovery-dashboard.tsx    # Main search/filter
│   ├── project-intelligence-card.tsx  # Project card
│   └── project-report-modal.tsx   # Detailed report
├── lib/
│   └── seed.ts                    # Database seeding
├── sql/
│   └── intelligence-schema.sql    # Database schema
└── package.json
```

## Next Steps

1. ✅ Customize colors and branding
2. ✅ Add real data sources (Twitter, GitHub APIs)
3. ✅ Implement on-chain data fetching
4. ✅ Build real-time update mechanisms
5. ✅ Add authentication for analyst roles
6. ✅ Create admin dashboard for data management
7. ✅ Set up automated scoring engine
8. ✅ Add email alerts for high-risk projects

## Support

For issues or questions:
- Check the troubleshooting section above
- Review Supabase documentation: https://supabase.com/docs
- Check Next.js documentation: https://nextjs.org/docs
