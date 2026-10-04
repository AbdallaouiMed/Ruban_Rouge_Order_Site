import { describe, expect, it } from "vitest";
import { baseProducts } from "@/lib/catalog";
import { cakeOccasionFor, houseSelection } from "@/lib/box";
import { occasions, bundles, cakeOptions } from "@/data/demo";
import { formatDay, formatMad, formatSlot } from "@/lib/format";
import { isValidEmail, isValidPhone, toWhatsAppNumber } from "@/lib/validation";
import { customerMessage, orderMessage, whatsAppLink } from "@/lib/whatsapp";
import { createOrder } from "@/lib/orders";
import { defaultSettings } from "@/data/demo";
import { buildSlots, wallClock } from "@/lib/slots";

describe("houseSelection", () => {
  const products = baseProducts();
  it("fills the box exactly, spread over products that can be ordered", () => {
    for (const size of [6, 12, 24] as const) {
      const box = houseSelection(size, products)!;
      expect(box.items.reduce((n, i) => n + i.qty, 0)).toBe(size);
      expect(box.items.some((i) => i.slug === "eclair-au-chocolat")).toBe(false); // sold out in the demo
      const qty = box.items.map((i) => i.qty);
      expect(Math.max(...qty) - Math.min(...qty)).toBeLessThanOrEqual(1);
    }
  });
  it("returns null when nothing can be ordered", () => {
    expect(houseSelection(6, products.map((p) => ({ ...p, priceMad: null })))).toBeNull();
  });
});

describe("demo data integrity", () => {
  it("maps every occasion to a cake occasion that exists", () => {
    for (const o of occasions) expect(cakeOptions.occasions.some((c) => c.id === cakeOccasionFor[o.id]), o.id).toBe(true);
  });
  it("gives every occasion at least one bundle and every bundle a known occasion", () => {
    for (const o of occasions) expect(bundles.some((b) => b.occasion === o.id), o.id).toBe(true);
    for (const b of bundles) expect(occasions.some((o) => o.id === b.occasion), b.id).toBe(true);
  });
  it("has trilingual labels everywhere", () => {
    const labels = [...occasions.flatMap((o) => [o.name, o.blurb]), ...bundles.flatMap((b) => [b.name, b.desc]), ...Object.values(cakeOptions).flatMap((l) => (l as readonly { label?: Record<string, string> }[]).map((x) => x.label).filter(Boolean))];
    for (const l of labels) for (const loc of ["fr", "en", "ar"]) expect((l as Record<string, string>)[loc]?.trim(), JSON.stringify(l)).toBeTruthy();
  });
});

describe("format", () => {
  it("formats prices with Latin digits and the right currency", () => {
    expect(formatMad(1250, "fr")).toMatch(/^1\D?250 DH$/);
    expect(formatMad(12.5, "en")).toBe("12.5 DH");
    expect(formatMad(18, "ar")).toBe("18 د.م.");
  });
  it("formats wall-clock slots without any timezone shift", () => {
    expect(formatSlot("2026-01-15T11:00", "fr")).toMatch(/jeudi 15 janvier.*11:00/);
    expect(formatSlot("2026-01-15T11:00", "en")).toMatch(/Thursday 15 January.*11:00/);
    expect(formatDay("2026-01-15", "ar")).toMatch(/15/);
  });
});

describe("validation", () => {
  it("accepts and rejects phones and emails", () => {
    expect(isValidPhone("+212 6 63 20 60 08")).toBe(true);
    expect(isValidPhone("0663206008")).toBe(true);
    expect(isValidPhone("123")).toBe(false);
    expect(isValidPhone("06-63-abc-008")).toBe(false);
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("a@b")).toBe(false);
  });
  it("normalises numbers for wa.me", () => {
    expect(toWhatsAppNumber("0663206008")).toBe("212663206008");
    expect(toWhatsAppNumber("+212 6 63 20 60 08")).toBe("212663206008");
    expect(toWhatsAppNumber("00212663206008")).toBe("212663206008");
  });
});

describe("WhatsApp messages", () => {
  const settings = defaultSettings;
  const slot = buildSlots({ now: wallClock(), hours: settings.hours, leadMinutes: settings.leadMinutes, slotMinutes: settings.slotMinutes })[0].slots[0].value;
  const r = createOrder({
    input: { items: [{ id: "1", kind: "product", slug: "croissant-au-beurre", qty: 10, note: "sans noix" }], customer: { name: "Salma B.", phone: "0663206008" }, method: "pickup", slot, locale: "ar" },
    products: baseProducts(),
    settings,
    seq: 7,
  });
  if (!r.ok) throw new Error("setup");

  it("writes the order summary in French for the bakery, whatever the customer's language", () => {
    const m = orderMessage(r.order);
    expect(m).toContain("RR-1007");
    expect(m).toContain("10 × Croissant au Beurre — sans noix");
    expect(m).toContain("Total : 60 DH (paiement à la réception)");
    expect(m).toContain("Retrait en boutique");
    expect(m).toContain("Salma B.");
    expect(m).not.toMatch(/\n\n\n/);
  });
  it("builds a wa.me link with an encoded message", () => {
    const link = whatsAppLink("212663206008", "Bonjour & merci");
    expect(link).toBe("https://wa.me/212663206008?text=Bonjour%20%26%20merci");
  });
  it("tells the customer what happens next at each status", () => {
    expect(customerMessage(r.order, "ready")).toContain("prête");
    expect(customerMessage(r.order, "out_for_delivery")).toContain("en route");
    expect(customerMessage(r.order, "cancelled")).toContain("annulée");
  });
});
