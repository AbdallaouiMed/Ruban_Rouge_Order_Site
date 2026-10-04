import { NextResponse, type NextRequest } from "next/server";
import { contactSchema, fieldErrors } from "@/lib/schemas/contact";
import { notifiers, stores } from "@/lib/server/messaging";
import { clientIp, rateLimit, verifyTurnstile } from "@/lib/server/security";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 10_000;

const json = (body: Record<string, unknown>, status: number, headers?: Record<string, string>) =>
  NextResponse.json(body, { status, headers: { "cache-control": "no-store", ...headers } });

/**
 * POST /api/contact
 * 200 {ok:true} | 400 {error:"invalid",fields} | 403 {error:"captcha"} | 413 | 415 | 429 {error:"rate_limited"} | 502 {error:"delivery_failed"} | 503 {error:"not_configured"}
 */
export async function POST(req: NextRequest) {
  if (!req.headers.get("content-type")?.includes("application/json")) return json({ error: "unsupported_media_type" }, 415);

  // Refuse by declared size before buffering anything, then re-check the real size
  // (the header can be absent or wrong, e.g. chunked uploads).
  if (Number(req.headers.get("content-length")) > MAX_BODY_BYTES) return json({ error: "too_large" }, 413);
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return json({ error: "too_large" }, 413);

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "invalid", fields: {} }, 400);
  }

  const ip = clientIp(req.headers);
  const limited = rateLimit(`contact:${ip}`, { limit: 5, windowMs: 10 * 60_000 });
  if (!limited.ok) return json({ error: "rate_limited" }, 429, { "retry-after": String(limited.retryAfterSec) });

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) return json({ error: "invalid", fields: fieldErrors(parsed.error) }, 400);
  const data = parsed.data;

  // Honeypot filled: pretend success so bots learn nothing.
  if (data.hp_trap) return json({ ok: true }, 200);

  // Configuration first: an unconfigured deployment must say so (503), not blame the visitor's captcha.
  const activeStores = stores.filter((s) => s.configured);
  const activeNotifiers = notifiers.filter((n) => n.configured);
  const nothingConfigured = activeStores.length + activeNotifiers.length === 0;

  // Public demo deploy (demo mode on, nothing configured): accept and discard so the form can be shown to clients.
  // Read per call, not at import, so it follows the environment. Demo off keeps the fail-closed behaviour below.
  if (nothingConfigured && process.env.NEXT_PUBLIC_DEMO_MODE !== "0") {
    console.info("[contact] demo mode: message accepted and discarded");
    return json({ ok: true, demo: true }, 200);
  }

  if (nothingConfigured && process.env.NODE_ENV === "production") return json({ error: "not_configured" }, 503);

  if (!(await verifyTurnstile(data.turnstileToken, ip))) return json({ error: "captcha" }, 403);

  if (nothingConfigured) {
    // Local development with no services configured: accept without delivering, never log message content.
    console.info("[contact] dev mode: no store or notifier configured, message accepted and discarded");
    return json({ ok: true, dev: true }, 200);
  }

  const results = await Promise.allSettled([
    ...activeStores.map((s) => s.save({ ...data, ip })),
    ...activeNotifiers.map((n) => n.send(data)),
  ]);

  results.forEach((r, i) => {
    if (r.status === "rejected") {
      const name = i < activeStores.length ? activeStores[i].name : activeNotifiers[i - activeStores.length].name;
      console.error(`[contact] ${name} failed:`, r.reason instanceof Error ? r.reason.message : "unknown");
    }
  });

  // Success if the owners will see the message through at least one channel.
  return results.some((r) => r.status === "fulfilled") ? json({ ok: true }, 200) : json({ error: "delivery_failed" }, 502);
}
