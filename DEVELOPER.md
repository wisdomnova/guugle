# Developer Quick Start

## Initial Setup

### 1. Clone & Install
```bash
git clone https://github.com/guugle/intel.git
cd guugle
pnpm install
```

### 2. Start Development Server
```bash
pnpm dev
```
Visit `http://localhost:3001`

### 3. Project Structure Overview
- `app/page.tsx` — Main intelligence feed
- `components/project-card.tsx` — Individual project display
- `lib/engine.ts` — Discovery & scoring logic
- `lib/types.ts` — TypeScript interfaces

## Adding a New Project

### Step 1: Update Engine
Edit `lib/engine.ts`:
```typescript
export async function discoverProjects(query: string = ''): Promise<ProjectReport[]> {
  return [
    // ... existing projects
    {
      id: 'my-project',
      name: 'NewProject AI',
      category: 'Agentic AI Protocols',
      chain: 'Solana',
      stage: 'Early',
      website: 'https://newproject.ai',
      xAccount: '@newproject_ai',
      founders: ['Alice', 'Bob'],
      funding: '$1.5M Seed',
      investors: ['Paradigm', 'Dragonfly'],
      productStatus: 'MVP available',
      tokenStatus: 'Unlaunched',
      communitySize: '2.1k X followers',
      githubActivity: 'Very High (Daily commits)',
      onchainSignals: ['Liquidity LP locked 18mo', 'Multisig 2-of-3'],
      smartMoneyInterest: 'Very High',
      redFlags: [],
      positiveSignals: [
        'Novel consensus mechanism',
        'Complete GitHub history',
        'Published research papers'
      ],
      assessment: 'Cutting-edge infra with institutional backing...',
      rugRiskScore: 8,
      survivalProbability: 'High',
      confidenceLevel: 'High',
      metrics: {
        legitimacy: 96,
        innovation: 94,
        sustainability: 88,
        community: 65,
        technical: 98
      }
    }
  ];
}
```

### Step 2: Verify in UI
```bash
pnpm dev
# Navigate to http://localhost:3001
# Your project should appear in the feed
```

## Customizing Components

### Update Badge Colors
Edit `components/ui/core.tsx`:
```typescript
const variants = {
  'risk-critical': 'bg-red-600/20 text-red-300 border border-red-600/30',
  'risk-medium': 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  // Add custom variants
};
```

### Modify Hero Section
Edit `app/page.tsx`:
```typescript
<h1 className="text-6xl lg:text-8xl font-bold tracking-tight mb-8">
  Your custom headline here
</h1>
```

### Update Color Scheme
Edit `app/globals.css`:
```css
@theme {
  --color-accent: #ff6b00;  /* Your custom accent */
  --color-bg-primary: #1a1a1a;
  /* ... */
}
```

## Adding New Analysis Dimensions

### Step 1: Update Types
Edit `lib/types.ts`:
```typescript
interface ProjectReport {
  // ... existing fields
  metrics: {
    legitimacy: number;
    innovation: number;
    sustainability: number;
    community: number;
    technical: number;
    regulatory: number;  // NEW
  };
}
```

### Step 2: Update Card Display
Edit `components/project-card.tsx`:
```typescript
<Metric label="Regulatory" value={`${project.metrics.regulatory}%`} />
```

### Step 3: Calculate in Engine
Edit `lib/engine.ts`:
```typescript
metrics: {
  legitimacy: 92,
  innovation: 88,
  sustainability: 75,
  community: 40,
  technical: 95,
  regulatory: 82,  // NEW
}
```

## Integrating External Data Sources

### Twitter/X API Integration
```typescript
// lib/twitter.ts
import { TwitterApi } from 'twitter-api-v2';

const client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);

export async function searchTrendingProjects() {
  const tweets = await client.v2.search('crypto new project', {
    max_results: 100,
    expansions: ['author_id'],
  });
  
  return tweets.data;
}
```

### GitHub Integration
```typescript
// lib/github.ts
export async function analyzeRepository(owner: string, repo: string) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    { headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` } }
  );
  
  const data = await response.json();
  return {
    stars: data.stargazers_count,
    commits: data.size,
    lastUpdate: data.updated_at,
  };
}
```

### On-Chain Data (Solana)
```typescript
// lib/onchain.ts
import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection(process.env.SOLANA_RPC_URL);

export async function analyzeTokenContract(mint: string) {
  const supply = await connection.getTokenSupply(new PublicKey(mint));
  return {
    totalSupply: supply.value.uiAmount,
    decimals: supply.value.decimals,
  };
}
```

## Testing

### Unit Tests
```bash
pnpm add -D vitest @testing-library/react
```

Create `__tests__/components/badge.test.tsx`:
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/core';

describe('Badge', () => {
  it('renders with accent variant', () => {
    render(<Badge variant="accent">High Risk</Badge>);
    expect(screen.getByText('High Risk')).toBeInTheDocument();
  });
});
```

### E2E Tests
```bash
pnpm add -D playwright
```

Create `e2e/feed.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';

test('intelligence feed displays projects', async ({ page }) => {
  await page.goto('http://localhost:3001');
  const cards = await page.locator('[data-testid="project-card"]').count();
  expect(cards).toBeGreaterThan(0);
});
```

## Debugging

### Enable Debug Logs
```bash
DEBUG=guugle:* pnpm dev
```

### Component Inspector
```typescript
// In any component
console.log('Project data:', project);
return <div>{/* UI */}</div>;
```

### Performance Profiling
```bash
# Build and start production server
pnpm build
NODE_ENV=production pnpm start

# Use Chrome DevTools Performance tab
# or: pnpm add -D next-bundle-analyzer
```

## Common Tasks

### Add New Navigation Link
`components/nav.tsx`:
```typescript
<a href="/reports" className="hover:text-accent transition-colors">
  Reports
</a>
```

### Update Footer
`app/page.tsx`:
```typescript
<footer className="mt-40 border-t border-border-dim pt-12">
  <a href="https://twitter.com/guugle_intel">Twitter</a>
  <a href="https://discord.gg/guugle">Discord</a>
</footer>
```

### Create New Page
```bash
mkdir app/reports
touch app/reports/page.tsx
```

`app/reports/page.tsx`:
```typescript
'use client';

export default function Reports() {
  return <div>Reports page</div>;
}
```

### Add Environment Variables
`.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
API_SECRET_KEY=your_secret_key
```

Access in code:
```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const secretKey = process.env.API_SECRET_KEY; // Server-only
```

## Performance Tips

### 1. Use Client Components Sparingly
```typescript
// ✅ Good: Server component
export default function Page() {
  return <IntelligenceCard project={project} />;
}

// ❌ Avoid: Unnecessary 'use client'
'use client';
export default function Page() {
  return <div>Static content</div>;
}
```

### 2. Optimize Images
```typescript
import Image from 'next/image';

<Image
  src="/project.png"
  alt="Project"
  width={200}
  height={200}
  quality={80}
/>
```

### 3. Memoize Components
```typescript
import { memo } from 'react';

const ProjectCard = memo(({ project }) => {
  return <Card>{/* ... */}</Card>;
});
```

## Common Errors & Fixes

### "next: command not found"
```bash
pnpm install
# or
npm install -g next
```

### Port 3000 already in use
```bash
pnpm dev  # Will automatically use 3001
```

### TypeScript errors
```bash
pnpm run type-check
```

### Build fails
```bash
rm -rf .next
pnpm install --frozen-lockfile
pnpm build
```

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [React 19](https://react.dev)

## Getting Help

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: dev@guugle.xyz
- **Twitter**: [@guugle_intel](https://twitter.com/guugle_intel)

---

**Happy building! Only facts, no hype.** 🚀
