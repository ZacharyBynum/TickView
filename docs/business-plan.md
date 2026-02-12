# TickView Business Plan

## What This Is

TickView is a trading simulator powered by AI-generated market data. Users
practice futures trading on synthetic markets that behave like real ones but
have never existed before. The product includes a 24/7 always-on market,
Python scripting for custom strategies, and competitive leaderboards.

This document covers the business side: LLC structure, financial projections,
sales goals, marketing, and how the company runs day-to-day with AI handling
operations under one human project director.

---

## 1. Company Structure

### Entity: Single-Member LLC

**TickView LLC** — registered in Wyoming (no state income tax, strong privacy
protections, low annual fees).

| Role | Who | What They Do |
|---|---|---|
| **Project Director** | You | Final approval on everything. Product vision, model training oversight, strategic decisions |
| **Customer Support Agent** | AI (Claude/GPT) | Handles support tickets, onboarding questions, billing issues. Escalates edge cases to you |
| **Content & Social Agent** | AI | Drafts tweets, Reddit comments, blog posts, changelog updates. Nothing published without your review |
| **Code Review Agent** | AI (Claude Code) | PR reviews, bug triage, dependency updates. Merges only after your approval |
| **Analytics Agent** | AI | Weekly dashboard: churn, MRR, signups, feature usage, support ticket themes. Flags anomalies |
| **QA / Validation Agent** | AI | Runs synthetic data quality gate pipeline. Rejects bad sessions automatically. Reports weekly |

### How "Nothing Ships Without You" Works

```
AI Agent produces output (draft, code, reply, report)
    |
    v
Output queued in review dashboard
    |
    v
You review, edit, approve, or reject
    |
    v
Only approved items go live
```

Every agent operates in **draft mode by default**. Customer support responses
are templated and pre-approved for common questions (billing, password reset,
how-to). Anything outside the template gets flagged for your review before
sending.

### Tools for AI Team Management

| Function | Tool | Cost |
|---|---|---|
| Customer support | Intercom with AI copilot or Plain.com | $0–74/mo |
| Social media drafts | Buffer or Typefully (queue + approval flow) | $0–30/mo |
| Code review | GitHub PRs with Claude Code | $0–20/mo |
| Analytics dashboard | PostHog or Plausible (self-hosted) | $0–30/mo |
| Task management | Linear or Notion | $0–10/mo |
| Email (transactional) | Resend or Postmark | $0–20/mo |

**Total operational tooling: $0–184/month** — scaling from free tiers at launch
to paid tiers as user count grows.

### LLC Costs

| Item | Cost | Frequency |
|---|---|---|
| Wyoming LLC formation | $100 | One-time |
| Registered agent | $50–100 | Annual |
| Wyoming annual report | $60 | Annual |
| EIN (IRS) | $0 | One-time |
| Business bank account | $0 | Monthly (Mercury, Relay) |
| **Total year 1** | **$210–260** | |
| **Total year 2+** | **$110–160** | |

---

## 2. Financial Projections (24 Months)

### Assumptions

- Average revenue per user (ARPU): $18.40/month (blended across tiers)
- Monthly churn: 6% (months 1–6), 5% (months 7–12), 4% (months 13–24)
- Free-to-paid conversion: 8% of free signups
- Stripe fees: 2.9% + $0.30 per transaction
- Infrastructure scales with users (see cost model below)
- No paid advertising in first 6 months (organic only)

### Monthly Projections

| Month | Free Users | Paying Users | MRR | Monthly Costs | Net Profit | Cumulative |
|---|---|---|---|---|---|---|
| 1 | 50 | 5 | $92 | $180 | -$88 | -$88 |
| 2 | 120 | 12 | $221 | $190 | $31 | -$57 |
| 3 | 220 | 25 | $460 | $200 | $260 | $203 |
| 4 | 350 | 42 | $773 | $220 | $553 | $756 |
| 5 | 500 | 60 | $1,104 | $240 | $864 | $1,620 |
| 6 | 700 | 85 | $1,564 | $270 | $1,294 | $2,914 |
| 7 | 950 | 115 | $2,116 | $310 | $1,806 | $4,720 |
| 8 | 1,200 | 145 | $2,668 | $340 | $2,328 | $7,048 |
| 9 | 1,500 | 180 | $3,312 | $370 | $2,942 | $9,990 |
| 10 | 1,800 | 215 | $3,956 | $400 | $3,556 | $13,546 |
| 11 | 2,100 | 255 | $4,692 | $430 | $4,262 | $17,808 |
| 12 | 2,500 | 300 | $5,520 | $470 | $5,050 | $22,858 |
| 13 | 2,900 | 350 | $6,440 | $510 | $5,930 | $28,788 |
| 14 | 3,300 | 400 | $7,360 | $540 | $6,820 | $35,608 |
| 15 | 3,700 | 450 | $8,280 | $570 | $7,710 | $43,318 |
| 16 | 4,100 | 500 | $9,200 | $600 | $8,600 | $51,918 |
| 17 | 4,500 | 545 | $10,028 | $620 | $9,408 | $61,326 |
| 18 | 4,900 | 590 | $10,856 | $650 | $10,206 | $71,532 |
| 19 | 5,300 | 630 | $11,592 | $670 | $10,922 | $82,454 |
| 20 | 5,700 | 670 | $12,328 | $690 | $11,638 | $94,092 |
| 21 | 6,100 | 710 | $13,064 | $710 | $12,354 | $106,446 |
| 22 | 6,500 | 750 | $13,800 | $730 | $13,070 | $119,516 |
| 23 | 6,900 | 790 | $14,536 | $750 | $13,786 | $133,302 |
| 24 | 7,300 | 830 | $15,272 | $770 | $14,502 | $147,804 |

### Key Milestones

| Milestone | Target | Revenue |
|---|---|---|
| Break even | Month 2 | $221 MRR |
| $1K MRR | Month 5 | 60 paying users |
| $3K MRR | Month 9 | 180 paying users |
| $5K MRR | Month 12 | 300 paying users |
| $10K MRR | Month 17 | 545 paying users |
| $15K MRR | Month 24 | 830 paying users |
| **Year 1 total revenue** | | **~$26,500** |
| **Year 2 total revenue** | | **~$143,000** |
| **24-month cumulative** | | **~$148,000** |

### Pessimistic Scenario (50% of projections)

| Milestone | Target |
|---|---|
| Break even | Month 4 |
| $1K MRR | Month 10 |
| $5K MRR | Month 20 |
| Year 1 total revenue | ~$13,000 |
| Year 2 total revenue | ~$70,000 |

Even in the pessimistic case, the business is profitable because costs are
so low. You can't lose money on this model unless you have zero users.

### Cost Breakdown by Phase

**Phase 1: Pre-launch + First 3 Months ($180–200/month)**

| Item | Cost |
|---|---|
| Domain (tickview.app or similar) | $12/year |
| Cloudflare (hosting + R2 storage) | $0–20 |
| Supabase (auth + database, free tier) | $0 |
| Stripe | Transaction fees only |
| GPU for model training (one-time) | $20–50 |
| PostHog analytics (free tier) | $0 |
| Email (Resend free tier) | $0 |
| **Total** | **$180–200/mo** |

**Phase 2: Months 4–12 ($220–470/month)**

| Item | Cost |
|---|---|
| All Phase 1 costs | $180–200 |
| Supabase Pro (more users) | $25 |
| 24/7 market server (Fly.io) | $30–80 |
| Batch GPU generation (RunPod) | $20–50 |
| Intercom or Plain (support) | $0–74 |
| Buffer (social scheduling) | $0–15 |
| **Total** | **$220–470/mo** |

**Phase 3: Months 13–24 ($510–770/month)**

| Item | Cost |
|---|---|
| All Phase 2 costs | $220–470 |
| Increased compute (more users) | $50–100 |
| PostHog paid (more events) | $30 |
| Monitoring (Sentry) | $26 |
| Legal/accounting (quarterly) | $50–100 |
| **Total** | **$510–770/mo** |

---

## 3. Sales Goals

"Sales" for TickView means conversions, not cold calls. Nobody should feel
sold to. The product sells itself through the free tier and word of mouth.

### Conversion Funnel Targets

| Stage | Metric | Month 6 | Month 12 | Month 24 |
|---|---|---|---|---|
| **Visitors** (monthly unique) | Site visits | 3,000 | 8,000 | 20,000 |
| **Free signups** | Conversion from visit | 700 (23%) | 2,500 (31%) | 7,300 (37%) |
| **Active free** | Used product this month | 350 (50%) | 1,250 (50%) | 3,650 (50%) |
| **Paid conversion** | Free → paid | 85 (12%) | 300 (12%) | 830 (11%) |
| **Retained paid** | Still paying after 3 months | 65 (76%) | 240 (80%) | 690 (83%) |

### Revenue per Tier (Month 12 target)

| Tier | Users | % of Paid | MRR |
|---|---|---|---|
| Starter ($12) | 120 | 40% | $1,440 |
| Standard ($20) | 120 | 40% | $2,400 |
| Pro ($35) | 60 | 20% | $2,100 |
| **Total** | **300** | | **$5,940** |

Blended ARPU: $19.80 (close to the $18.40 planning assumption — the
difference is rounding from tier distribution).

### What "Good" Looks Like

These are the numbers that tell you the business is healthy:

| Metric | Healthy | Concerning | Action |
|---|---|---|---|
| Monthly churn | <5% | >8% | Survey churned users; improve onboarding |
| Free-to-paid conversion | >8% | <5% | Improve free experience; adjust tier limits |
| Net revenue retention | >100% | <90% | Users aren't upgrading; add more Pro value |
| Payback period (CAC) | <2 months | >4 months | Cut paid channels; focus organic |
| Support tickets/user/month | <0.3 | >1.0 | Improve docs and onboarding flow |

---

## 4. Marketing Strategy

### Core Principle: Be Useful, Not Loud

The trading education space is flooded with scams, fake gurus, and aggressive
marketing. TickView's brand is the opposite: honest, understated, focused on
the product. No income claims. No "financial freedom" language. No fake
urgency. Just a good tool that helps people practice.

### Voice and Tone

**Do:**
- Talk like a trader, not a marketer
- Share insights about market microstructure
- Be specific and technical when appropriate
- Acknowledge what the product doesn't do
- Let users speak for the product

**Don't:**
- Use exclamation marks in marketing copy
- Promise results or imply income potential
- Use "limited time" or "exclusive" framing
- Post polished corporate graphics on social
- Use stock photos of people looking at charts

### Channel Strategy

**Tier 1 — Free, High-Value Channels (Months 1–6)**

These channels cost $0 and are where traders actually hang out:

**Reddit (r/FuturesTrading, r/DayTrading, r/algotrading)**

Reddit has become the most trusted platform for product discovery — 78% of
users search "product name + reddit" before buying. The strategy:

- Months 1–3: Contribute to discussions. Answer questions about futures
  trading, market microstructure, practice methods. Never link to TickView.
  Build karma and recognition as someone who knows what they're talking about.
- Month 3+: Occasionally mention TickView when directly relevant ("I built a
  tool for this actually" — only in response to someone asking for exactly
  what you offer). Link only in designated self-promo threads.
- Ongoing: Share interesting findings from synthetic data generation.
  "I trained a model on 2 years of NQ tick data, here's what it learned about
  volatility clustering" — this is genuinely interesting content that happens
  to showcase your tech.

**Twitter/X (FinTwit)**

The futures trading community on Twitter is active and tight-knit.

- Post about the building process: "Day 47 of building a synthetic futures
  market. Here's what minute-level volume patterns look like when AI generates
  them vs. real data." Attach a chart comparison.
- Share code snippets from the Python integration.
- Retweet and engage with traders and quant developers.
- Build in public — people root for builders they watch grow.

**YouTube (long-form)**

- "How I Trained an AI to Generate Realistic Futures Tick Data" — technical
  deep dive. This is the kind of video that gets 10K views from exactly the
  right audience.
- "NQ Tick Data: Real vs AI-Generated — Can You Tell?" — interactive format,
  high engagement.
- Screen recordings of trading on the 24/7 synthetic market.
- No face required. Screen capture + voiceover works fine.

**Blog / SEO**

- "What is tick-level data and why does it matter for practice trading?"
- "How synthetic market data works (and why it's better for learning)"
- "Building custom trading indicators with Python"
- Target long-tail keywords traders actually search for. These compound
  over time — a post written in month 2 is still bringing traffic in month 24.

**Tier 2 — Low-Cost, Scalable Channels (Months 6–12)**

**Discord Community**

- Free Discord server for all users (including free tier)
- Channels: #general, #daily-challenge, #strategies, #python-help,
  #feature-requests, #leaderboard
- This becomes the social glue. Users help each other. You moderate.
- The community itself becomes marketing — "join 500 traders practicing on
  AI-generated markets"

**Partnerships**

- Reach out to trading educators and YouTubers who teach futures
- Offer them free Pro accounts + affiliate commission (20% recurring)
- No "paid promotion" feel — they actually use and recommend the product
- Target: 5–10 affiliates by month 12, each driving 10–30 signups/month

**Product Hunt / Hacker News**

- Single launch on Product Hunt around month 4–6 (after the product is solid)
- "Show HN" post for the AI-generated market data angle — HN loves novel
  technical approaches
- Expected: 200–500 signups in the launch week, 10–20% converting to paid

**Tier 3 — Paid Channels (Month 12+, only if organic is working)**

Only spend money on channels where you've already proven organic traction:

| Channel | Budget | Expected CAC | Notes |
|---|---|---|---|
| Reddit ads (r/FuturesTrading) | $500/month | $15–25 | Only if organic Reddit presence is strong |
| Twitter/X promoted posts | $300/month | $10–20 | Promote best-performing organic content |
| YouTube sponsorships | $200–500/video | $8–15 | Micro-influencers (5K–50K subs) in trading niche |
| Google Ads (long-tail) | $300/month | $20–30 | "futures trading simulator," "practice trading futures" |

**Total paid marketing budget: $0 (months 1–6), $0–500 (months 7–12),
$500–1,500 (months 13–24).** Only scale what's working.

### Content Calendar (Weekly)

| Day | Channel | Content |
|---|---|---|
| Monday | Twitter | Build-in-public update or chart comparison (real vs. synthetic) |
| Tuesday | Blog | SEO article or technical deep-dive (bi-weekly) |
| Wednesday | Reddit | Contribute to 2–3 discussions in trading subs |
| Thursday | Twitter | Python tip or custom indicator example |
| Friday | Discord | "Weekend Challenge" — curated synthetic scenario |
| Saturday | YouTube | Monthly video (screen recording + voiceover) |
| Sunday | — | Review analytics, plan next week |

All content is drafted by the AI Content Agent, reviewed and approved by you
before publishing.

---

## 5. Brand Identity

### Name: TickView

Clean, descriptive, memorable. "Tick" = tick-level data. "View" = visualization.
No need to overthink it.

### Tagline Options (pick one)

- "Practice markets that have never existed."
- "Trade smarter. Every session is unique."
- "The trading gym."

### Design Principles

- **Minimal.** Dark backgrounds, one accent color, lots of whitespace.
  The chart is the hero — everything else gets out of the way.
- **Monospace.** Code-adjacent feel. This is a tool for serious people,
  not a gamified app.
- **No stock imagery.** Screenshots of the actual product. Real charts.
  Real Python code. If there are people, they're real users, not models.
- **No badges, seals, or trust signals.** The product is the trust signal.
  If it needs a "Trusted by 10,000 traders" badge to be convincing,
  the product isn't good enough yet.

### What the Landing Page Looks Like

```
[Dark background, single screenshot of TickView chart mid-replay]

TickView
Practice markets that have never existed.

AI-generated futures data. Tick-level resolution. 24/7.
$0 to start. No credit card.

[Try Free]

---

[Three feature blocks, minimal text, one screenshot each]

1. Every session is unique
   AI-generated markets based on real microstructure patterns.
   No spoilers. No memorization. Pure skill.

2. Trade anytime
   Our synthetic market runs 24/7.
   Practice at 2 AM on a Sunday. The market is always open.

3. Build and compete
   Write custom indicators in Python.
   Compete on daily challenges. See where you rank.

---

[Pricing table — 4 tiers, clean grid, no "most popular" badge]

---

[Footer: minimal. Links to docs, changelog, Discord, Twitter. No fluff.]
```

---

## 6. Operational Workflow

### Daily (15–30 minutes)

| Task | Who | Time |
|---|---|---|
| Review support ticket queue | AI drafts, you approve/edit | 5–10 min |
| Check MRR dashboard | AI Analytics Agent prepares summary | 2 min |
| Review and approve social media posts | AI Content Agent drafts | 5–10 min |
| Check synthetic data quality report | AI QA Agent flags issues | 2 min |
| Review any code PRs | AI Code Agent summarizes changes | 5 min |

### Weekly (1–2 hours)

| Task | Who | Time |
|---|---|---|
| Review weekly analytics report | AI produces, you interpret | 15 min |
| Plan next week's content | You outline, AI drafts | 30 min |
| Respond to feature requests (Discord) | You directly | 15 min |
| Update product roadmap | You | 15 min |
| Review churned users (why they left) | AI compiles, you analyze | 15 min |

### Monthly (half day)

| Task | Who | Time |
|---|---|---|
| Financial review (MRR, costs, runway) | AI prepares, you review | 1 hr |
| Synthetic data model retraining check | AI QA Agent recommends | 30 min |
| Competitor landscape check | AI researches, you review | 30 min |
| Roadmap prioritization for next month | You | 1 hr |

### How Customer Support Works

**Tier 1 — Automated (80% of tickets)**

AI agent handles immediately, using pre-approved response templates:
- "How do I reset my password?" → Automated reset link
- "How do I cancel?" → Link to billing portal
- "How do I load data?" → Link to docs with screenshot
- "The chart isn't rendering" → Troubleshooting checklist
- Billing questions → Stripe customer portal link

**Tier 2 — AI Draft + Your Approval (15% of tickets)**

Questions that need context but follow patterns:
- "Can you add X contract?" → AI drafts response referencing roadmap
- "I found a bug where..." → AI creates GitHub issue + drafts response
- "Is the synthetic data realistic?" → AI drafts response with validation
  metrics

**Tier 3 — You Directly (5% of tickets)**

- Upset customers threatening to churn
- Partnership or collaboration inquiries
- Press or media requests
- Legal or compliance questions

Target response times: Tier 1 = instant, Tier 2 = <4 hours, Tier 3 = <24 hours.

---

## 7. Risk-Adjusted Scenarios

### Scenario A: "Things Go Right" (30% probability)

Organic content hits, a YouTube video goes semi-viral in the futures
community, Product Hunt launch lands well. You reach 500 paying users by
month 14 instead of month 16.

| Metric | Month 12 | Month 24 |
|---|---|---|
| Paying users | 400 | 1,200 |
| MRR | $7,400 | $22,000 |
| Annual revenue | $45,000 | $180,000 |
| Monthly profit | $6,500 | $21,000 |

### Scenario B: "Steady Grind" (50% probability)

Growth is consistent but not explosive. You build a solid niche product that
serves a loyal user base. This is the base case in the projections above.

| Metric | Month 12 | Month 24 |
|---|---|---|
| Paying users | 300 | 830 |
| MRR | $5,520 | $15,272 |
| Annual revenue | $26,500 | $148,000 (cumulative) |
| Monthly profit | $5,050 | $14,502 |

### Scenario C: "Slow Burn" (20% probability)

Organic growth is slower than expected. Synthetic data quality takes longer
to validate. You reach $5K MRR by month 20 instead of month 12.

| Metric | Month 12 | Month 24 |
|---|---|---|
| Paying users | 150 | 400 |
| MRR | $2,760 | $7,360 |
| Annual revenue | $13,000 | $70,000 (cumulative) |
| Monthly profit | $2,300 | $6,600 |

Still profitable. Still growing. Just slower.

### Scenario D: "It Doesn't Work" (<5% probability)

Synthetic data quality never reaches acceptable levels. Users try it and leave.
You pivot to historical-data-only model or shut down.

| Trigger | Response |
|---|---|
| Churn >15%/month for 3 consecutive months | Investigate root cause; likely data quality |
| <50 paying users at month 9 | Evaluate if synthetic approach is working; consider pivot to historical |
| Negative community sentiment | Pause marketing; fix product; re-engage |

**Maximum downside: ~$2,000–3,000 in sunk costs** (GPU training + a few
months of infrastructure). This is a low-risk bet.

---

## 8. What Success Looks Like

### Year 1

- Working product with synthetic data for ES and NQ
- 24/7 market operational
- 300 paying users, $5K+ MRR
- Discord community of 500+ traders
- Established presence on Reddit and Twitter
- All operations running through AI agents with your oversight
- Total time commitment: 2–4 hours/day

### Year 2

- 6+ contracts with synthetic data
- Python integration live
- Leaderboard and daily challenges active
- 800+ paying users, $15K+ MRR
- Content flywheel running (blog posts ranking on Google, YouTube videos
  accumulating views)
- Affiliate partners driving 20%+ of signups
- Total time commitment: 1–3 hours/day (more automated)

### Year 3+ (If Everything Compounds)

- 2,000+ paying users, $30K+ MRR ($360K+ ARR)
- Recognized name in futures trading education
- Strategy marketplace generating network effects
- Potential for acquisition interest from trading platform companies
- Or: keep running as a profitable lifestyle business with 5–10 hours/week
  of oversight

---

## Summary

| Question | Answer |
|---|---|
| What's the entity? | Single-member LLC (Wyoming) |
| Who runs operations? | AI agents under your approval |
| What's the marketing strategy? | Organic first: Reddit, Twitter, YouTube, SEO. Authentic, not salesy. |
| What's the realistic Year 1 revenue? | $26K (base case), $13K (pessimistic), $45K (optimistic) |
| What's the realistic Year 2 MRR? | $15K/month (base), $7K (pessimistic), $22K (optimistic) |
| What's the max downside? | ~$2–3K in sunk costs |
| How much time does it take? | 2–4 hours/day year 1, 1–3 hours/day year 2 |
| When is it profitable? | Month 2 (base case), month 4 (pessimistic) |
| What makes it defensible? | Trained AI model + community + Python ecosystem + leaderboards |
