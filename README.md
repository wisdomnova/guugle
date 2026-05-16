# Guugle — Build with XAgent × OKX

Paste any contract address. Get the full intelligence picture before you ape.

Live rug risk scoring + OKX security pre-flight + smart money signals. No seed data. No static rankings. Every query hits Etherscan, CoinGecko, and the OKX skill suite.

Hackathon kicks off May 11, 2026. Node >= 18.17 required.

---

## What you get

Guugle is a token intelligence dashboard built on the OKX skill suite. Drop a contract address or token name into the analyze bar:

- **Rug Risk Score** — holder concentration, liquidity depth, contract verification, deployer history
- **Legitimacy Index** — market cap tier, exchange listings, on-chain age
- **Innovation Delta** — trading volume momentum, unique holder growth
- **OKX Security Widget** — honeypot detection, phishing dApp scan, token risk pre-flight (powered by `okx-security`)
- **OKX Smart Money Widget** — KOL trade feeds, whale cluster signals, aggregated alpha (powered by `okx-dex-signal`)
- **Market Intelligence** — live price, volume, OHLC, holder distribution (powered by `okx-market`)

Every score is calculated live. No DB lookups for cached scores — every analysis is a fresh API call.

---

## How it fits together

```
              Guugle dashboard
              (Next.js web UI)
   ┌──────────────┼──────────────┐
   │              │              │
 Etherscan      OKX            CoinGecko
 on-chain       skill          market
 metrics        suite          data
   ↑              ↑              ↑
 contract      security /      price /
 verification  smart money     volume /
 holder count  signals         cap tier
```

| Layer | Owned by | What it does | What Guugle does |
|---|---|---|---|
| **Identity** | XAgent | Registers hackathon participants | You run `xagt-plugin login` once |
| **Intelligence** | OKX skill suite | Security scans, smart money feeds, market data | Guugle calls `okx-security`, `okx-dex-signal`, `okx-market` on every analyze |
| **On-Chain** | Etherscan | Contract verification, holder distribution, tx history | Guugle fetches live metrics via Etherscan API |
| **Market** | CoinGecko | Token price, volume, market cap, exchange listings | Guugle enriches scores with CoinGecko Pro API |
| **Product** | You | UX, scoring algorithm, dashboard, modal | Guugle combines all 4 layers into one intelligence view |

A finished hackathon project uses all layers. Guugle wires them together — you deploy and submit.

---

## Product shape

**Rug-proof intelligence dashboard** — user pastes any contract address; Guugle runs live scoring (Etherscan + CoinGecko) + OKX security pre-flight; honeypots and low-legitimacy tokens flagged before user buys; full intelligence modal shows smart money signals via `okx-dex-signal`.

Similar to the "Rug-proof Swap Frontend" seed idea, but analytics-first instead of swap-first.

---

## Run it locally

```bash
git clone https://github.com/<you>/guugle
cd guugle
npm install
cp .env.local.example .env.local   # fill in your keys
npm run dev
# open http://localhost:3000
```

Required env vars:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://wfnhyoidvpjkdspasnud.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
ETHERSCAN_API_KEY=<your-etherscan-key>
COINGECKO_API_KEY=<your-coingecko-pro-key>
```

Then paste a contract address or token name into the analyze bar:

```
0x1f9840a85d5af5bf1d1762f925bdaddc4201f984   # Uniswap
0x514910771af9ca656af840dff83e8264ecf986ca   # Chainlink
PEPE                                          # name search works too
```

Hit Enter. Scores appear in ~2 seconds. Click **View Full Intelligence Report** to see OKX widgets.

---

## Eligibility

✅ Registered via `xagt-plugin setup --target all` (or `xagt-plugin login`)  
✅ Uses OKX skill suite (`okx-security`, `okx-dex-signal`, `okx-market`)  
✅ Public GitHub repo with source code  
✅ One-line description: "Paste any CA, get live rug risk + legitimacy + innovation scores + OKX intelligence"

Optional but encouraged:
- Deployed demo URL (Vercel, Railway, Render, etc.)
- Demo video / GIF showing the analyze flow

---

## Submit

One command:

```bash
xagt-plugin submit
```

Asks you for:

```
  Project name:           Guugle
  One-line description:   Paste any CA, get live rug risk + legitimacy + innovation scores + OKX intelligence
  GitHub repo URL:        https://github.com/<you>/guugle
  Deployed URL (optional, blank to skip): https://guugle.vercel.app
```

Then your browser opens GitHub at the right URL with the submission file pre-filled. Click **Propose new file** → GitHub forks `xerpa-ai/xagt-plugin` to your account and opens the PR for you. Click **Create pull request** and you're done.

The file lands at `projects/<your-participant-id>/README.md`. Judges merge accepted submissions.

Or scripted (CI / Makefile):

```bash
xagt-plugin submit \
  --name "Guugle" \
  --intro "Paste any CA, get live rug risk + legitimacy + innovation scores + OKX intelligence" \
  --repo "https://github.com/<you>/guugle" \
  --deploy "https://guugle.vercel.app"
```

Lost your local credentials? Run `xagt-plugin login` again with the same XAgent account — your participant ID stays stable, so your existing submission folder stays yours.

---

## Get help

In-person at the venue. No Discord, no Telegram. Pull a mentor over.

---

## Reference

### API Endpoints

```
GET /api/analyze?q=<address or name>    # live scoring, no DB required
GET /api/projects                       # stored projects list
GET /api/search?q=<query>               # full-text search
GET /api/health                         # system status
```

### Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19**, TypeScript
- **Tailwind CSS v4**, Framer Motion
- **Supabase** PostgreSQL
- **Etherscan** API — on-chain metrics
- **CoinGecko Pro** API — market data
- **OKX skill suite** — `okx-security`, `okx-dex-signal`, `okx-market`

### XAgent Identity

```bash
xagt-plugin login      # register / switch accounts
xagt-plugin doctor     # check session + runtime status
xagt-plugin logout     # clear local credentials
```

Credentials live at `~/.config/xagt/credentials.json` (`%APPDATA%\xagt\credentials.json` on Windows), chmod 600.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `npm run dev` fails with Supabase errors | Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` |
| Analyze returns "Analysis failed" | Check `ETHERSCAN_API_KEY` and `COINGECKO_API_KEY` in `.env.local` |
| OKX widgets show "No data" | Ensure you've run `xagt-plugin setup --target all` to install OKX skills |
| Build fails with TypeScript errors | Run `npm run build` to see full error trace |
