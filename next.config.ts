import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel deployment optimization
  output: process.env.VERCEL ? 'standalone' : undefined,
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Vercel-specific optimizations
  ...(process.env.VERCEL && {
    // Enable static exports for better caching
    trailingSlash: false,
  }),
  
  // Server external packages (moved from experimental)
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'unsplash.com',
        port: '',
        pathname: '/**',
      },
      // Add your production CDN/storage domains
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // Security headers
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google-analytics.com https://cdn.jsdelivr.net https://unpkg.com https://cdnjs.cloudflare.com https://va.vercel-scripts.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
            "img-src 'self' data: blob: https:",
            "font-src 'self' https://fonts.gstatic.com",
            "connect-src 'self' https://www.google-analytics.com https://cdn.jsdelivr.net https://unpkg.com https://cdnjs.cloudflare.com https://va.vercel-scripts.com",
            "frame-src 'self' https://shinylive.io",
            "media-src 'self' blob:",
            "worker-src 'self' blob:",
            "object-src 'none'",
            "base-uri 'self'",
            "frame-ancestors 'self'",
            "form-action 'self'",
            "upgrade-insecure-requests"
          ].join('; '),
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains; preload',
        },
      ],
    },
    {
      source: '/api/:path*',
      headers: [
        {
          key: 'Access-Control-Allow-Origin',
          value: process.env.CORS_ORIGINS || 'https://bcs-etextbook.vercel.app',
        },
        {
          key: 'Access-Control-Allow-Methods',
          value: 'GET, POST, PUT, DELETE, OPTIONS',
        },
        {
          key: 'Access-Control-Allow-Headers',
          value: 'Content-Type, Authorization',
        },
        {
          key: 'X-RateLimit-Limit',
          value: process.env.RATE_LIMIT_REQUESTS || '100',
        },
      ],
    },
  ],

  // Production redirects
  redirects: async () => [
    // Force HTTPS in production
    ...(process.env.NODE_ENV === 'production' && process.env.FORCE_HTTPS === 'true' ? [
      {
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: 'http',
          },
        ],
        destination: 'https://bcs-etextbook.vercel.app/:path*',
        permanent: true,
      },
    ] : []),
  ],

  // Compression and caching
  compress: true,
  
  // Bundle analyzer in development
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config: any) => {
      config.plugins.push(
        new (require('@next/bundle-analyzer')({ enabled: true }))()
      );
      return config;
    },
  }),

  // Logging configuration
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },

  // Experimental features for production
  experimental: {
    // Note: optimizeCss removed due to critters dependency issues
    // Can be re-enabled once the issue is resolved
  },
};

export default nextConfig;
