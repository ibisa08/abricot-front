/**
 * Définition des colonnes du Kanban, partagée par `TaskBoard` et son
 * enveloppe de carte. Isolé dans son propre module pour qu'aucun des deux
 * composants n'ait à importer l'autre.
 */
import type { Status, Task } from "@/types";

/**
 * Statuts matérialisés par une colonne. `CANCELLED` en est volontairement
 * absent : le tableau ne l'affiche pas et le glisser-déposer ne peut donc ni
 * l'atteindre ni le produire.
 */
export const BOARD_STATUSES = ["TODO", "IN_PROGRESS", "DONE"] as const satisfies readonly Status[];

export type BoardStatus = (typeof BOARD_STATUSES)[number];

/** Libellés FR des colonnes (cohérents avec `StatusBadge`). */
export const COLUMN_TITLES: Record<BoardStatus, string> = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  DONE: "Terminées",
};

export function isBoardStatus(status: Status): status is BoardStatus {
  return (BOARD_STATUSES as readonly Status[]).includes(status);
}

/**
 * Préfixe des identifiants de zone de dépôt. Il évite toute collision avec les
 * identifiants de tâche, qui vivent dans le même espace de noms `dnd-kit`.
 */
const COLUMN_DROPPABLE_PREFIX = "colonne:";

export function columnDroppableId(status: BoardStatus): string {
  return `${COLUMN_DROPPABLE_PREFIX}${status}`;
}

/**
 * Résout la colonne visée par un dépôt. `dnd-kit` renvoie soit l'identifiant
 * d'une colonne (survol d'une zone vide), soit celui d'une tâche (survol d'une
 * carte) : les deux doivent aboutir à la même colonne.
 *
 * @returns la colonne cible, ou `null` si l'identifiant n'en désigne aucune.
 */
export function resolveDropColumn(overId: string, tasks: Task[]): BoardStatus | null {
  if (overId.startsWith(COLUMN_DROPPABLE_PREFIX)) {
    const status = overId.slice(COLUMN_DROPPABLE_PREFIX.length);
    return BOARD_STATUSES.find((candidate) => candidate === status) ?? null;
  }

  const overTask = tasks.find((task) => task.id === overId);
  return overTask && isBoardStatus(overTask.status) ? overTask.status : null;
}
