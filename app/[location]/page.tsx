import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocationLast24h } from "@/lib/queries";
import { computeStats, computeMovement, computeTrendDetails } from "@/lib/stats";
import { getExplanations } from "@/lib/explain";
import { ViewTabs } from "@/components/ViewTabs";
import { StatsPanel } from "@/components/StatsPanel";
import { TrendList } from "@/components/TrendList";
import { trendHref } from "@/lib/links";
import { siteUrl } from "@/lib/site";

// Re-render at most every 15 minutes; ingest writes new snapshots hourly.
export const revalidate = 900;

export async function generateMetadata({
  params,
}: {
  params: { location: string };
}): Promise<Metadata> {
  const view = await getLocationLast24h(params.location);
  if (!view) return {};
  const top = (view.snapshots[0]?.trends ?? []).slice(0, 5).map((t) => t.name);
  const title = `${view.name} — X (Twitter) Trends, last 24 hours`;
  const description = top.length
    ? `Trending now on X in the ${view.name}: ${top.join(", ")}. Live ranked list, rank movement, and AI explanations of why each topic is trending.`
    : `Live X (Twitter) trends for the ${view.name} over the past 24 hours.`;
  const canonical = `/${view.slug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical },
    twitter: { title, description },
  };
}

function updatedAgo(d: Date): string {
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins <= 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  return hrs === 1 ? "1h ago" : `${hrs}h ago`;
}

export default async function LocationPage({
  params,
}: {
  params: { location: string };
}) {
  const view = await getLocationLast24h(params.location);
  if (!view) notFound();

  const stats = computeStats(view);
  const movement = computeMovement(view);
  const latest = view.snapshots[0];

  // Cached "why is this trending?" blurbs for the most recent snapshot (read-only here).
  const explanations = latest
    ? await getExplanations(view.slug, latest.trends.map((t) => t.name))
    : {};

  if (!latest) {
    return (
      <p className="rounded-lg border border-border bg-card p-6 text-muted">
        No snapshots yet. Run <code>npm run seed</code> or trigger{" "}
        <code>POST /api/ingest</code>.
      </p>
    );
  }

  // Per-trend detail for the hero list's click-through modal (computed from `view`).
  const details = computeTrendDetails(
    view,
    latest.trends.map((t) => t.name)
  );

  // JSON-LD ItemList of the current trends for rich search results.
  const base = siteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${view.name} X (Twitter) trends`,
    itemListElement: latest.trends.slice(0, 25).map((t) => ({
      "@type": "ListItem",
      position: t.rank,
      name: t.name,
      url: `${base}${trendHref(view.slug, t.name)}`,
    })),
  };

  return (
    <div className="fade-in space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Editorial masthead for the page */}
      <header>
        <p className="font-display text-xs font-bold uppercase tracking-[0.25em] text-accent">
          Trending now
        </p>
        <h1 className="mt-1 font-display text-4xl font-bold leading-none tracking-tight text-ink sm:text-5xl">
          {view.name}
        </h1>
        <p className="mt-3 text-sm text-muted">
          What X is talking about · updated {updatedAgo(latest.capturedAt)} ·{" "}
          {view.snapshots.length} snapshot{view.snapshots.length === 1 ? "" : "s"} in 24h
        </p>
      </header>

      {/* Hero: big ranked list of the current trends (click → modal) */}
      <TrendList
        trends={latest.trends}
        movement={movement}
        details={details}
        explanations={explanations}
        limit={10}
      />

      {/* Secondary: summary stats + deeper views */}
      <StatsPanel stats={stats} />

      <section>
        <h2 className="mb-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-muted">
          Explore the last 24 hours
        </h2>
        <ViewTabs
          locationSlug={view.slug}
          snapshots={view.snapshots}
          movement={movement}
        />
      </section>
    </div>
  );
}
