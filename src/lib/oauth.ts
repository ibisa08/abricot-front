/**
 * Constantes et libellés du flux OAuth Google.
 *
 * Le backend porte tout le protocole (state, échange de code, vérification de
 * l'id_token). Le front n'a besoin que de deux choses : l'URL de départ du
 * flux, et la traduction des codes d'erreur renvoyés en query string.
 */

/**
 * URL publique du backend Express, exposée au navigateur.
 * Doit être lue en littéral pour que Next l'inline au build.
 */
const PUBLIC_BACKEND_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"
).replace(/\/+$/, "");

/**
 * Point d'entrée du flux Google, côté backend.
 * À ouvrir en navigation pleine page : un `fetch` ne suivrait pas la
 * redirection vers Google (et se heurterait au CORS).
 */
export const GOOGLE_AUTH_URL = `${PUBLIC_BACKEND_URL}/auth/google`;

/**
 * Messages affichés sur /login pour chaque code d'erreur émis par le backend.
 * Formulation destinée à l'utilisateur : aucun terme technique.
 */
const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  oauth_state:
    "Votre connexion avec Google a expiré ou a été interrompue. Merci de réessayer.",
  oauth_email_unverified:
    "Votre adresse Google n'est pas confirmée. Confirmez-la auprès de Google, puis réessayez.",
  oauth_denied:
    "Vous n'avez pas autorisé Abricot à accéder à votre compte Google. Aucune information n'a été partagée.",
  oauth_missing_code:
    "La réponse de Google était incomplète. Merci de réessayer.",
  oauth_unavailable:
    "La connexion avec Google n'est pas disponible pour le moment. Vous pouvez vous connecter avec votre email et votre mot de passe.",
  oauth_init_failed:
    "Impossible de démarrer la connexion avec Google. Merci de réessayer dans un instant.",
  oauth_failed: "La connexion avec Google n'a pas abouti. Merci de réessayer.",
};

/**
 * Traduit un code d'erreur OAuth en message utilisateur.
 * @param code - Valeur du paramètre `error` de l'URL (ou null)
 * @returns Le message à afficher, ou null s'il n'y a pas d'erreur
 */
export function getOAuthErrorMessage(code: string | null): string | null {
  if (!code) return null;
  return (
    OAUTH_ERROR_MESSAGES[code] ??
    "La connexion n'a pas abouti. Merci de réessayer."
  );
}
