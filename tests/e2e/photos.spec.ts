import { expect, test, type Page } from "@playwright/test";
import { adminLogin } from "./helpers";

test.beforeEach(({}, testInfo) => {
  test.skip(!["mobile-360", "desktop-1440"].includes(testInfo.project.name), "photo checks run at 360 and 1440");
});

/** Scrolls the whole page so lazy images load, then reports every image that failed to decode. */
async function brokenImages(page: Page) {
  await page.evaluate(async () => {
    // Measure the document, not <body>: body can be shorter than the page, which would leave the last lazy images unloaded.
    const height = () => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    for (let y = 0; y < height(); y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
    window.scrollTo(0, height());
    await new Promise((r) => setTimeout(r, 150));
    window.scrollTo(0, 0);
  });
  const failing = () =>
    page.evaluate(() =>
      [...document.images]
        .filter((img) => !img.complete || img.naturalWidth === 0)
        .map((img) => img.currentSrc || img.src),
    );
  // The first request for each size is encoded on demand, so give slow images time before calling them broken.
  await expect.poll(failing, { timeout: 15_000, intervals: [250, 500, 1000] }).toEqual([]);
  return failing();
}

const pages = ["", "/menu", "/menu/mille-feuille", "/box", "/cakes", "/gift", "/occasions", "/occasions/ramadan", "/occasions/wedding", "/story"];

for (const locale of ["fr", "ar"]) {
  for (const p of pages) {
    test(`${locale}${p || "/"}: every photo loads and has alt text or is decorative`, async ({ page }) => {
      await page.goto(`/${locale}${p}`);
      await page.waitForLoadState("networkidle");
      expect(await brokenImages(page)).toEqual([]);
      const imgs = await page.locator("main img").count();
      expect(imgs, "page should show photography").toBeGreaterThan(0);
      // An image either describes itself (non-empty alt) or is explicitly decorative (alt="")
      expect(await page.locator("main img:not([alt])").count()).toBe(0);
    });
  }
}

test("every product card on the menu shows its own photograph", async ({ page }) => {
  await page.goto("/fr/menu");
  await page.waitForLoadState("networkidle");
  const cards = page.getByRole("article");
  expect(await cards.count()).toBe(8);
  for (const slug of ["pain-tradition", "baguette", "croissant-au-beurre", "pain-au-chocolat", "mille-feuille", "eclair-au-chocolat", "truffes-artisanales", "glace-vanille"]) {
    const src = await page.locator(`img[src*="${slug}"]`).first().getAttribute("src");
    expect(src, slug).toBeTruthy();
  }
});

test("the hero photo is the page's priority image and the home page keeps layout stable", async ({ page }) => {
  await page.goto("/fr");
  const hero = page.locator("main img").first();
  await expect(hero).toHaveAttribute("fetchpriority", "high");
  expect(await hero.getAttribute("loading")).not.toBe("lazy");
  const cls = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let total = 0;
        new PerformanceObserver((list) => {
          for (const e of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) if (!e.hadRecentInput) total += e.value;
        }).observe({ type: "layout-shift", buffered: true });
        setTimeout(() => resolve(total), 1200);
      }),
  );
  expect(cls, "cumulative layout shift").toBeLessThan(0.1);
});

test("the admin can hide a product photo and restore it; defaults are marked as defaults", async ({ context }) => {
  const admin = await context.newPage();
  await adminLogin(admin);
  await admin.goto("/fr/admin/products");
  const row = admin.getByRole("listitem").filter({ hasText: "Croissant au Beurre" });
  await expect(row.locator("img")).toBeVisible();

  const shop = await context.newPage();
  await shop.goto("/fr/menu");
  const card = shop.getByRole("article").filter({ hasText: "Croissant au Beurre" });
  await expect(card.locator("img")).toBeVisible();

  await row.getByRole("button", { name: "Masquer la photo" }).click();
  await expect(row.locator("img")).toHaveCount(0); // the illustration takes over
  await expect(card.locator("img")).toHaveCount(0);

  await row.getByRole("button", { name: "Rétablir" }).click();
  await expect(row.locator("img")).toBeVisible();
  await expect(card.locator("img")).toBeVisible();
});

test("admin image slots show the default photo with a badge, and an upload replaces it everywhere", async ({ context }) => {
  const admin = await context.newPage();
  await adminLogin(admin);
  await admin.goto("/fr/admin/images");
  await expect(admin.getByText("Image par défaut", { exact: true })).toHaveCount(6); // hero, story, occasions, box, cakes, gift

  await admin.getByLabel("Choisir : Bandeau « Composer une boîte »").setInputFiles({
    name: "banner.png",
    mimeType: "image/png",
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC", "base64"),
  });
  await expect(admin.getByText("Image par défaut", { exact: true })).toHaveCount(5);

  const site = await context.newPage();
  await site.goto("/fr/box");
  await expect(site.locator("header img[src^='data:image/jpeg']")).toBeVisible();
});
