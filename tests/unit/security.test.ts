import { describe, expect, it } from "vitest";
import { clientIp, escapeHtml, rateLimit, singleLine } from "@/lib/server/security";

describe("escapeHtml", () => {
  it("neutralises markup and attribute breakouts", () => {
    expect(escapeHtml(`<img src=x onerror="alert('x')">&`)).toBe("&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;&amp;");
  });
});

describe("singleLine", () => {
  it("removes CR/LF so values cannot inject email headers", () => {
    expect(singleLine("Bob\r\nBcc: evil@example.com")).toBe("Bob Bcc: evil@example.com");
  });
});

describe("rateLimit", () => {
  it("allows up to the limit then blocks with a retry hint", () => {
    const key = `t-${Math.random()}`;
    for (let i = 0; i < 3; i++) expect(rateLimit(key, { limit: 3, windowMs: 60_000 }).ok).toBe(true);
    const blocked = rateLimit(key, { limit: 3, windowMs: 60_000 });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("tracks keys independently", () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    rateLimit(a, { limit: 1, windowMs: 60_000 });
    expect(rateLimit(a, { limit: 1, windowMs: 60_000 }).ok).toBe(false);
    expect(rateLimit(b, { limit: 1, windowMs: 60_000 }).ok).toBe(true);
  });
});

describe("clientIp", () => {
  it("uses the first forwarded address", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe("1.2.3.4");
  });
  it("falls back to unknown", () => {
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
