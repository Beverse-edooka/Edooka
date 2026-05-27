import type { MetadataRoute } from "next";
import { getAppOrigin } from "@/lib/app-url";

export default function robots(): MetadataRoute.Robots {
  const origin = getAppOrigin();
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/c/", "/share/", "/api/og/"],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
