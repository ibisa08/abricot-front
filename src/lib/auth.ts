/**
 * Constantes et helpers partagés par la couche d'auth (BFF).
 * Le JWT vit UNIQUEMENT dans un cookie httpOnly — jamais exposé au JS navigateur.
 */

/** Nom du cookie httpOnly qui porte le JWT. */
export const AUTH_COOKIE = "abricot_token";

/** Durée de vie du cookie : ~7 jours (en secondes). */
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

/** URL du backend Express. Résolue côté serveur uniquement. */
export const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

/**
 * Options communes de pose du cookie d'auth.
 * `secure` activé en production ; `sameSite=lax` ; `path=/`.
 */
export const authCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: AUTH_COOKIE_MAX_AGE,
};
