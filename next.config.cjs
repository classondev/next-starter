/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
  webpack: (config, { isServer }) => {
    // Handle markdown files
    config.module.rules.push({
      test: /\.md$/,
      type: 'asset/source',
    });

    // Handle native modules
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });

    // Exclude @libsql+client from being processed
    config.module.rules.push({
      test: /node_modules\/@libsql\+client/,
      use: 'ignore-loader'
    });

    if (!isServer) {
      // Don't resolve 'fs' module on the client to prevent this error on build --> Error: Can't resolve 'fs'
      config.resolve.fallback = {
        fs: false,
      }
    }

    // Add node-loader to resolve options
    config.resolve.alias = {
      ...config.resolve.alias,
      '@libsql/darwin-arm64': false,
    }

    return config
  },
}

module.exports = nextConfig
