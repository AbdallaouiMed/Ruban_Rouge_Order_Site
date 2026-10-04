import "server-only";
import type { Order } from "@/lib/demo/types";

/**
 * Shared order list for the public demo, so an order placed on one device reaches the admin on another.
 * Backed by Upstash Redis (REST) when configured (the Vercel Marketplace sets KV_REST_API_URL/TOKEN);
 * otherwise by this server instance's memory, which is only reliable for local runs because serverless
 * instances do not share memory. Entries expire after a day. Demo data only: nothing here is secure storage.
 */
const URL_ = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
const KEY = "rr:live:orders";
const TTL_SECONDS = 24 * 60 * 60;
export const MAX_LIVE_ORDERS = 300;

export const persistent = Boolean(URL_ && TOKEN);

const g = globalThis as unknown as { __rrLive?: Map<string, string> };
const memory = (g.__rrLive ??= new Map<string, string>());

async function redis<T = unknown>(...cmd: (string | number)[]): Promise<T> {
  const res = await fetch(URL_!, {
    method: "POST",
    headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify(cmd),
    cache: "no-store",
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) throw new Error(`redis ${res.status}`);
  return ((await res.json()) as { result: T }).result;
}

const SEQ_KEY = "rr:live:seq";
const SEQ_BASE = 6; // the six demo orders on every device are RR-1001 to RR-1006
const seqMemory = globalThis as unknown as { __rrLiveSeq?: number };

/** Next order sequence number, unique across devices when Redis is configured. */
export async function nextSeq(): Promise<number> {
  if (persistent) {
    const n = await redis<number>("INCR", SEQ_KEY);
    await redis("EXPIRE", SEQ_KEY, TTL_SECONDS);
    return SEQ_BASE + n;
  }
  seqMemory.__rrLiveSeq = (seqMemory.__rrLiveSeq ?? 0) + 1;
  return SEQ_BASE + seqMemory.__rrLiveSeq;
}

export async function listOrders(): Promise<Order[]> {
  const raw = persistent ? await redis<string[]>("HVALS", KEY) : [...memory.values()];
  const orders: Order[] = [];
  for (const r of raw) {
    try {
      orders.push(JSON.parse(r) as Order);
    } catch {
      /* skip a corrupt entry */
    }
  }
  return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, MAX_LIVE_ORDERS);
}

/** Insert or update. An update only wins if it carries at least as much history as what is stored. */
export async function upsertOrder(order: Order): Promise<"stored" | "stale" | "full"> {
  const existingRaw = persistent ? await redis<string | null>("HGET", KEY, order.id) : (memory.get(order.id) ?? null);
  if (existingRaw) {
    try {
      if ((JSON.parse(existingRaw) as Order).history.length > order.history.length) return "stale";
    } catch {
      /* overwrite a corrupt entry */
    }
  } else {
    const size = persistent ? await redis<number>("HLEN", KEY) : memory.size;
    if (size >= MAX_LIVE_ORDERS) return "full";
  }
  const value = JSON.stringify(order);
  if (persistent) {
    await redis("HSET", KEY, order.id, value);
    await redis("EXPIRE", KEY, TTL_SECONDS);
  } else {
    memory.set(order.id, value);
  }
  return "stored";
}
