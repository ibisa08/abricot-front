import type { Priority, Status } from "@/types";

/**
 * Types partagés de la pipeline RAG de génération de tâches (Étape 6).
 * Côté SERVEUR uniquement — importés par src/lib/ai/* et la route.
 */

/**
 * Contexte projet extrait du backend Express (étape « load »).
 * Volontairement condensé : uniquement ce qui nourrit l'indexation/retrieval.
 */
export interface ProjectContext {
  project: { name: string; description: string };
  existingTasks: Array<{ title: string; description: string; status: string }>;
}

/**
 * Tâche proposée par l'IA, prête à passer dans l'écran de revue puis le commit
 * (POST /projects/:id/tasks, puis PUT status si ≠ TODO). `priority` et `status`
 * sont TOUJOURS renseignés (défauts appliqués à la validation) pour que l'UI de
 * commit existante puisse les honorer.
 */
export interface ProposedTask {
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  /** ISO 8601 si présent, sinon omis. */
  dueDate?: string;
}
