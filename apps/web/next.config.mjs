/** @type {import('next').NextConfig} */
const nextConfig = {
  // e2e runs its own dev server next to a developer's one; separate build dirs avoid clobbering.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  output: "standalone",
};

export default nextConfig;
