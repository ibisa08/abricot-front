import type { ApiResponse, FieldError, User } from "@/types";

/**
 * Client HTTP typé du front.
 *
 * - `api.get/post/put/del` tapent le proxy BFF `/api/backend/*` et déballent
 *   l'enveloppe `{ success, data, message }`.
 * - Les fonctions d'auth (`login/register/logout`) tapent `/api/auth/*`.
 *
 * En cas d'échec, une `ApiError` exploitable est levée (message + errors éventuels).
 */

/** Erreur applicative portant le message du back et ses erreurs de validation. */
export class ApiError extends Error {
  status: number;
  errors?: FieldError[];
  code?: string;

  constructor(message: string, status: number, errors?: FieldError[], code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    this.code = code;
  }
}

/** Préfixe du proxy BFF (appels navigateur → route handlers Next). */
const BACKEND_PREFIX = "/api/backend";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

/**
 * Exécute une requête vers une URL du BFF et déballe l'enveloppe standard.
 * Lève une `ApiError` si `success === false` ou si le status est en échec.
 */
async function request<T>(url: string, method: HttpMethod, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    // Les cookies httpOnly sont transmis automatiquement (même origine).
    credentials: "same-origin",
  });

  // Certaines réponses (204, ou back injoignable) peuvent ne pas être du JSON.
  let payload: ApiResponse<T> | null = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text) as ApiResponse<T>;
    } catch {
      payload = null;
    }
  }

  if (!res.ok || !payload || payload.success === false) {
    const message = payload?.message ?? "Une erreur est survenue.";
    throw new ApiError(message, res.status, payload?.data?.errors, payload?.error);
  }

  // Succès : on renvoie `data` (peut être vide pour les routes "message seul").
  return (payload.data ?? ({} as T)) as T;
}

/** Construit l'URL complète du proxy à partir d'un chemin back (`/projects`…). */
function backendUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${BACKEND_PREFIX}${normalized}`;
}

/** Client REST typé sur le proxy BFF. */
export const api = {
  get: <T>(path: string) => request<T>(backendUrl(path), "GET"),
  post: <T>(path: string, body?: unknown) => request<T>(backendUrl(path), "POST", body),
  put: <T>(path: string, body?: unknown) => request<T>(backendUrl(path), "PUT", body),
  del: <T>(path: string) => request<T>(backendUrl(path), "DELETE"),
};

/* ------------------------------------------------------------------ */
/* Fonctions d'auth dédiées (tapent /api/auth/*)                       */
/* ------------------------------------------------------------------ */

export interface Credentials {
  email: string;
  password: string;
}

export interface RegisterInput extends Credentials {
  name?: string;
}

/** Connexion : pose le cookie httpOnly côté BFF, renvoie l'utilisateur. */
export async function login(credentials: Credentials): Promise<User> {
  const { user } = await request<{ user: User }>("/api/auth/login", "POST", credentials);
  return user;
}

/** Inscription : idem login. */
export async function register(input: RegisterInput): Promise<User> {
  const { user } = await request<{ user: User }>("/api/auth/register", "POST", input);
  return user;
}

/** Déconnexion : supprime le cookie httpOnly côté BFF. */
export async function logout(): Promise<void> {
  await request<Record<string, never>>("/api/auth/logout", "POST");
}

/* ------------------------------------------------------------------ */
/* Mise en forme des erreurs pour l'UI                                 */
/* ------------------------------------------------------------------ */

/**
 * Message utilisateur à partir d'une erreur. Le back renvoie déjà des messages
 * FR corrects ; on garantit néanmoins un libellé clair par code d'erreur au cas
 * où le message serait absent (codes notables : docs/BACKEND_API.md).
 */
export function toUserMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.message) return err.message;
    switch (err.code) {
      case "INVALID_CREDENTIALS":
        return "Email ou mot de passe incorrect.";
      case "EMAIL_ALREADY_EXISTS":
        return "Cet email est déjà utilisé.";
      case "INVALID_CURRENT_PASSWORD":
        return "Le mot de passe actuel est incorrect.";
      default:
        return "Une erreur est survenue. Réessayez.";
    }
  }
  return "Une erreur est survenue. Réessayez.";
}
