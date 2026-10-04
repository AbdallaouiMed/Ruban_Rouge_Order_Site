import { categories } from "@/data/bakery";
import type { CategoryId } from "@/data/bakery";
import type { Locale } from "@/i18n/routing";
import { baseProducts, type Product } from "@/lib/catalog";

export type { Product } from "@/lib/catalog";

/**
 * Data access seam. When the real backend exists this reads the database (seed as fallback);
 * callers do not change. In demo mode, admin edits are layered on in the browser.
 */
export async function getProducts(): Promise<Product[]> {
  return baseProducts();
}

export async function getProduct(slug: string): Promise<Product | null> {
  return (await getProducts()).find((p) => p.slug === slug) ?? null;
}

export const categoryLabel = (id: CategoryId, locale: Locale) => categories.find((c) => c.id === id)?.[locale] ?? id;

/** Case/diacritic-insensitive match used by menu search. */
export const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
