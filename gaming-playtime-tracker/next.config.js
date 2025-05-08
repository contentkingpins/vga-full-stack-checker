/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configure for Amplify deployment
  output: 'export',
  // CORS headers still needed for API routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
 roblox-integration
  // Disable server-side image optimization when using export
  images: process.env.AWS_AMPLIFY ? { unoptimized: true } : {},
  // Add environment variables to be available at runtime
  env: {
    ROBLOX_API_KEY: process.env.ROBLOX_API_KEY,
  },
  // Disable server-side image optimization for static deployment
  images: { unoptimized: true },
 main
};

module.exports = nextConfig; 