import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  // Native modules (canvas + qrcode) can't be bundled — load at runtime from node_modules.
  serverExternalPackages: ["@napi-rs/canvas", "qrcode"],
  // Include template + DejaVu TTFs in serverless bundles (Linux has no Arial/Georgia).
  outputFileTracingIncludes: {
    "/api/certificate/**": [
      "./public/certificate-template.png",
      "./node_modules/dejavu-fonts-ttf/ttf/DejaVuSans.ttf",
      "./node_modules/dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf",
      "./node_modules/dejavu-fonts-ttf/ttf/DejaVuSerif-Italic.ttf",
      "./node_modules/dejavu-fonts-ttf/ttf/DejaVuSansMono.ttf",
    ],
  },
};

export default nextConfig;
