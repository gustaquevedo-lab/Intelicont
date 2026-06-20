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
            "linear-gradient(135deg, #051125 0%, #0a2244 45%, #104c91 100%)",
          fontFamily: "sans-serif",
          padding: 48,
        }}
      >
        {/* Logo + Wordmark row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginBottom: 14,
          }}
        >
          <svg width="118" height="62" viewBox="0 0 200 100">
            <path
              d="M 32 50 a 28 28 0 1 0 56 0 a 28 28 0 1 0 -56 0 Z M 48 50 a 12 12 0 1 1 24 0 a 12 12 0 1 1 -24 0 Z"
              fill="#3b82f6"
              fillRule="evenodd"
            />
            <path
              d="M 112 50 a 28 28 0 1 0 56 0 a 28 28 0 1 0 -56 0 Z M 128 50 a 12 12 0 1 1 24 0 a 12 12 0 1 1 -24 0 Z"
              fill="#10b981"
              fillRule="evenodd"
            />
            <circle cx="100" cy="50" r="6" fill="#ffffff" />
          </svg>
          <div
            style={{
              display: "flex",
              fontSize: 96,
              fontWeight: 800,
              letterSpacing: -3,
              lineHeight: 1,
            }}
          >
            <span style={{ color: "#60a5fa" }}>Inteli</span>
            <span style={{ color: "#34d399" }}>Cont</span>
          </div>
        </div>

        <div
          style={{
            fontSize: 26,
            color: "#cbd5e1",
            marginBottom: 28,
            textAlign: "center",
          }}
        >
          Contabilidad inteligente para Paraguay
        </div>

        {/* Mock asiento card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(148,163,184,0.25)",
            borderRadius: 18,
            padding: "22px 28px",
            width: 760,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 18,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  display: "flex",
                  fontSize: 14,
                  fontWeight: 800,
                  color: "#052e16",
                  background: "#a3e635",
                  padding: "5px 12px",
                  borderRadius: 999,
                  letterSpacing: 1,
                }}
              >
                IA · 98%
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 19,
                  color: "#e2e8f0",
                  fontWeight: 600,
                }}
              >
                Factura electrónica 001-001-0012345
              </div>
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 16,
                color: "#94a3b8",
                fontWeight: 600,
                letterSpacing: 1,
              }}
            >
              SIFEN ✓
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 0",
              borderTop: "1px solid rgba(148,163,184,0.18)",
            }}
          >
            <div style={{ display: "flex", fontSize: 18, color: "#cbd5e1" }}>
              5.1.1.01 · Compras de mercaderías
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 18,
                color: "#60a5fa",
                fontWeight: 700,
              }}
            >
              Gs. 7.050.000
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 0",
              borderTop: "1px solid rgba(148,163,184,0.18)",
            }}
          >
            <div style={{ display: "flex", fontSize: 18, color: "#cbd5e1" }}>
              1.1.4.01 · IVA crédito fiscal 10%
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 18,
                color: "#60a5fa",
                fontWeight: 700,
              }}
            >
              Gs. 705.000
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 0",
              borderTop: "1px solid rgba(148,163,184,0.18)",
            }}
          >
            <div style={{ display: "flex", fontSize: 18, color: "#cbd5e1" }}>
              2.1.1.01 · Proveedores locales
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 18,
                color: "#34d399",
                fontWeight: 700,
              }}
            >
              Gs. 7.755.000
            </div>
          </div>
        </div>

        {/* Trust strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 22,
            marginTop: 24,
            fontSize: 18,
            color: "#94a3b8",
            letterSpacing: 5,
            fontWeight: 700,
          }}
        >
          <span>SIFEN</span>
          <span style={{ color: "#475569" }}>•</span>
          <span>DNIT</span>
          <span style={{ color: "#475569" }}>•</span>
          <span>RG 90</span>
          <span style={{ color: "#475569" }}>•</span>
          <span>IA</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
