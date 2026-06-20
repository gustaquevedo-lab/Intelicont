import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "InteliCont — Contabilidad inteligente para Paraguay";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FONT_BASE = "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.16/files";

async function loadFont(weight: 500 | 700 | 800) {
  const res = await fetch(`${FONT_BASE}/inter-latin-${weight}-normal.woff`);
  return res.arrayBuffer();
}

export default async function OpengraphImage() {
  const [inter500, inter700, inter800] = await Promise.all([
    loadFont(500),
    loadFont(700),
    loadFont(800),
  ]);

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
          fontFamily: "Inter",
          padding: 44,
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
          <svg width="150" height="78" viewBox="0 0 200 100">
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
            <circle cx="100" cy="50" r="7" fill="#ffffff" />
          </svg>
          <div
            style={{
              display: "flex",
              fontSize: 128,
              fontWeight: 800,
              letterSpacing: -5,
              lineHeight: 1,
            }}
          >
            <span style={{ color: "#60a5fa" }}>Inteli</span>
            <span style={{ color: "#34d399" }}>Cont</span>
          </div>
        </div>

        <div
          style={{
            fontSize: 32,
            fontWeight: 500,
            color: "#cbd5e1",
            marginBottom: 30,
            textAlign: "center",
          }}
        >
          SaaS contable con IA para Paraguay
        </div>

        {/* Mock asiento contable */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(148,163,184,0.28)",
            borderRadius: 22,
            padding: "24px 30px",
            width: 820,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  display: "flex",
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#052e16",
                  background: "#a3e635",
                  padding: "6px 14px",
                  borderRadius: 999,
                  letterSpacing: 1,
                }}
              >
                IA · 98%
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#f1f5f9",
                }}
              >
                Factura 001-001-0012345
              </div>
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 18,
                fontWeight: 700,
                color: "#34d399",
                letterSpacing: 1.5,
              }}
            >
              SIFEN ✓
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "12px 0",
              borderTop: "1px solid rgba(148,163,184,0.2)",
            }}
          >
            <div
              style={{ display: "flex", fontSize: 22, color: "#cbd5e1", fontWeight: 500 }}
            >
              Compras de mercaderías
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 22,
                color: "#60a5fa",
                fontWeight: 800,
              }}
            >
              Gs. 7.050.000
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "12px 0",
              borderTop: "1px solid rgba(148,163,184,0.2)",
            }}
          >
            <div
              style={{ display: "flex", fontSize: 22, color: "#cbd5e1", fontWeight: 500 }}
            >
              IVA crédito fiscal 10%
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 22,
                color: "#60a5fa",
                fontWeight: 800,
              }}
            >
              Gs. 705.000
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "12px 0",
              borderTop: "1px solid rgba(148,163,184,0.2)",
            }}
          >
            <div
              style={{ display: "flex", fontSize: 22, color: "#cbd5e1", fontWeight: 500 }}
            >
              Proveedores locales
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 22,
                color: "#34d399",
                fontWeight: 800,
              }}
            >
              Gs. 7.755.000
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter", data: inter500, weight: 500, style: "normal" },
        { name: "Inter", data: inter700, weight: 700, style: "normal" },
        { name: "Inter", data: inter800, weight: 800, style: "normal" },
      ],
    },
  );
}
