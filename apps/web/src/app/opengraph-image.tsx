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
        {/* Canonical logo: loop + spark with brand gradient */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 26,
            marginBottom: 14,
          }}
        >
          <svg width="180" height="90" viewBox="0 0 72 36" fill="none">
            <path
              d="M 36 18 C 18 2, 4 9, 4 18 C 4 27, 18 34, 36 18 C 54 2, 68 9, 68 18 C 68 27, 54 34, 36 18 Z"
              stroke="url(#og-loop)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M 36 11 Q 36 18 43 18 Q 36 18 36 25 Q 36 18 29 18 Q 36 18 36 11 Z"
              fill="#ffffff"
            />
            <defs>
              <linearGradient id="og-loop" x1="4" y1="18" x2="68" y2="18" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="35%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#22d3ee" />
                <stop offset="70%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
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

          {[
            { label: "Compras de mercaderías", amount: "Gs. 7.050.000", color: "#60a5fa" },
            { label: "IVA crédito fiscal 10%", amount: "Gs. 705.000", color: "#60a5fa" },
            { label: "Proveedores locales", amount: "Gs. 7.755.000", color: "#34d399" },
          ].map((row) => (
            <div
              key={row.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 0",
                borderTop: "1px solid rgba(148,163,184,0.2)",
              }}
            >
              <div style={{ display: "flex", fontSize: 22, color: "#cbd5e1", fontWeight: 500 }}>
                {row.label}
              </div>
              <div style={{ display: "flex", fontSize: 22, color: row.color, fontWeight: 800 }}>
                {row.amount}
              </div>
            </div>
          ))}
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
