/** @type {import('next').NextConfig} */
const nextConfig = {
  // postgres.js uses Node.js APIs — don't bundle it with webpack.
  serverExternalPackages: ["postgres"],

  webpack(config, { dev }) {
    if (dev) {
      // Prevent infinite HMR rebuild loops when running inside OneDrive.
      config.watchOptions = {
        ignored: [
          "**/node_modules/**",
          "**/.next/**",
          "**/.git/**",
          "**/desktop.ini",
          "**/*.tmp",
          "**/*~$*",
        ],
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;
