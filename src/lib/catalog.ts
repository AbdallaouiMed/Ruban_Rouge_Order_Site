import { seedProducts, TODO_OWNER, type CategoryId, type SeedProduct } from "@/data/bakery";
import { demoAvailability, demoPrices, demoProductImages } from "@/data/demo";
import { isDemo } from "@/lib/demo/config";
import type { ProductOverride } from "@/lib/demo/types";
import type { Locale } from "@/i18n/routing";

export interface Product {
  slug: string;
  category: CategoryId;
  name: Record<Locale, string>;
  /** MAD, null until owners provide a price */
  priceMad: number | null;
  image: string | null;
  /** "Fresh from the oven today" flag; admin-controlled */
  freshToday: boolean;
  soldOut: boolean;
}

const fromSeed = (p: SeedProduct): Product => {
  const demo = isDemo ? demoAvailability[p.slug] : undefined;
  return {
    slug: p.slug,
    category: p.category,
    name: p.name,
    // Real price when owners provide one; demo placeholder otherwise (demo mode only).
    priceMad: p.priceMad !== TODO_OWNER ? p.priceMad : isDemo ? (demoPrices[p.slug] ?? null) : null,
    // Real photo when owners provide one; stock placeholder photo otherwise (demo mode only).
    image: p.image ?? (isDemo ? (demoProductImages[p.slug] ?? null) : null),
    freshToday: demo?.freshToday ?? false,
    soldOut: demo?.soldOut ?? false,
  };
};

/** Synchronous catalogue (server and client). Admin edits are layered on with `applyOverrides`. */
export const baseProducts = (): Product[] => seedProducts.map(fromSeed);

export function applyOverride(p: Product, o?: ProductOverride): Product {
  if (!o) return p;
  return {
    ...p,
    priceMad: o.priceMad ?? p.priceMad,
    soldOut: o.soldOut ?? p.soldOut,
    freshToday: o.freshToday ?? p.freshToday,
    image: o.image === undefined ? p.image : o.image,
  };
}

export const applyOverrides = (products: Product[], overrides: Record<string, ProductOverride>) =>
  products.map((p) => applyOverride(p, overrides[p.slug]));

/** A product can be bought only when it has a price and is not sold out. */
export const isOrderable = (p: Product) => p.priceMad !== null && !p.soldOut;
