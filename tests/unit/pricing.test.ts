import { describe, expect, it } from "vitest";
import { bundles, defaultSettings } from "@/data/demo";
import { applyOverrides, baseProducts, isOrderable } from "@/lib/catalog";
import { boxUnitPrice, bundleTotal, buildLines, cakeEstimate, computeTotals, PricingError, unitPrice } from "@/lib/pricing";
import type { CartItem } from "@/lib/demo/types";

const products = baseProducts();
const settings = defaultSettings; // delivery 20, free from 200, minimum 60, box fee 10
const item = (partial: Partial<CartItem>): CartItem => ({ id: "x", kind: "product", qty: 1, ...partial });

describe("computeTotals", () => {
  it("charges no delivery fee for pickup", () => {
    expect(computeTotals(50, "pickup", settings)).toMatchObject({ deliveryFee: 0, total: 50, belowMinimumBy: 0 });
  });
  it("adds the fee for delivery below the free threshold and reports the shortfall", () => {
    expect(computeTotals(50, "delivery", settings)).toMatchObject({ deliveryFee: 20, total: 70, belowMinimumBy: 10, freeDeliveryIn: 150 });
  });
  it("makes delivery free at exactly the threshold", () => {
    expect(computeTotals(200, "delivery", settings)).toMatchObject({ deliveryFee: 0, total: 200, freeDeliveryIn: 0 });
  });
  it("rounds to two decimals", () => {
    expect(computeTotals(10.005 + 0.1, "pickup", settings).total).toBe(10.11);
  });
});

describe("unitPrice", () => {
  it("prices a product from the catalogue", () => {
    expect(unitPrice(item({ slug: "croissant-au-beurre" }), products, settings)).toBe(6);
  });
  it("refuses a sold-out product and an unknown one", () => {
    expect(() => unitPrice(item({ slug: "eclair-au-chocolat" }), products, settings)).toThrowError(PricingError);
    expect(() => unitPrice(item({ slug: "does-not-exist" }), products, settings)).toThrowError(PricingError);
  });
  it("refuses a product with no price", () => {
    const noPrice = products.map((p) => (p.slug === "baguette" ? { ...p, priceMad: null } : p));
    expect(isOrderable(noPrice.find((p) => p.slug === "baguette")!)).toBe(false);
    expect(() => unitPrice(item({ slug: "baguette" }), noPrice, settings)).toThrowError(PricingError);
  });
  it("uses admin price overrides", () => {
    const edited = applyOverrides(products, { baguette: { priceMad: 3 } });
    expect(unitPrice(item({ slug: "baguette" }), edited, settings)).toBe(3);
  });
});

describe("boxes and bundles", () => {
  it("prices a full box as pieces plus the box fee", () => {
    const box = { size: 6 as const, items: [{ slug: "croissant-au-beurre", qty: 4 }, { slug: "baguette", qty: 2 }] };
    expect(boxUnitPrice(box, products, settings)).toBe(10 + 4 * 6 + 2 * 2);
  });
  it("rejects a box that is not full or has a sold-out piece", () => {
    expect(() => boxUnitPrice({ size: 6, items: [{ slug: "baguette", qty: 5 }] }, products, settings)).toThrowError(PricingError);
    expect(() => boxUnitPrice({ size: 6, items: [{ slug: "eclair-au-chocolat", qty: 6 }] }, products, settings)).toThrowError(PricingError);
  });
  it("prices a bundle 5% under the sum of its pieces", () => {
    const b = bundles.find((x) => x.id === "mawlid-small")!; // 6 truffles (9) + 3 croissants (6) = 72
    expect(bundleTotal(b.id, products)).toBe(Math.round(72 * 0.95));
  });
  it("every bundle references real products", () => {
    for (const b of bundles) expect(() => bundleTotal(b.id, products), b.id).not.toThrow();
  });
});

describe("buildLines", () => {
  it("snapshots French labels, notes and box contents", () => {
    const lines = buildLines(
      [item({ slug: "baguette", qty: 2, note: " bien cuite " }), item({ id: "b", kind: "box", box: { size: 6, items: [{ slug: "croissant-au-beurre", qty: 6 }] } })],
      products,
      settings,
    );
    expect(lines[0]).toMatchObject({ label: "Baguette", qty: 2, unitPrice: 2, note: "bien cuite" });
    expect(lines[1].label).toBe("Boîte de 6 (ruban rouge)");
    expect(lines[1].details).toContain("6 × Croissant au Beurre");
  });
  it("rejects an empty cart", () => {
    expect(() => buildLines([], products, settings)).toThrowError(PricingError);
  });
});

describe("cakeEstimate", () => {
  it("builds a range around the base price plus scaled extras", () => {
    // size m: base 280, factor 1.3; chocolate +20, ganache +25, fondant +60, gold +50 => extras 155 * 1.3 = 201.5; mid 481.5
    const e = cakeEstimate({ size: "m", flavor: "chocolate", filling: "ganache", frosting: "fondant", decorations: ["gold", "ribbon"] })!;
    expect(e.low).toBe(430);
    expect(e.high).toBe(550);
    expect(e.low).toBeLessThan(e.high);
  });
  it("returns null for an unknown size and grows with the size", () => {
    expect(cakeEstimate({ size: "zz", flavor: "vanilla", filling: "cream", frosting: "buttercream", decorations: [] })).toBeNull();
    const small = cakeEstimate({ size: "s", flavor: "vanilla", filling: "cream", frosting: "buttercream", decorations: [] })!;
    const big = cakeEstimate({ size: "xl", flavor: "vanilla", filling: "cream", frosting: "buttercream", decorations: [] })!;
    expect(big.low).toBeGreaterThan(small.low);
  });
});
