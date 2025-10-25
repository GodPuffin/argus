import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable tracing to prevent EPERM errors on Windows
  experimental: {
    // @ts-ignore - This is a valid option but not in types yet
    disableOptimizedLoading: false,
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
