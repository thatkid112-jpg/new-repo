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

// Shape returned by the snapshot+trends `include` below; shared by all readers.
type SnapshotWithTrends = {
  capturedAt: Date;
  trends: { rank: number; name: string; url: string; tweetVolume: number | null }[];
};

function toSnapshotViews(snapshots: SnapshotWithTrends[]): SnapshotView[] {
  return snapshots.map((s) => ({
    capturedAt: s.capturedAt,
    trends: s.trends.map((t) => ({
      rank: t.rank,
      name: t.name,
      url: t.url,
      tweetVolume: t.tweetVolume,
    })),
  }));
}

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
    snapshots: toSnapshotViews(snapshots),
  };
}

export type ArchiveDay = {
  date: string; // "YYYY-MM-DD" (UTC)
  snapshotCount: number;
};

export type ArchiveIndex = {
  slug: string;
  name: string;
  days: ArchiveDay[]; // newest day first
};

// Paywalled archive index: every UTC day that has snapshots, with per-day counts.
// Grouping happens in JS over a lightweight capturedAt-only query — fine at current
// volume, and backed by the @@index([locationId, capturedAt]).
export async function getArchiveDays(slug: string): Promise<ArchiveIndex | null> {
  const location = await prisma.location.findUnique({ where: { slug } });
  if (!location) return null;

  const snaps = await prisma.snapshot.findMany({
    where: { locationId: location.id },
    select: { capturedAt: true },
    orderBy: { capturedAt: "desc" },
  });

  const counts = new Map<string, number>();
  for (const s of snaps) {
    const day = s.capturedAt.toISOString().slice(0, 10);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  const days: ArchiveDay[] = [...counts.entries()]
    .map(([date, snapshotCount]) => ({ date, snapshotCount }))
    .sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first

  return { slug: location.slug, name: location.name, days };
}

// Paywalled archive day view: all snapshots within a single UTC calendar day,
// newest first. Same shape as getLocationLast24h so the existing render
// components (Timeline / TrendTable / StatsPanel) work unchanged.
export async function getSnapshotsForDay(
  slug: string,
  dateISO: string
): Promise<LocationView | null> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) return null;
  const start = new Date(`${dateISO}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + DAY_MS);

  const location = await prisma.location.findUnique({ where: { slug } });
  if (!location) return null;

  const snapshots = await prisma.snapshot.findMany({
    where: { locationId: location.id, capturedAt: { gte: start, lt: end } },
    orderBy: { capturedAt: "desc" },
    include: { trends: { orderBy: { rank: "asc" } } },
  });

  return {
    slug: location.slug,
    name: location.name,
    snapshots: toSnapshotViews(snapshots),
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
