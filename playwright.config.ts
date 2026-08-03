import { defineConfig, devices } from "@playwright/test";
import { E2E_BACKEND_URL, E2E_BASE_URL } from "./e2e/config";

/**
 * Configuration Playwright — tests end-to-end du front Abricot.
 *
 * Le serveur Next est démarré par Playwright avec `BACKEND_URL` pointant sur le
 * backend de TEST (port 8001). Une variable présente dans l'environnement du
 * processus l'emporte sur `.env.local` : c'est ce qui garantit que les tests ne
 * touchent jamais la base de développement.
 *
 * Voir https://playwright.dev/docs/test-configuration
 */
/** Port du serveur Next, dérivé de l'URL pour que les deux ne divergent jamais. */
const FRONT_PORT = new URL(E2E_BASE_URL).port || "3000";

export default defineConfig({
  testDir: "./e2e",

  /** Vérifie que le backend de test répond avant de lancer quoi que ce soit. */
  globalSetup: "./e2e/global-setup.ts",

  fullyParallel: true,

  /**
   * Un seul worker : la base de test est un fichier SQLite, qui n'accepte qu'un
   * écrivain à la fois. Avec quatre tests, le gain du parallélisme serait
   * marginal face au risque de verrous intermittents.
   */
  workers: 1,

  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,

  /** `list` pour le terminal ; le rapport HTML ne s'ouvre pas tout seul. */
  reporter: [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: E2E_BASE_URL,
    /* Diagnostics conservés uniquement en cas d'échec. */
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  /* Un seul navigateur : exécution rapide. */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    /**
     * `next dev` est appelé directement plutôt que via `npm run dev`, dont le
     * port est figé à 3000 : le port doit suivre `E2E_BASE_URL`.
     */
    command: `npx next dev -p ${FRONT_PORT}`,
    url: E2E_BASE_URL,
    /** Injecté dans le serveur Next : prime sur la valeur de `.env.local`. */
    env: { BACKEND_URL: E2E_BACKEND_URL },
    /**
     * Volontairement `false`. Réutiliser un serveur déjà lancé ferait tourner
     * les tests contre le backend de DÉVELOPPEMENT, silencieusement.
     * Le port 3000 doit donc être libre avant de lancer la suite.
     */
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
