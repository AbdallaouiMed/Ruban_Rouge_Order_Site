import { expect, test } from "@playwright/test";
import { criticalOnly, fillCustomer, pickFirstSlot, tinyPng } from "./helpers";

criticalOnly();

test("build a box of 6, see the ribbon tie, add it to the cart", async ({ page }) => {
  await page.goto("/fr/box");
  const add = page.getByRole("button", { name: /Ajouter Croissant au Beurre$/ });
  const addBtn = page.getByRole("button", { name: "Ajouter la boîte au panier" });
  await expect(addBtn).toBeDisabled();
  await expect(page.locator(".ribbon-animate")).toHaveCount(0);

  for (let i = 0; i < 5; i++) await add.click();
  await expect(addBtn).toBeDisabled();
  await expect(page.getByText(/Encore 1 pièce à choisir/)).toBeVisible();
  await page.getByRole("button", { name: /Ajouter Baguette$/ }).click();

  await expect(page.locator(".ribbon-animate")).toHaveCount(1);
  await expect(page.getByText(/Votre boîte est prête/)).toBeVisible();
  await expect(add).toBeDisabled(); // full: no more pieces
  await addBtn.click();

  const drawer = page.getByRole("dialog", { name: "Votre panier" });
  await expect(drawer.getByText("Boîte de 6")).toBeVisible();
  await expect(drawer.getByText(/5 × Croissant au Beurre/)).toBeVisible();
  await expect(drawer.locator("strong")).toHaveText("42 DH"); // box fee 10 + 5 × 6 + 1 × 2
});

test("shrinking the box size trims the pieces that no longer fit", async ({ page }) => {
  await page.goto("/fr/box");
  await page.getByText("12 pièces", { exact: true }).click();
  for (let i = 0; i < 10; i++) await page.getByRole("button", { name: /Ajouter Baguette$/ }).click();
  await expect(page.getByText("10 / 12 pièces", { exact: false }).first()).toBeVisible();
  await page.getByText("6 pièces", { exact: true }).click();
  await expect(page.getByText("6 / 6 pièces", { exact: false }).first()).toBeVisible();
  await expect(page.locator(".ribbon-animate")).toHaveCount(1);
});

test("cake studio: nine steps, live estimate, date rule, photo upload, request sent", async ({ page }) => {
  await page.goto("/fr/cakes?occasion=wedding");
  await expect(page.getByText("Étape 1 sur 9")).toBeVisible();
  await expect(page.getByRole("radio", { name: "Mariage" })).toBeChecked(); // prefilled from the occasion link

  const estimate = page.locator("aside").getByText(/DH – .* DH/);
  const first = await estimate.textContent();
  await page.getByRole("button", { name: "Suivant" }).click(); // size
  await page.getByRole("radio", { name: /24 parts/ }).check({ force: true });
  await expect(estimate).not.toHaveText(first!);

  for (let i = 0; i < 4; i++) await page.getByRole("button", { name: "Suivant" }).click(); // flavor, filling, frosting, decorations
  await page.getByRole("checkbox", { name: /Feuilles d.or/ }).check({ force: true });
  await page.getByRole("button", { name: "Suivant" }).click(); // message & photo
  await page.getByLabel(/Dédicace/).fill("Félicitations Yasmine et Omar");
  await page.getByLabel("Choisir une photo").or(page.locator("#cake-photo")).first().setInputFiles({ name: "idea.png", mimeType: "image/png", buffer: tinyPng });
  await expect(page.getByRole("img", { name: "Photo d'inspiration choisie" })).toBeVisible();
  await page.getByRole("button", { name: "Suivant" }).click(); // date & budget

  // The date is required and must respect the lead time
  await page.getByRole("button", { name: "Suivant" }).click();
  await expect(page.getByRole("alert").filter({ hasText: /Choisissez une date/ })).toBeVisible();
  const d = new Date(Date.now() + 20 * 86_400_000).toISOString().slice(0, 10);
  await page.getByLabel(/Date de l.événement/).fill(d);
  await page.getByRole("button", { name: "Suivant" }).click(); // details

  await page.getByLabel(/Nom complet/).fill("Yasmine Alaoui");
  await page.getByLabel(/Téléphone/).fill("0661234567");
  await page.getByRole("button", { name: "Envoyer ma demande" }).click();

  await page.waitForURL(/\/fr\/order\//);
  await expect(page.getByRole("heading", { level: 1, name: "Demande bien reçue" })).toBeVisible();
  await expect(page.getByText(/Estimation indicative :/)).toBeVisible();
  await expect(page.getByText(/Félicitations Yasmine et Omar/)).toBeVisible();
});

test("gift flow: card preview, delivery to the recipient, order confirmation", async ({ page }) => {
  await page.goto("/fr/gift");
  await page.getByRole("button", { name: "Continuer vers la commande" }).click();
  await expect(page.getByRole("alert").first()).toBeVisible(); // required fields

  await page.getByLabel(/Nom du destinataire/).fill("Imane");
  await page.getByLabel(/Téléphone du destinataire/).fill("0661000000");
  await page.getByLabel(/Adresse de livraison/).fill("5 Hay Salam, Meknès");
  await page.getByLabel(/Votre message/).fill("Bon anniversaire ma chérie !");
  await page.getByLabel("De la part de").fill("Salma");
  await expect(page.getByRole("figure")).toContainText("Pour Imane");
  await expect(page.getByRole("figure")).toContainText("Bon anniversaire ma chérie !");
  await page.getByText("Doré", { exact: true }).click();
  await page.getByRole("button", { name: "Continuer vers la commande" }).click();

  await expect(page).toHaveURL(/\/fr\/checkout$/);
  await expect(page.getByText(/Cadeau pour Imane/)).toBeVisible();
  await expect(page.getByRole("radio", { name: /Retrait en boutique/ })).toBeDisabled();
  await expect(page.getByLabel(/Adresse de livraison/)).toHaveCount(0); // the recipient's address is used
  await pickFirstSlot(page);
  await fillCustomer(page, "Salma Benali");
  await page.getByRole("button", { name: "Confirmer la commande" }).click();
  await page.waitForURL(/\/fr\/order\//);
  await expect(page.getByText("Cadeau pour Imane")).toBeVisible();
  await expect(page.getByText(/Bon anniversaire ma chérie/)).toBeVisible();
});

test("occasion collections: an available bundle goes to the cart, one with a sold-out piece is blocked", async ({ page }) => {
  await page.goto("/fr/occasions");
  await page.getByRole("link", { name: /Aïd/ }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Aïd" })).toBeVisible();
  await page.getByRole("button", { name: "Ajouter" }).first().click();
  await expect(page.getByRole("dialog", { name: "Votre panier" }).getByText("Boîte visite")).toBeVisible();

  // Ramadan's Iftar platter contains the sold-out éclair
  await page.goto("/fr/occasions/ramadan");
  await expect(page.getByRole("button", { name: "Indisponible" })).toBeDisabled();
  await expect(page.getByText("Précommandes : dates à confirmer")).toBeVisible();
  await page.getByRole("link", { name: "Créer mon gâteau" }).click();
  await expect(page).toHaveURL(/\/fr\/cakes\?occasion=eid/);
});

test("fresh-today board follows the admin flags", async ({ page }) => {
  await page.goto("/fr");
  const board = page.getByRole("region", { name: /Frais aujourd.hui/ });
  await expect(board.getByRole("article")).toHaveCount(4);
  await expect(board.getByText("Éclair au Chocolat")).toBeVisible(); // listed as sold out
});
