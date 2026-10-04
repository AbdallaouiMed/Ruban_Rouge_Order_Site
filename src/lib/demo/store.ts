"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { defaultSettings } from "@/data/demo";
import { baseProducts, applyOverrides } from "@/lib/catalog";
import { applyStatus, createCakeRequest, createOrder, demoOrder, type CreateResult, type OrderInput } from "@/lib/orders";
import type { CakeSpec, CartItem, GiftInfo, Order, OrderStatus, ProductOverride, Settings, SiteImageSlot } from "@/lib/demo/types";
import { isDemo } from "@/lib/demo/config";
import { pushOrder } from "@/lib/demo/live";
import type { Locale } from "@/i18n/routing";

/** localStorage that never throws; quota errors are surfaced through an event the admin listens to. */
const safeStorage = {
  getItem: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      if (typeof window !== "undefined") window.dispatchEvent(new Event("rr-storage-error"));
    }
  },
  removeItem: (k: string) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  },
};
const storage = createJSONStorage(() => safeStorage);

/** Keep only the newest orders: localStorage is small and cake requests can carry a photo. */
const MAX_ORDERS = 200;
const keepNewest = (orders: Order[]) => orders.slice(0, MAX_ORDERS);

const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}${Math.random().toString(36).slice(2)}`);

/* ---------- hydration flag ---------- */

export const useHydration = create<{ ready: boolean }>(() => ({ ready: false }));

/* ---------- UI (not persisted) ---------- */

export const useUi = create<{ cartOpen: boolean; setCartOpen: (v: boolean) => void }>((set) => ({
  cartOpen: false,
  setCartOpen: (cartOpen) => set({ cartOpen }),
}));

/* ---------- cart ---------- */

interface CartState {
  items: CartItem[];
  gift: GiftInfo | null;
  add: (item: Omit<CartItem, "id">) => void;
  setQty: (id: string, qty: number) => void;
  setNote: (id: string, note: string) => void;
  remove: (id: string) => void;
  setGift: (gift: GiftInfo | null) => void;
  clear: () => void;
}

const MAX_QTY = 99;
const clampQty = (n: number) => Math.max(1, Math.min(MAX_QTY, Math.floor(n) || 1));

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      gift: null,
      add: (item) =>
        set((s) => {
          // Plain products with no note merge into one line
          if (item.kind === "product" && !item.note) {
            const same = s.items.find((i) => i.kind === "product" && i.slug === item.slug && !i.note);
            if (same) return { items: s.items.map((i) => (i.id === same.id ? { ...i, qty: clampQty(i.qty + item.qty) } : i)) };
          }
          return { items: [...s.items, { ...item, id: uid(), qty: clampQty(item.qty) }] };
        }),
      setQty: (id, qty) => set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, qty: clampQty(qty) } : i)) })),
      setNote: (id, note) => set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, note: note.slice(0, 200) } : i)) })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      setGift: (gift) => set({ gift }),
      clear: () => set({ items: [], gift: null }),
    }),
    { name: "rr-cart", version: 1, storage, skipHydration: true },
  ),
);

/* ---------- demo data: admin edits + orders ---------- */

interface DemoData {
  overrides: Record<string, ProductOverride>;
  siteImages: Partial<Record<SiteImageSlot, string>>;
  settings: Settings;
  orders: Order[];
  seq: number;
  seeded: boolean;

  setOverride: (slug: string, patch: ProductOverride | null) => void;
  setSiteImage: (slot: SiteImageSlot, dataUrl: string | null) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  /** `seq` is a number reserved from the server, so devices never share an order number. */
  placeOrder: (input: OrderInput, seq?: number) => CreateResult;
  placeCakeRequest: (args: { spec: Omit<CakeSpec, "summary">; customer: OrderInput["customer"]; locale: Locale; seq?: number }) => CreateResult;
  setStatus: (id: string, status: OrderStatus, note?: string) => void;
  simulateOrder: () => Order;
  /** Merge orders from the shared list: add unknown ones, take a remote copy that has more history. */
  mergeRemote: (remote: Order[]) => void;
  seedIfEmpty: () => void;
  resetAll: () => void;
}

const initial = () => ({ overrides: {}, siteImages: {}, settings: defaultSettings, orders: [] as Order[], seq: 0, seeded: false });

export const useDemoData = create<DemoData>()(
  persist(
    (set, get) => ({
      ...initial(),

      setOverride: (slug, patch) =>
        set((s) => {
          const next = { ...s.overrides };
          if (patch === null) delete next[slug];
          else next[slug] = { ...next[slug], ...patch };
          return { overrides: next };
        }),

      setSiteImage: (slot, dataUrl) =>
        set((s) => {
          const next = { ...s.siteImages };
          if (dataUrl) next[slot] = dataUrl;
          else delete next[slot];
          return { siteImages: next };
        }),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      placeOrder: (input, reserved) => {
        // Without demo mode there is no browser-only fallback: the real back end must take the order.
        if (!isDemo) return { ok: false, error: "offline" };
        const s = get();
        const products = applyOverrides(baseProducts(), s.overrides);
        const seq = Math.max(s.seq + 1, reserved ?? 0);
        const result = createOrder({ input, products, settings: s.settings, seq });
        if (result.ok) {
          set({ orders: keepNewest([result.order, ...s.orders]), seq });
          void pushOrder(result.order);
        }
        return result;
      },

      placeCakeRequest: ({ spec, customer, locale, seq: reserved }) => {
        if (!isDemo) return { ok: false, error: "offline" };
        const s = get();
        const seq = Math.max(s.seq + 1, reserved ?? 0);
        const result = createCakeRequest({ spec, customer, locale, settings: s.settings, seq });
        if (result.ok) {
          set({ orders: keepNewest([result.order, ...s.orders]), seq });
          void pushOrder(result.order);
        }
        return result;
      },

      setStatus: (id, status, note) => {
        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== id) return o;
            try {
              return applyStatus(o, status, new Date(), note);
            } catch {
              return o;
            }
          }),
        }));
        const updated = get().orders.find((o) => o.id === id);
        if (updated) void pushOrder(updated);
      },

      mergeRemote: (remote) => {
        const s = get();
        const byId = new Map(s.orders.map((o) => [o.id, o]));
        let changed = false;
        for (const r of remote) {
          const local = byId.get(r.id);
          if (!local || r.history.length > local.history.length) {
            byId.set(r.id, r);
            changed = true;
          }
        }
        if (!changed) return;
        const orders = keepNewest([...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        // Keep numbering ahead of orders taken on other devices, so this device does not reuse a number.
        const highest = Math.max(0, ...remote.map((r) => Number(r.number.replace(/\D/g, "")) - 1000));
        set({ orders, seq: Math.max(s.seq, highest) });
      },

      simulateOrder: () => {
        const s = get();
        const products = applyOverrides(baseProducts(), s.overrides);
        const order = demoOrder({ seq: s.seq + 1, now: new Date(), settings: s.settings, products });
        set({ orders: keepNewest([order, ...s.orders]), seq: s.seq + 1 });
        return order;
      },

      seedIfEmpty: () => {
        const s = get();
        if (s.seeded || s.orders.length > 0) {
          if (!s.seeded) set({ seeded: true });
          return;
        }
        const products = applyOverrides(baseProducts(), s.overrides);
        const plan: { status: OrderStatus; age: number }[] = [
          { status: "completed", age: 60 * 26 },
          { status: "completed", age: 60 * 20 },
          { status: "ready", age: 55 },
          { status: "preparing", age: 35 },
          { status: "confirmed", age: 20 },
          { status: "new", age: 6 },
        ];
        const now = new Date();
        const orders = plan.map((p, i) => demoOrder({ seq: i + 1, now, settings: s.settings, products, status: p.status, ageMinutes: p.age })).reverse();
        set({ orders, seq: plan.length, seeded: true });
      },

      resetAll: () => set({ ...initial(), seeded: false }),
    }),
    { name: "rr-demo", version: 1, storage, skipHydration: true },
  ),
);
