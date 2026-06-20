# TrendSite

An MVP clone of [trends24.in](https://trends24.in/united-states/) — tracks X (Twitter) trending
topics for the United States over the past 24 hours, shown as a **timeline**, **tag cloud**, and
**ranked table**, plus summary stats (longest trending / new / most active).

It runs **end-to-end with zero paid accounts** using a built-in mock data provider. When you're ready,
plug in a real third-party trends API by changing one env var — no code changes needed.

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind
- **Prisma** + **Postgres (Neon)** — same DB for local dev and production
- Swappable **data-source adapter** (`lib/providers/`): `mock` (default) or `apify`

## Run it locally

```bash
npm install
cp .env.example .env            # already provided; defaults to the mock provider
npx prisma migrate dev --name init
npm run seed                    # seeds US + 24h of mock hourly snapshots
npm run dev
```

Open http://localhost:3000 → it redirects to `/united-states`.

## How the data flows

```
provider (mock | apify)  ->  lib/ingest.ts  ->  Snapshot + Trend rows (Prisma)  ->  pages read last 24h
```

- **`npm run seed`** — backfills 24 hourly snapshots so the UI is full immediately.
- **`npm run ingest`** — pulls the *current* hour's trends once (same logic the cron runs).
- **`POST /api/ingest`** — the production entry point; protected by `INGEST_SECRET`.

Trigger an ingest manually:

```bash
curl -X POST "http://localhost:3000/api/ingest?secret=dev-secret"
```

Snapshots are **never deleted** — the live view shows the last 24h, but all history stays in the DB
(that history is the asset you'd eventually monetize as an archive).

## Plug in a real trends API (later)

1. Sign up for a third-party "Twitter/X trends by location" API (e.g. an Apify actor).
2. In `.env` set:
   ```
   TRENDS_PROVIDER=apify
   APIFY_TOKEN=your-token
   APIFY_TRENDS_ACTOR=actor-id
   ```
3. Adjust the response mapping in [`lib/providers/apify.ts`](lib/providers/apify.ts) to match your
   chosen actor's output shape. That file is the **only** place that knows the provider's format.

To add the **official X API** instead, write a new `lib/providers/x.ts` implementing the same
`TrendProvider` interface and register it in `lib/providers/index.ts`.

## Deploy (production) — Neon Postgres + GitHub + Vercel

The app uses **Postgres (Neon)** for both local dev and production. Hourly ingest in production runs via a
**GitHub Actions** workflow ([.github/workflows/ingest.yml](.github/workflows/ingest.yml)) because Vercel's
Hobby plan limits cron to once/day; `vercel.json`'s cron is the Pro-tier alternative.

1. **Neon**: create a project. Copy the **pooled** connection string → `DATABASE_URL` and the **direct**
   one → `DIRECT_URL` (both include `?sslmode=require`). Put both in local `.env`.
2. **Migrate + seed locally** (writes to Neon):
   ```bash
   npx prisma migrate dev --name init
   npm run ingest
   ```
3. **Push to GitHub**: `git init`, commit, create a repo, push. (`.env` is gitignored.)
4. **Vercel**: import the repo and set Environment Variables:
   `DATABASE_URL`, `DIRECT_URL`, `TRENDS_PROVIDER=apify`, `APIFY_TOKEN`, `APIFY_TASK_ID`,
   `INGEST_SECRET`, `CRON_SECRET` (= `INGEST_SECRET`), `EXPLAIN_PROVIDER=openrouter`,
   `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENROUTER_WEB_SEARCH`. Deploy.
   The build runs `prisma migrate deploy` automatically (see `package.json`).
5. **Hourly ingest**: in the GitHub repo → Settings → Secrets and variables → Actions, add
   `INGEST_URL` = `https://<your-app>.vercel.app/api/ingest` and `INGEST_SECRET`. The workflow then
   POSTs to it every hour (run it once via "Run workflow" to confirm).
6. Disable the local Windows task once the cloud schedule is live:
   `schtasks /change /tn "TrendSite Hourly Ingest" /disable`.

## "Why is this trending?" (web-grounded LLM feature)

Each topic in the **Table** view can show a one-sentence, **web-grounded** explanation of why it's
trending right now. This is **off by default** and fully optional — the app runs normally without it.

To enable:

1. Get an API key at https://console.anthropic.com and set it in `.env`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   EXPLAIN_MODEL=claude-haiku-4-5     # fast + cheap (default)
   ```
2. Generate blurbs for the current top trends:
   ```bash
   npm run explain
   ```
   They're also generated automatically after each `/api/ingest` run.

How it works (see [`lib/explain.ts`](lib/explain.ts)):
- Uses the official Anthropic TypeScript SDK (`@anthropic-ai/sdk`) with **Claude Haiku 4.5**.
- **Web-grounded:** each blurb is produced with the `web_search` server tool, so the reason
  reflects current events rather than the model's prior. `max_uses` caps searches per topic.
- Blurbs are **cached per topic** in the `Explanation` table, so you pay once per distinct
  trend (one model call + at most a couple of searches), not once per snapshot. Repeat runs
  cost nothing.
- The page only *reads* cached blurbs, so rendering stays fast and cheap.

**Cost note:** the `web_search` server tool is billed per search in addition to model tokens.
Caching keeps this bounded to genuinely new trends each hour; lower `max_uses` or the trend
`limit` in `explainLatest()` if you want to spend less.

## What's intentionally NOT in this MVP

Archive paywall (Stripe), display ads, multi-location, public API, and keyword alerts —
these are the remaining phase-2/3 items in `PLAN.md`. (The LLM "why is this trending?" feature,
previously a phase-3 item, is now built — see above.)
