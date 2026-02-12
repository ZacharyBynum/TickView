# TickView Pricing Structure — Cost Analysis Reference

> **Note:** This document contains the raw cost analysis and CME fee research.
> The final product strategy, pricing tiers, and business plan are in
> [synthetic-data-strategy.md](./synthetic-data-strategy.md).

---

## CME Exchange Data Fee Reference

CME Group charges **per-user, per-exchange** fees for real-time market data:

| Data Type | Per User/Month (Non-Professional) |
|---|---|
| CME Level 1 (Top of Book) | ~$3/exchange |
| CME Level 2 (Depth of Market) | ~$5–15/exchange |
| CME Bundle (all 4 exchanges: CME, CBOT, NYMEX, COMEX) | ~$14–41/month |

These fees make live data redistribution at $20/month impossible. This
constraint led to the synthetic data strategy.

---

## Historical Data Vendor Costs

| Vendor | Cost Model | Notes |
|---|---|---|
| Databento Historical | ~$0.02–0.05/day/symbol | Pay-as-you-go, billed by data credits |
| FirstRateData | ~$30–50/symbol/year | Bulk download, one-time |
| TickData.com | Custom pricing | Institutional-grade |
| CME historical license | Negotiable | Required for redistribution |

At 10 contracts, daily updates via Databento: ~$6.60/month for raw data.

---

## Infrastructure Cost Baseline (500 users)

| Component | Monthly Cost | Per User |
|---|---|---|
| API Server | $80–150 | $0.16–0.30 |
| Object Storage (S3/R2) | $20–40 | $0.04–0.08 |
| CDN / Data Transfer | $50–100 | $0.10–0.20 |
| Database | $15–30 | $0.03–0.06 |
| Auth / Payments (Clerk + Stripe) | $50–100 | $0.10–0.20 |
| Data Pipeline | $30–60 | $0.06–0.12 |
| Monitoring / Logging | $20–40 | $0.04–0.08 |
| **Total** | **$265–520** | **$0.53–1.04** |

---

## Competitive Pricing Landscape

| Platform | Monthly Cost | Includes Data? | Replay? |
|---|---|---|---|
| Bookmap Global | $49 + $34–179 data | No | Yes |
| Jigsaw Daytradr | $579 upfront + $50/mo live | No | Yes (sim only) |
| EdgeProX | $35 + data fees | No | Yes (bar-level) |
| NinjaTrader | $60/mo or $1,099 lifetime | No | Yes |
| TradingView | $12.95–49.95/mo + data fees | No | Paper trading only |

---

## Futures Contract Reference

### Phase 1 Contracts

| Symbol | Name | Exchange | Tick Size | Point Value |
|---|---|---|---|---|
| ES | E-mini S&P 500 | CME | 0.25 | $12.50 |
| NQ | E-mini NASDAQ 100 | CME | 0.25 | $5.00 |
| YM | E-mini Dow | CBOT | 1.00 | $5.00 |
| RTY | E-mini Russell 2000 | CME | 0.10 | $5.00 |
| CL | Crude Oil | NYMEX | 0.01 | $10.00 |
| GC | Gold | COMEX | 0.10 | $10.00 |

### Phase 2 Contracts

| Symbol | Name | Exchange | Tick Size | Point Value |
|---|---|---|---|---|
| MES | Micro E-mini S&P 500 | CME | 0.25 | $1.25 |
| MNQ | Micro E-mini NASDAQ 100 | CME | 0.25 | $0.50 |
| SI | Silver | COMEX | 0.005 | $25.00 |
| NG | Natural Gas | NYMEX | 0.001 | $10.00 |
| ZB | 30-Year T-Bond | CBOT | 1/32 | $31.25 |
| 6E | Euro FX | CME | 0.00005 | $6.25 |
