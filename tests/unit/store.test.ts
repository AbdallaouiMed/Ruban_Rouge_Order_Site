import { beforeEach, describe, expect, it } from "vitest";
import { useCart, useDemoData } from "@/lib/demo/store";
import { buildSlots, wallClock } from "@/lib/slots";

const reset = () => {
  useCart.setState({ items: [], gift: null });
  useDemoData.getState().resetAll();
};

describe("cart store", () => {
  beforeEach(reset);

  it("merges plain products and keeps noted ones on their own line", () => {
    const { add } = useCart.getState();
    add({ kind: "product", slug: "baguette", qty: 1 });
    add({ kind: "product", slug: "baguette", qty: 2 });
    add({ kind: "product", slug: "baguette", qty: 1, note: "bien cuite" });
    const items = useCart.getState().items;
    expect(items).toHaveLength(2);
    expect(items.find((i) => !i.note)!.qty).toBe(3);
  });

  it("clamps quantities to 1..99 and edits lines", () => {
    useCart.getState().add({ kind: "product", slug: "baguette", qty: 500 });
    const id = useCart.getState().items[0].id;
    expect(useCart.getState().items[0].qty).toBe(99);
    useCart.getState().setQty(id, 0);
    expect(useCart.getState().items[0].qty).toBe(1);
    useCart.getState().setNote(id, "x".repeat(300));
    expect(useCart.getState().items[0].note).toHaveLength(200);
    useCart.getState().remove(id);
    expect(useCart.getState().items).toHaveLength(0);
  });

  it("clear() also drops the gift", () => {
    useCart.getState().setGift({ recipientName: "Imane", recipientPhone: "0661000000", address: "5 Hay Salam", message: "Hello", cardStyle: "classic", senderName: "Salma" });
    useCart.getState().clear();
    expect(useCart.getState().gift).toBeNull();
  });
});

describe("demo data store", () => {
  beforeEach(reset);

  const slot = () => {
    const s = useDemoData.getState().settings;
    return buildSlots({ now: wallClock(), hours: s.hours, leadMinutes: s.leadMinutes, slotMinutes: s.slotMinutes })[0].slots[0].value;
  };

  it("seeds a realistic set of orders exactly once", () => {
    useDemoData.getState().seedIfEmpty();
    const s = useDemoData.getState();
    expect(s.orders).toHaveLength(6);
    expect(s.seeded).toBe(true);
    expect(new Set(s.orders.map((o) => o.status)).size).toBeGreaterThan(3);
    s.seedIfEmpty();
    expect(useDemoData.getState().orders).toHaveLength(6);
  });

  it("places an order, numbering it and putting it first", () => {
    const r = useDemoData.getState().placeOrder({
      items: [{ id: "1", kind: "product", slug: "mille-feuille", qty: 5 }],
      customer: { name: "Salma B.", phone: "0663206008" },
      method: "pickup",
      slot: slot(),
      locale: "fr",
    });
    expect(r.ok).toBe(true);
    const s = useDemoData.getState();
    expect(s.orders[0].number).toBe("RR-1001");
    expect(s.orders[0].total).toBe(90);
    expect(s.seq).toBe(1);
  });

  it("does not store or number a rejected order", () => {
    const r = useDemoData.getState().placeOrder({ items: [], customer: { name: "Salma B.", phone: "0663206008" }, method: "pickup", slot: slot(), locale: "fr" });
    expect(r).toMatchObject({ ok: false, error: "empty" });
    expect(useDemoData.getState().orders).toHaveLength(0);
    expect(useDemoData.getState().seq).toBe(0);
  });

  it("applies admin price edits to new orders immediately", () => {
    useDemoData.getState().setOverride("mille-feuille", { priceMad: 25 });
    const r = useDemoData.getState().placeOrder({ items: [{ id: "1", kind: "product", slug: "mille-feuille", qty: 2 }], customer: { name: "Salma B.", phone: "0663206008" }, method: "pickup", slot: slot(), locale: "fr" });
    expect(r.ok && r.order.total).toBe(50);
  });

  it("blocks ordering a product the admin marked sold out", () => {
    useDemoData.getState().setOverride("croissant-au-beurre", { soldOut: true });
    const r = useDemoData.getState().placeOrder({ items: [{ id: "1", kind: "product", slug: "croissant-au-beurre", qty: 2 }], customer: { name: "Salma B.", phone: "0663206008" }, method: "pickup", slot: slot(), locale: "fr" });
    expect(r).toMatchObject({ ok: false, error: "unavailable" });
  });

  it("moves an order through the workflow and ignores an invalid jump", () => {
    const o = useDemoData.getState().simulateOrder();
    useDemoData.getState().setStatus(o.id, "ready"); // invalid from "new"
    expect(useDemoData.getState().orders[0].status).toBe("new");
    useDemoData.getState().setStatus(o.id, "confirmed");
    useDemoData.getState().setStatus(o.id, "cancelled", "épuisé");
    const final = useDemoData.getState().orders[0];
    expect(final.status).toBe("cancelled");
    expect(final.history.at(-1)!.note).toBe("épuisé");
  });

  it("keeps only the 200 newest orders so browser storage cannot fill up", () => {
    for (let i = 0; i < 205; i++) useDemoData.getState().simulateOrder();
    const { orders, seq } = useDemoData.getState();
    expect(orders).toHaveLength(200);
    expect(seq).toBe(205); // numbering keeps counting
    expect(orders[0].number).toBe("RR-1205");
  });

  it("replaces and removes site images and overrides", () => {
    const s = useDemoData.getState();
    s.setSiteImage("hero", "data:image/jpeg;base64,AAAA");
    expect(useDemoData.getState().siteImages.hero).toBeDefined();
    s.setSiteImage("hero", null);
    expect(useDemoData.getState().siteImages.hero).toBeUndefined();
    s.setOverride("baguette", { priceMad: 3 });
    s.setOverride("baguette", null);
    expect(useDemoData.getState().overrides.baguette).toBeUndefined();
  });

  it("creates a cake request as an unpaid order", () => {
    const wc = wallClock();
    const date = new Date(Date.UTC(wc.y, wc.m - 1, wc.d + 10)).toISOString().slice(0, 10);
    const r = useDemoData.getState().placeCakeRequest({
      spec: { occasion: "birthday", servings: 10, flavor: "vanilla", filling: "cream", frosting: "buttercream", decorations: [], dedication: "", date, budget: "b2", estimateLow: 300, estimateHigh: 400 },
      customer: { name: "Salma B.", phone: "0663206008" },
      locale: "fr",
    });
    expect(r.ok && r.order.kind).toBe("cake");
    expect(useDemoData.getState().orders).toHaveLength(1);
  });
});
