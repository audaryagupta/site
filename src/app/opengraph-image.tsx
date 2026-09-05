import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const runtime = "nodejs";
export const alt = `${site.name} — ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#faf9f6",
          color: "#1a1a1a",
          padding: "80px",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 34, letterSpacing: 2 }}>
          BYAUDARYA
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.05 }}>
            The Personal Blog of
          </div>
          <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.05 }}>
            Audarya Gupta
          </div>
          <div style={{ marginTop: 28, fontSize: 34, color: "#555" }}>
            Essays on finance, business, technology & markets.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 28,
            color: "#555",
          }}
        >
          <span>www.byaudarya.com</span>
          <span>Essays · Dispatches · Curiosities</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
