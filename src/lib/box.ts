import { isOrderable, type Product } from "@/lib/catalog";
import type { BoxContents, BoxSize } from "@/lib/demo/types";

/**
 * The house's own assortment for gift boxes: pieces are spread evenly over the products that can
 * be ordered today, in catalogue order, so the box is varied and never contains a sold-out item.
 */
export function houseSelection(size: BoxSize, products: Product[]): BoxContents | null {
  const available = products.filter(isOrderable);
  if (available.length === 0) return null;
  const counts = new Map<string, number>();
  for (let i = 0; i < size; i++) {
    const slug = available[i % available.length].slug;
    counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }
  return { size, items: [...counts].map(([slug, qty]) => ({ slug, qty })) };
}

/** Occasion collections map onto the closest cake-studio occasion. */
export const cakeOccasionFor: Record<string, string> = {
  ramadan: "eid",
  eid: "eid",
  mawlid: "eid",
  wedding: "wedding",
  engagement: "engagement",
  graduation: "graduation",
  corporate: "corporate",
};
