import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/mp3/convert": ["./bin/yt-dlp", "./node_modules/ffmpeg-static/**"],
  },
  serverExternalPackages: ["ffmpeg-static"],
  images: {
    qualities: [62, 68, 75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tmaakvblibexllbwlgth.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.mzstatic.com",
      },
      {
        protocol: "https",
        hostname: "a.espncdn.com",
      },
    ],
  },
};

export default nextConfig;
