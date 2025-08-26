/** @type {import('next').NextConfig} */
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin();

const nextConfig = {
  // Enable strict checks in production
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'oaidalleapiprodscus.blob.core.windows.net',
      },
    ],
    unoptimized: process.env.NETLIFY === 'true',
    // Handle broken image gracefully
    dangerouslyAllowSVG: false,
    minimumCacheTTL: 60,
  },
  // CSS optimization disabled due to critters module issue
  experimental: {
    optimizeCss: false,
  },
  serverExternalPackages: ['@supabase/supabase-js', 'openai', 'stripe', '@sendgrid/mail'],
  // Allow cross-origin for Same.new preview
  allowedDevOrigins: [
    '*.preview.same-app.com',
    '*.same.new'
  ],
};

module.exports = withNextIntl(nextConfig);
