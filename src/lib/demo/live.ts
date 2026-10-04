import { isDemo } from "@/lib/demo/config";
import type { Order } from "@/lib/demo/types";

/** Browser side of the shared demo order list. Failures are silent: the local copy always works. */

const ENDPOINT = "/api/live/orders";

/** Orders made by the simulator or the demo seed stay on the device. */
export const isShared = (o: Order) => isDemo && !o.simulated;

export async function pushOrder(order: Order, retry = true): Promise<void> {
  if (!isShared(order)) return;
  try {
    const res = await fetch(ENDPOINT, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(order), keepalive: true });
    if (!res.ok && res.status >= 500 && retry) setTimeout(() => void pushOrder(order, false), 1500);
  } catch {
    if (retry) setTimeout(() => void pushOrder(order, false), 1500);
  }
}

/** Reserves the next order number from the server; null when it cannot be reached (the device then numbers locally). */
export async function reserveSeq(): Promise<number | null> {
  if (!isDemo) return null;
  try {
    const res = await fetch("/api/live/seq", { method: "POST", signal: AbortSignal.timeout(2500) });
    if (!res.ok) return null;
    const { seq } = (await res.json()) as { seq?: number };
    return Number.isInteger(seq) ? (seq as number) : null;
  } catch {
    return null;
  }
}

export async function pullOrders(etag: string | null): Promise<{ orders: Order[]; etag: string | null } | "same" | null> {
  try {
    const res = await fetch(ENDPOINT, { cache: "no-store", headers: etag ? { "if-none-match": etag } : {} });
    if (res.status === 304) return "same";
    if (!res.ok) return null;
    const data = (await res.json()) as { orders: Order[] };
    return { orders: data.orders, etag: res.headers.get("etag") };
  } catch {
    return null;
  }
}
