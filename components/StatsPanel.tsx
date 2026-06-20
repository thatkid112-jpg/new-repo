import type { TrendStats, RankedName } from "@/lib/stats";

function StatList({
  title,
  items,
  format,
}: {
  title: string;
  items: RankedName[];
  format: (v: number) => string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-3 font-display text-xs font-bold uppercase tracking-[0.15em] text-muted">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted">None</p>
      ) : (
        <ol className="space-y-2 text-sm">
          {items.map((it, i) => (
            <li key={it.name} className="flex items-center gap-2">
              <span className="w-4 shrink-0 font-display tabular-nums text-muted">
                {i + 1}
              </span>
              <a
                href={it.url}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate font-medium hover:text-accent hover:underline"
              >
                {it.name}
              </a>
              <span className="ml-auto shrink-0 tabular-nums text-muted">
                {format(it.value)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// Summary stats. "Most active" is omitted — this data source has no tweet volume.
export function StatsPanel({ stats }: { stats: TrendStats }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <StatList
        title="Longest trending"
        items={stats.longestTrending}
        format={(v) => `${v}h`}
      />
      <StatList title="New trends" items={stats.newTrends} format={(v) => `#${v}`} />
    </div>
  );
}
