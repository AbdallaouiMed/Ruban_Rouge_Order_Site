import { BUNDLE_DISCOUNT, bundles, cakeOptions } from "@/data/demo";
import { isOrderable, type Product } from "@/lib/catalog";
import type { CartItem, FulfillmentMethod, OrderLine, Settings } from "@/lib/demo/types";

export class PricingError extends Error {
  constructor(
    public code: "unknown_product" | "unavailable" | "unknown_bundle" | "invalid_box" | "empty",
    public detail?: string,
  ) {
    super(code);
  }
}

const round = (n: number) => Math.round(n * 100) / 100;

const bySlug = (products: Product[], slug: string) => products.find((p) => p.slug === slug);

export function bundleTotal(bundleId: string, products: Product[]): number {
  const bundle = bundles.find((x) => x.id === bundleId);
  if (!bundle) throw new PricingError("unknown_bundle", bundleId);
  let sum = 0;
  for (const it of bundle.items) {
    const p = bySlug(products, it.slug);
    if (!p || p.priceMad === null) throw new PricingError("unknown_product", it.slug);
    sum += p.priceMad * it.qty;
  }
  return Math.round(sum * (1 - BUNDLE_DISCOUNT));
}

export function boxUnitPrice(box: NonNullable<CartItem["box"]>, products: Product[], settings: Settings): number {
  const count = box.items.reduce((n, i) => n + i.qty, 0);
  if (count !== box.size) throw new PricingError("invalid_box", `${count}/${box.size}`);
  let sum = settings.boxFee;
  for (const it of box.items) {
    const p = bySlug(products, it.slug);
    if (!p || !isOrderable(p)) throw new PricingError(p ? "unavailable" : "unknown_product", it.slug);
    sum += p.priceMad! * it.qty;
  }
  return round(sum);
}

/**
 * Price a single cart item from the CURRENT catalogue. The cart never carries prices, so a stale
 * or tampered cart cannot change what is charged (same rule the real server will apply).
 */
export function unitPrice(item: CartItem, products: Product[], settings: Settings): number {
  if (item.kind === "bundle") return bundleTotal(item.bundleId ?? "", products);
  if (item.kind === "box") {
    if (!item.box) throw new PricingError("invalid_box");
    return boxUnitPrice(item.box, products, settings);
  }
  const p = item.slug ? bySlug(products, item.slug) : undefined;
  if (!p) throw new PricingError("unknown_product", item.slug);
  if (!isOrderable(p)) throw new PricingError("unavailable", p.slug);
  return p.priceMad!;
}

export interface Totals {
  subtotal: number;
  deliveryFee: number;
  total: number;
  /** Delivery only: how much more is needed to reach the minimum order (0 when met) */
  belowMinimumBy: number;
  /** Delivery only: how much more for free delivery (0 when free) */
  freeDeliveryIn: number;
}

export function computeTotals(subtotal: number, method: FulfillmentMethod, settings: Settings): Totals {
  const delivery = method === "delivery";
  const deliveryFee = delivery && subtotal < settings.freeAbove ? settings.deliveryFee : 0;
  return {
    subtotal: round(subtotal),
    deliveryFee,
    total: round(subtotal + deliveryFee),
    belowMinimumBy: delivery ? Math.max(0, round(settings.minOrder - subtotal)) : 0,
    freeDeliveryIn: delivery ? Math.max(0, round(settings.freeAbove - subtotal)) : 0,
  };
}

/** Human label for a cart line, in French (the admin language). */
export function lineLabelFr(item: CartItem, products: Product[]): { label: string; details?: string } {
  if (item.kind === "bundle") {
    const bundle = bundles.find((b) => b.id === item.bundleId);
    return { label: bundle?.name.fr ?? "Collection" };
  }
  if (item.kind === "box") {
    const parts = (item.box?.items ?? []).map((i) => `${i.qty} × ${bySlug(products, i.slug)?.name.fr ?? i.slug}`);
    return { label: `Boîte de ${item.box?.size} (ruban rouge)`, details: parts.join(", ") };
  }
  return { label: bySlug(products, item.slug ?? "")?.name.fr ?? "Produit" };
}

export function buildLines(items: CartItem[], products: Product[], settings: Settings): OrderLine[] {
  if (items.length === 0) throw new PricingError("empty");
  return items.map((item) => {
    const { label, details } = lineLabelFr(item, products);
    return { label, details, qty: item.qty, unitPrice: unitPrice(item, products, settings), note: item.note?.trim() || undefined };
  });
}

/* ---------- Cake studio estimate ---------- */

export interface CakeChoice {
  size: string;
  flavor: string;
  filling: string;
  frosting: string;
  decorations: string[];
}

export function cakeEstimate(c: CakeChoice): { low: number; high: number } | null {
  const size = cakeOptions.sizes.find((s) => s.id === c.size);
  if (!size) return null;
  const add = (list: readonly { id: string; add?: number }[], id: string) => list.find((x) => x.id === id)?.add ?? 0;
  const extras =
    add(cakeOptions.flavors, c.flavor) +
    add(cakeOptions.fillings, c.filling) +
    add(cakeOptions.frostings, c.frosting) +
    c.decorations.reduce((n, d) => n + add(cakeOptions.decorations, d), 0);
  const mid = size.base + extras * size.factor;
  const tidy = (n: number) => Math.round(n / 10) * 10;
  return { low: tidy(mid * 0.9), high: tidy(mid * 1.15) };
}
