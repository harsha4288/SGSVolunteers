
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Ensure environment variables are available in the browser
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://itnuxwdxpzdjlfwlvjyz.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0bnV4d2R4cHpkamxmd2x2anl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4NDk0NTUsImV4cCI6MjA2MjQyNTQ1NX0.2YXD8rjFdAq4jGIHihya60QD_h3PsBB2m17SGBU0Hes',
  },
};

export default nextConfig;
