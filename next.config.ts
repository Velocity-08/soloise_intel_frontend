import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com'],
  },
  // Allow environment variables at build time
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SOLIOSE_BACKEND_URL: process.env.NEXT_PUBLIC_SOLIOSE_BACKEND_URL,
  },
  // API rewrites to backend
  async rewrites() {
    return [
      {
        source: '/api/recommend',
        destination: process.env.NEXT_PUBLIC_SOLIOSE_BACKEND_URL 
          ? `${process.env.NEXT_PUBLIC_SOLIOSE_BACKEND_URL}/recommend`
          : 'https://soloise-intel.vercel.app/recommend',
      },
      {
        source: '/api/health',
        destination: process.env.NEXT_PUBLIC_SOLIOSE_BACKEND_URL 
          ? `${process.env.NEXT_PUBLIC_SOLIOSE_BACKEND_URL}/health`
          : 'https://soloise-intel.vercel.app/health',
      },
    ];
  },
  // For better mobile performance
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
};

export default nextConfig;