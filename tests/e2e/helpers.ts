import { expect, test, type Page } from "@playwright/test";

/** Critical flows run at the narrowest and widest layouts only (layout.spec.ts covers all four). */
export function criticalOnly() {
  test.beforeEach(({}, testInfo) => {
    test.skip(!["mobile-360", "desktop-1440"].includes(testInfo.project.name), "critical flows run at 360 and 1440");
  });
}

export const addToCart = (page: Page, name: string) => page.getByRole("button", { name: `Ajouter ${name} au panier` }).click();

export const openCart = (page: Page) => page.getByRole("button", { name: /^Panier/ }).click();

export async function pickFirstSlot(page: Page) {
  const times = page.getByRole("group", { name: "Choisir l'heure" });
  await expect(times).toBeVisible();
  await times.getByRole("button").first().click();
}

export async function fillCustomer(page: Page, name = "Salma Benali", phone = "0663206008") {
  await page.getByLabel(/Nom complet/).fill(name);
  await page.getByLabel(/Téléphone/).fill(phone);
}

/** Adds one Mille-Feuille and places a pickup order. Returns the order number. */
export async function placePickupOrder(page: Page, product = "Mille-Feuille") {
  await page.goto("/fr/menu");
  await addToCart(page, product);
  await page.goto("/fr/checkout");
  await pickFirstSlot(page);
  await fillCustomer(page);
  await page.getByRole("button", { name: "Confirmer la commande" }).click();
  await page.waitForURL(/\/fr\/order\//);
  const number = (await page.getByText(/^RR-\d+$/).first().textContent())!.trim();
  return number;
}

export async function adminLogin(page: Page) {
  await page.goto("/fr/admin");
  await page.getByLabel("Mot de passe").fill("demo");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();
}

/** A real (tiny) PNG, for upload tests. */
export const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC",
  "base64",
);
