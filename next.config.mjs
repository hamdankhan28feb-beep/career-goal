/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  // Suppress the `fs` usage in server components
  serverExternalPackages: [],
  // Ensure JSON data files in root are accessible from server components
  experimental: {},
};

export default nextConfig;