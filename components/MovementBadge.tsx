import type { Movement } from "@/lib/stats";

// Compact rank-movement indicator: ▲n (up), ▼n (down), NEW, or — (no change / no data).
export function MovementBadge({ movement }: { movement?: Movement }) {
  if (!movement) return <span className="text-muted">—</span>;

  if (movement.isNew) {
    return (
      <span className="rounded-sm bg-accent-weak px-1.5 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider text-accent">
        New
      </span>
    );
  }

  const d = movement.delta;
  if (d == null || d === 0) {
    return <span className="tabular-nums text-muted">—</span>;
  }

  const up = d > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 tabular-nums font-medium ${
        up ? "text-accent" : "text-muted"
      }`}
      aria-label={up ? `up ${d} places` : `down ${Math.abs(d)} places`}
    >
      <span aria-hidden>{up ? "▲" : "▼"}</span>
      {Math.abs(d)}
    </span>
  );
}
