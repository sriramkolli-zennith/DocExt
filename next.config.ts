import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Image optimization for Vercel
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    unoptimized: false,
  },
  // Vercel analytics
  poweredByHeader: false,
  // Suppress the middleware convention deprecation warning
  reactStrictMode: true,
}

export default nextConfig
