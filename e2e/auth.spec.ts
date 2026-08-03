import { expect, test } from "@playwright/test";
import { login, TEST_USER } from "./helpers/auth";

test.describe("Authentification", () => {
  test("refuse des identifiants invalides et reste sur la page de connexion", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email", { exact: true }).fill(TEST_USER.email);
    await page.getByLabel("Mot de passe", { exact: true }).fill("MauvaisMotDePasse1!");
    await page.getByRole("button", { name: "Se connecter" }).click();

    // Le message d'échec est rendu dans un `role="alert"` au-dessus du formulaire.
    await expect(
      page.getByRole("alert").filter({ hasText: "Email ou mot de passe incorrect" }),
    ).toBeVisible();

    // Aucune redirection : l'utilisateur peut corriger sa saisie.
    await expect(page).toHaveURL("/login");
  });

  test("connecte un utilisateur valide et affiche son nom sur le tableau de bord", async ({
    page,
  }) => {
    await login(page);

    await expect(page.getByRole("heading", { name: "Tableau de bord", level: 1 })).toBeVisible();

    // Le nom est affiché dans le message d'accueil, sous le titre.
    await expect(page.getByText(`Bonjour ${TEST_USER.name},`)).toBeVisible();
  });
});
