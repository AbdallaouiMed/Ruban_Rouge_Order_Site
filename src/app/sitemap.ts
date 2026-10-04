import type { MetadataRoute } from "next";
import { bakery } from "@/data/bakery";
import { occasions } from "@/data/demo";
import { routing } from "@/i18n/routing";
import { getProducts } from "@/lib/products";

const staticPaths = ["", "/menu", "/box", "/cakes", "/occasions", "/gift", "/story", "/contact"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();
  const paths = [...staticPaths, ...products.map((p) => `/menu/${p.slug}`), ...occasions.map((o) => `/occasions/${o.id}`)];
  const url = (locale: string, path: string) => `${bakery.siteUrl}/${locale}${path}`;

  return paths.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: url(locale, path),
      changeFrequency: path === "" || path === "/menu" ? ("daily" as const) : ("monthly" as const),
      priority: path === "" ? 1 : path.split("/").length > 2 ? 0.5 : 0.8,
      alternates: { languages: Object.fromEntries(routing.locales.map((l) => [l, url(l, path)])) },
    })),
  );
}
