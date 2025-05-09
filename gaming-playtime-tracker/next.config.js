/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Remove the static export for Amplify deployment and use the default Next.js server
  // This allows API routes to work properly
  distDir: '.next',
  // Configure CORS headers
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
  // Adjust image settings to work correctly in Amplify environment
  images: {
    unoptimized: process.env.AWS_AMPLIFY === 'true',
    domains: ['cdn.cloudflare.steamstatic.com'],
  },
};

module.exports = nextConfig; 