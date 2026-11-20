import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "lh3.googleusercontent.com" }],
    minimumCacheTTL: 86400,
  },
  // NOTE: `cacheComponents` is intentionally NOT enabled. It forbids the
  // `export const dynamic = "force-dynamic"` route config this app uses on
  // every database-backed page to avoid build-time prerendering against
  // the database. The classic segment-config model is used instead.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
