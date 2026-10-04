import { expect, test } from "@playwright/test";
import { adminLogin, criticalOnly, placePickupOrder } from "./helpers";

criticalOnly();

// Two separate browser contexts have separate storage, exactly like two devices:
// the order can only reach the admin through the server.
test("an order placed on one device reaches the admin on another within seconds, and its status flows back", async ({ browser }) => {
  const adminCtx = await browser.newContext();
  const phoneCtx = await browser.newContext();
  try {
    const admin = await adminCtx.newPage();
    await adminLogin(admin);
    await admin.goto("/fr/admin/orders");
    await expect(admin.getByRole("heading", { name: "Commandes", level: 1 })).toBeVisible();

    const phone = await phoneCtx.newPage();
    const number = await placePickupOrder(phone);
    const placedAt = Date.now();

    const list = admin.getByRole("region", { name: "Liste des commandes" });
    await expect(list.getByRole("button", { name: new RegExp(number) })).toBeVisible({ timeout: 6000 });
    expect(Date.now() - placedAt).toBeLessThan(6000);

    // The admin confirms it; the customer's confirmation page, open on the other device, follows.
    await list.getByRole("button", { name: new RegExp(number) }).click();
    await admin.getByRole("button", { name: /Confirmer/ }).first().click();
    await expect(phone.getByRole("listitem").filter({ hasText: "Confirmée" })).toHaveAttribute("aria-current", "step", { timeout: 6000 });
  } finally {
    await adminCtx.close();
    await phoneCtx.close();
  }
});

test("the live order route validates input and refuses junk", async ({ request }) => {
  expect((await request.post("/api/live/orders", { data: { id: "x" } })).status()).toBe(400);
  expect((await request.post("/api/live/orders", { headers: { "content-type": "text/plain" }, data: "hi" })).status()).toBe(415);
  const list = await request.get("/api/live/orders");
  expect(list.status()).toBe(200);
  expect(Array.isArray((await list.json()).orders)).toBe(true);
});
