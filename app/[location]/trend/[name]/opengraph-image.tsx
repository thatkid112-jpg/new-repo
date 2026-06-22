import { ogImage, ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "Why it's trending — TrendSite";

export default function Image({
  params,
}: {
  params: { location: string; name: string };
}) {
  return ogImage("Why it's trending", decodeURIComponent(params.name));
}
