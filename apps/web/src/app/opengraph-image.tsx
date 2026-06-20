import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "InteliCont — Contabilidad inteligente para Paraguay";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #0a2244 0%, #1e3a8a 55%, #0a2244 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 156,
            fontWeight: 800,
            letterSpacing: -6,
            lineHeight: 1,
          }}
        >
          <span style={{ color: "#60a5fa" }}>Inteli</span>
          <span style={{ color: "#34d399" }}>Cont</span>
        </div>

        <div
          style={{
            fontSize: 36,
            color: "#e2e8f0",
            marginTop: 28,
            textAlign: "center",
            maxWidth: 820,
            lineHeight: 1.2,
          }}
        >
          Contabilidad inteligente para Paraguay
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
            marginTop: 56,
            fontSize: 24,
            color: "#94a3b8",
            letterSpacing: 6,
            fontWeight: 600,
          }}
        >
          <span>SIFEN</span>
          <span style={{ color: "#475569" }}>•</span>
          <span>DNIT</span>
          <span style={{ color: "#475569" }}>•</span>
          <span>IA</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
