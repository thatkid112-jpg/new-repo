# TrendSite — Replica of trends24.in (US X/Twitter Trends Tracker)

## Context
A clone of https://trends24.in/united-states/ — tracks X (Twitter) trending topics over the past 24 hours
as timeline snapshots, a tag cloud, and ranked tables. Covers: what the site does, build/run cost,
enhancements, recommendation, and realistic revenue, followed by a developer hand-off spec.

---

## 1. What the site actually is (review)
A thin, very cacheable content site over a single data feed:
- **Core data**: X trending topics for a location (US), captured as ~hourly snapshots and kept for 24h.
- **Views**: timeline (column of hourly snapshots), tag cloud, ranked table; light/dark theme.
- **Derived stats**: "longest trending", "new trends", "popular/active", tweet-count volume.
- **Upsell**: ad-free historical archive (subscription) — the real product is the *archive*, not the live page.
- **Monetization today**: light display ads + archive subscription.

The hard part is **not** the front end (it's simple). The hard part is the **data pipeline**: legally and
reliably getting X trends every hour for many locations, and storing history cheaply.

## 2. Cost to build a replica
Three realistic build tiers:

| Tier | What you get | One-time build | Monthly run | Data source assumed |
|------|--------------|----------------|-------------|---------------------|
| **DIY / MVP** | US-only, hourly snapshots, timeline + cloud + table, Postgres history, deployed on a cheap VPS/Vercel | ~40–80 hrs (≈ $4k–$8k if hired, or your own time) | $20–$80 | **Third-party trends API** (~$20–$100/mo) + cheap DB/hosting |
| **Production** | Multi-location, archive subscriptions (Stripe), ads, CDN caching, monitoring, SEO | ~150–250 hrs (≈ $15k–$30k contracted) | $150–$600 | **Third-party trends API**, more locations + CDN + monitoring + Stripe |
| **Scaled** | trends24-equivalent: 400+ locations, years of archive, paid API, redundancy | $40k+ | $1k–$5k+ | **Official/paid X API** at volume (jump driven mostly by this) |

> **Note:** The *one-time build* figures are dev labor only — they don't change with the data source.
> The *monthly run* figures do: MVP and Production assume the third-party trends API (the recommended
> route); only the Scaled tier assumes graduating to the official paid X API, which is what drives that
> jump. Staying on a third-party API even at scale would keep run costs lower, at the cost of reliability.

**The real cost driver is the data source, not the code:**
- **Official X API (2026)**: free tier is write-only/no reads; pay-per-use is ~$0.005/read (legacy Basic
  $200/mo, Pro $5,000/mo, Enterprise ~$42k/mo). Trends at scale via official API is expensive.
- **Scraping (what trends24 effectively relies on)**: cheap but legally gray, brittle, and against X ToS.
- **Third-party trend APIs / Apify actors**: ~$20–$100/mo for trends-by-location — the pragmatic middle
  path for an MVP, and what I'd recommend to start.

So a working MVP is realistically **$20–$100/month to run** plus your build time; a polished product that
could actually compete is a **$15k–$30k** build.

## 3. Enhancements over trends24
- **Sentiment & summary per trend** (LLM): "why is this trending?" one-liner — strong differentiator.
- **Email/push alerts** when a keyword or category starts trending (clear paid feature).
- **Better historical analytics**: search history, compare two trends, seasonality charts, CSV/API export.
- **Multi-platform**: add TikTok / Google Trends / Reddit / YouTube for a true "what's trending everywhere".
- **Public read API** (monetizable) — many people want trend data programmatically.
- **Embeddable widgets** for blogs/newsrooms (drives backlinks + SEO).
- **Faster, cleaner UX**: real charts, deep-linkable trends, proper mobile.

## 4. Recommendation
Start **DIY/MVP** with a third-party trends API (e.g., an Apify trends actor) on an hourly cron, store
snapshots in Postgres, and serve a statically-cached Next.js front end. Validate traffic/SEO for 1–2 months
**before** spending on the official X API or building the archive paywall. The defensible, monetizable
asset is **historical data + the LLM "why it's trending" layer**, so design the schema to retain history
from day one. Avoid building the business on scraping X directly — it's the part most likely to break or
get you blocked.

## 5. How much money a site like this makes
Public estimates for trends24.in: ~1.1M monthly users / ~2.5M pageviews, est. ~**$7.4k/month** revenue,
site value ~$90k (third-party estimators — treat as rough). Reality for a *new* replica:
- Months 1–6, low traffic: **$0–$200/mo** (display ads only).
- A site that reaches real traffic (100k+ visits/mo): **~$1k–$5k/mo** from ads + a few hundred archive subs.
- Matching trends24 scale: **~$5k–$10k/mo**, but that takes years of SEO/history to reach.
Ad RPMs for this content are low; the upside is the **subscription archive + API**, not banner ads.

---

> **Decided with user:** deliverable is *analysis + a detailed technical spec* (no build yet).
> Data source for the eventual MVP is a **third-party trends API** (e.g. Apify trends-by-location actor).
> The rest of this document is the hand-off spec a developer can build from.

---

## Technical specification (hand-off)

### Stack
- **Frontend/SSR**: Next.js (App Router) + TypeScript + Tailwind. ISR/static caching so pages are near-free to serve.
- **DB**: Postgres (Neon or Supabase free/cheap tier). Prisma ORM.
- **Ingest**: scheduled hourly job — Vercel Cron or a GitHub Action calling an authenticated route.
- **Hosting**: Vercel (frontend + cron) + managed Postgres. Cloudflare in front for CDN/caching (optional early).
- **Data source**: third-party trends API (Apify actor or similar). Wrap it behind one adapter so it can be
  swapped for the official X API later without touching the rest of the app.

### Data model (`prisma/schema.prisma`)
- `Location { id, slug ("united-states"), name, woeid? }`
- `Snapshot { id, locationId, capturedAt (UTC) }`  — one row per hourly pull per location
- `Trend { id, snapshotId, rank, name, url, tweetVolume? }`
- Indexes on `(locationId, capturedAt)` and `Trend.name`. **Never delete** — history is the product.

### Ingest pipeline (`lib/ingest.ts`)
1. Hourly cron hits a protected route with a secret.
2. Adapter (`lib/providers/trends.ts`) calls the third-party API per location, normalizes to
   `{ rank, name, url, tweetVolume, capturedAt }`.
3. Insert one `Snapshot` + its `Trend[]` in a transaction. Idempotent per `(locationId, capturedAt-hour)`.
4. Log success/failure; alert on missed runs.

### Pages & components
- `app/[location]/page.tsx` — main view; last 24h of snapshots (ISR, revalidate ~15 min).
- `Timeline` (column of hourly snapshots), `TagCloud`, `TrendTable`, `ThemeToggle` (light/dark/system).
- `lib/stats.ts` — derived stats from the 24h window: longest-trending, new trends, popular/active.

### Phased roadmap (matches the build tiers above)
1. **MVP** — US-only, ingest + 3 views + history retained. (the spec above)
2. **Monetize** — display ads; Stripe-gated **archive** (the real revenue lever); SEO (per-trend pages, sitemap).
3. **Differentiate** — LLM "why is this trending?" summaries (`lib/summarize.ts`, Claude), keyword alerts
   (email/push worker), public read API (`app/api/trends/route.ts`), embeddable widgets.
4. **Scale** — multi-location, redundancy, evaluate official X API once revenue justifies it.

### Cost & revenue summary (for the spec reader)
- **Build**: MVP ≈ $4k–$8k (or your own ~40–80 hrs); production ≈ $15k–$30k.
- **Run**: MVP $20–$100/mo (mostly the trends API + DB); production $150–$600/mo.
- **Revenue**: $0–$200/mo early; ~$1k–$5k/mo at real traffic; $5k–$10k/mo only at trends24-scale.
  trends24.in itself: est. ~$7.4k/mo (third-party estimate). Subscriptions + API > banner ads.

### Verification (when built)
- `npm run dev` → location page renders timeline/cloud/table from seeded data.
- Manually trigger ingest → new `Snapshot` + `Trend` rows appear; page updates after revalidation.
- 24h rollover: old snapshots drop from live view but remain in DB.
- Mobile Lighthouse pass; confirm ISR/CDN caching keeps serving cost near zero.

### Key risks
- **Data source reliability/legality** — biggest risk. Keep it behind one adapter; never hard-couple to scraping.
- **Low ad RPMs** — don't bank on ads; the archive + API are the monetizable assets.
- **SEO ramp is slow** — competing with trends24's domain authority takes time; per-trend pages + widgets help.

---

## Sources
- X API pricing 2026: https://postproxy.dev/blog/x-api-pricing-2026/
- trends24 scraper (GitHub): https://github.com/Mf4Tn/trends24Scraper
- Apify trends actor: https://apify.com/data-slayer/twitter-trends-by-location/api
- trends24.in traffic/revenue est. (Statshow): https://www.statshow.com/www/trends24.in
- trends24.in analytics (Similarweb): https://www.similarweb.com/website/trends24.in/
