/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.externals.push("pino-pretty", "encoding");
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        port: "",
        pathname: "**",
      },
    ],
  },
  serverExternalPackages: ["pino-pretty", "encoding"],
  turbopack: {},
  typescript: {
    // Only use this if you want to ignore TypeScript errors during build
    // ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  transpilePackages: ["@sim/db", "@sim/ui"],
};

export default nextConfig;
