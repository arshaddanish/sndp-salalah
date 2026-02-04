/** @type {import('next').NextConfig} */
const nextConfig: import('next').NextConfig = {
  // Performance & Cleanliness
  reactStrictMode: true, // Catches side-effect bugs in development
  poweredByHeader: false, // Security: Don't tell hackers you're using Next.js

  // Modern Image Optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'your-member-storage.com', // Only allow specific image sources
      },
    ],
  },

  // Security Headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
