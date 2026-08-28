import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth";

test.describe("Projets", () => {
  test("crée un projet et l'affiche dans la liste", async ({ page }) => {
    await login(page);

    // Nom unique : le test reste rejouable sans réinitialiser la base, et ne
    // dépend d'aucun projet créé par un autre test.
    const projectName = `Projet E2E ${Date.now()}`;

    await page.goto("/projets");
    await page.getByRole("button", { name: "Créer un projet" }).click();

    const dialog = page.getByRole("dialog", { name: "Créer un projet" });
    await dialog.getByLabel("Titre*").fill(projectName);
    await dialog.getByLabel("Description*").fill("Projet créé par un test end-to-end.");
    await dialog.getByRole("button", { name: "Ajouter un projet" }).click();

    await expect(page.getByRole("link", { name: `Ouvrir le projet ${projectName}` })).toBeVisible();
  });
});
