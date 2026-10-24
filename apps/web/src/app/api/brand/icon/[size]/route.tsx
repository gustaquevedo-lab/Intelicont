import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

const ALLOWED = new Set([72, 96, 128, 144, 152, 192, 384, 512]);

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ size: string }> },
) {
  const { size: rawSize } = await ctx.params;
  const size = Number(rawSize);
  if (!Number.isInteger(size) || !ALLOWED.has(size)) {
    return new Response("invalid size", { status: 400 });
  }

  // 80% safe zone for maskable icons — content lives inside the inner square.
  const inner = Math.round(size * 0.66);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #051125 0%, #0a2244 55%, #104c91 100%)",
        }}
      >
        <svg
          width={inner}
          height={Math.round(inner / 2)}
          viewBox="0 0 72 36"
          fill="none"
        >
          <path
            d="M 36 18 C 18 2, 4 9, 4 18 C 4 27, 18 34, 36 18 C 54 2, 68 9, 68 18 C 68 27, 54 34, 36 18 Z"
            stroke="url(#g)"
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
            <linearGradient id="g" x1="4" y1="18" x2="68" y2="18" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="35%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#22d3ee" />
              <stop offset="70%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    ),
    {
      width: size,
      height: size,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    },
  );
}
