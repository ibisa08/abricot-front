import Link from "next/link";
import { Folder, Calendar, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDueDate } from "@/lib/format";
import type { Task } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";

export type TaskCardVariant = "list" | "board";

export interface TaskCardProps {
  task: Task;
  /** `list` = carte large (badge + bouton à droite) ; `board` = carte colonne Kanban. */
  variant?: TaskCardVariant;
  className?: string;
}

/** Ligne de méta-données (📁 projet · 📅 échéance · 💬 commentaires). */
function TaskMeta({ task }: { task: Task }) {
  const due = formatDueDate(task.dueDate);
  const items = [
    {
      key: "project",
      icon: Folder,
      label: task.project.name,
      srLabel: `Projet : ${task.project.name}`,
    },
    due ? { key: "due", icon: Calendar, label: due, srLabel: `Échéance : ${due}` } : null,
    {
      key: "comments",
      icon: MessageSquare,
      label: String(task.comments.length),
      srLabel: `${task.comments.length} commentaire(s)`,
    },
  ].filter(Boolean) as {
    key: string;
    icon: typeof Folder;
    label: string;
    srLabel: string;
  }[];

  return (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
      {items.map(({ key, icon: Icon, label, srLabel }, index) => (
        <li key={key} className="flex items-center gap-2">
          {index > 0 && (
            <span aria-hidden="true" className="text-border">
              |
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="max-w-[16ch] truncate">
              <span className="sr-only">{srLabel}</span>
              <span aria-hidden="true">{label}</span>
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Bouton « Voir » → page du projet parent. */
function ViewButton({ task, className }: { task: Task; className?: string }) {
  return (
    <Link
      href={`/projets/${task.projectId}`}
      aria-label={`Voir la tâche « ${task.title} »`}
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-lg bg-ink px-6 text-sm font-medium text-white transition-colors hover:bg-ink-hover",
        className,
      )}
    >
      Voir
    </Link>
  );
}

/**
 * Carte de tâche réutilisée en vue Liste et en Kanban (docs/DESIGN.md §4).
 * - `list`  : contenu à gauche, badge (haut) + bouton « Voir » (bas) à droite.
 * - `board` : titre + badge en tête, méta, puis bouton « Voir ».
 */
export function TaskCard({ task, variant = "list", className }: TaskCardProps) {
  const cardBase =
    "rounded-xl border border-border bg-surface p-5 shadow-card transition-shadow hover:shadow-md";

  if (variant === "board") {
    return (
      <article className={cn(cardBase, className)}>
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-heading text-base font-semibold text-text">{task.title}</h3>
          <StatusBadge status={task.status} className="shrink-0" />
        </div>
        {task.description && (
          <p className="mt-1 line-clamp-2 text-sm text-text-muted">{task.description}</p>
        )}
        <div className="mt-4">
          <TaskMeta task={task} />
        </div>
        <ViewButton task={task} className="mt-4" />
      </article>
    );
  }

  // variant === "list"
  return (
    <article className={cn(cardBase, "flex items-stretch gap-4 p-6", className)}>
      <div className="min-w-0 flex-1">
        <h3 className="font-heading text-lg font-semibold text-text">{task.title}</h3>
        {task.description && (
          <p className="mt-1 line-clamp-2 text-sm text-text-muted">{task.description}</p>
        )}
        <div className="mt-4">
          <TaskMeta task={task} />
        </div>
      </div>
      <div className="flex flex-col items-end justify-between gap-4">
        <StatusBadge status={task.status} />
        <ViewButton task={task} />
      </div>
    </article>
  );
}
