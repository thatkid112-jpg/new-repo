import type { SnapshotView } from "@/lib/queries";

// Tag cloud: size each topic by how often it appeared across the 24h window
// (more persistent trends render larger), like trends24's cloud view.
export function TagCloud({ snapshots }: { snapshots: SnapshotView[] }) {
  const counts = new Map<string, { count: number; url: string }>();
  for (const snap of snapshots) {
    for (const t of snap.trends) {
      const entry = counts.get(t.name);
      if (entry) entry.count += 1;
      else counts.set(t.name, { count: 1, url: t.url });
    }
  }

  const items = [...counts.entries()].sort((a, b) => b[1].count - a[1].count);
  const max = items[0]?.[1].count ?? 1;
  const min = items[items.length - 1]?.[1].count ?? 1;

  // Map appearance count to a font size between 0.85rem and 2.2rem.
  function sizeRem(count: number): number {
    if (max === min) return 1.3;
    const ratio = (count - min) / (max - min);
    return 0.85 + ratio * 1.35;
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 rounded-lg border border-border bg-card p-8">
      {items.map(([name, { count, url }]) => (
        <a
          key={name}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          title={`Appeared in ${count} of the last ${snapshots.length} snapshots`}
          className="font-display font-medium leading-none text-ink transition-colors hover:text-accent"
          style={{ fontSize: `${sizeRem(count)}rem`, opacity: 0.5 + (sizeRem(count) - 0.85) / 2.7 }}
        >
          {name}
        </a>
      ))}
    </div>
  );
}
