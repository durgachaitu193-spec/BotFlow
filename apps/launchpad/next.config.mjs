/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { webpack }) => {
    config.externals.push('pino-pretty', 'encoding')
    config.externals.push({
      pino: 'commonjs pino',
      'thread-stream': 'commonjs thread-stream',
    })
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^tap$/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /^tape$/,
      })
    )
    config.resolve.alias = {
      ...config.resolve.alias,
      tap: false,
      tape: false,
    }
    return config
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '**',
      },
    ],
  },
  serverExternalPackages: [
    'pino',
    'pino-pretty',
    'encoding',
    'thread-stream',
    'on-exit-leak-free',
    'pino-std-serializers',
    'process-warning',
    'real-require',
    'sonic-boom',
  ],
  turbopack: {
    resolveAlias: {
      'thread-stream': './lib/empty.js',
      'pino-pretty': './lib/empty.js',
      'on-exit-leak-free': './lib/empty.js',
      'pino-std-serializers': './lib/empty.js',
      'process-warning': './lib/empty.js',
      'real-require': './lib/empty.js',
      'sonic-boom': './lib/empty.js',
    },
  },
  typescript: {
    // Only use this if you want to ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  transpilePackages: ['@sim/db', '@sim/ui'],
}

export default nextConfig
