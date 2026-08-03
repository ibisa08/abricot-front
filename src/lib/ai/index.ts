import { loadProjectContext } from "@/lib/ai/loadContext";
import { buildProjectIndex } from "@/lib/ai/buildIndex";
import { retrieveContext } from "@/lib/ai/retrieve";
import { generateProposedTasks } from "@/lib/ai/generate";
import { classifyMistralError, getMistralApiKey, withTimeout } from "@/lib/ai/errors";
import type { ProposedTask } from "@/lib/ai/types";

export type { ProposedTask, ProjectContext } from "@/lib/ai/types";
export {
  AiBadOutputError,
  AiConfigError,
  AiQuotaError,
  AiUnavailableError,
  ContextError,
} from "@/lib/ai/errors";

/** Timeout dur sur la partie Mistral (embeddings + génération). */
const MISTRAL_TIMEOUT_MS = 30_000;

const isDev = process.env.NODE_ENV !== "production";
/** Log de débug étape par étape (exigence OC), en dev uniquement. */
function log(message: string): void {
  if (isDev) console.info(`[RAG] ${message}`);
}

export interface GenerateTasksInput {
  projectId: string;
  prompt: string;
  /** Valeur du cookie httpOnly (JWT) — attaché en Bearer côté serveur. */
  authCookie: string;
}

/**
 * ORCHESTRATEUR — pipeline RAG complète : load → buildIndex → retrieve → generate.
 *
 * Chaque étape est isolée dans son module (débug pas-à-pas). Les erreurs sont
 * typées à la source :
 *  - `getMistralApiKey` → AiConfigError (clé serveur absente),
 *  - `loadProjectContext` → ContextError (backend injoignable),
 *  - étapes Mistral → classifiées (quota/indispo/bad output) et bornées à 30s.
 */
export async function generateTasks({
  projectId,
  prompt,
  authCookie,
}: GenerateTasksInput): Promise<ProposedTask[]> {
  // Étape 0 — configuration : échoue tôt et clair si la clé serveur manque.
  getMistralApiKey();
  log("step 0 config ok");

  // Étape 1 — récupération du contexte (backend Express, Bearer côté serveur).
  const context = await loadProjectContext(projectId, authCookie);
  log(`step 1 load ok (${context.existingTasks.length} tâche(s) existante(s))`);

  // Étapes 2→4 — Mistral : bornées par un timeout dur, erreurs classifiées.
  try {
    return await withTimeout(
      (async () => {
        const index = await buildProjectIndex(context);
        log("step 2 buildIndex ok");

        const ragContext = await retrieveContext(index, prompt);
        log("step 3 retrieve ok");

        const tasks = await generateProposedTasks(ragContext, prompt);
        log(`step 4 generate ok (${tasks.length} tâche(s) valide(s))`);
        return tasks;
      })(),
      MISTRAL_TIMEOUT_MS,
      "génération IA",
    );
  } catch (err) {
    throw classifyMistralError(err);
  }
}
