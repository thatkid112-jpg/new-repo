"use client";

import { useState } from "react";
import type { TrendRow } from "@/lib/queries";
import type { Movement, TrendDetail } from "@/lib/stats";
import { MovementBadge } from "./MovementBadge";
import { TrendModal } from "./TrendModal";

// The editorial hero: a bold, large-type ranked list of the current top trends.
// Clicking a row opens an in-page modal (no navigation). The AI "why" blurb shows
// inline under each trend.
export function TrendList({
  trends,
  movement,
  details,
  explanations,
  limit = 25,
}: {
  trends: TrendRow[];
  movement: Record<string, Movement>;
  details: Record<string, TrendDetail>;
  explanations: Record<string, string>;
  limit?: number;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const rows = trends.slice(0, limit);

  return (
    <>
      <ol className="divide-y divide-border border-y border-border">
        {rows.map((t) => {
          const m = movement[t.name];
          const blurb = explanations[t.name];
          return (
            <li
              key={t.rank}
              className="group flex items-center gap-4 py-3 transition-colors hover:bg-card"
            >
              <span className="w-10 shrink-0 text-right font-display text-2xl font-bold tabular-nums text-muted group-hover:text-accent sm:w-14 sm:text-3xl">
                {t.rank}
              </span>
              <div className="min-w-0 flex-1">
                <button
                  onClick={() => setSelected(t.name)}
                  className="text-left font-display text-lg font-medium leading-tight text-ink underline-offset-4 hover:text-accent hover:underline sm:text-xl"
                >
                  {t.name}
                </button>
                {blurb && <p className="mt-0.5 text-xs text-muted">{blurb}</p>}
                {!blurb && m && m.hoursTrending > 1 && (
                  <p className="mt-0.5 text-xs text-muted">trending {m.hoursTrending}h</p>
                )}
              </div>
              <div className="shrink-0 text-sm">
                <MovementBadge movement={m} />
              </div>
            </li>
          );
        })}
      </ol>

      {selected && details[selected] && (
        <TrendModal
          detail={details[selected]}
          movement={movement[selected]}
          blurb={explanations[selected]}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
