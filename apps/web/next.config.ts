import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Allow HMR from network origin during development
  allowedDevOrigins: ['192.168.56.1', 'localhost'],
};

export default nextConfig;
