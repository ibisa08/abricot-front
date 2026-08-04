import { expect, test } from "@playwright/test";
import { login, SEED_PROJECT_NAME, TEST_USER } from "./helpers/auth";

/**
 * Le 15 du mois courant.
 *
 * Le Kanban privilégie les tâches échéant dans le mois et ne bascule sur
 * l'ensemble des tâches que si aucune ne correspond. Dater la tâche du mois
 * courant garantit son affichage quel que soit le contenu de la base, et fixe
 * le mode du tableau au lieu de le subir. Le 15 évite tout effet de bord aux
 * bornes du mois (la modale envoie l'échéance en UTC).
 */
function dueDateThisMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-15`;
}

test.describe("Kanban", () => {
  test("déplace une tâche d'une colonne à l'autre au clavier", async ({ page }) => {
    await login(page);

    // Titre unique : le test reste rejouable sans réinitialiser la base.
    const taskTitle = `Tâche Kanban E2E ${Date.now()}`;

    /* ---- Préparation : une tâche assignée à l'utilisateur de test -------- */
    // Le tableau de bord ne montre que les tâches assignées
    // (`GET /dashboard/assigned-tasks`) : créer la tâche ne suffit pas.
    await page.goto("/projets");
    await page.getByRole("link", { name: `Ouvrir le projet ${SEED_PROJECT_NAME}` }).click();
    await expect(page.getByRole("heading", { name: SEED_PROJECT_NAME })).toBeVisible();

    await page.getByRole("button", { name: "Créer une tâche" }).click();

    const dialog = page.getByRole("dialog", { name: "Créer une tâche" });
    await dialog.getByLabel("Titre*").fill(taskTitle);
    await dialog.getByLabel("Description*").fill("Tâche créée pour le test du glisser-déposer.");
    await dialog.getByLabel("Échéance*").fill(dueDateThisMonth());

    await dialog.getByLabel("Assigné à :").click();
    await page.getByRole("option", { name: TEST_USER.name }).click();
    await page.keyboard.press("Escape");

    await dialog.getByRole("button", { name: "Ajouter une tâche" }).click();
    await expect(dialog).toBeHidden();

    /* ---- La tâche démarre dans « À faire » ------------------------------- */
    await page.goto("/dashboard?view=kanban");

    const todoColumn = page.getByRole("region", { name: /^À faire/ });
    const doingColumn = page.getByRole("region", { name: /^En cours/ });

    await expect(todoColumn.getByRole("heading", { name: taskTitle })).toBeVisible();

    /* ---- Déplacement au clavier depuis la poignée ------------------------ */
    // Espace saisit la carte, flèche droite vise la colonne suivante, Espace
    // dépose. Aucun recours à la souris : c'est le chemin clavier qui est testé.
    await page.getByRole("button", { name: `Déplacer la tâche « ${taskTitle} »` }).focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Space");

    /* ---- La tâche a changé de colonne ------------------------------------ */
    await expect(doingColumn.getByRole("heading", { name: taskTitle })).toBeVisible();
    await expect(todoColumn.getByRole("heading", { name: taskTitle })).toHaveCount(0);

    // Le changement est persisté : il survit à un rechargement complet.
    await page.reload();
    await expect(doingColumn.getByRole("heading", { name: taskTitle })).toBeVisible();
  });
});
