import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    serverActions: {
      // The official National Hospital Directory CSV is approximately 10 MB.
      bodySizeLimit: "25mb"
    }
  }
};

export default nextConfig;
