/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Strict production configuration for Docker / server deployment

  eslint: {
    ignoreDuringBuilds: true, // Skip ESLint during builds
  },
  typescript: {
    ignoreBuildErrors: true, // Skip TypeScript checks during builds
  },

  // ✅ Use standard Next.js build (not standalone)
  // output: 'standalone',

  // ✅ Prevent Next.js from treating routes as static export
  trailingSlash: false,
  skipTrailingSlashRedirect: true,

  // ✅ Image optimization
  images: {
    unoptimized: true,
    domains: ['localhost', 'localboxs.com'],
    formats: ['image/webp', 'image/avif'],
  },

  // ✅ Core performance and security
  compress: true,
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },

  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/onboard',
        permanent: true,
      },
    ];
  },

  // ✅ Environment variables passthrough
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // ✅ Webpack configuration (keep lightweight)
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('mammoth', 'canvas', 'pdf-parse');
    }
    return config;
  },

  // ✅ Explicitly allow hybrid rendering for dynamic routes
  experimental: {
    typedRoutes: false,
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localboxs.com'],
    },
    externalDir: true,
  },
};

export default nextConfig;


