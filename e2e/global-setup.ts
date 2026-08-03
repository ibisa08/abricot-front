import { E2E_BACKEND_URL } from "./config";

/**
 * Garde-fou exécuté une fois avant toute la suite.
 *
 * Sans lui, un backend de test éteint produirait quatre échecs opaques (erreurs
 * 502 relayées par le BFF) au lieu d'un message explicite.
 */
async function globalSetup(): Promise<void> {
  const healthUrl = `${E2E_BACKEND_URL}/health`;

  const marcheASuivre = [
    `Le backend de test est injoignable sur ${E2E_BACKEND_URL}.`,
    "",
    "Depuis le dépôt abricot-backend :",
    "  cp .env.test.example .env.test   # une seule fois",
    "  npm run db:test:reset            # réinitialise la base de test",
    "  npm run dev:test                 # démarre le serveur sur le port 8001",
  ].join("\n");

  let response: Response;
  try {
    response = await fetch(healthUrl, { signal: AbortSignal.timeout(5000) });
  } catch {
    throw new Error(marcheASuivre);
  }

  if (!response.ok) {
    throw new Error(`${marcheASuivre}\n\n(réponse HTTP ${response.status} sur ${healthUrl})`);
  }
}

export default globalSetup;
