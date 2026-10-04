import { afterEach, describe, expect, it, vi } from "vitest";

// isDemo is read once at import time, so each case loads a fresh copy of the modules.
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

const order = {
  items: [{ id: "1", kind: "product" as const, slug: "mille-feuille", qty: 5 }],
  customer: { name: "Salma B.", phone: "0663206008" },
  method: "pickup" as const,
  slot: "2099-01-01T10:00",
  locale: "fr" as const,
};

describe("without demo mode and without a back end", () => {
  it("refuses orders and cake requests instead of keeping them only in the browser", async () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "0");
    const { useDemoData } = await import("@/lib/demo/store");
    const s = useDemoData.getState();
    expect(s.placeOrder(order)).toEqual({ ok: false, error: "offline" });
    expect(
      s.placeCakeRequest({ spec: { occasion: "birthday", servings: 10, flavor: "vanilla", filling: "cream", frosting: "buttercream", decorations: [], dedication: "", date: "2099-01-01", budget: "b2", estimateLow: 1, estimateHigh: 2 }, customer: order.customer, locale: "fr" }),
    ).toEqual({ ok: false, error: "offline" });
    expect(useDemoData.getState().orders).toHaveLength(0);
  });

  it("drops the placeholder prices and availability from the catalogue", async () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "0");
    const { baseProducts, isOrderable } = await import("@/lib/catalog");
    const products = baseProducts();
    expect(products.every((p) => p.priceMad === null)).toBe(true);
    expect(products.some(isOrderable)).toBe(false);
    expect(products.every((p) => !p.freshToday && !p.soldOut)).toBe(true);
  });

  it("shows no demo banner state: isDemo is false", async () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "0");
    const { isDemo } = await import("@/lib/demo/config");
    expect(isDemo).toBe(false);
  });
});

describe("in demo mode (the default)", () => {
  it("is on unless explicitly switched off", async () => {
    const { isDemo } = await import("@/lib/demo/config");
    expect(isDemo).toBe(true);
  });
});
