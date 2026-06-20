import { LocationView, TrendHistoryPoint } from "./queries";

export type RankedName = { name: string; value: number; url: string };

export type TrendStats = {
  // Topics present in the most snapshots over the window.
  longestTrending: RankedName[]; // value = snapshot count
  // Topics in the newest snapshot that were absent from the prior one.
  newTrends: RankedName[]; // value = current rank
  // Highest tweet volume in the newest snapshot.
  mostActive: RankedName[]; // value = tweet volume
};

// Compute the trends24-style summary stats from a 24h location view.
export function computeStats(view: LocationView, limit = 10): TrendStats {
  const snapshots = view.snapshots; // newest first
  const urlByName = new Map<string, string>();

  // Longest trending: count snapshot appearances per topic.
  const appearances = new Map<string, number>();
  for (const snap of snapshots) {
    for (const t of snap.trends) {
      appearances.set(t.name, (appearances.get(t.name) ?? 0) + 1);
      if (!urlByName.has(t.name)) urlByName.set(t.name, t.url);
    }
  }
  const longestTrending = [...appearances.entries()]
    .map(([name, value]) => ({ name, value, url: urlByName.get(name)! }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);

  // New trends: in newest snapshot but not in the one before it.
  const newest = snapshots[0]?.trends ?? [];
  const previousNames = new Set((snapshots[1]?.trends ?? []).map((t) => t.name));
  const newTrends = newest
    .filter((t) => !previousNames.has(t.name))
    .map((t) => ({ name: t.name, value: t.rank, url: t.url }))
    .slice(0, limit);

  // Most active: newest snapshot ranked by tweet volume.
  const mostActive = newest
    .filter((t) => t.tweetVolume != null)
    .map((t) => ({ name: t.name, value: t.tweetVolume as number, url: t.url }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);

  return { longestTrending, newTrends, mostActive };
}

export type Movement = {
  delta: number | null; // ranks gained vs previous snapshot (+ = moved up); null if no prior data
  isNew: boolean; // present now, absent in the previous snapshot
  hoursTrending: number; // number of snapshots (≈ hours) this topic has appeared in
};

// Per-trend movement for the current (newest) snapshot, keyed by trend name.
// Degrades gracefully: with only one snapshot, delta is null and isNew is false.
export function computeMovement(view: LocationView): Record<string, Movement> {
  const snapshots = view.snapshots; // newest first
  const current = snapshots[0]?.trends ?? [];
  const prev = snapshots[1]?.trends ?? [];
  const hasPrev = snapshots.length > 1;

  const prevRank = new Map(prev.map((t) => [t.name, t.rank]));

  // Appearance count across the whole window = how long it's been trending.
  const appearances = new Map<string, number>();
  for (const snap of snapshots) {
    for (const t of snap.trends) {
      appearances.set(t.name, (appearances.get(t.name) ?? 0) + 1);
    }
  }

  const out: Record<string, Movement> = {};
  for (const t of current) {
    const before = prevRank.get(t.name);
    out[t.name] = {
      delta: !hasPrev ? null : before == null ? null : before - t.rank,
      isNew: hasPrev && before == null,
      hoursTrending: appearances.get(t.name) ?? 1,
    };
  }
  return out;
}

export type TrendDetail = {
  name: string;
  url: string;
  currentRank: number | null;
  bestRank: number | null; // best (lowest) rank reached in the 24h window
  hoursTrending: number; // snapshots it appeared in
  firstSeenAt: string | null; // ISO timestamp of earliest appearance
  firstRank: number | null; // rank at that first appearance
  points: TrendHistoryPoint[]; // oldest -> newest, for the sparkline
};

// Build per-trend detail for a set of names directly from the already-loaded 24h
// view — no extra DB queries. Used to populate the click-through modal for the hero list.
export function computeTrendDetails(
  view: LocationView,
  names: string[]
): Record<string, TrendDetail> {
  const chrono = [...view.snapshots].reverse(); // oldest -> newest
  const wanted = new Set(names);
  const out: Record<string, TrendDetail> = {};

  for (const name of wanted) {
    let url = "";
    let bestRank: number | null = null;
    let firstSeenAt: string | null = null;
    let firstRank: number | null = null;
    let hoursTrending = 0;

    const points: TrendHistoryPoint[] = chrono.map((snap) => {
      const hit = snap.trends.find((t) => t.name === name);
      if (hit) {
        hoursTrending++;
        if (!url) url = hit.url;
        if (bestRank == null || hit.rank < bestRank) bestRank = hit.rank;
        if (firstSeenAt == null) {
          firstSeenAt = snap.capturedAt.toISOString();
          firstRank = hit.rank;
        }
      }
      return { capturedAt: snap.capturedAt, rank: hit ? hit.rank : null };
    });

    const currentRank = points[points.length - 1]?.rank ?? null;
    out[name] = {
      name,
      url,
      currentRank,
      bestRank,
      hoursTrending,
      firstSeenAt,
      firstRank,
      points,
    };
  }
  return out;
}
