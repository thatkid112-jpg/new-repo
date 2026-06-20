import { ingestAll } from "../lib/ingest";

// CLI entry point: `npm run ingest` — pulls current trends for all locations.
// In production this same logic runs via POST /api/ingest on an hourly cron.
ingestAll()
  .then((results) => {
    for (const r of results) {
      const status = r.created ? "created" : "already existed";
      console.log(
        `[${r.locationSlug}] ${r.capturedAt.toISOString()} — ${r.trendCount} trends (${status})`
      );
    }
  })
  .catch((e) => {
    console.error("Ingest failed:", e);
    process.exit(1);
  });
