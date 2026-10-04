import { expect, test, type Page } from "@playwright/test";
import { addToCart, criticalOnly } from "./helpers";

criticalOnly();

/** The language switch lives in the header on wide screens and in the menu on phones. */
async function switchTo(page: Page, label: "FR" | "EN" | "ع") {
  const burger = page.getByRole("button", { name: /Ouvrir le menu|Open menu|فتح القائمة/ });
  if (await burger.isVisible()) await burger.click();
  await page.locator("#mobile-nav:visible, header").first().getByRole("link", { name: label, exact: true }).first().click();
}

test("switching to Arabic flips the page to right-to-left and keeps the same page", async ({ page }) => {
  await page.goto("/fr/menu?cat=viennoiseries");
  await switchTo(page, "ع");
  await expect(page).toHaveURL(/\/ar\/menu/);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("منتجاتنا");
  await expect(page.getByRole("article").first()).toBeVisible();
  // No horizontal scroll in RTL
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});

test("switching to English and back to French", async ({ page }) => {
  await page.goto("/fr/box");
  await switchTo(page, "EN");
  await expect(page).toHaveURL(/\/en\/box$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Build your own box");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await switchTo(page, "FR");
  await expect(page).toHaveURL(/\/fr\/box$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Composez votre boîte");
});

test("the cart and its content follow the language", async ({ page }) => {
  await page.goto("/fr/menu");
  await addToCart(page, "Croissant au Beurre");
  await page.goto("/ar/menu");
  await expect(page.getByRole("button", { name: /^السلة \(1\)/ })).toBeVisible();
  await page.getByRole("button", { name: /^السلة/ }).click();
  const drawer = page.getByRole("dialog", { name: "سلتك" });
  await expect(drawer.getByText("كرواسان بالزبدة")).toBeVisible();
  await expect(drawer.locator("strong")).toContainText("6 د.م.");

  await page.goto("/en/menu");
  await openCartEn(page);
  await expect(page.getByRole("dialog", { name: "Your cart" }).getByText("Butter croissant")).toBeVisible();
});

async function openCartEn(page: Page) {
  await page.getByRole("button", { name: /^Cart/ }).click();
}

test("checkout works in Arabic: slots, validation messages and confirmation", async ({ page }) => {
  await page.goto("/ar/menu");
  await page.getByRole("button", { name: /أضف كرواسان بالزبدة/ }).click();
  await page.goto("/ar/checkout");
  await page.getByRole("button", { name: "تأكيد الطلب" }).click();
  await expect(page.getByRole("alert").first()).toContainText(/اختر|أدخل/);

  await page.getByRole("group", { name: "اختر الوقت" }).getByRole("button").first().click();
  await page.getByLabel(/الاسم الكامل/).fill("سلمى بنعلي");
  await page.getByLabel(/الهاتف/).fill("0663206008");
  await page.getByRole("button", { name: "تأكيد الطلب" }).click();
  await page.waitForURL(/\/ar\/order\//);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("شكرًا");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});

test("every locale serves hreflang alternates and a canonical link", async ({ page }) => {
  await page.goto("/ar/story");
  const alternates = await page.locator('link[rel="alternate"][hreflang]').evaluateAll((els) => els.map((e) => e.getAttribute("hreflang")));
  expect(alternates).toEqual(expect.arrayContaining(["fr", "ar", "en", "x-default"]));
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/ar\/story$/);
});

test("unknown product pages show the friendly not-found page inside the site", async ({ page }) => {
  const res = await page.goto("/fr/menu/does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Page introuvable" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Retour à l'accueil" })).toBeVisible();
});
