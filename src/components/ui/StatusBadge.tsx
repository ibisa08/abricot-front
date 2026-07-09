import { cn } from "@/lib/utils";
import type { Status } from "@/types";

/** Libellés FR des statuts (docs/BACKEND_API.md). */
const STATUS_LABELS: Record<Status, string> = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  DONE: "Terminée",
  CANCELLED: "Annulée",
};

/** Couleurs par statut (tokens DESIGN.md §2). */
const STATUS_CLASSES: Record<Status, string> = {
  TODO: "bg-status-todo-bg text-status-todo-fg",
  IN_PROGRESS: "bg-status-doing-bg text-status-doing-fg",
  DONE: "bg-status-done-bg text-status-done-fg",
  CANCELLED: "bg-status-cancel-bg text-status-cancel-fg",
};

export interface StatusBadgeProps {
  status: Status;
  className?: string;
}

/** Pastille de statut d'une tâche. `role="status"` pour l'accessibilité. */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_CLASSES[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
