/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "*.ufs.sh" },
      { protocol: "https", hostname: "uploadthing.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
    // Serve modern formats for better compression and faster load times
    formats: ["image/avif", "image/webp"],
    // Cache optimised images for 7 days
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
  // Remove X-Powered-By header (minor security + payload improvement)
  poweredByHeader: false,
  // Enable gzip compression
  compress: true,
  experimental: {
    optimizeCss: true,
  },
  // Generate static optimization data
  staticPageGenerationTimeout: 1000,
};

export default nextConfig;
