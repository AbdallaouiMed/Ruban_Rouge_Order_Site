import { cakeOptions } from "@/data/demo";
import { baseProducts, type Product } from "@/lib/catalog";
import type { CakeSpec, CartItem, FulfillmentMethod, GiftInfo, Order, OrderStatus, Settings } from "@/lib/demo/types";
import type { Locale } from "@/i18n/routing";
import { buildLines, computeTotals, PricingError } from "@/lib/pricing";
import { buildSlots, isValidSlot, wallClock, type WallClock } from "@/lib/slots";
import { isValidEmail, isValidPhone } from "@/lib/validation";

export type OrderError =
  | "name"
  | "phone"
  | "email"
  | "address"
  | "slot"
  | "below_minimum"
  | "empty"
  | "unavailable"
  | "gift"
  | "gift_needs_delivery"
  | "cake_date"
  | "cake_spec"
  /** Demo mode is off but no back end is connected yet: refuse rather than lose the order in the browser. */
  | "offline";

export type CreateResult = { ok: true; order: Order } | { ok: false; error: OrderError; detail?: string };

export interface OrderInput {
  items: CartItem[];
  customer: { name: string; phone: string; email?: string };
  method: FulfillmentMethod;
  slot?: string;
  address?: string;
  note?: string;
  gift?: GiftInfo | null;
  locale: Locale;
}

const nowIso = (d: Date) => d.toISOString();

export const orderNumber = (seq: number) => `RR-${1000 + seq}`;

function validCustomer(c: OrderInput["customer"]): OrderError | null {
  if (c.name.trim().length < 2) return "name";
  if (!isValidPhone(c.phone)) return "phone";
  if (c.email && !isValidEmail(c.email)) return "email";
  return null;
}

function base(seq: number, now: Date, partial: Omit<Order, "id" | "number" | "createdAt" | "status" | "history" | "payment">): Order {
  return {
    ...partial,
    id: `o${seq}${now.getTime().toString(36)}`,
    number: orderNumber(seq),
    createdAt: nowIso(now),
    status: "new",
    history: [{ status: "new", at: nowIso(now) }],
    payment: "cash",
  };
}

/**
 * The single place an order is validated and priced. Everything is recomputed from the catalogue and
 * settings; nothing the browser sends about prices is trusted. The real backend runs this same function.
 */
export function createOrder(args: {
  input: OrderInput;
  products: Product[];
  settings: Settings;
  seq: number;
  now?: Date;
}): CreateResult {
  const { input, products, settings, seq } = args;
  const now = args.now ?? new Date();

  const bad = validCustomer(input.customer);
  if (bad) return { ok: false, error: bad };

  if (input.gift) {
    if (input.method !== "delivery") return { ok: false, error: "gift_needs_delivery" };
    const g = input.gift;
    if (g.recipientName.trim().length < 2 || !isValidPhone(g.recipientPhone) || g.address.trim().length < 8 || g.message.length > 300) {
      return { ok: false, error: "gift" };
    }
  }
  if (input.method === "delivery" && (input.address ?? "").trim().length < 8 && !input.gift) return { ok: false, error: "address" };

  const slotDays = buildSlots({ now: wallClock(now), hours: settings.hours, leadMinutes: settings.leadMinutes, slotMinutes: settings.slotMinutes });
  if (!isValidSlot(input.slot, slotDays)) return { ok: false, error: "slot" };

  let lines;
  try {
    lines = buildLines(input.items, products, settings);
  } catch (e) {
    if (e instanceof PricingError) return { ok: false, error: e.code === "empty" ? "empty" : "unavailable", detail: e.detail };
    throw e;
  }

  const subtotal = lines.reduce((n, l) => n + l.unitPrice * l.qty, 0);
  const totals = computeTotals(subtotal, input.method, settings);
  if (totals.belowMinimumBy > 0) return { ok: false, error: "below_minimum", detail: String(totals.belowMinimumBy) };

  const address = input.gift ? input.gift.address.trim() : input.address?.trim();
  return {
    ok: true,
    order: base(seq, now, {
      kind: input.gift ? "gift" : "order",
      customer: { name: input.customer.name.trim(), phone: input.customer.phone.trim(), email: input.customer.email?.trim() || undefined },
      method: input.method,
      slot: input.slot,
      address: input.method === "delivery" ? address : undefined,
      lines,
      subtotal: totals.subtotal,
      deliveryFee: totals.deliveryFee,
      total: totals.total,
      note: input.note?.trim() || undefined,
      gift: input.gift ?? undefined,
      locale: input.locale,
    }),
  };
}

/** A custom-cake request: no payment yet, the bakery replies with a firm quote. */
export function createCakeRequest(args: {
  spec: Omit<CakeSpec, "summary">;
  customer: OrderInput["customer"];
  locale: Locale;
  settings: Settings;
  seq: number;
  now?: Date;
}): CreateResult {
  const { spec, customer, settings, seq, locale } = args;
  const now = args.now ?? new Date();

  const bad = validCustomer(customer);
  if (bad) return { ok: false, error: bad };

  const wc = wallClock(now);
  const earliest = new Date(Date.UTC(wc.y, wc.m - 1, wc.d + settings.cakeLeadDays)).toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(spec.date) || spec.date < earliest) return { ok: false, error: "cake_date", detail: earliest };
  if (!cakeOptions.sizes.some((s) => s.servings === spec.servings) || spec.dedication.length > 80) return { ok: false, error: "cake_spec" };

  const label = (list: readonly { id: string; label: Record<Locale, string> }[], id: string) => list.find((x) => x.id === id)?.label.fr ?? id;
  const summary = [
    `${label(cakeOptions.occasions, spec.occasion)} · ${spec.servings} parts`,
    `${label(cakeOptions.flavors, spec.flavor)} / ${label(cakeOptions.fillings, spec.filling)} / ${label(cakeOptions.frostings, spec.frosting)}`,
    spec.decorations.length ? `Décors: ${spec.decorations.map((d) => label(cakeOptions.decorations, d)).join(", ")}` : "",
    spec.dedication ? `Dédicace: « ${spec.dedication} »` : "",
  ]
    .filter(Boolean)
    .join(" — ");

  return {
    ok: true,
    order: base(seq, now, {
      kind: "cake",
      customer: { name: customer.name.trim(), phone: customer.phone.trim(), email: customer.email?.trim() || undefined },
      method: "pickup",
      slot: `${spec.date}T00:00`,
      lines: [{ label: "Gâteau sur mesure (demande de devis)", qty: 1, unitPrice: 0, details: summary }],
      subtotal: 0,
      deliveryFee: 0,
      total: 0,
      cake: { ...spec, summary },
      locale,
    }),
  };
}

/* ---------- Status workflow ---------- */

export const statusLabelFr: Record<OrderStatus, string> = {
  new: "Nouvelle",
  confirmed: "Confirmée",
  preparing: "En préparation",
  ready: "Prête",
  out_for_delivery: "En livraison",
  completed: "Terminée",
  cancelled: "Annulée",
};

/** Allowed next statuses; "ready" is for pickup and "out_for_delivery" for delivery. */
export function nextStatuses(order: Pick<Order, "status" | "method">): OrderStatus[] {
  switch (order.status) {
    case "new":
      return ["confirmed", "cancelled"];
    case "confirmed":
      return ["preparing", "cancelled"];
    case "preparing":
      return [order.method === "delivery" ? "out_for_delivery" : "ready", "cancelled"];
    case "ready":
    case "out_for_delivery":
      return ["completed", "cancelled"];
    default:
      return [];
  }
}

export function applyStatus(order: Order, status: OrderStatus, now = new Date(), note?: string): Order {
  if (!nextStatuses(order).includes(status)) throw new Error(`Invalid transition ${order.status} -> ${status}`);
  return { ...order, status, history: [...order.history, { status, at: now.toISOString(), note: note?.trim() || undefined }] };
}

export const isOpenOrder = (o: Pick<Order, "status">) => o.status !== "completed" && o.status !== "cancelled";

/* ---------- Demo order generation ---------- */

const demoPeople = ["Salma B.", "Youssef A.", "Khadija M.", "Omar T.", "Imane R.", "Hamza E.", "Nadia L.", "Anas K."];
const demoStreets = ["Av. Mohammed V", "Rue Ibn Khaldoun", "Hay Salam", "Hamria", "Marjane", "Hay Riad"];

/** Builds a plausible demo order. Pure given `rand`, so it can be tested. */
export function demoOrder(args: { seq: number; now: Date; settings: Settings; products?: Product[]; rand?: () => number; status?: OrderStatus; ageMinutes?: number }): Order {
  const { seq, settings } = args;
  const rand = args.rand ?? Math.random;
  const products = (args.products ?? baseProducts()).filter((p) => p.priceMad !== null);
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
  const created = new Date(args.now.getTime() - (args.ageMinutes ?? 0) * 60_000);

  const lineCount = 1 + Math.floor(rand() * 3);
  const chosen = new Set<Product>();
  while (chosen.size < Math.min(lineCount, products.length)) chosen.add(pick(products));
  const items: CartItem[] = [...chosen].map((p, i) => ({ id: `d${seq}-${i}`, kind: "product", slug: p.slug, qty: 1 + Math.floor(rand() * 6) }));
  const method: FulfillmentMethod = rand() < 0.4 ? "delivery" : "pickup";

  const lines = items.map((it) => {
    const p = products.find((x) => x.slug === it.slug)!;
    return { label: p.name.fr, qty: it.qty, unitPrice: p.priceMad!, note: rand() < 0.2 ? "sans noix" : undefined };
  });
  const totals = computeTotals(lines.reduce((n, l) => n + l.qty * l.unitPrice, 0), method, settings);

  const wc: WallClock = wallClock(created);
  const slotMin = Math.min(22 * 60, Math.max(7 * 60, wc.minutes + 90));
  const slotDate = new Date(Date.UTC(wc.y, wc.m - 1, wc.d)).toISOString().slice(0, 10);
  const hh = String(Math.floor(slotMin / 60)).padStart(2, "0");
  const mm = slotMin % 60 < 30 ? "00" : "30";

  const person = pick(demoPeople);
  const order = base(seq, created, {
    kind: "order",
    customer: { name: person, phone: `+2126${String(10000000 + Math.floor(rand() * 89999999))}` },
    method,
    slot: `${slotDate}T${hh}:${mm}`,
    address: method === "delivery" ? `${1 + Math.floor(rand() * 90)} ${pick(demoStreets)}, Meknès` : undefined,
    lines,
    subtotal: totals.subtotal,
    deliveryFee: totals.deliveryFee,
    total: totals.total,
    locale: pick<Locale>(["fr", "fr", "ar", "en"]),
    simulated: true,
  });

  // Walk a demo order forward through the workflow up to the requested status.
  let current = order;
  const path: OrderStatus[] = method === "delivery" ? ["confirmed", "preparing", "out_for_delivery", "completed"] : ["confirmed", "preparing", "ready", "completed"];
  // Delivery orders have no "ready" step and pickup orders no "out_for_delivery": use the equivalent one.
  let target = args.status ?? "new";
  if (target === "ready" && method === "delivery") target = "out_for_delivery";
  if (target === "out_for_delivery" && method === "pickup") target = "ready";
  for (const s of path) {
    if (current.status === target) break;
    current = applyStatus(current, s, new Date(created.getTime() + 5 * 60_000));
  }
  return current;
}
