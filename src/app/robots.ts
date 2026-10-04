import type { MetadataRoute } from "next";
import { bakery } from "@/data/bakery";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/*/admin", "/*/checkout", "/*/order/", "/*/design-system"] }],
    sitemap: `${bakery.siteUrl}/sitemap.xml`,
  };
}
