import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Allow next/image with ESPN CDN origins (used if switching to <Image> later)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "a.espncdn.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "a1.espncdn.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "a2.espncdn.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
