import type { TrendHistoryPoint } from "@/lib/queries";

// Inline-SVG rank-over-time chart. Rank axis is inverted so #1 sits at the top.
// Gaps (snapshots where the trend was absent) break the line. No chart library.
export function RankSparkline({ points }: { points: TrendHistoryPoint[] }) {
  const W = 640;
  const H = 180;
  const PAD = 16;

  const ranks = points.map((p) => p.rank).filter((r): r is number => r != null);
  if (ranks.length === 0) return null;

  const maxRank = Math.max(...ranks, 1); // worst (largest) rank → bottom
  const n = points.length;

  const x = (i: number) =>
    n <= 1 ? W / 2 : PAD + (i * (W - 2 * PAD)) / (n - 1);
  // rank 1 → top (PAD); rank maxRank → bottom (H - PAD)
  const y = (rank: number) =>
    maxRank <= 1
      ? H / 2
      : PAD + ((rank - 1) * (H - 2 * PAD)) / (maxRank - 1);

  // Build path segments, breaking on null ranks.
  let d = "";
  let pendingMove = true;
  points.forEach((p, i) => {
    if (p.rank == null) {
      pendingMove = true;
      return;
    }
    d += `${pendingMove ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.rank).toFixed(1)} `;
    pendingMove = false;
  });

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-44 w-full"
      role="img"
      aria-label="Rank over the last 24 hours (higher is better)"
    >
      <path
        d={d.trim()}
        fill="none"
        stroke="rgb(var(--accent))"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {points.map((p, i) =>
        p.rank == null ? null : (
          <circle
            key={i}
            cx={x(i)}
            cy={y(p.rank)}
            r={3}
            fill="rgb(var(--accent))"
          />
        )
      )}
    </svg>
  );
}
