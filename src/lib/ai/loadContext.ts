import { BACKEND_URL } from "@/lib/auth";
import { ContextError } from "@/lib/ai/errors";
import type { ProjectContext } from "@/lib/ai/types";

/**
 * ÉTAPE 1 — RÉCUPÉRATION (RAG).
 *
 * Charge le contexte d'un projet depuis le backend Express. On attache le
 * Bearer CÔTÉ SERVEUR, exactement comme le proxy `/api/backend/[...path]`
 * (cf. src/lib/auth.ts) : le token httpOnly ne transite jamais côté client.
 *
 * On tape directement `${BACKEND_URL}/projects/:id` (appel serveur→serveur)
 * plutôt que de reboucler sur notre propre route proxy : même Bearer, même
 * cible, sans hop HTTP supplémentaire ni URL absolue de self-call.
 *
 * `GET /projects/:id` renvoie déjà le projet ET ses `tasks[]` → un seul appel
 * suffit pour le nom, la description et les tâches existantes.
 *
 * Toute erreur réseau ou réponse invalide est ISOLÉE ici en `ContextError`
 * (→ 502 AI_CONTEXT_ERROR côté route).
 */
export async function loadProjectContext(
  projectId: string,
  authCookie: string,
): Promise<ProjectContext> {
  const url = `${BACKEND_URL}/projects/${encodeURIComponent(projectId)}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        // Bearer attaché côté serveur, comme le proxy BFF.
        ...(authCookie ? { Authorization: `Bearer ${authCookie}` } : {}),
      },
      cache: "no-store",
    });
  } catch {
    // Backend injoignable (DNS, connexion refusée, coupure réseau).
    throw new ContextError("Le backend est injoignable pour charger le contexte projet.");
  }

  if (!res.ok) {
    throw new ContextError(`Le backend a répondu ${res.status} au chargement du contexte.`);
  }

  let payload: {
    success?: boolean;
    data?: {
      project?: {
        name?: string;
        description?: string | null;
        tasks?: Array<{ title?: string; description?: string | null; status?: string }>;
      };
    };
  } | null = null;

  try {
    payload = await res.json();
  } catch {
    throw new ContextError("Réponse backend illisible (JSON invalide).");
  }

  const project = payload?.data?.project;
  if (!payload?.success || !project || typeof project.name !== "string") {
    throw new ContextError("Contexte projet absent ou malformé dans la réponse backend.");
  }

  const existingTasks = (project.tasks ?? [])
    .filter((t) => typeof t?.title === "string" && t.title.trim() !== "")
    .map((t) => ({
      title: t.title as string,
      description: t.description ?? "",
      status: t.status ?? "TODO",
    }));

  return {
    project: {
      name: project.name,
      description: project.description ?? "",
    },
    existingTasks,
  };
}
