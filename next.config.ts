import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allows this development machine's LAN address to load Next.js dev assets.
  // Keep this explicit instead of allowing arbitrary origins.
  allowedDevOrigins: ["10.170.169.8"],
};

export default nextConfig;
