# Guugle — Build with XAgent × OKX

Paste any contract address. Get the full intelligence picture before you ape.

Live rug risk scoring, OKX security pre-flight, smart money signals, and on-chain + market data. Every analyze query hits Etherscan, DexScreener, CoinGecko, and GitHub — no cached scores, no fake-address results.

Hackathon kicks off May 11, 2026. Node >= 18.17 required.

---

## What you get

Drop a **contract address** or **token name** into the analyze bar:

| Signal | Source | What it checks |
|--------|--------|----------------|
| **Rug risk** | Etherscan + DexScreener | Liquidity depth, pair age, holder concentration, contract verification, deploy age |
| **Legitimacy** | CoinGecko + on-chain | Market cap tier, CEX listings, verified contract, website on file |
| **Innovation** | CoinGecko + DEX | 24h volume, trading activity, GitHub dev velocity |
| **Survival** | Composite | Weighted blend of legitimacy, innovation, and inverse rug risk |
| **OKX Security** | `okx-security` | Honeypot, phishing dApp scan, token risk pre-flight |
| **OKX Smart Money** | `okx-dex-signal` | KOL trades, whale clusters, aggregated alpha |
| **OKX Market** | `okx-market` | Live price, volume, OHLC |

**Contract validation** — invalid or unknown addresses return an error instead of fabricated scores. Real tokens resolve to their **name** and **website** from CoinGecko (with DexScreener / Etherscan fallbacks for names).

**Tracked protocols** grid live-rescores seeded blue chips on each page load so cards never show identical stale numbers.

---

## How it fits together

```
                    Guugle dashboard
                    (Next.js web UI)
         ┌──────────────┼──────────────┐
         │              │              │
    Etherscan       DexScreener      CoinGecko
    on-chain        DEX pairs        price / cap
    verify          liquidity        website
         │              │              │
         └──────────────┼──────────────┘
                        │
                   OKX skill suite
              security / smart money / market
                        │
                     GitHub
                  (public repos)
```

| Layer | Provider | Guugle uses it for |
|-------|----------|-------------------|
| **Identity** | XAgent | Hackathon registration (`xagt-plugin login`) |
| **Security** | OKX `okx-security` | Pre-trade risk widgets in full report |
| **Alpha** | OKX `okx-dex-signal` | Smart money panel |
| **Market** | OKX `okx-market` + CoinGecko | Price, volume, cap tier |
| **On-chain** | Etherscan V2 | Verification, deployer, holders (Pro for holder count) |
| **DEX** | DexScreener | Per-CA liquidity, pair age, buy/sell pressure |
| **Dev** | GitHub API | Stars, commits, contributors, code quality |
| **Product** | You | Scoring, dashboard, analyze UX |

---

## Run locally

```bash
git clone https://github.com/wisdomnova/guugle.git
cd guugle
npm install
cp .env.local.example .env.local   # fill in keys
npm run dev
# http://localhost:3000
```

### Required env

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # projects API + admin routes

ETHERSCAN_API_KEY=                  # Etherscan API V2 (Ethereum mainnet)
COINGECKO_PRO_API_KEY=              # CoinGecko Pro (or free tier key)
```

### Optional

```bash
GITHUB_TOKEN=                       # higher GitHub API rate limits
JOB_SECRET=                         # POST /api/admin/sync-data
SEED_SECRET=                        # seed endpoint
```

OKX skills are configured via `xagt-plugin setup --target all` — no OKX key in `.env`.

### Try it

```
0x1f9840a85d5af5bf1d1762f925bdaddc4201f984   # Uniswap
0x514910771af9ca656af840dff83e8264ecf986ca   # Chainlink
uniswap                                        # name search (CoinGecko)
```

Fake / non-existent CAs → **404** with a clear message. Valid CAs → name, website link, and live breakdown in ~2–5s.

---

## API

```
GET /api/analyze?q=<address or name>   # live analysis (force-dynamic, no cache)
GET /api/projects                      # tracked protocols (live rescore on load)
GET /api/search?q=<query>              # DB search; validates 0x addresses
GET /api/health                        # status
GET /api/okx                           # OKX skill proxy
```

---

## Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19**, TypeScript, Tailwind CSS v4, Framer Motion
- **Supabase** — project storage
- **Etherscan V2**, **DexScreener**, **CoinGecko Pro**, **GitHub**
- **OKX skill suite** — `okx-security`, `okx-dex-signal`, `okx-market`

---

## Hackathon submit

```bash
xagt-plugin submit
```

```
Project name:     Guugle
Description:      Paste any CA — live rug risk, legitimacy, innovation, OKX intel. Validates unknown contracts.
Repo:             https://github.com/wisdomnova/guugle
Deploy (optional): https://your-demo.vercel.app
```

Or scripted:

```bash
xagt-plugin submit \
  --name "Guugle" \
  --intro "Paste any CA — live rug risk, legitimacy, innovation, OKX intel. Validates unknown contracts." \
  --repo "https://github.com/wisdomnova/guugle" \
  --deploy "https://your-demo.vercel.app"
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Analyze returns 404 for a CA | Address has no CoinGecko, DexScreener, or Etherscan contract signal — try a listed token |
| All discovery cards show same scores | Hard refresh; first `/api/projects` load rescored live (can take a few seconds) |
| Holder count shows N/A | Etherscan holder count needs Pro API on V2 |
| OKX widgets empty | Run `xagt-plugin setup --target all` |
| Build fails | `npm run build` for full TypeScript trace |

---

## Eligibility

✅ `xagt-plugin login` / setup  
✅ OKX skill suite in analyze + report modal  
✅ Public repo  
✅ Live data (no mock scoring for analyze)
