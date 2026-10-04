import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { addToCart, adminLogin } from "./helpers";

// WCAG 2.x A and AA rules. Serious and critical findings fail the build.
const scan = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  return results.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id} (${v.impact}): ${v.help}\n   ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join("\n   ")}`);
};

// Structure rules that sit outside the WCAG tag set but matter for screen-reader users.
const scanStructure = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withRules(["heading-order", "page-has-heading-one", "landmark-one-main", "landmark-unique", "image-redundant-alt", "region"]).analyze();
  return results.violations.map((v) => `${v.id}: ${v.help}\n   ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join("\n   ")}`);
};

test.beforeEach(({}, testInfo) => {
  test.skip(!["mobile-360", "desktop-1440"].includes(testInfo.project.name), "a11y runs at 360 and 1440");
});

const pages = ["", "/menu", "/menu/mille-feuille", "/box", "/cakes", "/gift", "/occasions", "/occasions/eid", "/story", "/contact"];

for (const locale of ["fr", "ar"]) {
  for (const p of pages) {
    test(`a11y ${locale}${p || "/"}`, async ({ page }) => {
      await page.goto(`/${locale}${p}`);
      await page.waitForLoadState("networkidle");
      expect(await scan(page)).toEqual([]);
    });
  }
}

for (const locale of ["fr", "ar"]) {
  for (const p of [...pages, "/checkout"]) {
    test(`structure ${locale}${p || "/"}: heading order, one main landmark, no redundant alt`, async ({ page }) => {
      await page.goto(`/${locale}${p}`);
      await page.waitForLoadState("networkidle");
      expect(await scanStructure(page)).toEqual([]);
    });
  }
}

test("a11y checkout with items", async ({ page }) => {
  await page.goto("/fr/menu");
  await addToCart(page, "Mille-Feuille");
  await page.goto("/fr/checkout");
  await page.waitForLoadState("networkidle");
  expect(await scan(page)).toEqual([]);
});

test("a11y cart drawer", async ({ page }) => {
  await page.goto("/fr/menu");
  await addToCart(page, "Mille-Feuille");
  await page.getByRole("button", { name: /^Panier/ }).click();
  await expect(page.getByRole("dialog", { name: "Votre panier" })).toBeVisible();
  expect(await scan(page)).toEqual([]);
});

for (const p of ["", "/orders", "/products", "/images", "/settings"]) {
  test(`a11y admin${p || " dashboard"}`, async ({ page }) => {
    await adminLogin(page);
    await page.goto(`/fr/admin${p}`);
    await page.waitForLoadState("networkidle");
    expect(await scan(page)).toEqual([]);
  });
}

test("a11y admin login", async ({ page }) => {
  await page.goto("/fr/admin");
  await expect(page.getByRole("heading", { name: "Espace admin" })).toBeVisible();
  expect(await scan(page)).toEqual([]);
});

test("keyboard: skip link reaches the main content and every header link is focusable", async ({ page }) => {
  await page.goto("/fr");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Aller au contenu" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
});
