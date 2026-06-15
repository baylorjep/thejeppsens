import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tmaakvblibexllbwlgth.supabase.co",
      },
    ],
  },
};

export default nextConfig;
