import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    // Google profile pictures (OAuth sign-in avatars). User-supplied avatar
    // URLs are rendered with plain <img> tags, not next/image.
    remotePatterns: [{ protocol: "https", hostname: "lh3.googleusercontent.com" }],
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
