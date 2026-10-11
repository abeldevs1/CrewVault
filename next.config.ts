import type { NextConfig } from "next";
import path from "node:path";

if (process.env.NODE_ENV !== "production") {
  process.env.XDG_CONFIG_HOME = process.env.XDG_CONFIG_HOME || path.join(process.cwd(), ".config");
  process.env.WRANGLER_LOG_PATH = process.env.WRANGLER_LOG_PATH || path.join(process.cwd(), ".wrangler/logs");
}

const nextConfig: NextConfig = {
  serverExternalPackages: ["wrangler", "@cloudflare/workerd-linux-64"],
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
