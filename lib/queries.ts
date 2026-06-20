import { prisma } from "./db";

export type TrendRow = {
  rank: number;
  name: string;
  url: string;
  tweetVolume: number | null;
};

export type SnapshotView = {
  capturedAt: Date;
  trends: TrendRow[];
};

export type LocationView = {
  slug: string;
  name: string;
  snapshots: SnapshotView[]; // newest first
};

const DAY_MS = 24 * 60 * 60 * 1000;

// Read the last 24h of snapshots for a location, newest first.
export async function getLocationLast24h(slug: string): Promise<LocationView | null> {
  const location = await prisma.location.findUnique({ where: { slug } });
  if (!location) return null;

  const since = new Date(Date.now() - DAY_MS);
  const snapshots = await prisma.snapshot.findMany({
    where: { locationId: location.id, capturedAt: { gte: since } },
    orderBy: { capturedAt: "desc" },
    include: { trends: { orderBy: { rank: "asc" } } },
  });

  return {
    slug: location.slug,
    name: location.name,
    snapshots: snapshots.map((s) => ({
      capturedAt: s.capturedAt,
      trends: s.trends.map((t) => ({
        rank: t.rank,
        name: t.name,
        url: t.url,
        tweetVolume: t.tweetVolume,
      })),
    })),
  };
}

export async function getAllLocations() {
  return prisma.location.findMany({ orderBy: { name: "asc" } });
}

export type TrendHistoryPoint = {
  capturedAt: Date;
  rank: number | null; // null = not present in that snapshot
};

export type TrendHistory = {
  name: string;
  url: string;
  points: TrendHistoryPoint[]; // oldest -> newest (chart-friendly order)
  currentRank: number | null;
  hoursTrending: number;
};

// Build a 24h rank-over-time history for a single trend name within a location.
// Reuses getLocationLast24h so there's a single source of truth for the window.
export async function getTrendHistory(
  slug: string,
  name: string
): Promise<TrendHistory | null> {
  const view = await getLocationLast24h(slug);
  if (!view) return null;

  // snapshots are newest-first; reverse for a left-to-right time axis.
  const chrono = [...view.snapshots].reverse();
  let url = "";
  let hoursTrending = 0;

  const points: TrendHistoryPoint[] = chrono.map((snap) => {
    const hit = snap.trends.find((t) => t.name === name);
    if (hit) {
      hoursTrending++;
      if (!url) url = hit.url;
    }
    return { capturedAt: snap.capturedAt, rank: hit ? hit.rank : null };
  });

  if (hoursTrending === 0) return null; // unknown trend in this window

  const currentRank = points[points.length - 1]?.rank ?? null;
  return { name, url, points, currentRank, hoursTrending };
}
