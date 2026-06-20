import type { SnapshotView } from "@/lib/queries";

// Show how long ago a snapshot was captured, rounded to the nearest hour:
// "Just now", "1 hour ago", "2 hours ago", ...
function formatRelative(d: Date): string {
  const hours = Math.round((Date.now() - d.getTime()) / (60 * 60 * 1000));
  if (hours <= 0) return "Just now";
  if (hours === 1) return "1 hour ago";
  return `${hours} hours ago`;
}

// trends24-style timeline: one column card per hourly snapshot, newest first,
// each listing its ranked trends.
export function Timeline({ snapshots }: { snapshots: SnapshotView[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {snapshots.map((snap) => (
        <div
          key={snap.capturedAt.toISOString()}
          className="rounded-lg border border-border bg-card p-4"
        >
          <div className="mb-3 font-display text-xs font-bold uppercase tracking-[0.15em] text-accent">
            {formatRelative(snap.capturedAt)}
          </div>
          <ol className="space-y-1.5 text-sm">
            {snap.trends.slice(0, 10).map((t) => (
              <li key={t.rank} className="flex gap-2">
                <span className="w-5 shrink-0 text-right font-display tabular-nums text-muted">
                  {t.rank}
                </span>
                <a
                  href={t.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate hover:text-accent hover:underline"
                >
                  {t.name}
                </a>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
