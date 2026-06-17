import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Set the root directory for output file tracing to fix lockfile warning
  outputFileTracingRoot: __dirname,

  // Expose DEMO_MODE to client bundles too. `isDemoMode` (lib/demo/flag.ts) is
  // read in client components (watch grid, sidebar, etc.); without this the
  // browser would see `process.env.DEMO_MODE` as undefined and take non-demo
  // paths even when the server is in demo mode.
  env: {
    DEMO_MODE: process.env.DEMO_MODE,
  },

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
