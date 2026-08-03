import { expect, test } from "@playwright/test";

test.describe("Routes protégées", () => {
  test("redirige vers la connexion quand /dashboard est demandé sans session", async ({ page }) => {
    // Contexte navigateur neuf : aucun cookie `abricot_token`.
    await page.goto("/dashboard");

    await expect(page).toHaveURL("/login");
    await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();
  });
});
