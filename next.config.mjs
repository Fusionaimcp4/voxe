/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Strict production configuration for Docker / server deployment

  typescript: {
    ignoreBuildErrors: true, // Skip TypeScript checks during builds
  },

  // ✅ Use standard Next.js build (not standalone)
  // output: 'standalone',

  // ✅ Prevent Next.js from treating routes as static export
  trailingSlash: false,
  skipTrailingSlashRedirect: true,

  // ✅ Image optimization (updated for Next.js 16)
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'voxe.mcp4.ai',
      },
    ],
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

  // ✅ Turbopack configuration (Next.js 16 uses Turbopack by default)
  turbopack: {
    // Empty config to silence the warning - webpack config will still work
  },

  // ✅ Explicitly allow hybrid rendering for dynamic routes
  typedRoutes: false,
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'voxe.mcp4.ai'],
    },
    externalDir: true,
  },
};

export default nextConfig;


