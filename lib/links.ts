// Pure URL helpers — safe to import from both server and client components
// (no DB/SDK imports here).

// Build the deep-link detail-page href for a trend (names contain '#', spaces, etc.).
export function trendHref(locationSlug: string, name: string): string {
  return `/${locationSlug}/trend/${encodeURIComponent(name)}`;
}
