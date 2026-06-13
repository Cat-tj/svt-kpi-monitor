/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable server actions for form submissions
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
