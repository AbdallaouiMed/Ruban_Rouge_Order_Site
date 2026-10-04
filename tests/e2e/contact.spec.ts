import { expect, test } from "@playwright/test";
import { criticalOnly } from "./helpers";

criticalOnly();

test("contact form validates every field with translated messages and focuses the first error", async ({ page }) => {
  await page.goto("/fr/contact");
  await page.getByRole("button", { name: "Envoyer le message" }).click();
  await expect(page.getByText("Indiquez votre nom (2 caractères minimum).")).toBeVisible();
  await expect(page.getByText("Indiquez un email ou un téléphone valide.")).toBeVisible();
  await expect(page.getByText(/entre 10 et 2000 caractères/)).toBeVisible();
  await expect(page.getByLabel(/Nom complet/)).toBeFocused();

  await page.getByLabel(/Nom complet/).fill("Salma");
  await page.getByLabel(/Téléphone/).fill("abc");
  await page.getByLabel(/Votre message/).fill("Bonjour, je voudrais des informations.");
  await page.getByRole("button", { name: "Envoyer le message" }).click();
  await expect(page.getByText("Téléphone invalide.")).toBeVisible();
});

test("the contact page shows the hours card, a live open badge and the real map", async ({ page }) => {
  await page.goto("/fr/contact");
  await expect(page.getByRole("status").filter({ hasText: /Ouvert maintenant|Fermé actuellement/ })).toBeVisible();
  await expect(page.getByRole("main").getByText("Tous les jours")).toBeVisible();
  await expect(page.locator("iframe[src^='https://www.google.com/maps']")).toBeVisible();
  await expect(page.getByRole("link", { name: "Itinéraire" })).toHaveAttribute("href", /google\.com\/maps/);
});

test("the honeypot field is invisible and unreachable for people", async ({ page }) => {
  await page.goto("/fr/contact");
  const trap = page.locator("#contact-hp-trap");
  await expect(trap).toHaveAttribute("tabindex", "-1");
  await expect(trap).toHaveAttribute("autocomplete", "off");
  expect(await trap.evaluate((el) => el.closest("[aria-hidden=true]") !== null)).toBe(true);
});
