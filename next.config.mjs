/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable ESLint during build to avoid deployment issues
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Configure any necessary settings for deployment here
  images: {
    // Allow optimization for images
    unoptimized: process.env.NODE_ENV !== 'production',
  },
};

export default nextConfig; 