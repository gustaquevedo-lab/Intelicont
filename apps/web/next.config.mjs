/** @type {import('next').NextConfig} */
const nextConfig = {
  // e2e runs its own dev server next to a developer's one; separate build dirs avoid clobbering.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  output: "standalone",
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options",          value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options",    value: "nosniff" },
          { key: "X-DNS-Prefetch-Control",    value: "on" },
          { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // unsafe-eval needed for Next.js hot-reload and some tRPC/RSC internals in dev.
              // shortcut: unsafe-eval in prod too; tighten when app migrates to SRI hashes.
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://raw.githubusercontent.com https://*.intellihouse.lat",
              "connect-src 'self' https://*.intellihouse.lat https://zrkaverfiualywftrhtb.supabase.co",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
