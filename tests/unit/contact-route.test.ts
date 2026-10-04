import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// Adapters are replaced so the route's decisions can be tested without any network.
const mocks = vi.hoisted(() => ({
  store: { name: "store", configured: true, save: vi.fn() },
  notifier: { name: "notifier", configured: true, send: vi.fn() },
}));
vi.mock("@/lib/server/messaging", () => ({ stores: [mocks.store], notifiers: [mocks.notifier] }));

import { POST } from "@/app/api/contact/route";

const good = { name: "Salma B.", email: "salma@example.com", message: "Bonjour, je voudrais commander un gâteau.", locale: "fr" };
let ipCounter = 0;

const call = (body: unknown, init: { ip?: string; contentType?: string; raw?: string } = {}) =>
  POST(
    new NextRequest("http://localhost/api/contact", {
      method: "POST",
      headers: { "content-type": init.contentType ?? "application/json", "x-forwarded-for": init.ip ?? `10.0.0.${++ipCounter}` },
      body: init.raw ?? JSON.stringify(body),
    }),
  );

beforeEach(() => {
  mocks.store.configured = true;
  mocks.notifier.configured = true;
  mocks.store.save.mockReset().mockResolvedValue(undefined);
  mocks.notifier.send.mockReset().mockResolvedValue(undefined);
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("POST /api/contact", () => {
  it("delivers a valid message to the store and the notifier", async () => {
    const res = await call(good);
    expect(res.status).toBe(200);
    expect(mocks.store.save).toHaveBeenCalledOnce();
    expect(mocks.notifier.send).toHaveBeenCalledOnce();
  });

  it("rejects non-JSON content types with 415", async () => {
    expect((await call("x", { contentType: "text/plain" })).status).toBe(415);
  });

  it("rejects malformed JSON and invalid fields with 400, naming the bad field", async () => {
    expect((await call(null, { raw: "{nope" })).status).toBe(400);
    const res = await call({ ...good, name: "" });
    expect(res.status).toBe(400);
    expect((await res.json()).fields.name).toBe("name");
    expect(mocks.store.save).not.toHaveBeenCalled();
  });

  it("rejects oversized bodies with 413", async () => {
    expect((await call({ ...good, message: "x".repeat(20_000) })).status).toBe(413);
  });

  it("rejects by declared Content-Length without reading the body", async () => {
    const req = new NextRequest("http://localhost/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json", "content-length": "50000", "x-forwarded-for": "198.51.100.7" },
      body: JSON.stringify(good),
    });
    expect((await POST(req)).status).toBe(413);
    expect(mocks.store.save).not.toHaveBeenCalled();
  });

  it("answers a filled honeypot with a fake success and delivers nothing", async () => {
    const res = await call({ ...good, hp_trap: "http://spam.example" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(mocks.store.save).not.toHaveBeenCalled();
    expect(mocks.notifier.send).not.toHaveBeenCalled();
  });

  it("still succeeds when one adapter fails but another delivers", async () => {
    mocks.notifier.send.mockRejectedValue(new Error("resend 500"));
    expect((await call(good)).status).toBe(200);
  });

  it("returns 502 when every adapter fails", async () => {
    mocks.store.save.mockRejectedValue(new Error("db down"));
    mocks.notifier.send.mockRejectedValue(new Error("resend 500"));
    expect((await call(good)).status).toBe(502);
  });

  it("does not leak message content into error logs", async () => {
    mocks.store.save.mockRejectedValue(new Error("db down"));
    mocks.notifier.send.mockRejectedValue(new Error("resend 500"));
    await call(good);
    const logged = JSON.stringify((console.error as unknown as { mock: { calls: unknown[] } }).mock.calls);
    expect(logged).not.toContain("Salma");
    expect(logged).not.toContain("salma@example.com");
    expect(logged).not.toContain("gâteau");
  });

  it("blocks the sixth request from one IP in the window with 429 and Retry-After", async () => {
    const ip = "203.0.113.9";
    for (let i = 0; i < 5; i++) expect((await call(good, { ip })).status).toBe(200);
    const res = await call(good, { ip });
    expect(res.status).toBe(429);
    expect(Number(res.headers.get("retry-after"))).toBeGreaterThan(0);
  });

  it("in demo mode accepts and discards when nothing is configured, even in production without a captcha key", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    mocks.store.configured = false;
    mocks.notifier.configured = false;
    const res = await call(good);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, demo: true });
    expect(mocks.store.save).not.toHaveBeenCalled();
  });

  it("with demo mode off, in development, accepts and discards when nothing is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "0");
    mocks.store.configured = false;
    mocks.notifier.configured = false;
    const res = await call(good);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ dev: true });
  });

  it("in production (demo off) reports 503 not_configured (not a captcha error) when nothing is configured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "0");
    mocks.store.configured = false;
    mocks.notifier.configured = false;
    const res = await call(good);
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "not_configured" });
  });

  it("in production (demo off) refuses submissions when Turnstile is not configured (fail closed)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "0");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    const res = await call(good);
    expect(res.status).toBe(403);
    expect(mocks.store.save).not.toHaveBeenCalled();
  });
});
