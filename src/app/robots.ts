import type { MetadataRoute } from "next";
import { bakery } from "@/data/bakery";
import { isDemo } from "@/lib/demo/config";

export default function robots(): MetadataRoute.Robots {
  // A demo has placeholder prices and photos: keep it out of search engines.
  if (isDemo) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/*/admin", "/*/checkout", "/*/order/", "/*/design-system"] }],
    sitemap: `${bakery.siteUrl}/sitemap.xml`,
  };
}
