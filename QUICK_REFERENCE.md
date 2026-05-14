# Quick Reference Guide

## Essential Commands

```bash
# Development
pnpm dev              # Start dev server (http://localhost:3001)
pnpm build            # Build for production
pnpm start            # Start production server
pnpm type-check       # Verify TypeScript
pnpm lint             # Run ESLint

# Testing (when tests are added)
pnpm test             # Run test suite
pnpm test:e2e         # Run end-to-end tests

# Maintenance
pnpm install          # Install dependencies
pnpm update           # Update packages
pnpm audit            # Security audit
pnpm outdated         # Check outdated packages
```

## Environment Setup

```bash
# From project root
cd /Users/user/guugle

# Install dependencies
pnpm install

# Start development server
pnpm dev

# In browser, visit
http://localhost:3001
```

## Project Structure Quick Links

| File | Purpose |
|------|---------|
| `app/page.tsx` | Main UI page |
| `components/ui/core.tsx` | Base components |
| `lib/engine.ts` | Discovery logic |
| `lib/types.ts` | TypeScript types |
| `app/globals.css` | Design tokens |
| `next.config.ts` | Next.js config |

## Common Customizations

### Change Accent Color
Edit `app/globals.css`:
```css
--color-accent: #22c55e;  /* Change this */
```

### Update Hero Headline
Edit `app/page.tsx`:
```tsx
<h1 className="...">Your custom headline</h1>
```

### Add New Project
Edit `lib/engine.ts`:
```typescript
{
  id: 'new-project',
  name: 'Project Name',
  // ... full ProjectReport object
}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3000 in use | Run `pnpm dev` (auto-selects 3001) |
| Dependencies broken | Run `pnpm install --frozen-lockfile` |
| TypeScript errors | Run `pnpm type-check` |
| Build fails | Delete `.next/` and rebuild |

## File Editing Guide

### To add a new feature:
1. Add type to `lib/types.ts`
2. Add logic to `lib/engine.ts`
3. Update component in `app/page.tsx`
4. Style in `app/globals.css` or Tailwind classes

### To update styling:
1. Global styles: `app/globals.css`
2. Component classes: JSX className prop
3. Design tokens: `@theme` block in CSS

## Deployment Quick Start

```bash
# Build for production
pnpm build

# Test production build locally
pnpm start

# Deploy to Vercel (requires CLI)
npm i -g vercel
vercel --prod

# Deploy with Docker
docker build -t guugle-intel .
docker run -p 3000:3000 guugle-intel
```

## Development Workflow

1. **Start dev server**: `pnpm dev`
2. **Make changes**: Edit `.tsx`, `.css`, or `.ts` files
3. **Hot reload**: Changes auto-update in browser
4. **Test in production**: `pnpm build && pnpm start`
5. **Deploy**: Push to Git or use deployment CLI

## Documentation Files

- **README.md** — Project overview & features
- **DEVELOPER.md** — Development guide & customization
- **DEPLOYMENT.md** — Production deployment strategies
- **ARCHITECTURE.md** — System design & scalability
- **PROJECT_SUMMARY.md** — Delivery summary

## Git Workflow

```bash
# Clone repository
git clone https://github.com/guugle/intel.git
cd guugle

# Create feature branch
git checkout -b feature/my-feature

# Make changes
# ... edit files ...

# Commit
git add .
git commit -m "feat: add new feature"

# Push
git push origin feature/my-feature

# Create Pull Request on GitHub
```

## Performance Monitoring

```bash
# Check build time
time pnpm build

# Analyze bundle size
ANALYZE=true pnpm build

# Type check time
time pnpm type-check

# Lighthouse audit
pnpm build
pnpm start
# Then use Chrome DevTools Lighthouse
```

## Useful URLs

- **Local Dev**: `http://localhost:3001`
- **Production**: `https://guugle.xyz` (when deployed)
- **GitHub**: `https://github.com/guugle/intel`
- **API Docs**: `https://api.guugle.xyz/docs` (future)

## Environment Variables

Create `.env.local` for local development:
```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:3001

# Analytics (optional)
NEXT_PUBLIC_ANALYTICS_ID=your_id

# Third-party APIs (when integrated)
TWITTER_API_KEY=your_key
GITHUB_TOKEN=your_token
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

## IDE Shortcuts

### VS Code
- `Cmd+P` — Quick file open
- `Cmd+Shift+P` — Command palette
- `Cmd+/` — Toggle comment
- `Cmd+D` — Select word (multi-select)
- `Cmd+Shift+F` — Global search

### TypeScript
- Hover over symbol for type info
- `Cmd+Click` to go to definition
- `Cmd+Shift+H` to rename symbol

## Learning Resources

- [Next.js Official Docs](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Framer Motion Guide](https://www.framer.com/motion/)
- [React 19 Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Support

- **Documentation**: See files in project root
- **Issues**: GitHub Issues tab
- **Email**: team@guugle.xyz
- **Twitter**: [@guugle_intel](https://twitter.com/guugle_intel)

---

**Last Updated**: May 14, 2026  
**Version**: 1.0.0 Alpha
