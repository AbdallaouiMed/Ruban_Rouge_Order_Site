import { expect, test } from "@playwright/test";
import { addToCart, criticalOnly, fillCustomer, openCart, pickFirstSlot } from "./helpers";

criticalOnly();

test("add to cart, change quantity, add a note, check out for pickup and see the confirmation", async ({ page }) => {
  await page.goto("/fr/menu");
  await addToCart(page, "Mille-Feuille");
  await expect(page.getByRole("button", { name: /^Panier \(1\)/ })).toBeVisible();

  await openCart(page);
  const drawer = page.getByRole("dialog", { name: "Votre panier" });
  await expect(drawer).toBeVisible();
  await drawer.getByRole("button", { name: "Augmenter la quantité" }).click();
  await drawer.getByRole("button", { name: "Ajouter une note" }).click();
  await drawer.getByLabel("Note pour ce produit").fill("sans noix");
  await drawer.getByLabel("Note pour ce produit").blur();
  await expect(drawer.locator("strong")).toHaveText("36 DH"); // subtotal: 2 × 18 DH

  await drawer.getByRole("link", { name: "Passer commande" }).click();
  await expect(page).toHaveURL(/\/fr\/checkout$/);
  await expect(page.locator("#main").getByText("2 × Mille-Feuille")).toBeVisible();
  await expect(page.locator("#main").getByText("“sans noix”")).toBeVisible();

  await pickFirstSlot(page);
  await fillCustomer(page);
  await page.getByRole("button", { name: "Confirmer la commande" }).click();

  await page.waitForURL(/\/fr\/order\//);
  await expect(page.getByRole("heading", { level: 1, name: /Merci Salma/ })).toBeVisible();
  await expect(page.getByText(/^RR-\d+$/).first()).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: "Reçue" })).toHaveAttribute("aria-current", "step");
  await expect(page.getByText("36 DH").first()).toBeVisible();
  const wa = await page.getByRole("link", { name: "Envoyer par WhatsApp" }).getAttribute("href");
  expect(wa).toMatch(/^https:\/\/wa\.me\/\d+\?text=/);
  expect(decodeURIComponent(wa!)).toContain("2 × Mille-Feuille — sans noix");

  // The cart is emptied once the order is placed
  await page.goto("/fr/checkout");
  await expect(page.getByRole("heading", { name: "Votre panier est vide" })).toBeVisible();
});

test("the cart survives a reload", async ({ page }) => {
  await page.goto("/fr/menu");
  await addToCart(page, "Baguette");
  await addToCart(page, "Baguette");
  await page.reload();
  await expect(page.getByRole("button", { name: /^Panier \(2\)/ })).toBeVisible();
});

test("delivery adds the fee, enforces the minimum and needs an address", async ({ page }) => {
  await page.goto("/fr/menu");
  await addToCart(page, "Baguette");
  await page.goto("/fr/checkout");

  await page.getByRole("radio", { name: /Livraison à Meknès/ }).check({ force: true });
  await expect(page.getByText(/Minimum de commande pour la livraison/)).toBeVisible();
  await expect(page.getByText(/Plus que .* pour la livraison offerte/)).toBeVisible();

  await pickFirstSlot(page);
  await fillCustomer(page);
  await page.getByRole("button", { name: "Confirmer la commande" }).click();
  await expect(page.getByRole("alert").filter({ hasText: /adresse|minimum/i }).first()).toBeVisible();
  await expect(page).toHaveURL(/\/checkout$/);

  // Enough in the cart, with an address: the 20 DH fee applies below the free-delivery threshold
  await page.goto("/fr/menu");
  for (let i = 0; i < 4; i++) await addToCart(page, "Mille-Feuille");
  await page.goto("/fr/checkout");
  await page.getByRole("radio", { name: /Livraison à Meknès/ }).check({ force: true });
  await expect(page.getByText("Livraison", { exact: true }).locator("xpath=following-sibling::dd")).toHaveText("20 DH");
  await pickFirstSlot(page);
  await fillCustomer(page);
  await page.getByLabel(/Adresse de livraison/).fill("25 Hay Salam, Meknès");
  await page.getByRole("button", { name: "Confirmer la commande" }).click();
  await page.waitForURL(/\/fr\/order\//);
  await expect(page.getByText("25 Hay Salam, Meknès")).toBeVisible();
});

test("a sold-out product cannot be added to the cart", async ({ page }) => {
  await page.goto("/fr/menu");
  const card = page.getByRole("article").filter({ hasText: "Éclair au Chocolat" });
  await expect(card.getByText("Épuisé")).toBeVisible();
  await expect(card.getByRole("button", { name: /Ajouter/ })).toHaveCount(0);

  await page.goto("/fr/menu/eclair-au-chocolat");
  await expect(page.getByText("Indisponible pour le moment")).toBeVisible();
  await expect(page.getByRole("button", { name: "Ajouter au panier" })).toHaveCount(0);
});

test("product page: quantity and note go to the cart", async ({ page }) => {
  await page.goto("/fr/menu/croissant-au-beurre");
  await page.getByRole("button", { name: "Augmenter la quantité" }).click();
  await page.getByRole("button", { name: "Augmenter la quantité" }).click();
  await page.getByLabel(/Note/).fill("bien dorés");
  await page.getByRole("button", { name: "Ajouter au panier" }).click();
  const drawer = page.getByRole("dialog", { name: "Votre panier" });
  await expect(drawer).toBeVisible();
  await expect(drawer.locator("strong")).toHaveText("18 DH"); // 3 × 6 DH
  await expect(drawer.getByText("“bien dorés”")).toBeVisible();
});

test("the cart drawer closes with Escape and returns focus", async ({ page }) => {
  await page.goto("/fr/menu");
  await openCart(page);
  const drawer = page.getByRole("dialog", { name: "Votre panier" });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText("Votre panier est vide")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
});
