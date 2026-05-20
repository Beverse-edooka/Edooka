import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  // Native modules (canvas + qrcode) can't be bundled — load at runtime from node_modules.
  serverExternalPackages: ["@napi-rs/canvas", "qrcode"],
};

export default nextConfig;
