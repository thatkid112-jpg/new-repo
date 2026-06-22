import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { siteUrl } from "@/lib/site";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
});
const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const DESCRIPTION =
  "Track X (Twitter) trending topics and hashtags in the United States over the past 24 hours — live ranked list, timeline, tag cloud, and AI explanations of why each topic is trending.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "TrendSite — US X (Twitter) Trends, last 24 hours",
    template: "%s · TrendSite",
  },
  description: DESCRIPTION,
  applicationName: "TrendSite",
  openGraph: {
    type: "website",
    siteName: "TrendSite",
    title: "TrendSite — US X (Twitter) Trends, last 24 hours",
    description: DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "TrendSite — US X (Twitter) Trends, last 24 hours",
    description: DESCRIPTION,
  },
};

// Inline script set before paint to avoid a flash of the wrong theme.
const themeInit = `
(function() {
  try {
    var t = localStorage.getItem('theme');
    var dark = t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-screen antialiased">
        <header className="border-b-2 border-ink/90 bg-surface">
          <div className="mx-auto flex max-w-5xl items-end justify-between px-4 pb-2 pt-4">
            <Link href="/" className="group flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold uppercase tracking-tight text-ink">
                Trend<span className="text-accent">Site</span>
              </span>
              <span className="hidden font-display text-xs font-medium uppercase tracking-[0.2em] text-muted sm:inline">
                X / Twitter trends
              </span>
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                href="/archive"
                className="font-display text-xs font-medium uppercase tracking-[0.15em] text-muted transition-colors hover:text-ink"
              >
                Archive
              </Link>
              <Link
                href="/account"
                className="font-display text-xs font-medium uppercase tracking-[0.15em] text-muted transition-colors hover:text-ink"
              >
                Account
              </Link>
              <ThemeToggle />
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-5xl border-t border-border px-4 py-8 text-sm text-muted">
          Unofficial. Trend data is scraped from public sources; “why” blurbs are AI-generated.
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
