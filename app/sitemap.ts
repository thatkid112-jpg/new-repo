import type { MetadataRoute } from "next";
import { getAllLocations, getLocationLast24h } from "@/lib/queries";
import { trendHref } from "@/lib/links";
import { siteUrl } from "@/lib/site";

export const revalidate = 900;

// Dynamic sitemap: home, each location page, and every current-snapshot trend URL.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "hourly", priority: 1 },
  ];

  const locations = await getAllLocations();
  for (const loc of locations) {
    entries.push({
      url: `${base}/${loc.slug}`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    });

    const view = await getLocationLast24h(loc.slug);
    const latest = view?.snapshots[0];
    if (!latest) continue;
    for (const t of latest.trends) {
      entries.push({
        url: `${base}${trendHref(loc.slug, t.name)}`,
        lastModified: latest.capturedAt,
        changeFrequency: "hourly",
        priority: 0.6,
      });
    }
  }

  return entries;
}
