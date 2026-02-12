# TickView Pricing Structure Analysis

## Executive Summary

**Target price point: ~$20/month**

This is feasible — but only with a specific cost-cutting strategy focused on
**historical replay only** (no live streaming) for a **limited set of futures
contracts**. Live tick-level data streaming at $20/month is not viable due to
CME exchange fees alone exceeding that price per user. The strategy below
outlines how to hit the $20 mark profitably.

---

## 1. The Core Cost Problem: Exchange Data Fees

CME Group charges **per-user, per-exchange** fees for real-time market data
that get passed through to end users. These fees alone make a $20/month
live-data product impossible:

| Data Type | Per User/Month (Non-Professional) |
|---|---|
| CME Level 1 (Top of Book) | ~$3/exchange |
| CME Level 2 (Depth of Market) | ~$5–15/exchange |
| CME Bundle (all 4 exchanges: CME, CBOT, NYMEX, COMEX) | ~$14–41/month |

Even the cheapest Level 1 bundle across CME's 4 exchanges costs $12+/user/month
before you pay for a single server. **This is the constraint that shapes the
entire pricing model.**

### The Solution: Historical Replay, Not Live Data

TickView is already architected as a **replay simulator** — users load tick
data and replay it. The product doesn't need live streaming to deliver value.
By serving **historical tick data** instead of real-time feeds:

- **No per-user CME exchange fees** (exchange fees apply to real-time
  redistribution, not historical data served from your own licensed database)
- **One-time data licensing cost** amortized across all users
- **Predictable, fixed infrastructure costs** (storage + API, no live feed
  infrastructure)

---

## 2. Cost Model (Historical Replay Architecture)

### Data Acquisition Costs

| Item | Cost | Notes |
|---|---|---|
| Databento Historical (pay-as-you-go) | ~$0.02–0.05/day/symbol | L1 tick data, billed by data credits |
| Alternative: FirstRateData bulk | ~$30–50/symbol/year | Full tick history, one-time download |
| Alternative: TickData.com | Custom pricing | Institutional-grade, higher cost |
| CME historical data license | Negotiable | Required for redistribution; contact CME |

**Estimated monthly data cost (10 futures contracts, daily updates):**

Using Databento historical API at ~$0.03/day/symbol:
- 10 contracts x $0.03/day x 22 trading days = **~$6.60/month** for raw data

Bulk historical backfill (one-time):
- 10 contracts x 5 years x ~$40/symbol = **~$2,000 one-time**

### Infrastructure Costs (per month, at scale)

Assuming **500 active subscribers**:

| Component | Monthly Cost | Per User |
|---|---|---|
| **API Server** (serves tick files on demand) | $80–150 | $0.16–0.30 |
| **Object Storage** (S3/R2 for tick data files) | $20–40 | $0.04–0.08 |
| **CDN / Data Transfer** (serving ~200MB/user/month) | $50–100 | $0.10–0.20 |
| **Database** (user accounts, metadata) | $15–30 | $0.03–0.06 |
| **Auth / Payments** (Clerk + Stripe) | $50–100 | $0.10–0.20 |
| **Data Pipeline** (daily ingest + processing) | $30–60 | $0.06–0.12 |
| **Monitoring / Logging** | $20–40 | $0.04–0.08 |
| **Total Infrastructure** | **$265–520** | **$0.53–1.04** |

### Fixed Overhead Costs

| Item | Monthly Cost |
|---|---|
| Domain + DNS | $2 |
| SSL / Security | $0 (Let's Encrypt) |
| Email (transactional) | $10–20 |
| Error tracking (Sentry) | $0–26 |
| CME data redistribution license (amortized) | $100–500 (varies) |
| **Total Fixed Overhead** | **$112–548** |

---

## 3. Unit Economics at $20/month

### Revenue Per User
- Gross revenue: **$20.00**
- Stripe fees (2.9% + $0.30): **-$0.88**
- Net revenue: **$19.12**

### Cost Per User (at 500 subscribers)

| Cost Category | Per User/Month |
|---|---|
| Infrastructure | $0.53–1.04 |
| Data acquisition | $0.01–0.05 |
| Fixed overhead (amortized over 500 users) | $0.22–1.10 |
| **Total cost per user** | **$0.76–2.19** |

### Margin Analysis (500 subscribers)

| Metric | Conservative | Optimistic |
|---|---|---|
| Monthly Revenue | $9,560 | $9,560 |
| Monthly Costs | $1,095 | $380 |
| **Monthly Profit** | **$8,465** | **$9,180** |
| **Gross Margin** | **88.5%** | **96.0%** |

**$20/month is very feasible with historical replay.** The margins are strong
because the primary cost driver (exchange data fees) is eliminated.

---

## 4. Recommended Tier Structure

### Tier 1: "Starter" — $15/month ($144/year)

**Target:** New traders learning to read price action

| Feature | Limit |
|---|---|
| Contracts available | NQ, ES only (2 contracts) |
| Historical depth | 6 months rolling |
| Replay speed | Up to 100x |
| Indicators | 10 (basic set: SMA, EMA, RSI, MACD, BB, etc.) |
| Saved sessions | 5 |
| Data resolution | Tick-level (full) |
| Upload own data | No |

### Tier 2: "Standard" — $25/month ($240/year)

**Target:** Active traders practicing strategies across multiple markets

| Feature | Limit |
|---|---|
| Contracts available | ES, NQ, YM, RTY, CL, GC (6 contracts) |
| Historical depth | 2 years rolling |
| Replay speed | Up to 500x |
| Indicators | All 20 |
| Saved sessions | 25 |
| Data resolution | Tick-level (full) |
| Performance analytics | Full suite (MFE/MAE, equity curve) |
| Upload own data | Yes |
| Export trade log | CSV |

### Tier 3: "Pro" — $45/month ($432/year)

**Target:** Serious traders and prop firm candidates

| Feature | Limit |
|---|---|
| Contracts available | All available futures (10+) |
| Historical depth | 5 years rolling |
| Replay speed | Up to 1000x |
| Indicators | All 20 + custom indicator API |
| Saved sessions | Unlimited |
| Data resolution | Tick-level (full) + Level 2 DOM |
| Performance analytics | Full suite + daily journal |
| Upload own data | Yes |
| Export trade log | CSV + JSON API |
| Multi-chart layouts | Yes |
| Priority support | Yes |

### Why This Structure Works

1. **$15 Starter hooks users** at an impulse-buy price point. NQ + ES covers
   80%+ of retail futures traders. Your original $20 target fits between
   Starter and Standard — go with $15 to maximize conversion.

2. **$25 Standard is the volume play.** Most users will land here. Adding CL
   (crude oil) and GC (gold) covers the next most popular contracts. $25 is
   still cheaper than any competitor (Bookmap $49+, EdgeProX $35+ before data).

3. **$45 Pro captures high-value users** willing to pay for deeper history and
   more instruments. Level 2 DOM replay is a significant differentiator.

---

## 5. Competitive Positioning

| Platform | Monthly Cost | Includes Data? | Replay? |
|---|---|---|---|
| **TickView Starter** | **$15** | **Yes** | **Yes (tick-level)** |
| **TickView Standard** | **$25** | **Yes** | **Yes (tick-level)** |
| **TickView Pro** | **$45** | **Yes** | **Yes (tick + DOM)** |
| Bookmap Global | $49 + $34–179 data | No | Yes |
| Jigsaw Daytradr | $579 upfront + $50/mo live | No | Yes (sim only) |
| EdgeProX | $35 + data fees | No | Yes (bar-level) |
| NinjaTrader | $60/mo or $1,099 lifetime | No | Yes |

**TickView's key differentiator: data is included in the subscription.**
Competitors charge $35–100/month for the platform, then $34–179/month
separately for market data feeds. TickView bundles everything for $15–45.

---

## 6. Contracts to Include (Phased Rollout)

### Phase 1 — Launch (Starter + Standard)

Focus on the most liquid, most traded futures contracts:

| Symbol | Name | Exchange | Tick Size | Point Value |
|---|---|---|---|---|
| ES | E-mini S&P 500 | CME | 0.25 | $12.50 |
| NQ | E-mini NASDAQ 100 | CME | 0.25 | $5.00 |
| YM | E-mini Dow | CBOT | 1.00 | $5.00 |
| RTY | E-mini Russell 2000 | CME | 0.10 | $5.00 |
| CL | Crude Oil | NYMEX | 0.01 | $10.00 |
| GC | Gold | COMEX | 0.10 | $10.00 |

**Why these 6:** They represent ~85% of retail futures trading volume. All are
on CME Group exchanges, simplifying data licensing to a single vendor
relationship.

### Phase 2 — Expansion (Pro tier)

| Symbol | Name | Exchange | Tick Size | Point Value |
|---|---|---|---|---|
| MES | Micro E-mini S&P 500 | CME | 0.25 | $1.25 |
| MNQ | Micro E-mini NASDAQ 100 | CME | 0.25 | $0.50 |
| SI | Silver | COMEX | 0.005 | $25.00 |
| NG | Natural Gas | NYMEX | 0.001 | $10.00 |
| ZB | 30-Year T-Bond | CBOT | 1/32 | $31.25 |
| 6E | Euro FX | CME | 0.00005 | $6.25 |

### Phase 3 — Future Consideration

- Crypto futures (BTC, ETH on CME)
- Agricultural futures (ZC, ZS, ZW)
- Options on futures (separate data licensing)
- Live data streaming (requires per-user exchange fee pass-through, repricing)

---

## 7. Architecture Changes Required

The current app is fully client-side. To support a subscription model with
server-hosted data, the following changes are needed:

### Backend (New)
- **Auth system** — Clerk, Supabase Auth, or Auth.js
- **API layer** — Node.js/Express or edge functions (Cloudflare Workers)
- **Data pipeline** — Daily cron job to fetch + process new tick data
- **File serving** — Presigned URLs to S3/R2 for tick data files
- **Subscription management** — Stripe Billing with webhook handlers
- **User database** — PostgreSQL (Supabase, Neon, or PlanetScale)

### Frontend (Modified)
- **Login/signup flow** — Gate access behind auth
- **Contract selector** — Replace file upload with server-side data browser
- **Date picker** — Select which trading day to replay
- **Subscription management UI** — Plan selection, billing portal
- **Keep file upload** — For Standard/Pro tiers as an additional feature

### Data Pipeline
- **Ingest:** Databento API (or similar) → fetch daily tick data after market close
- **Process:** Normalize to TickView's internal format (timestamp, price, bid, ask, volume)
- **Store:** Compressed files in object storage (S3/R2), indexed by symbol + date
- **Serve:** Generate presigned download URLs per user request
- **Cache:** IndexedDB caching on client side remains (reduces repeat downloads)

---

## 8. Revenue Projections

### Conservative Scenario (Month 12)

| Tier | Users | MRR |
|---|---|---|
| Starter ($15) | 200 | $3,000 |
| Standard ($25) | 150 | $3,750 |
| Pro ($45) | 50 | $2,250 |
| **Total** | **400** | **$9,000** |

Monthly costs at 400 users: ~$800–1,200
**Net monthly profit: ~$7,800–8,200**
**Annual run rate: ~$93,600–98,400**

### Optimistic Scenario (Month 12)

| Tier | Users | MRR |
|---|---|---|
| Starter ($15) | 500 | $7,500 |
| Standard ($25) | 350 | $8,750 |
| Pro ($45) | 150 | $6,750 |
| **Total** | **1,000** | **$23,000** |

Monthly costs at 1,000 users: ~$1,500–2,500
**Net monthly profit: ~$20,500–21,500**
**Annual run rate: ~$246,000–258,000**

---

## 9. Key Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| CME historical data redistribution license cost | Could be $500–5,000+/month | Start with Databento (they handle CME licensing); negotiate direct CME license at scale |
| Users expect live data at $20 | Churn if expectations misaligned | Clear marketing: "historical replay simulator" — not a live trading platform |
| Data vendor API changes/price increases | Cost spike | Abstract data layer; support multiple vendors; maintain local data cache |
| Low initial user count (<100) | Fixed costs eat into margin | Keep infrastructure minimal (serverless/edge); $15 tier still profitable at 50 users |
| Competitors drop prices | Price pressure | Differentiate on UX, bundled data, and simplicity — not just price |

---

## 10. Recommendation

**Launch with two tiers:**

1. **$15/month "Starter"** — ES + NQ only, 6 months history, basic indicators
2. **$25/month "Standard"** — 6 contracts, 2 years history, full feature set

Skip the Pro tier initially. Add it once you have 200+ paying users and can
validate demand for deeper history and more contracts.

**$20/month as a single tier** also works if you want simplicity. Offer ES, NQ,
CL, GC (4 contracts), 1 year of history, all indicators, and unlimited replay.
This sits right at your target and is profitable from user #1.

The key insight: **by using historical data instead of live streaming, you
eliminate the single largest cost (CME per-user exchange fees) and make $20/month
not just feasible, but highly profitable.**
