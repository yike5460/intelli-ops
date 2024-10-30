/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

if (process.env.GITHUB_ACTIONS) {
  nextConfig.output = 'export'
  nextConfig.basePath = '/intelli-ops'
  nextConfig.assetPrefix = '/intelli-ops/'
} else {
  nextConfig.output = 'standalone'
}

module.exports = nextConfig
