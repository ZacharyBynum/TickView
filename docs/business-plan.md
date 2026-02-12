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

### A Note on Honesty

Most SaaS projections you see online are survivorship bias. The founders who
write "How I Hit $10K MRR in 6 Months" are the 5% — the other 95% quietly
shut down. Here's what the actual data says:

- **70% of micro-SaaS businesses earn under $1,000/month** (study of 1,000+
  micro-SaaS businesses, 2025)
- **30% never reach $1K MRR and abandon the project**
- **Median time to $1M ARR is 2 years 9 months** — for companies that make it
- **Median bootstrapped SaaS growth: 23% annually** (SaaS Capital, 2025)
- Jigsaw Trading, a well-established niche futures tool, has ~6,000 users
  **after many years in market**

The projections below use three scenarios. The "likely" scenario is what
happens if the product is decent and you show up consistently. Not viral.
Not lucky. Just decent and consistent.

### Assumptions

- ARPU: $18.40/month (blended across tiers)
- Monthly churn: 8% (months 1–6), 6% (months 7–12), 5% (months 13–24)
- Free-to-paid conversion: 4–6% of free signups (not the 8–12% SaaS blogs
  claim — that's for products people already know they need, like email tools)
- Stripe fees: 2.9% + $0.30 per transaction
- No paid advertising first 9 months
- Most growth comes from 2–3 organic channels that work, not all of them
- There will be months where nothing grows and you question everything

### Scenario A: "Likely" (60% probability)

Slow, grinding growth. Some months are flat. A few Reddit posts land. Most
don't. You're building in a niche of a niche (futures traders who want
practice tools — not all traders, not all futures traders, just the ones
who actively seek simulation).

| Month | Free Users | Paying | MRR | Costs | Net | Cumulative |
|---|---|---|---|---|---|---|
| 1 | 20 | 0 | $0 | $150 | -$150 | -$150 |
| 2 | 40 | 2 | $37 | $150 | -$113 | -$263 |
| 3 | 70 | 4 | $74 | $160 | -$86 | -$349 |
| 4 | 100 | 7 | $129 | $160 | -$31 | -$380 |
| 5 | 130 | 10 | $184 | $170 | $14 | -$366 |
| 6 | 170 | 15 | $276 | $180 | $96 | -$270 |
| 7 | 220 | 22 | $405 | $200 | $205 | -$65 |
| 8 | 280 | 30 | $552 | $210 | $342 | $277 |
| 9 | 340 | 38 | $699 | $230 | $469 | $746 |
| 10 | 400 | 48 | $883 | $250 | $633 | $1,379 |
| 11 | 470 | 58 | $1,067 | $260 | $807 | $2,186 |
| 12 | 550 | 70 | $1,288 | $280 | $1,008 | $3,194 |
| 13 | 630 | 82 | $1,509 | $300 | $1,209 | $4,403 |
| 14 | 720 | 95 | $1,748 | $320 | $1,428 | $5,831 |
| 15 | 810 | 110 | $2,024 | $340 | $1,684 | $7,515 |
| 16 | 900 | 125 | $2,300 | $350 | $1,950 | $9,465 |
| 17 | 1,000 | 140 | $2,576 | $360 | $2,216 | $11,681 |
| 18 | 1,100 | 158 | $2,907 | $380 | $2,527 | $14,208 |
| 19 | 1,200 | 175 | $3,220 | $390 | $2,830 | $17,038 |
| 20 | 1,300 | 190 | $3,496 | $400 | $3,096 | $20,134 |
| 21 | 1,400 | 210 | $3,864 | $410 | $3,454 | $23,588 |
| 22 | 1,500 | 228 | $4,195 | $420 | $3,775 | $27,363 |
| 23 | 1,600 | 248 | $4,563 | $430 | $4,133 | $31,496 |
| 24 | 1,700 | 270 | $4,968 | $440 | $4,528 | $36,024 |

**Year 1 total revenue: ~$5,600**
**Year 2 total revenue: ~$35,900**
**Month 24 MRR: ~$5,000**

That's $5K MRR after two full years of work. Not $15K. Not $10K. Five
thousand. And that's if you don't quit during the 7 months where you're
making less than a side gig at Starbucks.

### Scenario B: "Slow Burn" (25% probability)

The product works but organic traction is weak. Content doesn't land. Growth
is mostly word of mouth from a small group of loyal users.

| Milestone | When |
|---|---|
| First paying user | Month 3 |
| Break even | Month 10 |
| $1K MRR | Month 16 |
| $2K MRR | Month 24 |
| Year 1 total revenue | ~$2,500 |
| Year 2 total revenue | ~$17,000 |

This is still a net-positive project because costs are so low, but it's not
replacing income. It's beer money for 18 months before it becomes a car
payment.

### Scenario C: "Something Catches" (15% probability)

A YouTube video or HN post hits with the right audience. A trading educator
with 50K followers mentions you. You don't control if this happens — you
just make sure the product is ready when it does.

| Milestone | When |
|---|---|
| First paying user | Month 2 |
| Break even | Month 3 |
| $1K MRR | Month 6 |
| $5K MRR | Month 12 |
| $10K MRR | Month 20 |
| Year 1 total revenue | ~$20,000 |
| Year 2 total revenue | ~$90,000 |

Don't plan for this. Be ready for it. The difference between Scenario A and
Scenario C usually isn't the product — it's one piece of content that happens
to reach the right person at the right time.

### What the Comparable Says

Jigsaw Trading has ~6,000 users at ~$500/year after **many years** in the
futures trading tools niche. They're well-known, well-reviewed, and solve a
real problem. If TickView captured 5% of Jigsaw's user base in 2 years, that
would be 300 users at ~$20/month = **$6K MRR**. That's roughly what Scenario A
projects and feels honest.

### The Math That Actually Matters

The real question isn't "how fast does this grow" — it's "can I afford to
wait for it to grow?"

| Metric | Value |
|---|---|
| Sunk cost to launch | ~$200–400 (GPU training + first 2 months hosting) |
| Monthly burn before break-even | $150–200/month |
| **Total cash at risk (months 1–8)** | **~$1,200–1,600** |
| Hours per week (building + marketing) | 15–25 |
| Opportunity cost | Whatever else you'd do with that time |

The financial risk is genuinely low. The real cost is your time and the
psychological toll of months 3–9 when MRR is under $500 and it feels like
nobody cares. That's where most solo founders quit — not because the math
is wrong, but because the silence is deafening. You know this from Spotify.

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

### Conversion Funnel Targets (Scenario A — Likely)

| Stage | Metric | Month 6 | Month 12 | Month 24 |
|---|---|---|---|---|
| **Visitors** (monthly unique) | Site visits | 500 | 2,000 | 5,000 |
| **Free signups** | Conversion from visit | 170 (34%) | 550 (28%) | 1,700 (34%) |
| **Active free** | Used product this month | 60 (35%) | 200 (36%) | 600 (35%) |
| **Paid conversion** | Free → paid | 15 (9%) | 70 (13%) | 270 (16%) |
| **Retained paid** | Still paying after 3 months | 10 (67%) | 52 (74%) | 216 (80%) |

Notes on these numbers:
- **500 monthly visitors at month 6** is what a niche product with no ad spend
  and sporadic organic content actually gets. Not 3,000.
- **34% visit-to-signup** is reasonable for a free tier with no credit card.
- **9% free-to-paid in month 6** is generous — many users try and leave.
  This improves over time as the product gets better and word of mouth kicks in.
- **67% 3-month retention early on** reflects that early adopters churn more
  (product is rougher, less content, no community yet).

### Revenue per Tier (Month 12 target — Scenario A)

| Tier | Users | % of Paid | MRR |
|---|---|---|---|
| Starter ($12) | 30 | 43% | $360 |
| Standard ($20) | 28 | 40% | $560 |
| Pro ($35) | 12 | 17% | $420 |
| **Total** | **70** | | **$1,340** |

Blended ARPU: $19.14. At month 12, you have 70 paying users and ~$1.3K MRR.
That's the honest number.

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

### Scenario A: "Likely" — The Grind (60% probability)

Nothing goes viral. No lucky breaks. You show up, you post, you improve the
product. Growth is slow but real. Some months are flat. Some months you lose
more users than you gain. But the product is good and the niche is real, so
it compounds — eventually.

| Metric | Month 12 | Month 24 |
|---|---|---|
| Paying users | 70 | 270 |
| MRR | $1,288 | $4,968 |
| Year revenue | $5,600 | $35,900 (year 2 only) |
| Monthly profit | $1,008 | $4,528 |

This is what "working" looks like for a solo-founder niche SaaS. You're not
quitting your day job at month 12. You might be at month 30.

### Scenario B: "Slow Burn" (25% probability)

Content doesn't land. The market is harder to reach than expected. Maybe
the futures trading practice niche is smaller than you thought, or traders
don't trust AI-generated data yet. Growth is mostly word of mouth from a
handful of loyal users.

| Metric | Month 12 | Month 24 |
|---|---|---|
| Paying users | 30 | 120 |
| MRR | $552 | $2,208 |
| Year revenue | $2,500 | $17,000 (year 2 only) |
| Monthly profit | $272 | $1,768 |

Still technically profitable. But $550/month MRR at month 12 will test
your motivation. This is where most people quit — and honestly, quitting
might be the right call if nothing changes by month 15. The product might
need a pivot, not more marketing.

### Scenario C: "Something Catches" (15% probability)

A YouTube video hits 50K views in the trading community. An educator with
a following uses the product and mentions it. A HN post makes the front page.
You don't control this. You just make sure the product is solid when it
happens.

| Metric | Month 12 | Month 24 |
|---|---|---|
| Paying users | 250 | 700 |
| MRR | $4,600 | $12,880 |
| Year revenue | $20,000 | $90,000 (year 2 only) |
| Monthly profit | $4,130 | $12,440 |

This is the version that looks like the blog posts. It happens. Just not
to most people.

### Scenario D: "It Doesn't Work" (15% probability)

Synthetic data quality isn't convincing. Experienced traders can tell it's
fake and say so publicly. Or the market for practice tools is too small.
Or you burn out during the silent months.

**This is a real and significant probability. 15% is not a rounding error.**

| Trigger | Honest Response |
|---|---|
| Synthetic data feels obviously fake after 2 months of iteration | Pivot to historical-only (cheaper product, still works) or shelve the AI approach |
| <20 paying users at month 9 | Seriously evaluate whether to continue. Talk to the 20 users. If they love it, keep going. If they're lukewarm, stop. |
| You haven't posted content in 3 weeks because you lost motivation | This is the most common failure mode. Not the tech, not the market — just running out of energy in the silence. |
| Negative community reception | Don't fight it. Listen. If traders say it's bad, it's bad. Fix it or fold. |

**Maximum financial downside: ~$1,500–2,500.** That's the real number.
GPU training ($20–50), hosting ($150/mo x 12 months worst case = $1,800),
domain ($12). You are not going to go broke on this. The risk is time, not
money.

### The Spotify Comparison

You already know what this feels like. Music on Spotify has the same
dynamics: near-zero marginal cost, algorithmic discovery that's opaque,
months of work before any traction, and the psychological weight of low
numbers. The difference here:

| Factor | Spotify Music | TickView |
|---|---|---|
| Competition | Millions of artists | Handful of niche tools |
| Discovery | Algorithm-dependent, opaque | SEO + community + content (you control it) |
| Revenue per user | $0.003–0.005/stream | $12–35/month |
| Switching cost | Zero (users just tap next) | Medium (leaderboard rank, Python scripts, saved sessions) |
| Content creation cycle | Write → record → mix → master → release | Build feature → ship → iterate |
| Feedback loop | Weeks/months to know if a track works | Days (users sign up or they don't) |

The unit economics and feedback loops are dramatically better. The emotional
grind is similar.

---

## 8. What Success Looks Like (Honestly)

### Year 1

- Working product with synthetic data for NQ and ES
- 24/7 market operational (even if only 5 people are trading on it)
- 50–100 paying users, $1K–2K MRR
- A Discord server that's quiet most days but has 20 people who actually
  care about the product
- 5–10 pieces of content that rank or get shared
- You haven't quit
- Total time commitment: 15–25 hours/week
- **This is a side project, not a business yet.** Treat it that way.

### Year 2

- 4–6 contracts with synthetic data
- Python integration live (this is what moves it from "tool" to "platform")
- Leaderboard active (even 50 daily challenge participants feels alive)
- 200–400 paying users, $4K–8K MRR
- One or two content channels that reliably bring in signups
- A few affiliate relationships with trading educators
- Total time commitment: 10–20 hours/week
- **This is starting to look like a real business.** You're covering some
  bills. Not all of them.

### Year 3+ (If It Keeps Compounding)

- 500–1,000+ paying users, $10K–20K MRR ($120K–240K ARR)
- Known in the niche but not famous. "Oh yeah, TickView, I've heard of that"
  in r/FuturesTrading
- Strategy marketplace starting to generate network effects
- Could be a full-time income. Could also plateau at $5K MRR for years —
  many niche SaaS products do, and that's fine if your costs are $400/month.
- Potential for acquisition by a trading platform company wanting the AI
  model and user base. Or keep it as a profitable lifestyle business.

### What Failure Looks Like (So You Recognize It)

- Month 6: <10 paying users and you haven't posted content in a month
- Month 12: <30 paying users and churn is >10%/month
- Month 18: MRR has been flat for 6 months and you dread working on it

If you hit these markers, it's not a failure of character. It might mean the
market is too small, the timing is wrong, or the product needs a different
angle. The sunk cost is under $2,000. Walk away without guilt.

---

## Summary

| Question | Answer |
|---|---|
| What's the entity? | Single-member LLC (Wyoming, ~$210 to form) |
| Who runs operations? | AI agents under your approval |
| What's the marketing strategy? | Organic: Reddit, Twitter, YouTube, SEO. Authentic, not salesy. |
| What's the realistic Year 1 revenue? | **$5,600** (likely), $2,500 (slow), $20,000 (lucky) |
| What's the realistic Month 24 MRR? | **$5,000** (likely), $2,200 (slow), $12,900 (lucky) |
| What's the max financial downside? | ~$1,500–2,500 in sunk costs |
| How much time does it take? | 15–25 hrs/week year 1, 10–20 hrs/week year 2 |
| When is it profitable? | Month 5–8 (likely), month 10+ (slow) |
| When does it replace income? | Year 2–3 if it works. Maybe never. Be honest about that. |
| What makes it defensible? | Trained AI model + community + Python ecosystem + leaderboards |
| What's the real risk? | Not money — time and motivation during the silent months |
