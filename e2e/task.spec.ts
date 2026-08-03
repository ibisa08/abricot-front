import { expect, test } from "@playwright/test";
import { login, SEED_PROJECT_NAME } from "./helpers/auth";

test.describe("Tâches", () => {
  test("crée une tâche dans un projet existant et l'affiche", async ({ page }) => {
    await login(page);

    await page.goto("/projets");
    await page.getByRole("link", { name: `Ouvrir le projet ${SEED_PROJECT_NAME}` }).click();
    await expect(page.getByRole("heading", { name: SEED_PROJECT_NAME })).toBeVisible();

    const taskTitle = `Tâche E2E ${Date.now()}`;

    await page.getByRole("button", { name: "Créer une tâche" }).click();

    const dialog = page.getByRole("dialog", { name: "Créer une tâche" });
    await dialog.getByLabel("Titre*").fill(taskTitle);
    await dialog.getByLabel("Description*").fill("Tâche créée par un test end-to-end.");
    await dialog.getByLabel("Échéance*").fill("2026-12-31");
    await dialog.getByRole("button", { name: "Ajouter une tâche" }).click();

    // Aucune assertion sur les commentaires : le seed en génère un nombre et un
    // auteur aléatoires (Math.random), toute vérification serait instable.
    await expect(page.getByRole("heading", { name: taskTitle })).toBeVisible();
  });
});
