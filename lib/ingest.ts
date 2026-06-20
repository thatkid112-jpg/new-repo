import { prisma } from "./db";
import { getProvider } from "./providers";
import { explainLatest, explanationsEnabled } from "./explain";

// Snap a timestamp to the top of its hour so repeated runs within the same hour
// are idempotent (the [locationId, capturedAt] unique constraint dedupes them).
function topOfHour(d = new Date()): Date {
  const t = new Date(d);
  t.setMinutes(0, 0, 0);
  return t;
}

export type IngestResult = {
  locationSlug: string;
  capturedAt: Date;
  trendCount: number;
  created: boolean; // false if a snapshot for this hour already existed
};

// Pull the current trends for one location and persist them as a Snapshot + Trend rows.
export async function ingestLocation(locationSlug: string): Promise<IngestResult> {
  const location = await prisma.location.findUnique({ where: { slug: locationSlug } });
  if (!location) throw new Error(`Unknown location slug: ${locationSlug}`);

  const capturedAt = topOfHour();

  const existing = await prisma.snapshot.findUnique({
    where: { locationId_capturedAt: { locationId: location.id, capturedAt } },
    include: { _count: { select: { trends: true } } },
  });
  if (existing) {
    return { locationSlug, capturedAt, trendCount: existing._count.trends, created: false };
  }

  const provider = getProvider();
  const trends = await provider.fetchTrends(locationSlug);

  await prisma.snapshot.create({
    data: {
      locationId: location.id,
      capturedAt,
      trends: {
        create: trends.map((t) => ({
          rank: t.rank,
          name: t.name,
          url: t.url,
          tweetVolume: t.tweetVolume ?? null,
        })),
      },
    },
  });

  // Best-effort: generate "why is this trending?" blurbs for the new top trends.
  // Only runs if ANTHROPIC_API_KEY is set; cached topics are skipped, so cost is
  // bounded to genuinely new trends each hour. Never blocks/breaks the ingest.
  if (explanationsEnabled()) {
    await explainLatest(locationSlug).catch((e) =>
      console.error(`explainLatest failed for ${locationSlug}:`, e)
    );
  }

  return { locationSlug, capturedAt, trendCount: trends.length, created: true };
}

// Ingest every known location (the cron entry point).
export async function ingestAll(): Promise<IngestResult[]> {
  const locations = await prisma.location.findMany();
  const results: IngestResult[] = [];
  for (const loc of locations) {
    results.push(await ingestLocation(loc.slug));
  }
  return results;
}
