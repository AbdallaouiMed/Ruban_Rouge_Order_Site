import { NextResponse, type NextRequest } from "next/server";
import { nextSeq } from "@/lib/server/liveOrders";
import { clientIp, rateLimit } from "@/lib/server/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });

/** POST /api/live/seq -> {seq}: reserves the next order number so two devices never get the same one. Demo only. */
export async function POST(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "0") return json({ error: "not_found" }, 404);
  if (!rateLimit(`live-seq:${clientIp(req.headers)}`, { limit: 30, windowMs: 60_000 }).ok) return json({ error: "rate_limited" }, 429);
  try {
    return json({ seq: await nextSeq() });
  } catch {
    return json({ error: "unavailable" }, 503);
  }
}
