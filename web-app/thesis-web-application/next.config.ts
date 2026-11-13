import type { NextConfig } from "next";

// Cloudflare quick tunnels get a random subdomain on every run.
const tunnelHosts = ["*.trycloudflare.com"];

const nextConfig: NextConfig = {
  allowedDevOrigins: tunnelHosts,
  experimental: {
    serverActions: { allowedOrigins: tunnelHosts, bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
