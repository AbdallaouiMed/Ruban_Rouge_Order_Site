import { expect, test } from "@playwright/test";

// Header and API checks do not depend on the screen size: run once.
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "one project is enough");
});

test("every page sends the security headers, including a Content-Security-Policy", async ({ request }) => {
  for (const path of ["/fr", "/fr/menu", "/ar/checkout", "/fr/admin"]) {
    const res = await request.get(path);
    const h = res.headers();
    expect(h["x-content-type-options"], path).toBe("nosniff");
    expect(h["x-frame-options"], path).toBe("DENY");
    expect(h["referrer-policy"], path).toBe("strict-origin-when-cross-origin");
    expect(h["strict-transport-security"], path).toContain("max-age=");
    expect(h["permissions-policy"], path).toContain("camera=()");
    expect(h["x-powered-by"], path).toBeUndefined();
    const csp = h["content-security-policy"];
    expect(csp, path).toContain("default-src 'self'");
    expect(csp, path).toContain("frame-ancestors 'none'");
    expect(csp, path).toContain("object-src 'none'");
    expect(csp, path).toContain("base-uri 'self'");
  }
});

test("the CSP lets uploaded images (data URLs) and the whole shop work, with no violations", async ({ page }) => {
  const problems: string[] = [];
  page.on("console", (m) => /Content Security Policy|Refused to/i.test(m.text()) && problems.push(m.text()));
  page.on("pageerror", (e) => problems.push(String(e)));
  await page.goto("/fr");
  await page.getByRole("button", { name: "Ajouter Mille-Feuille au panier" }).first().click();
  await page.goto("/fr/admin/images");
  await page.getByLabel("Mot de passe").fill("demo");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.getByLabel("Choisir : Photo principale de l'accueil").setInputFiles({
    name: "hero.png",
    mimeType: "image/png",
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC", "base64"),
  });
  await page.goto("/fr");
  await expect(page.locator("main img[src^='data:image/jpeg']").first()).toBeVisible();
  await page.goto("/fr/contact");
  await page.waitForLoadState("networkidle");
  expect(problems).toEqual([]);
});

test.describe("contact API in a production build", () => {
  const good = { name: "Api Test", email: "a@b.co", message: "Un message de test suffisamment long.", locale: "fr" };
  const post = (request: import("@playwright/test").APIRequestContext, data: unknown, headers: Record<string, string> = {}) =>
    request.post("/api/contact", { data: data as object, headers });

  test("rejects the wrong content type, bad JSON and oversized bodies", async ({ request }) => {
    expect((await request.post("/api/contact", { headers: { "content-type": "text/plain", "x-forwarded-for": "198.51.100.1" }, data: "hello" })).status()).toBe(415);
    expect((await request.post("/api/contact", { headers: { "content-type": "application/json", "x-forwarded-for": "198.51.100.2" }, data: "{nope" })).status()).toBe(400);
    expect((await post(request, { ...good, message: "x".repeat(20_000) }, { "x-forwarded-for": "198.51.100.3" })).status()).toBe(413);
  });

  test("validates fields and reports translation keys, never raw validator text", async ({ request }) => {
    const res = await post(request, { ...good, name: "", email: "bad", message: "x" }, { "x-forwarded-for": "198.51.100.4" });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.fields).toEqual({ name: "name", email: "email", message: "message" });
  });

  test("demo build: without delivery channels it accepts and discards, and says so", async ({ request }) => {
    const res = await post(request, good, { "x-forwarded-for": "198.51.100.5" });
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ ok: true, demo: true });
    expect(res.headers()["cache-control"]).toBe("no-store");
  });

  test("rate-limits one address after five requests with Retry-After", async ({ request }) => {
    const headers = { "x-forwarded-for": "198.51.100.77" };
    for (let i = 0; i < 5; i++) expect((await post(request, good, headers)).status()).not.toBe(429);
    const limited = await post(request, good, headers);
    expect(limited.status()).toBe(429);
    expect(Number(limited.headers()["retry-after"])).toBeGreaterThan(0);
    // another address is unaffected
    expect((await post(request, good, { "x-forwarded-for": "198.51.100.78" })).status()).not.toBe(429);
  });
});

test("the demo admin and checkout are kept out of search results", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  // demo build: nothing is indexed
  expect(robots).toContain("Disallow: /");
  const admin = await (await request.get("/fr/admin")).text();
  expect(admin).toMatch(/<meta name="robots" content="noindex, nofollow"/);
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/fr/menu/mille-feuille");
  expect(sitemap).toContain('hreflang="ar"');
  expect(sitemap).not.toContain("/admin");
  expect(sitemap).not.toContain("/checkout");
});

test("structured data describes the bakery without invented ratings or coordinates", async ({ page }) => {
  await page.goto("/fr");
  const json = JSON.parse((await page.locator('script[type="application/ld+json"]').first().textContent())!);
  expect(json["@type"]).toBe("Bakery");
  expect(json.name).toBe("Ruban Rouge");
  expect(json.address.streetAddress).toContain("Bd des F.A.R.");
  expect(json.openingHoursSpecification).toHaveLength(7);
  expect(json).not.toHaveProperty("aggregateRating");
  expect(json).not.toHaveProperty("geo");
});
