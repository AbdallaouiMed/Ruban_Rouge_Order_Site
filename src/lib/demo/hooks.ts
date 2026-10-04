"use client";

import { useMemo } from "react";
import { applyOverride, applyOverrides, baseProducts, type Product } from "@/lib/catalog";
import { bundles, type Bundle } from "@/data/demo";
import { bundleTotal, computeTotals, unitPrice } from "@/lib/pricing";
import { useCart, useDemoData, useHydration } from "./store";
import type { FulfillmentMethod, SiteImageSlot } from "./types";

/** The live catalogue: seed + demo prices + whatever the admin changed. */
export function useCatalog() {
  const overrides = useDemoData((s) => s.overrides);
  const ready = useHydration((s) => s.ready);
  const products = useMemo(() => applyOverrides(baseProducts(), overrides), [overrides]);
  return { products, ready };
}

/** One product with admin edits applied (used by cards, which receive the server's seed product). */
export function useLiveProduct(product: Product): Product {
  const override = useDemoData((s) => s.overrides[product.slug]);
  return useMemo(() => applyOverride(product, override), [product, override]);
}

export function useSettings() {
  return useDemoData((s) => s.settings);
}

export function useSiteImage(slot: SiteImageSlot) {
  return useDemoData((s) => s.siteImages[slot]);
}

export function useBundlePrice(bundle: Bundle) {
  const { products } = useCatalog();
  return useMemo(() => {
    try {
      return bundleTotal(bundle.id, products);
    } catch {
      return null;
    }
  }, [bundle.id, products]);
}

/** Priced cart lines + totals for a fulfilment method, all derived from the live catalogue. */
export function useCartSummary(method: FulfillmentMethod = "pickup") {
  const items = useCart((s) => s.items);
  const { products } = useCatalog();
  const settings = useSettings();

  return useMemo(() => {
    const lines = items.map((item) => {
      try {
        return { item, unit: unitPrice(item, products, settings), error: null as null | string };
      } catch (e) {
        return { item, unit: 0, error: e instanceof Error ? e.message : "error" };
      }
    });
    const subtotal = lines.reduce((n, l) => n + l.unit * l.item.qty, 0);
    const count = items.reduce((n, i) => n + i.qty, 0);
    return { lines, count, hasProblem: lines.some((l) => l.error), ...computeTotals(subtotal, method, settings) };
  }, [items, products, settings, method]);
}

export { bundles };
