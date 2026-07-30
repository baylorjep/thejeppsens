import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/deal-or-no-deal",
        destination: "https://ballornoball.vercel.app",
        permanent: false,
      },
      {
        source: "/deal-or-no-deal/:path*",
        destination: "https://ballornoball.vercel.app/:path*",
        permanent: false,
      },
    ];
  },
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
