import { expect, test } from "@playwright/test";
import { adminLogin, criticalOnly, placePickupOrder, tinyPng } from "./helpers";
import type { Page } from "@playwright/test";

criticalOnly();

/** Opens an order from the list (needed on phones, harmless on desktop). */
const openOrder = (admin: Page, number: string) => admin.getByRole("region", { name: "Liste des commandes" }).getByRole("button", { name: new RegExp(number) }).click();

test("admin login rejects a wrong password and accepts the demo one", async ({ page }) => {
  await page.goto("/fr/admin");
  await expect(page.getByRole("heading", { name: "Espace admin" })).toBeVisible();
  await page.getByLabel("Mot de passe").fill("nope");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.locator("#pw-err")).toHaveText("Mot de passe incorrect.");
  await adminLogin(page);
});

test("admin pages are not reachable in other languages: they redirect to French", async ({ page }) => {
  await page.goto("/ar/admin");
  await expect(page).toHaveURL(/\/fr\/admin$/);
});

test("a customer order arrives live in the admin and can be processed to completion", async ({ context }) => {
  const admin = await context.newPage();
  await adminLogin(admin);
  await admin.goto("/fr/admin/orders");
  await expect(admin.getByRole("heading", { name: "Commandes", level: 1 })).toBeVisible();
  const before = await admin.getByRole("button", { name: /^Nouvelles/ }).textContent();

  // The customer places an order in another tab of the same browser
  const customer = await context.newPage();
  const number = await placePickupOrder(customer);

  // Live arrival: toast + the order in the list, without any reload
  await expect(admin.getByRole("status").filter({ hasText: `Nouvelle commande ${number}` })).toBeVisible();
  await expect(admin.getByRole("button", { name: /^Nouvelles/ })).not.toHaveText(before!);
  await openOrder(admin, number); // on a phone the detail opens from the list
  await expect(admin.getByRole("heading", { name: number })).toBeVisible();

  // Process it: confirm, prepare, ready, complete. The customer's page follows along.
  const stepOnCustomerPage = (label: string) => customer.getByRole("listitem").filter({ hasText: label });
  await admin.getByRole("button", { name: "Confirmer la commande" }).click();
  await expect(stepOnCustomerPage("Confirmée")).toHaveAttribute("aria-current", "step");
  await admin.getByRole("button", { name: "Lancer la préparation" }).click();
  await expect(stepOnCustomerPage("En préparation")).toHaveAttribute("aria-current", "step");
  await admin.getByRole("button", { name: "Marquer comme prête" }).click();
  await expect(stepOnCustomerPage("Prête à retirer")).toHaveAttribute("aria-current", "step");
  await admin.getByRole("button", { name: "Marquer comme terminée" }).click();
  await expect(admin.getByText("Commande terminée.")).toBeVisible();
  await expect(customer.getByRole("listitem").filter({ hasText: "Terminée" })).toBeVisible();

  // History records every step
  const history = admin.getByRole("region", { name: "Historique" }).or(admin.locator("section[aria-labelledby=hist]"));
  for (const s of ["Nouvelle", "Confirmée", "En préparation", "Prête", "Terminée"]) await expect(history.getByText(s, { exact: true })).toBeVisible();
});

test("the admin can cancel an order with a reason and send the customer a WhatsApp message", async ({ context }) => {
  const admin = await context.newPage();
  await adminLogin(admin);
  const customer = await context.newPage();
  const number = await placePickupOrder(customer);
  await admin.goto("/fr/admin/orders");
  await openOrder(admin, number);

  const wa = await admin.getByRole("link", { name: "WhatsApp au client" }).getAttribute("href");
  expect(wa).toMatch(/^https:\/\/wa\.me\/212663206008\?text=/);

  await admin.getByRole("button", { name: "Annuler", exact: true }).click();
  await admin.getByLabel(/Motif de l.annulation/).fill("produit épuisé");
  await admin.getByRole("button", { name: /Confirmer l.annulation/ }).click();
  await expect(admin.getByText("Commande annulée.")).toBeVisible();
  await expect(customer.getByText("Commande annulée")).toBeVisible();
  await expect(admin.getByText(/produit épuisé/)).toBeVisible();
});

test("simulating an order adds one to the list", async ({ page }) => {
  await adminLogin(page);
  await page.goto("/fr/admin/orders");
  const total = async () => Number((await page.getByText(/au total/).textContent())!.match(/(\d+) au total/)![1]);
  const n = await total();
  await page.getByRole("button", { name: "Simuler une commande" }).click();
  await expect.poll(total).toBe(n + 1);
});

test("a price changed in the admin shows on the public menu, and sold-out blocks ordering", async ({ context }) => {
  const admin = await context.newPage();
  await adminLogin(admin);
  await admin.goto("/fr/admin/products");
  const price = admin.getByLabel("Prix (DH)").nth(4); // Mille-Feuille
  await price.fill("25");
  await price.blur();

  const shop = await context.newPage();
  await shop.goto("/fr/menu");
  const card = shop.getByRole("article").filter({ hasText: "Mille-Feuille" });
  await expect(card.getByText("25 DH")).toBeVisible();

  // Invalid price is refused and the old one stays
  await price.fill("0");
  await price.blur();
  await expect(admin.getByRole("alert").filter({ hasText: /Entrez un prix/ })).toBeVisible();

  // Mark sold out: the add button disappears on the public site (live, no reload)
  await admin.getByRole("switch", { name: "Épuisé" }).nth(4).check();
  await expect(card.getByText("Épuisé")).toBeVisible();
  await expect(card.getByRole("button", { name: /Ajouter/ })).toHaveCount(0);
});

test("the admin can replace the home photo and restore the default", async ({ context }) => {
  const admin = await context.newPage();
  await adminLogin(admin);
  await admin.goto("/fr/admin/images");
  await admin.getByLabel("Choisir : Photo principale de l'accueil").setInputFiles({ name: "hero.png", mimeType: "image/png", buffer: tinyPng });
  await expect(admin.getByRole("img", { name: /Aperçu : Photo principale/ })).toBeVisible();

  const site = await context.newPage();
  await site.goto("/fr");
  const hero = site.locator("main img[src^='data:image/jpeg']").first();
  await expect(hero).toBeVisible();

  await admin.getByRole("button", { name: /Rétablir l.image par défaut/ }).first().click();
  await expect(site.locator("main img[src^='data:image/jpeg']")).toHaveCount(0);
});

test("the admin refuses a non-image upload", async ({ page }) => {
  await adminLogin(page);
  await page.goto("/fr/admin/images");
  await page.getByLabel("Choisir : Photo principale de l'accueil").setInputFiles({ name: "evil.svg", mimeType: "image/svg+xml", buffer: Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>") });
  await expect(page.getByRole("alert").filter({ hasText: /Format non accepté/ })).toBeVisible();
});

test("settings: invalid hours are refused and valid changes are saved", async ({ page }) => {
  await adminLogin(page);
  await page.goto("/fr/admin/settings");
  await page.getByLabel("lundi : ouverture").fill("23:00");
  await page.getByRole("button", { name: "Enregistrer les réglages" }).click();
  await expect(page.getByRole("alert").filter({ hasText: /ouverture doit être avant la fermeture/ })).toBeVisible();

  await page.getByLabel("lundi : ouverture").fill("07:00");
  await page.getByLabel("Frais de livraison").fill("30");
  await page.getByRole("button", { name: "Enregistrer les réglages" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Réglages enregistrés." })).toBeVisible();

  // The new delivery fee is used at checkout
  await page.goto("/fr/menu");
  for (let i = 0; i < 4; i++) await page.getByRole("button", { name: "Ajouter Mille-Feuille au panier" }).click();
  await page.goto("/fr/checkout");
  await page.getByRole("radio", { name: /Livraison à Meknès/ }).check({ force: true });
  await expect(page.getByText("Livraison", { exact: true }).locator("xpath=following-sibling::dd")).toHaveText("30 DH");
});

test("the admin has a bottom tab bar on phones and a sidebar on desktop", async ({ page }, testInfo) => {
  await adminLogin(page);
  const nav = page.getByRole("navigation", { name: "Administration" });
  if (testInfo.project.name === "mobile-360") await expect(nav.last()).toBeVisible();
  else await expect(nav.first()).toBeVisible();
  await page.getByRole("link", { name: /Commandes/ }).first().click();
  await expect(page).toHaveURL(/\/fr\/admin\/orders$/);
});
