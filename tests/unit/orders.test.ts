import { describe, expect, it } from "vitest";
import { defaultSettings } from "@/data/demo";
import { baseProducts } from "@/lib/catalog";
import type { CartItem, GiftInfo, Order } from "@/lib/demo/types";
import { applyStatus, createCakeRequest, createOrder, demoOrder, isOpenOrder, nextStatuses, type OrderInput } from "@/lib/orders";
import { buildSlots, wallClock } from "@/lib/slots";

const products = baseProducts();
const settings = defaultSettings;
// Thursday 2026-01-15 10:00 in Casablanca (09:00 UTC)
const NOW = new Date("2026-01-15T09:00:00Z");
const firstSlot = () => buildSlots({ now: wallClock(NOW), hours: settings.hours, leadMinutes: settings.leadMinutes, slotMinutes: settings.slotMinutes })[0].slots[0].value;

const cart = (slug = "croissant-au-beurre", qty = 10): CartItem[] => [{ id: "1", kind: "product", slug, qty }];
const input = (over: Partial<OrderInput> = {}): OrderInput => ({
  items: cart(),
  customer: { name: "Salma B.", phone: "0663206008" },
  method: "pickup",
  slot: firstSlot(),
  locale: "fr",
  ...over,
});
const make = (over: Partial<OrderInput> = {}, seq = 1) => createOrder({ input: input(over), products, settings, seq, now: NOW });

describe("createOrder", () => {
  it("creates a priced pickup order with number, status history and cash payment", () => {
    const r = make();
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.order).toMatchObject({ number: "RR-1001", status: "new", payment: "cash", method: "pickup", subtotal: 60, deliveryFee: 0, total: 60, kind: "order" });
    expect(r.order.history).toHaveLength(1);
    expect(r.order.lines[0]).toMatchObject({ label: "Croissant au Beurre", qty: 10, unitPrice: 6 });
  });

  it("adds the delivery fee below the free threshold and none above", () => {
    const small = make({ method: "delivery", address: "12 rue Ibn Khaldoun, Meknès" });
    expect(small.ok && small.order.deliveryFee).toBe(20);
    const big = make({ method: "delivery", address: "12 rue Ibn Khaldoun, Meknès", items: cart("mille-feuille", 12) });
    expect(big.ok && big.order.deliveryFee).toBe(0);
    expect(big.ok && big.order.total).toBe(216);
  });

  it("never trusts prices from the client: only slugs and quantities are used", () => {
    const tampered = [{ id: "1", kind: "product", slug: "mille-feuille", qty: 1, unitPrice: 0.01, price: 0 } as unknown as CartItem];
    const r = make({ items: tampered });
    expect(r.ok && r.order.total).toBe(18);
  });

  it("validates the customer", () => {
    expect(make({ customer: { name: "A", phone: "0663206008" } })).toMatchObject({ ok: false, error: "name" });
    expect(make({ customer: { name: "Salma", phone: "abc" } })).toMatchObject({ ok: false, error: "phone" });
    expect(make({ customer: { name: "Salma", phone: "0663206008", email: "nope" } })).toMatchObject({ ok: false, error: "email" });
  });

  it("requires a real, currently offered slot", () => {
    expect(make({ slot: undefined })).toMatchObject({ ok: false, error: "slot" });
    expect(make({ slot: "2026-01-15T09:00" })).toMatchObject({ ok: false, error: "slot" }); // inside the lead time
    expect(make({ slot: "2026-01-15T23:30" })).toMatchObject({ ok: false, error: "slot" }); // after closing
  });

  it("requires an address for delivery and enforces the delivery minimum", () => {
    expect(make({ method: "delivery", address: "" })).toMatchObject({ ok: false, error: "address" });
    const r = make({ method: "delivery", address: "12 rue Ibn Khaldoun, Meknès", items: cart("baguette", 2) });
    expect(r).toMatchObject({ ok: false, error: "below_minimum" });
    // pickup has no minimum
    expect(make({ items: cart("baguette", 2) }).ok).toBe(true);
  });

  it("rejects an empty cart and unavailable products", () => {
    expect(make({ items: [] })).toMatchObject({ ok: false, error: "empty" });
    expect(make({ items: cart("eclair-au-chocolat", 3) })).toMatchObject({ ok: false, error: "unavailable" });
  });

  it("handles gifts: delivery only, recipient details required, delivered to the recipient", () => {
    const gift: GiftInfo = { recipientName: "Imane", recipientPhone: "0661000000", address: "5 Hay Salam, Meknès", message: "Bon anniversaire", cardStyle: "ribbon", senderName: "Salma" };
    expect(make({ gift })).toMatchObject({ ok: false, error: "gift_needs_delivery" });
    expect(make({ gift: { ...gift, recipientPhone: "x" }, method: "delivery" })).toMatchObject({ ok: false, error: "gift" });
    const ok = make({ gift, method: "delivery", items: cart("mille-feuille", 12) });
    expect(ok.ok && ok.order).toMatchObject({ kind: "gift", address: "5 Hay Salam, Meknès" });
  });
});

describe("createCakeRequest", () => {
  const spec = { occasion: "birthday", servings: 10, flavor: "vanilla", filling: "cream", frosting: "buttercream", decorations: ["ribbon"], dedication: "Joyeux anniversaire", date: "2026-01-25", budget: "b3", estimateLow: 300, estimateHigh: 400 };
  const customer = { name: "Salma B.", phone: "0663206008" };
  const run = (s = spec) => createCakeRequest({ spec: s, customer, locale: "fr", settings, seq: 5, now: NOW });

  it("creates an unpaid quote request with a French summary", () => {
    const r = run();
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.order).toMatchObject({ kind: "cake", total: 0, status: "new", number: "RR-1005" });
    expect(r.order.cake!.summary).toContain("Anniversaire");
    expect(r.order.cake!.summary).toContain("Joyeux anniversaire");
  });
  it("enforces the cake lead time", () => {
    // lead 3 days from 2026-01-15 => earliest 2026-01-18
    expect(run({ ...spec, date: "2026-01-17" })).toMatchObject({ ok: false, error: "cake_date" });
    expect(run({ ...spec, date: "2026-01-18" }).ok).toBe(true);
    expect(run({ ...spec, date: "" })).toMatchObject({ ok: false, error: "cake_date" });
  });
  it("rejects an unknown size and an overlong dedication", () => {
    expect(run({ ...spec, servings: 7 })).toMatchObject({ ok: false, error: "cake_spec" });
    expect(run({ ...spec, dedication: "x".repeat(81) })).toMatchObject({ ok: false, error: "cake_spec" });
  });
});

describe("status workflow", () => {
  const order = (method: "pickup" | "delivery", status: Order["status"] = "new") => ({ status, method }) as Order;

  it("walks pickup orders through ready and delivery orders through out_for_delivery", () => {
    expect(nextStatuses(order("pickup"))).toEqual(["confirmed", "cancelled"]);
    expect(nextStatuses(order("pickup", "preparing"))).toEqual(["ready", "cancelled"]);
    expect(nextStatuses(order("delivery", "preparing"))).toEqual(["out_for_delivery", "cancelled"]);
    expect(nextStatuses(order("pickup", "ready"))).toEqual(["completed", "cancelled"]);
  });
  it("has no way out of completed or cancelled", () => {
    expect(nextStatuses(order("pickup", "completed"))).toEqual([]);
    expect(nextStatuses(order("pickup", "cancelled"))).toEqual([]);
    expect(isOpenOrder({ status: "completed" })).toBe(false);
    expect(isOpenOrder({ status: "preparing" })).toBe(true);
  });
  it("records history and refuses skipped or backward transitions", () => {
    const r = make();
    if (!r.ok) throw new Error("setup");
    const confirmed = applyStatus(r.order, "confirmed", NOW, " ok ");
    expect(confirmed.status).toBe("confirmed");
    expect(confirmed.history.map((h) => h.status)).toEqual(["new", "confirmed"]);
    expect(confirmed.history[1].note).toBe("ok");
    expect(() => applyStatus(r.order, "ready")).toThrow();
    expect(() => applyStatus(confirmed, "new")).toThrow();
  });
});

describe("demoOrder", () => {
  const seeded = (n: number) => () => ((n = (n * 9301 + 49297) % 233280) / 233280);
  it("builds a valid order that can be walked to the requested status", () => {
    const o = demoOrder({ seq: 3, now: NOW, settings, products, rand: seeded(1), status: "ready", ageMinutes: 55 });
    expect(o.simulated).toBe(true);
    expect(o.number).toBe("RR-1003");
    expect(o.lines.length).toBeGreaterThan(0);
    expect(o.total).toBeGreaterThan(0);
    expect(new Date(o.createdAt).getTime()).toBe(NOW.getTime() - 55 * 60_000);
    // "ready" means ready for pickup, or out for delivery for a delivery order: never overshoots
    expect(o.status).toBe(o.method === "delivery" ? "out_for_delivery" : "ready");
  });
  it("stops exactly at every requested status for both fulfilment methods", () => {
    for (let seed = 1; seed <= 12; seed++) {
      for (const status of ["new", "confirmed", "preparing", "completed"] as const) {
        const o = demoOrder({ seq: seed, now: NOW, settings, products, rand: seeded(seed), status });
        expect(o.status, `seed ${seed} ${o.method}`).toBe(status);
      }
    }
  });
  it("never includes a product without a price", () => {
    const o = demoOrder({ seq: 1, now: NOW, settings, products: products.map((p) => (p.slug === "baguette" ? { ...p, priceMad: null } : p)), rand: seeded(7) });
    expect(o.lines.every((l) => l.unitPrice > 0)).toBe(true);
  });
});
