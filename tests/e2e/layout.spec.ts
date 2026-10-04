import { expect, test, type Page } from "@playwright/test";

/** Puts two croissants in the persisted cart before the page loads. */
const seedCart = (page: Page) =>
  page.addInitScript(() => {
    localStorage.setItem("rr-cart", JSON.stringify({ state: { items: [{ id: "t", kind: "product", slug: "croissant-au-beurre", qty: 2 }], gift: null }, version: 1 }));
  });

// Runs at all four widths (360, 768, 1024, 1440) in every locale.
const paths = ["", "/menu", "/menu/croissant-au-beurre", "/box", "/cakes", "/occasions", "/occasions/wedding", "/gift", "/story", "/contact", "/checkout"];
const adminPaths = ["/admin", "/admin/orders", "/admin/products", "/admin/images", "/admin/settings"];

for (const locale of ["fr", "ar", "en"]) {
  for (const p of paths) {
    test(`${locale}${p || "/"}: no horizontal scroll, no console errors, one h1, readable tap targets`, async ({ page }, testInfo) => {
      const errors: string[] = [];
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      page.on("pageerror", (e) => errors.push(String(e)));

      // Checkout is only a form when the cart has something in it
      if (p === "/checkout") await seedCart(page);
      const res = await page.goto(`/${locale}${p}`);
      expect(res?.status()).toBe(200);
      await page.waitForLoadState("networkidle");

      // On a phone, content wider than the screen makes the browser widen the layout viewport instead of
      // scrolling, so `scrollWidth > innerWidth` alone cannot see it: compare with the device width.
      const width = testInfo.project.use.viewport!.width;
      expect(await page.evaluate(() => ({ inner: window.innerWidth, scroll: document.documentElement.scrollWidth })), "page wider than the screen").toEqual({ inner: width, scroll: width });
      await expect(page.locator("h1")).toHaveCount(1);
      expect(errors).toEqual([]);

      // Header, main content and footer links/buttons should be comfortable to tap (24px is the WCAG minimum; we aim for 40)
      const small = await page.evaluate(() =>
        [...document.querySelectorAll("a, button")]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            const style = getComputedStyle(el);
            const inline = style.display === "inline" && el.closest("p, li, address, span, h1, h2, h3, label");
            return r.width > 0 && r.height > 0 && !inline && !el.closest(".sr-only") && (r.height < 40 || r.width < 40);
          })
          .map((el) => `${el.tagName} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 30)}" ${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`),
      );
      expect(small, `${testInfo.project.name} small targets`).toEqual([]);
    });
  }
}

for (const p of adminPaths) {
  test(`admin ${p}: no horizontal scroll or console errors once signed in`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto("/fr/admin");
    await page.getByLabel("Mot de passe").fill("demo");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await page.goto(`/fr${p}`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toHaveCount(1);
    const width = test.info().project.use.viewport!.width;
    expect(await page.evaluate(() => ({ inner: window.innerWidth, scroll: document.documentElement.scrollWidth })), "page wider than the screen").toEqual({ inner: width, scroll: width });
    expect(errors).toEqual([]);
  });
}

test("desktop navigation fits on one line at 1024 and 1440; phones use the menu", async ({ page }, testInfo) => {
  await page.goto("/fr");
  const links = page.getByRole("navigation", { name: "Navigation principale" }).first().getByRole("link");
  if (testInfo.project.name === "mobile-360" || testInfo.project.name === "tablet-768") {
    await expect(page.getByRole("button", { name: "Ouvrir le menu" })).toBeVisible();
    return;
  }
  const boxes = await links.evaluateAll((els) => els.map((e) => e.getBoundingClientRect()));
  expect(boxes.length).toBe(6);
  const tops = new Set(boxes.map((b) => Math.round(b.top)));
  expect(tops.size, "nav links wrap onto several lines").toBe(1);
  for (const b of boxes) expect(b.height).toBeLessThan(60);
});
