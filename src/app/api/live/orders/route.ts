import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { listOrders, persistent, upsertOrder } from "@/lib/server/liveOrders";
import { clientIp, rateLimit } from "@/lib/server/security";
import type { Order } from "@/lib/demo/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 200_000; // a cake request can carry a small photo
const STATUSES = ["new", "confirmed", "preparing", "ready", "out_for_delivery", "completed", "cancelled"] as const;

const orderSchema = z
  .object({
    id: z.string().regex(/^[A-Za-z0-9_-]{3,64}$/),
    number: z.string().max(20),
    createdAt: z.iso.datetime(),
    kind: z.string().max(20),
    status: z.enum(STATUSES),
    history: z.array(z.object({ status: z.enum(STATUSES), at: z.string().max(40), note: z.string().max(500).optional() })).min(1).max(30),
    customer: z.object({ name: z.string().max(120), phone: z.string().max(40), email: z.string().max(160).optional() }),
    lines: z.array(z.unknown()).max(80),
    subtotal: z.number(),
    total: z.number(),
  })
  .loose();

const json = (body: unknown, status = 200, headers?: Record<string, string>) =>
  NextResponse.json(body, { status, headers: { "cache-control": "no-store", ...headers } });

/** Demo only: a real launch (demo off) uses the real back end instead, so this route disappears. */
const off = () => process.env.NEXT_PUBLIC_DEMO_MODE === "0";

/** A cheap fingerprint of the list, so an idle poll can be answered with 304. */
const fingerprint = (orders: Order[]) =>
  `"${orders.length}-${orders.reduce((n, o) => n + o.history.length, 0)}-${orders[0]?.id ?? ""}-${orders[orders.length - 1]?.id ?? ""}"`;

/** GET /api/live/orders → {orders, persistent}. Honours If-None-Match. */
export async function GET(req: NextRequest) {
  if (off()) return json({ error: "not_found" }, 404);
  if (!rateLimit(`live-get:${clientIp(req.headers)}`, { limit: 240, windowMs: 60_000 }).ok) return json({ error: "rate_limited" }, 429);
  try {
    const orders = await listOrders();
    const tag = fingerprint(orders);
    if (req.headers.get("if-none-match") === tag) return new NextResponse(null, { status: 304, headers: { etag: tag, "cache-control": "no-store" } });
    return json({ orders, persistent }, 200, { etag: tag });
  } catch {
    return json({ error: "unavailable" }, 503);
  }
}

/** POST /api/live/orders with one order → {ok, result, persistent}. */
export async function POST(req: NextRequest) {
  if (off()) return json({ error: "not_found" }, 404);
  if (!req.headers.get("content-type")?.includes("application/json")) return json({ error: "unsupported_media_type" }, 415);
  if (Number(req.headers.get("content-length")) > MAX_BODY_BYTES) return json({ error: "too_large" }, 413);
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return json({ error: "too_large" }, 413);

  if (!rateLimit(`live-post:${clientIp(req.headers)}`, { limit: 60, windowMs: 60_000 }).ok) return json({ error: "rate_limited" }, 429);

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "invalid" }, 400);
  }
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) return json({ error: "invalid" }, 400);

  try {
    const result = await upsertOrder(parsed.data as unknown as Order);
    if (result === "full") return json({ error: "full" }, 507);
    return json({ ok: true, result, persistent });
  } catch {
    return json({ error: "unavailable" }, 503);
  }
}
