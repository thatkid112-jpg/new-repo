import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };

// Flame-on-dark social card. No DB or custom fonts (so it stays fast and runtime-safe);
// text comes from route params. Used by the opengraph-image routes.
export function ogImage(kicker: string, title: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0E0E10",
          padding: "70px",
          color: "#F3F1EC",
        }}
      >
        <div
          style={{
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "#FF5A33",
          }}
        >
          {kicker}
        </div>
        <div style={{ fontSize: 88, fontWeight: 700, lineHeight: 1.05 }}>{title}</div>
        <div style={{ fontSize: 30, fontWeight: 700 }}>
          Trend<span style={{ color: "#FF5A33" }}>Site</span>
          <span style={{ color: "#9A968E", fontWeight: 400 }}>
            {"  ·  US X / Twitter trends"}
          </span>
        </div>
      </div>
    ),
    { ...ogSize }
  );
}
