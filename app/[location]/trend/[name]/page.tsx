import Link from "next/link";
import { notFound } from "next/navigation";
import { getTrendHistory } from "@/lib/queries";
import { RankSparkline } from "@/components/RankSparkline";

export const revalidate = 900;

function formatTime(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export default async function TrendDetailPage({
  params,
}: {
  params: { location: string; name: string };
}) {
  const name = decodeURIComponent(params.name);
  const history = await getTrendHistory(params.location, name);
  if (!history) notFound();

  // Newest-first list of the snapshots where it appeared, with rank.
  const appearances = [...history.points]
    .filter((p) => p.rank != null)
    .reverse();

  return (
    <div className="fade-in space-y-8">
      <div>
        <Link
          href={`/${params.location}`}
          className="text-sm text-muted hover:text-accent"
        >
          ← All trends
        </Link>
        <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
          {history.name}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
          {history.currentRank != null && (
            <span>
              Currently{" "}
              <span className="font-medium text-accent">#{history.currentRank}</span>
            </span>
          )}
          <span>trending {history.hoursTrending}h in the last 24h</span>
          <a
            href={history.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent hover:underline"
          >
            View on X ↗
          </a>
        </div>
      </div>

      <section>
        <h2 className="mb-2 font-display text-xs font-bold uppercase tracking-[0.2em] text-muted">
          Rank over 24 hours
        </h2>
        <div className="rounded-lg border border-border bg-card p-4">
          <RankSparkline points={history.points} />
          <p className="mt-2 text-center text-xs text-muted">
            Higher line = better rank (#1 at top). Gaps = not trending.
          </p>
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-display text-xs font-bold uppercase tracking-[0.2em] text-muted">
          Appearances
        </h2>
        <ol className="divide-y divide-border border-y border-border text-sm">
          {appearances.map((p) => (
            <li
              key={p.capturedAt.toISOString()}
              className="flex items-center justify-between py-2"
            >
              <span className="text-muted">{formatTime(p.capturedAt)}</span>
              <span className="font-medium tabular-nums">#{p.rank}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
