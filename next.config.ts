import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Set the root directory for output file tracing to fix lockfile warning
  outputFileTracingRoot: __dirname,
  
  // Disable tracing to prevent EPERM errors on Windows
  experimental: {
    disableOptimizedLoading: false,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  webpack: (config, { isServer }) => {
    // Prevent webpack from watching .next directory
    if (isServer) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ["**/.next/**", "**/node_modules/**", "**/videos/**"],
      };
    }
    return config;
  },
};

export default nextConfig;
