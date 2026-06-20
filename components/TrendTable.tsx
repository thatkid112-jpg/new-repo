import Link from "next/link";
import type { SnapshotView } from "@/lib/queries";
import type { Movement } from "@/lib/stats";
import { MovementBadge } from "./MovementBadge";
import { trendHref } from "@/lib/links";

// Ranked table of the most recent snapshot. The old "Tweets" column (no data from the
// scrape) is replaced with rank-movement and how long the topic has been trending.
// Names link to the deep-link detail page.
export function TrendTable({
  locationSlug,
  snapshots,
  movement = {},
}: {
  locationSlug: string;
  snapshots: SnapshotView[];
  movement?: Record<string, Movement>;
}) {
  const latest = snapshots[0];
  if (!latest) return <p className="text-muted">No data yet.</p>;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left font-display text-xs uppercase tracking-wider text-muted">
            <th className="w-12 px-4 py-2 font-medium">#</th>
            <th className="px-4 py-2 font-medium">Trend</th>
            <th className="w-20 px-4 py-2 text-right font-medium">Move</th>
            <th className="w-24 px-4 py-2 text-right font-medium">Trending</th>
          </tr>
        </thead>
        <tbody>
          {latest.trends.map((t) => {
            const m = movement[t.name];
            return (
              <tr
                key={t.rank}
                className="border-b border-border/60 align-top transition-colors last:border-0 hover:bg-surface"
              >
                <td className="px-4 py-2.5 font-display tabular-nums text-muted">
                  {t.rank}
                </td>
                <td className="px-4 py-2.5">
                  <Link
                    href={trendHref(locationSlug, t.name)}
                    className="font-medium text-ink underline-offset-4 hover:text-accent hover:underline"
                  >
                    {t.name}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <MovementBadge movement={m} />
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-muted">
                  {m ? `${m.hoursTrending}h` : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
