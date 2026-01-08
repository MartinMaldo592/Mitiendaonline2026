import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["http://localhost:3000", "http://192.168.0.15:3000"],
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "blama.shop" }],
        destination: "https://www.blama.shop/:path*",
        permanent: true,
      },
    ]
  },
  images: {
    qualities: [70, 75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
