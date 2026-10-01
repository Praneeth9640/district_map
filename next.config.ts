import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // District maps are local static assets under /public/maps
    unoptimized: false,
  },
};

export default nextConfig;
