"use client";

import { useState } from "react";
import { Timeline } from "./Timeline";
import { TagCloud } from "./TagCloud";
import { TrendTable } from "./TrendTable";
import type { SnapshotView } from "@/lib/queries";
import type { Movement } from "@/lib/stats";

type View = "table" | "timeline" | "cloud";

const TABS: { id: View; label: string }[] = [
  { id: "timeline", label: "Timeline" },
  { id: "cloud", label: "Tag Cloud" },
  { id: "table", label: "Table" },
];

// Client-side switch between the three presentations of the same 24h data.
export function ViewTabs({
  locationSlug,
  snapshots,
  movement,
}: {
  locationSlug: string;
  snapshots: SnapshotView[];
  movement: Record<string, Movement>;
}) {
  const [view, setView] = useState<View>("timeline");

  return (
    <div>
      <div className="mb-4 flex gap-6 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`-mb-px border-b-2 pb-2 font-display text-sm font-medium transition-colors ${
              view === tab.id
                ? "border-accent text-ink"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {view === "table" && (
        <TrendTable
          locationSlug={locationSlug}
          snapshots={snapshots}
          movement={movement}
        />
      )}
      {view === "timeline" && <Timeline snapshots={snapshots} />}
      {view === "cloud" && <TagCloud snapshots={snapshots} />}
    </div>
  );
}
