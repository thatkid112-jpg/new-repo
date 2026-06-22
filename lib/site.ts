// Absolute base URL for metadata, canonicals, sitemap, and OG tags.
// Resolution order:
//   1. NEXT_PUBLIC_SITE_URL — explicit override (set this to a custom domain).
//   2. VERCEL_PROJECT_PRODUCTION_URL — Vercel's stable production domain (auto-set;
//      tracks a custom domain once you assign one as the production domain).
//   3. localhost for local dev.
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;

  return "http://localhost:3000";
}
