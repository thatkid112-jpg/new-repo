import { ogImage, ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "TrendSite — US X (Twitter) trends";

export default function Image({ params }: { params: { location: string } }) {
  const name = params.location
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
  return ogImage("Trending now", name);
}
