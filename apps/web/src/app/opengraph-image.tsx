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
            "linear-gradient(135deg, #051125 0%, #0a2244 50%, #104c91 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Big infinity logo — readable even at WhatsApp thumbnail size */}
        <svg
          width="360"
          height="180"
          viewBox="0 0 400 200"
          style={{ marginBottom: 20 }}
        >
          <path
            d="M 60 100 a 60 60 0 1 0 120 0 a 60 60 0 1 0 -120 0 Z M 90 100 a 30 30 0 1 1 60 0 a 30 30 0 1 1 -60 0 Z"
            fill="#3b82f6"
            fillRule="evenodd"
          />
          <path
            d="M 220 100 a 60 60 0 1 0 120 0 a 60 60 0 1 0 -120 0 Z M 250 100 a 30 30 0 1 1 60 0 a 30 30 0 1 1 -60 0 Z"
            fill="#10b981"
            fillRule="evenodd"
          />
          <circle cx="200" cy="100" r="14" fill="#ffffff" />
        </svg>

        {/* Massive wordmark */}
        <div
          style={{
            display: "flex",
            fontSize: 170,
            fontWeight: 800,
            letterSpacing: -7,
            lineHeight: 1,
          }}
        >
          <span style={{ color: "#60a5fa" }}>Inteli</span>
          <span style={{ color: "#34d399" }}>Cont</span>
        </div>

        {/* Big readable tagline */}
        <div
          style={{
            fontSize: 48,
            color: "#e2e8f0",
            marginTop: 28,
            textAlign: "center",
            fontWeight: 500,
          }}
        >
          SaaS contable con IA para Paraguay
        </div>
      </div>
    ),
    { ...size },
  );
}
