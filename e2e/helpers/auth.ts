import { expect, type Page } from "@playwright/test";

/**
 * Compte de démonstration créé par le seed du backend
 * (`abricot-backend/scripts/seed.ts`). Propriétaire du projet
 * « Application E-commerce », lui aussi issu du seed.
 */
export const TEST_USER = {
  email: "alice@example.com",
  password: "P@ssword123",
  name: "Alice Martin",
} as const;

/** Projet du seed appartenant à TEST_USER — cible stable des tests. */
export const SEED_PROJECT_NAME = "Application E-commerce";

/**
 * Connecte l'utilisateur de test via le formulaire, comme le ferait une
 * personne : c'est le chemin réel (BFF + cookie httpOnly), pas un raccourci.
 *
 * Chaque test Playwright disposant d'un contexte navigateur neuf, l'appel est
 * nécessaire dans tout test qui exige une session — et suffit à le rendre
 * indépendant des autres.
 *
 * @param page - La page du test en cours
 */
export async function login(page: Page): Promise<void> {
  await page.goto("/login");

  await page.getByLabel("Email", { exact: true }).fill(TEST_USER.email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(TEST_USER.password);
  await page.getByRole("button", { name: "Se connecter" }).click();

  // L'attente automatique de Playwright fait foi : aucun délai fixe.
  await expect(page).toHaveURL("/dashboard");
}
