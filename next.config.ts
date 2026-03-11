import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Docker standalone builds
  output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },

  // Next.js 15: renamed from experimental.serverComponentsExternalPackages
  serverExternalPackages: ["@prisma/client", "bcryptjs", "node-cron"],
};

export default nextConfig;
