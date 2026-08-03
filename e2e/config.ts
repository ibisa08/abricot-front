/**
 * Source unique des URL utilisées par les tests end-to-end.
 *
 * `E2E_BACKEND_URL` est injectée dans le serveur Next par `playwright.config.ts`
 * (champ `webServer.env`) sous le nom `BACKEND_URL`. C'est le seul endroit du
 * dépôt où l'adresse du backend de test est écrite : ni `.env.local`, ni les
 * scripts npm, ni les specs ne la répètent.
 *
 * Les deux valeurs restent surchargeables par variable d'environnement, ce qui
 * permet de viser une autre instance sans modifier le code.
 */

/** URL du front sous test. */
export const E2E_BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

/**
 * URL du backend de TEST (base isolée, port 8001).
 * Jamais le backend de développement (port 8000) : les tests créent des données.
 */
export const E2E_BACKEND_URL = process.env.E2E_BACKEND_URL ?? "http://localhost:8001";
